'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { ExclamationTriangleIcon, CheckCircledIcon } from '@/components/ui/icons';
import AuthShell from '@/components/auth/AuthShell';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordChecklist from '@/components/auth/PasswordChecklist';
import styles from '../auth.module.css';

const MIN_LENGTH = 12;

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password || !confirmPassword) {
            setError('Please enter and confirm your new password.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < MIN_LENGTH) {
            setError(`Password must be at least ${MIN_LENGTH} characters`);
            return;
        }

        setLoading(true);
        try {
            await apiRequest('/auth/reset-password', {
                method: 'POST',
                body: { token, new_password: password },
            });
            setSuccess(true);
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Reset your password"
            subtitle="Choose a new password for your Tahoe account."
            panelNote="For your security, this link works once and expires 1 hour after it was sent."
        >
            <div className={styles.stack}>
                {error && (
                    <div className="tahoe-banner tahoe-banner-error" role="alert">
                        <ExclamationTriangleIcon />
                        <span>{error}</span>
                    </div>
                )}

                {!token ? (
                    <>
                        <div className="tahoe-banner tahoe-banner-error" role="alert">
                            <ExclamationTriangleIcon />
                            <span>This reset link is invalid or incomplete.</span>
                        </div>
                        <div className={styles.footerLinks}>
                            <div>
                                <Link href="/forgot-password" className={styles.authLink}>Request a new reset link</Link>
                            </div>
                        </div>
                    </>
                ) : success ? (
                    <>
                        <div className="tahoe-banner tahoe-banner-success" role="status">
                            <CheckCircledIcon />
                            <span>Your password has been reset. You can now sign in with your new password.</span>
                        </div>
                        <div className={styles.footerLinks}>
                            <div>
                                <Link href="/login" className={styles.authLink}>Sign in</Link>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className={styles.form} noValidate>
                            <div className={styles.field}>
                                <label htmlFor="reset-password" className="tahoe-label">New password</label>
                                <PasswordInput
                                    id="reset-password"
                                    value={password}
                                    onChange={setPassword}
                                    placeholder="At least 12 characters"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="reset-confirm-password" className="tahoe-label">Confirm new password</label>
                                <PasswordInput
                                    id="reset-confirm-password"
                                    value={confirmPassword}
                                    onChange={setConfirmPassword}
                                    placeholder="Re-enter your new password"
                                    autoComplete="new-password"
                                />
                            </div>

                            <PasswordChecklist password={password} confirmPassword={confirmPassword} showMatch minLength={MIN_LENGTH} />

                            <button className="tahoe-button" type="submit" disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset password'}
                            </button>
                        </form>

                        <div className={styles.footerLinks}>
                            <div>
                                <Link href="/login" className={styles.authLink}>Back to sign in</Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AuthShell>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className={styles.loadingState}><span className="tahoe-spinner" /><span>Loading...</span></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
