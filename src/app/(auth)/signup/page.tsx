'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { PersonIcon, EnvelopeClosedIcon, LockClosedIcon, ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import AltchaField, { type AltchaFieldHandle } from '@/components/auth/AltchaField';
import GoogleAuthSection from '@/components/auth/GoogleAuthSection';
import AuthShell from '@/components/auth/AuthShell';
import styles from '../auth.module.css';

export default function SignupPage() {
    const router = useRouter();
    const altchaRef = useRef<AltchaFieldHandle>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
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

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();

        setLoading(true);
        try {
            const altcha = await altchaRef.current?.ensureVerified();
            if (!altcha) {
                throw new Error('Human verification is required');
            }
            const response = await apiRequest<{ is_verified: boolean }>('/auth/signup', {
                method: 'POST',
                body: {
                    first_name: trimmedFirst,
                    last_name: trimmedLast,
                    email: normalizedEmail,
                    password,
                    confirm_password: confirmPassword,
                    altcha,
                },
            });
            setSuccess(
                response.is_verified
                    ? 'Account created successfully! You can now sign in.'
                    : 'Account created. Check your email to verify your account before signing in.',
            );
            setError('');
            setPassword('');
            setConfirmPassword('');
            altchaRef.current?.reset();
        } catch (err) {
            if (err instanceof Error) {
                if (err.message.includes('Email already registered')) {
                    setError('Email already registered. Use Forgot password to regain access.');
                } else if (err.message.includes('Database unavailable')) {
                    setError('Backend is unavailable right now. Please try again shortly.');
                } else if (err.message.includes('verify your email')) {
                    setError('Please verify your email before signing in.');
                } else {
                    setError(err.message || 'Registration failed. Please retry.');
                }
            } else {
                setError('Registration failed.');
            }
            altchaRef.current?.reset();
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Create an account" subtitle="" panelNote="">
            <div className={styles.stack}>
                {error && (
                    <div className="tahoe-banner tahoe-banner-error" role="alert">
                        <ExclamationTriangleIcon />
                        <span>
                            {error}
                            {error.includes('Forgot password') && (
                                <span className={styles.bannerLinks}>
                                    <Link href={`/forgot-password?email=${encodeURIComponent(email.trim().toLowerCase())}`} className={styles.authLink}>
                                        Forgot password
                                    </Link>
                                </span>
                            )}
                        </span>
                    </div>
                )}

                {success && (
                    <div className="tahoe-banner tahoe-banner-success" role="status">
                        <CheckCircledIcon />
                        <span>
                            {success}
                            <span className={styles.bannerLinks}>
                                <Link href="/login" className={styles.authLink}>Go to sign in</Link>
                            </span>
                        </span>
                    </div>
                )}

                <GoogleAuthSection
                    context="signup"
                    onError={setError}
                    onSuccess={() => router.push('/dashboard')}
                />

                <div className={styles.authDivider}>or continue with email</div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.fieldGridTwo}>
                        <div className={styles.field}>
                            <label htmlFor="signup-first-name" className="tahoe-label">First Name</label>
                            <div className={styles.inputShell}>
                                <span className={styles.inputIcon}><PersonIcon /></span>
                                <input
                                    id="signup-first-name"
                                    className={styles.input}
                                    placeholder="John"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="signup-last-name" className="tahoe-label">Last Name</label>
                            <div className={styles.inputShell}>
                                <span className={styles.inputIcon}><PersonIcon /></span>
                                <input
                                    id="signup-last-name"
                                    className={styles.input}
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="signup-email" className="tahoe-label">Email</label>
                        <div className={styles.inputShell}>
                            <span className={styles.inputIcon}><EnvelopeClosedIcon /></span>
                            <input
                                id="signup-email"
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
                        <label htmlFor="signup-password" className="tahoe-label">Password</label>
                        <div className={styles.inputShell}>
                            <span className={styles.inputIcon}><LockClosedIcon /></span>
                            <input
                                id="signup-password"
                                className={styles.input}
                                placeholder="At least 8 characters"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="signup-confirm-password" className="tahoe-label">Confirm Password</label>
                        <div className={styles.inputShell}>
                            <span className={styles.inputIcon}><LockClosedIcon /></span>
                            <input
                                id="signup-confirm-password"
                                className={styles.input}
                                placeholder="Re-enter your password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <AltchaField ref={altchaRef} flow="signup" />

                    <button className="tahoe-button" type="submit" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className={styles.footerLinks}>
                    <div>
                        Already have an account? <Link href="/login" className={styles.authLink}>Sign in</Link>
                    </div>
                </div>
            </div>
        </AuthShell>
    );
}
