'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { apiRequest, setToken } from '@/lib/api';
import styles from '@/app/[lang]/(auth)/auth.module.css';

interface TokenResponse {
    access_token: string;
}

interface GoogleAuthSectionProps {
    context: 'signin' | 'signup';
    onError: (message: string) => void;
    onSuccess: () => void;
    /** When true, the button is greyed out and clicks/One-Tap are blocked. */
    disabled?: boolean;
    /** Message shown (and surfaced via onError) while disabled. */
    disabledHint?: string;
    /** Sent to the backend as `accepted_terms` (required to create a new account). */
    acceptedTerms?: boolean;
    /** Small caption under the button, e.g. "Business email only". */
    note?: string;
}

export default function GoogleAuthSection({
    context,
    onError,
    onSuccess,
    disabled = false,
    disabledHint,
    acceptedTerms,
    note,
}: GoogleAuthSectionProps) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const buttonRef = useRef<HTMLDivElement | null>(null);
    const initializedRef = useRef(false);
    const onErrorRef = useRef(onError);
    const onSuccessRef = useRef(onSuccess);
    const isSubmittingRef = useRef(false);
    const disabledRef = useRef(disabled);
    const disabledHintRef = useRef(disabledHint);
    const acceptedTermsRef = useRef(acceptedTerms);
    const [scriptReady, setScriptReady] = useState(
        typeof window !== 'undefined' && Boolean(window.google?.accounts.id),
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        onErrorRef.current = onError;
        onSuccessRef.current = onSuccess;
        isSubmittingRef.current = isSubmitting;
        disabledRef.current = disabled;
        disabledHintRef.current = disabledHint;
        acceptedTermsRef.current = acceptedTerms;
    }, [isSubmitting, onError, onSuccess, disabled, disabledHint, acceptedTerms]);

    useEffect(() => {
        if (!clientId || !buttonRef.current || !window.google?.accounts.id) {
            return;
        }

        const googleIdentity = window.google.accounts.id;
        if (!initializedRef.current) {
            googleIdentity.initialize({
                client_id: clientId,
                callback: async (response) => {
                    if (!response.credential || isSubmittingRef.current) {
                        return;
                    }

                    // Gate One-Tap / button while terms are unaccepted.
                    if (disabledRef.current) {
                        onErrorRef.current(disabledHintRef.current || '');
                        return;
                    }

                    onErrorRef.current('');
                    isSubmittingRef.current = true;
                    setIsSubmitting(true);
                    try {
                        const data = await apiRequest<TokenResponse>('/auth/google', {
                            method: 'POST',
                            body: {
                                credential: response.credential,
                                context,
                                select_by: response.select_by,
                                accepted_terms: Boolean(acceptedTermsRef.current),
                            },
                        });
                        setToken(data.access_token);
                        onSuccessRef.current();
                    } catch (error) {
                        onErrorRef.current(
                            error instanceof Error
                                ? error.message
                                : 'Google sign-in failed',
                        );
                    } finally {
                        isSubmittingRef.current = false;
                        setIsSubmitting(false);
                    }
                },
                cancel_on_tap_outside: true,
                context,
                use_fedcm_for_prompt: true,
            });
            initializedRef.current = true;
        }

        buttonRef.current.innerHTML = '';
        googleIdentity.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            type: 'standard',
            text: context === 'signup' ? 'signup_with' : 'signin_with',
            width: Math.min(400, window.innerWidth - 40),
        });
        // Don't auto-prompt One-Tap while gated behind the terms checkbox.
        if (!disabledRef.current) {
            googleIdentity.prompt();
        }

        return () => {
            window.google?.accounts.id.cancel();
        };
    }, [clientId, context, scriptReady]);

    if (!clientId) {
        return null;
    }

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => setScriptReady(true)}
            />
            <div className={styles.googleSection}>
                <div className={styles.googleButtonWrap}>
                    <div
                        ref={buttonRef}
                        className={styles.googleButtonShell}
                        data-testid={`google-${context}-button`}
                    />
                    {disabled && (
                        <div
                            className={styles.googleDisabledOverlay}
                            role="button"
                            tabIndex={0}
                            aria-disabled="true"
                            aria-label={disabledHint}
                            onClick={() => onErrorRef.current(disabledHint || '')}
                        />
                    )}
                </div>
                {note && <p className={styles.googleBusinessNote}>{note}</p>}
                {isSubmitting && (
                    <p className={styles.altchaHint}>
                        Completing Google sign-in...
                    </p>
                )}
            </div>
        </>
    );
}
