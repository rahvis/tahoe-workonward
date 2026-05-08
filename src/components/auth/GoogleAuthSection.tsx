'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { apiRequest, setToken } from '@/lib/api';
import styles from '@/app/(auth)/auth.module.css';

interface TokenResponse {
    access_token: string;
}

interface GoogleAuthSectionProps {
    context: 'signin' | 'signup';
    onError: (message: string) => void;
    onSuccess: () => void;
}

export default function GoogleAuthSection({
    context,
    onError,
    onSuccess,
}: GoogleAuthSectionProps) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const buttonRef = useRef<HTMLDivElement | null>(null);
    const initializedRef = useRef(false);
    const onErrorRef = useRef(onError);
    const onSuccessRef = useRef(onSuccess);
    const isSubmittingRef = useRef(false);
    const [scriptReady, setScriptReady] = useState(
        typeof window !== 'undefined' && Boolean(window.google?.accounts.id),
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        onErrorRef.current = onError;
        onSuccessRef.current = onSuccess;
        isSubmittingRef.current = isSubmitting;
    }, [isSubmitting, onError, onSuccess]);

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
            width: Math.min(380, window.innerWidth - 72),
        });
        googleIdentity.prompt();

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
                <div
                    ref={buttonRef}
                    className={styles.googleButtonShell}
                    data-testid={`google-${context}-button`}
                />
                {isSubmitting && (
                    <p className={styles.altchaHint}>
                        Completing Google sign-in...
                    </p>
                )}
            </div>
        </>
    );
}
