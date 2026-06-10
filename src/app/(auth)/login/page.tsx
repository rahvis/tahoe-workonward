'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, setToken } from '@/lib/api';
import { EnvelopeClosedIcon, LockClosedIcon, ExclamationTriangleIcon } from '@/components/ui/icons';
import AltchaField, { type AltchaFieldHandle } from '@/components/auth/AltchaField';
import GoogleAuthSection from '@/components/auth/GoogleAuthSection';
import AuthShell from '@/components/auth/AuthShell';
import styles from '../auth.module.css';

export default function LoginPage() {
    const router = useRouter();
    const altchaRef = useRef<AltchaFieldHandle>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }

        setLoading(true);

        try {
            const altcha = await altchaRef.current?.ensureVerified();
            if (!altcha) {
                throw new Error('Human verification is required');
            }
            const data = await apiRequest<{ access_token: string }>('/auth/login', {
                method: 'POST',
                body: { email, password, altcha },
            });
            setToken(data.access_token);
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            altchaRef.current?.reset();
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Welcome back" subtitle="Sign in to your Tahoe account and continue the recruiter workflow.">
            <div className={styles.stack}>
                {error && (
                    <div className="tahoe-banner tahoe-banner-error" role="alert">
                        <ExclamationTriangleIcon />
                        <span>
                            {error}
                            {error.toLowerCase().includes('verify your email') && (
                                <span className={styles.bannerLinks}>
                                    <Link href={`/resend-verification?email=${encodeURIComponent(email.trim().toLowerCase())}`} className={styles.authLink}>Resend verification email</Link>
                                </span>
                            )}
                        </span>
                    </div>
                )}

                <GoogleAuthSection
                    context="signin"
                    onError={setError}
                    onSuccess={() => router.push('/dashboard')}
                />

                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <div className={styles.field}>
                        <label htmlFor="login-email" className="tahoe-label">Email</label>
                        <div className={styles.inputShell}>
                            <span className={styles.inputIcon}><EnvelopeClosedIcon /></span>
                            <input
                                id="login-email"
                                className={styles.input}
                                placeholder="you@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="login-password" className="tahoe-label">Password</label>
                        <div className={styles.inputShell}>
                            <span className={styles.inputIcon}><LockClosedIcon /></span>
                            <input
                                id="login-password"
                                className={styles.input}
                                placeholder="Enter your password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <AltchaField ref={altchaRef} flow="login" />

                    <button className="tahoe-button" type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className={styles.footerLinks}>
                    <div>
                        <Link href="/forgot-password" className={styles.authLink}>Forgot password?</Link>
                    </div>
                    <div>
                        Don&apos;t have an account? <Link href="/signup" className={styles.authLink}>Sign up</Link>
                    </div>
                </div>
            </div>
        </AuthShell>
    );
}
