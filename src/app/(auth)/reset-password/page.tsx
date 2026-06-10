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

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 12) {
            setError('Password must be at least 12 characters');
            return;
        }

        setLoading(true);
        try {
            await apiRequest('/auth/reset-password', {
                method: 'POST',
                body: { token, new_password: password },
            });
            setSuccess('Password reset successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <AuthShell
                title="Invalid link"
                subtitle="This password reset link is invalid or has expired."
                panelNote="Request a fresh email and Tahoe will issue a new reset link."
            >
                <div className={styles.footerLinks}>
                    <Link href="/forgot-password" className={styles.authLink}>Request a new link</Link>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="Reset password"
            subtitle="Enter your new password below."
            panelNote="Choose a new password for the same Tahoe account. The reset token stays in the URL for this step only."
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
                        <span>
                            {success}
                            <span className={styles.bannerLinks}>
                                <Link href="/login" className={styles.authLink}>Sign in</Link>
                            </span>
                        </span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="reset-password" className="tahoe-label">New Password</label>
                        <PasswordInput
                            id="reset-password"
                            value={password}
                            onChange={setPassword}
                            placeholder="At least 12 characters"
                            autoComplete="new-password"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="reset-confirm-password" className="tahoe-label">Confirm Password</label>
                        <PasswordInput
                            id="reset-confirm-password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                        />
                    </div>

                    <PasswordChecklist password={password} confirmPassword={confirmPassword} showMatch minLength={12} />

                    <button className="tahoe-button" type="submit" disabled={loading}>
                        {loading ? 'Resetting password...' : 'Reset Password'}
                    </button>
                </form>

                <div className={styles.footerLinks}>
                    <div>
                        <Link href="/login" className={styles.authLink}>Back to sign in</Link>
                    </div>
                </div>
            </div>
        </AuthShell>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className={styles.loadingState}>
                <span className="tahoe-spinner" />
                <span>Loading...</span>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
