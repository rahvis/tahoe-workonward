'use client';
import { useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { EnvelopeClosedIcon, ExclamationTriangleIcon, CheckCircledIcon } from '@/components/ui/icons';
import AuthShell from '@/components/auth/AuthShell';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }

        setLoading(true);

        try {
            await apiRequest('/auth/forgot-password', {
                method: 'POST',
                body: { email: email.trim().toLowerCase() },
            });
            // The backend returns the same generic response whether or not the
            // email exists (and never sends a link to Google-only accounts), so
            // we always show the same confirmation — no account enumeration.
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Forgot your password?"
            subtitle="Enter your email and Tahoe will send a link to reset your password."
            panelNote="Reset links are only for email/password accounts and expire after 1 hour."
        >
            <div className={styles.stack}>
                {error && (
                    <div className="tahoe-banner tahoe-banner-error" role="alert">
                        <ExclamationTriangleIcon />
                        <span>{error}</span>
                    </div>
                )}

                {submitted ? (
                    <>
                        <div className="tahoe-banner tahoe-banner-success" role="status">
                            <CheckCircledIcon />
                            <span>
                                If that email is registered, a reset link is on its way.
                                Check your inbox (and spam folder).
                            </span>
                        </div>
                        <div className={styles.altchaHint}>
                            Signed up with Google? Use <strong>Continue with Google</strong> on the{' '}
                            <Link href="/login" className={styles.authLink}>sign-in page</Link> —
                            Google accounts don&apos;t have a password to reset.
                        </div>
                        <div className={styles.footerLinks}>
                            <div>
                                <Link href="/login" className={styles.authLink}>Back to sign in</Link>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className={styles.form} noValidate>
                            <div className={styles.field}>
                                <label htmlFor="forgot-email" className="tahoe-label">Email</label>
                                <div className={styles.inputShell}>
                                    <span className={styles.inputIcon}><EnvelopeClosedIcon /></span>
                                    <input
                                        id="forgot-email"
                                        className={styles.input}
                                        placeholder="you@example.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button className="tahoe-button" type="submit" disabled={loading}>
                                {loading ? 'Sending...' : 'Send reset link'}
                            </button>
                        </form>

                        <div className={styles.footerLinks}>
                            <div>
                                Remember your password? <Link href="/login" className={styles.authLink}>Sign in</Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AuthShell>
    );
}
