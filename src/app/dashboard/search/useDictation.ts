"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, transcribeAudio } from "@/lib/api";

export type DictationStatus = "idle" | "recording" | "transcribing" | "error";

/** Hard cap so a forgotten/hot mic can't record indefinitely. */
const MAX_RECORDING_MS = 60_000;

/** Preferred capture mime types, most compatible first. Safari only does mp4. */
const PREFERRED_MIME_TYPES = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
];

function pickMimeType(): string | undefined {
    if (typeof MediaRecorder === "undefined") return undefined;
    for (const type of PREFERRED_MIME_TYPES) {
        if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return undefined; // let the browser choose its default
}

function isSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined"
    );
}

export interface UseDictationResult {
    /** Whether the browser can capture audio at all. */
    supported: boolean;
    status: DictationStatus;
    /** Live mic amplitude 0–1 for the waveform; 0 when not recording. */
    amplitude: number;
    /** Human-readable error for the most recent failure, or null. */
    errorMessage: string | null;
    start: () => Promise<void>;
    stop: () => void;
    /** Dismiss a lingering error (e.g. when the recruiter resumes typing). */
    clearError: () => void;
}

/**
 * Encapsulates the browser mic lifecycle for batch (record-then-transcribe)
 * speech-to-text: getUserMedia → MediaRecorder → upload to /search/transcribe
 * (Deepgram Nova-3) → onTranscript(text). Also exposes a live amplitude derived
 * from a Web Audio AnalyserNode so the UI can render a waveform while recording.
 *
 * Stop is manual only (caller calls stop()); a 60s cap is a safety net. All
 * resources (tracks, AudioContext, timers, rAF) are torn down on stop/unmount.
 */
export function useDictation(onTranscript: (text: string) => void): UseDictationResult {
    const [supported] = useState<boolean>(() => isSupported());
    const [status, setStatus] = useState<DictationStatus>("idle");
    const [amplitude, setAmplitude] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number | null>(null);
    const capTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Guards against a second start() while the first is still awaiting
    // getUserMedia (which would open — and leak — a second mic stream).
    const startingRef = useRef(false);
    // Lets in-flight async work (transcription) bail out after unmount.
    const mountedRef = useRef(true);
    // Keep the latest callback without re-creating start()/stop() each render.
    const onTranscriptRef = useRef(onTranscript);
    onTranscriptRef.current = onTranscript;

    const teardownAudio = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (capTimerRef.current !== null) {
            clearTimeout(capTimerRef.current);
            capTimerRef.current = null;
        }
        analyserRef.current = null;
        if (audioContextRef.current) {
            void audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setAmplitude(0);
    }, []);

    // Named function expression so the rAF loop can re-schedule itself via its
    // own name (`sample`) without referencing the outer const before init.
    const sampleAmplitude = useCallback(function sample() {
        const analyser = analyserRef.current;
        if (!analyser) return;
        const buffer = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buffer);
        // RMS deviation from the 128 midpoint → 0–1.
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i += 1) {
            const deviation = (buffer[i] - 128) / 128;
            sumSquares += deviation * deviation;
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        setAmplitude(Math.min(1, rms * 2.2));
        rafRef.current = requestAnimationFrame(sample);
    }, []);

    const handleRecordingStopped = useCallback(async (mimeType: string) => {
        teardownAudio();
        const parts = chunksRef.current;
        chunksRef.current = [];
        if (parts.length === 0) {
            setStatus("idle");
            return;
        }
        const blob = new Blob(parts, { type: mimeType || "audio/webm" });
        if (blob.size === 0) {
            setStatus("idle");
            return;
        }
        setStatus("transcribing");
        try {
            const { transcript } = await transcribeAudio(blob);
            if (!mountedRef.current) return; // component went away mid-transcription
            if (transcript.trim()) {
                onTranscriptRef.current(transcript.trim());
                setStatus("idle");
            } else {
                setStatus("error");
                setErrorMessage("Didn't catch that — try again or type your search.");
            }
        } catch (err) {
            if (!mountedRef.current) return;
            setStatus("error");
            setErrorMessage(
                err instanceof ApiError && err.status === 503
                    ? "Couldn't transcribe right now. Please try again or type your search."
                    : "Couldn't transcribe the audio. Please try again or type your search.",
            );
        }
    }, [teardownAudio]);

    const start = useCallback(async () => {
        if (!supported || startingRef.current) return;
        if (status === "recording" || status === "transcribing") return;
        startingRef.current = true;
        setErrorMessage(null);
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            startingRef.current = false;
            setStatus("error");
            setErrorMessage("Microphone access was blocked. Allow it in your browser, or type your search.");
            return;
        }
        // The component may have unmounted during the permission prompt.
        if (!mountedRef.current) {
            stream.getTracks().forEach((track) => track.stop());
            startingRef.current = false;
            return;
        }
        streamRef.current = stream;
        chunksRef.current = [];

        // Live waveform via Web Audio.
        try {
            const AudioCtx =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                const context = new AudioCtx();
                audioContextRef.current = context;
                // Created after an await, so the user-gesture context can be lost
                // and the context may start suspended — resume to keep bars live.
                if (context.state === "suspended") void context.resume().catch(() => {});
                const source = context.createMediaStreamSource(stream);
                const analyser = context.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyserRef.current = analyser;
                rafRef.current = requestAnimationFrame(sampleAmplitude);
            }
        } catch {
            // Waveform is cosmetic; ignore failures and keep recording.
        }

        const mimeType = pickMimeType();
        let recorder: MediaRecorder;
        try {
            recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        } catch {
            teardownAudio();
            startingRef.current = false;
            setStatus("error");
            setErrorMessage("Recording isn't supported in this browser. Please type your search.");
            return;
        }
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
            void handleRecordingStopped(recorder.mimeType || mimeType || "audio/webm");
        };
        recorder.start();
        startingRef.current = false;
        setStatus("recording");
        capTimerRef.current = setTimeout(() => {
            if (recorderRef.current?.state === "recording") recorderRef.current.stop();
        }, MAX_RECORDING_MS);
    }, [supported, status, sampleAmplitude, teardownAudio, handleRecordingStopped]);

    const stop = useCallback(() => {
        const recorder = recorderRef.current;
        if (recorder && recorder.state === "recording") {
            recorder.stop(); // triggers onstop → handleRecordingStopped
        }
    }, []);

    const clearError = useCallback(() => {
        setErrorMessage((current) => (current === null ? current : null));
        setStatus((current) => (current === "error" ? "idle" : current));
    }, []);

    // Cleanup on unmount: stop any live recording and release the mic.
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (recorderRef.current?.state === "recording") {
                recorderRef.current.onstop = null;
                try {
                    recorderRef.current.stop();
                } catch {
                    // ignore
                }
            }
            teardownAudio();
        };
    }, [teardownAudio]);

    return { supported, status, amplitude, errorMessage, start, stop, clearError };
}
