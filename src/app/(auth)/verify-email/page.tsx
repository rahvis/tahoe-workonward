'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import AuthShell from '@/components/auth/AuthShell';
import styles from '../auth.module.css';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
        token ? 'loading' : 'error',
    );
    const [message, setMessage] = useState(token ? '' : 'Invalid verification link.');

    useEffect(() => {
        if (!token) {
            return;
        }

        const verify = async () => {
            try {
                await apiRequest('/auth/verify-email', {
                    method: 'POST',
                    body: { token },
                });
                setStatus('success');
                setMessage('Email verified successfully!');
            } catch (err) {
                setStatus('error');
                setMessage(err instanceof Error ? err.message : 'Verification failed');
            }
        };

        verify();
    }, [token]);

    return (
        <AuthShell
            title="Verify email"
            subtitle="Tahoe is confirming the link from your inbox."
            panelNote="This page only checks the verification token. It does not sign you in automatically."
        >
            {status === 'loading' && (
                <div className={styles.loadingState}>
                    <span className="tahoe-spinner" />
                    <div>Verifying your email...</div>
                    <div className={styles.altchaHint}>Please wait a moment.</div>
                </div>
            )}

            {status === 'success' && (
                <div className={styles.stack}>
                    <div className="tahoe-banner tahoe-banner-success" role="status">
                        <CheckCircledIcon />
                        <span>{message}</span>
                    </div>
                    <div className={styles.footerLinks}>
                        <div>
                            You can now <Link href="/login" className={styles.authLink}>sign in to your account</Link>
                        </div>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className={styles.stack}>
                    <div className="tahoe-banner tahoe-banner-error" role="alert">
                        <ExclamationTriangleIcon />
                        <span>{message}</span>
                    </div>
                    <div className={styles.footerLinks}>
                        <div>
                            <Link href="/login" className={styles.authLink}>Back to sign in</Link>
                        </div>
                    </div>
                </div>
            )}
        </AuthShell>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className={styles.loadingState}>
                <span className="tahoe-spinner" />
                <span>Loading...</span>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
