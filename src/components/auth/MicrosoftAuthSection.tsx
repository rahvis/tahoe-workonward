'use client';

import { useState } from 'react';
import { apiRequest, setToken } from '@/lib/api';
import {
    getMsalInstance,
    isMicrosoftConfigured,
    MICROSOFT_SCOPES,
} from '@/lib/msal';
import styles from '@/app/[lang]/(auth)/auth.module.css';

interface TokenResponse {
    access_token: string;
}

interface MicrosoftAuthSectionProps {
    context: 'signin' | 'signup';
    onError: (message: string) => void;
    onSuccess: () => void;
    /** When true, the button is greyed out and clicks surface `disabledHint`. */
    disabled?: boolean;
    /** Message shown (via onError) while disabled. */
    disabledHint?: string;
    /** Sent to the backend as `accepted_terms` (required to create a new account). */
    acceptedTerms?: boolean;
    /** Button label override; defaults to the context-appropriate copy. */
    label?: string;
}

function MicrosoftLogo() {
    return (
        <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
        </svg>
    );
}

export default function MicrosoftAuthSection({
    context,
    onError,
    onSuccess,
    disabled = false,
    disabledHint,
    acceptedTerms,
    label,
}: MicrosoftAuthSectionProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isMicrosoftConfigured()) {
        return null;
    }

    const handleClick = async () => {
        if (isSubmitting) {
            return;
        }
        // Gate behind the terms checkbox, mirroring the Google button.
        if (disabled) {
            onError(disabledHint || '');
            return;
        }

        onError('');
        setIsSubmitting(true);
        try {
            const msal = await getMsalInstance();
            if (!msal) {
                throw new Error('Microsoft sign-in is unavailable');
            }
            const result = await msal.loginPopup({
                scopes: MICROSOFT_SCOPES,
                prompt: 'select_account',
            });
            if (!result.idToken) {
                throw new Error('Microsoft sign-in did not return a token');
            }
            const data = await apiRequest<TokenResponse>('/auth/microsoft', {
                method: 'POST',
                body: {
                    credential: result.idToken,
                    context,
                    accepted_terms: Boolean(acceptedTerms),
                },
            });
            setToken(data.access_token);
            onSuccess();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Microsoft sign-in failed';
            // Swallow benign popup-cancellation noise from MSAL.
            if (
                !/user_cancelled|popup_window_error|interaction_in_progress|window\s*closed/i.test(
                    message,
                )
            ) {
                onError(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const text =
        label || (context === 'signup' ? 'Sign up with Microsoft' : 'Sign in with Microsoft');

    return (
        <div className={styles.googleSection}>
            <button
                type="button"
                className={styles.microsoftButton}
                onClick={handleClick}
                disabled={isSubmitting}
                aria-disabled={disabled}
                data-testid={`microsoft-${context}-button`}
            >
                <MicrosoftLogo />
                <span>{isSubmitting ? 'Completing Microsoft sign-in…' : text}</span>
            </button>
        </div>
    );
}
