'use client';

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { getApiUrl } from '@/lib/api';
import styles from '@/app/[lang]/(auth)/auth.module.css';

export interface AltchaFieldHandle {
    ensureVerified: () => Promise<string>;
    reset: () => void;
}

interface AltchaFieldProps {
    flow: 'signup' | 'login' | 'resend-verification' | 'partner-application';
}

interface AltchaStateDetail {
    state?: string;
    payload?: string;
    error?: string;
}

const AltchaField = forwardRef<AltchaFieldHandle, AltchaFieldProps>(function AltchaField(
    { flow },
    ref,
) {
    const widgetId = useId().replace(/:/g, '-');
    const widgetRef = useRef<AltchaWidgetElement | null>(null);
    const pendingVerificationRef = useRef<{
        resolve: (payload: string) => void;
        reject: (error: Error) => void;
    } | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [payload, setPayload] = useState('');
    const [loadError, setLoadError] = useState('');
    const challengeUrl = getApiUrl(`/auth/altcha/challenge?flow=${flow}`);

    useEffect(() => {
        let isMounted = true;

        import('altcha')
            .then(() => {
                if (isMounted) {
                    setIsReady(true);
                    setLoadError('');
                }
            })
            .catch(() => {
                if (isMounted) {
                    setLoadError('Human verification is unavailable right now');
                }
            });

        return () => {
            isMounted = false;
            pendingVerificationRef.current?.reject(
                new Error('Human verification was cancelled'),
            );
            pendingVerificationRef.current = null;
        };
    }, []);

    useEffect(() => {
        const widget = widgetRef.current;
        if (!widget) {
            return;
        }

        const handleStateChange = (event: Event) => {
            const detail = (event as CustomEvent<AltchaStateDetail>).detail ?? {};
            if (detail.payload) {
                setPayload(detail.payload);
            }
            if (detail.state === 'verified' && detail.payload) {
                pendingVerificationRef.current?.resolve(detail.payload);
                pendingVerificationRef.current = null;
            }
            if (detail.state === 'error') {
                const error = new Error(detail.error || 'Human verification failed');
                pendingVerificationRef.current?.reject(error);
                pendingVerificationRef.current = null;
                setPayload('');
            }
        };

        widget.addEventListener('statechange', handleStateChange as EventListener);
        return () => {
            widget.removeEventListener('statechange', handleStateChange as EventListener);
        };
    }, []);

    useImperativeHandle(ref, () => ({
        ensureVerified: async () => {
            const widget = widgetRef.current;
            if (!widget || !isReady) {
                throw new Error(loadError || 'Human verification is still loading');
            }

            if (payload && widget.getState?.() === 'verified') {
                return payload;
            }

            setPayload('');
            widget.reset?.();

            return new Promise<string>((resolve, reject) => {
                pendingVerificationRef.current = { resolve, reject };
                try {
                    widget.verify();
                } catch (error) {
                    pendingVerificationRef.current = null;
                    reject(
                        error instanceof Error
                            ? error
                            : new Error('Human verification failed'),
                    );
                }
            });
        },
        reset: () => {
            pendingVerificationRef.current = null;
            setPayload('');
            widgetRef.current?.reset?.();
        },
    }), [isReady, loadError, payload]);

    return (
        <div className={styles.altchaField} aria-hidden="true">
            <altcha-widget
                ref={widgetRef}
                id={widgetId}
                auto="off"
                challengeurl={challengeUrl}
                delay={250}
                hidefooter
                hidelogo
                refetchonexpire
            />
            {loadError ? (
                <p className={`${styles.altchaHint} ${styles.altchaHintError}`}>{loadError}</p>
            ) : null}
        </div>
    );
});

export default AltchaField;
