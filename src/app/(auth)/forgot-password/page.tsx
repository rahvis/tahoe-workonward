'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { EnvelopeClosedIcon, ExclamationTriangleIcon, CheckCircledIcon } from '@/components/ui/icons';
import AltchaField, { type AltchaFieldHandle } from '@/components/auth/AltchaField';
import AuthShell from '@/components/auth/AuthShell';
import styles from '../auth.module.css';

import { Suspense } from 'react';

function ForgotPasswordContent() {
    const searchParams = useSearchParams();
    const altchaRef = useRef<AltchaFieldHandle>(null);
    const prefillEmail = searchParams.get('email') || '';
    const [email, setEmail] = useState(prefillEmail);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (prefillEmail) {
            setEmail(prefillEmail);
        }
    }, [prefillEmail]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const altcha = await altchaRef.current?.ensureVerified();
            if (!altcha) {
                throw new Error('Human verification is required');
            }
            await apiRequest('/auth/forgot-password', {
                method: 'POST',
                body: { email, altcha },
            });
            setSuccess('Password reset link sent! Check your email.');
            altchaRef.current?.reset();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset link');
            altchaRef.current?.reset();
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Forgot password?"
            subtitle="Enter your email and Tahoe will send a reset link."
        >
            <div className={styles.stack}>
                {error && (
                    <div className="tahoe-banner tahoe-banner-error" role="alert">
                        <ExclamationTriangleIcon />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="tahoe-banner tahoe-banner-success" role="status">
                        <CheckCircledIcon />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="forgot-password-email" className="tahoe-label">Email</label>
                        <div className={styles.inputShell}>
                            <span className={styles.inputIcon}><EnvelopeClosedIcon /></span>
                            <input
                                id="forgot-password-email"
                                className={styles.input}
                                placeholder="you@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <AltchaField ref={altchaRef} flow="forgot-password" />

                    <button className="tahoe-button" type="submit" disabled={loading}>
                        {loading ? 'Sending reset link...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className={styles.footerLinks}>
                    <div>
                        Remember your password? <Link href="/login" className={styles.authLink}>Sign in</Link>
                    </div>
                </div>
            </div>
        </AuthShell>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className={styles.loadingState}><span className="tahoe-spinner" /><span>Loading...</span></div>}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
