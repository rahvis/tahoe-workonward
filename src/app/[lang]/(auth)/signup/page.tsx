'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { PersonIcon, EnvelopeClosedIcon, ExclamationTriangleIcon, CheckCircledIcon } from '@/components/ui/icons';
import GoogleAuthSection from '@/components/auth/GoogleAuthSection';
import AuthShell from '@/components/auth/AuthShell';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordChecklist from '@/components/auth/PasswordChecklist';
import { authT } from '@/i18n/auth-dictionary';
import { useLocale } from '@/i18n/useLocale';
import styles from '../auth.module.css';

export default function SignupPage() {
    const router = useRouter();
    const lang = useLocale();
    const t = authT[lang].signup;
    const c = authT[lang].common;
    const L = (path: string) => `/${lang}${path}`;
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

        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
            setError(t.errFill);
            return;
        }

        if (password !== confirmPassword) {
            setError(t.errNoMatch);
            return;
        }

        if (password.length < 12) {
            setError(t.errMin);
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();

        setLoading(true);
        try {
            const response = await apiRequest<{ is_verified: boolean }>('/auth/signup', {
                method: 'POST',
                body: {
                    first_name: trimmedFirst,
                    last_name: trimmedLast,
                    email: normalizedEmail,
                    password,
                    confirm_password: confirmPassword,
                },
            });
            setSuccess(response.is_verified ? t.successVerified : t.successCheck);
            setError('');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            if (err instanceof Error) {
                if (err.message.includes('Email already registered')) {
                    setError(t.errRegistered);
                } else if (err.message.includes('Database unavailable')) {
                    setError(t.errBackend);
                } else if (err.message.includes('verify your email')) {
                    setError(t.errVerify);
                } else {
                    setError(err.message || t.errGeneric);
                }
            } else {
                setError(t.errGeneric);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title={t.title} subtitle="" panelNote="">
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

                <GoogleAuthSection
                    context="signup"
                    onError={setError}
                    onSuccess={() => router.push('/dashboard')}
                />

                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <div className={styles.fieldGridTwo}>
                        <div className={styles.field}>
                            <label htmlFor="signup-first-name" className="tahoe-label">{t.firstName}</label>
                            <div className={styles.inputShell}>
                                <span className={styles.inputIcon}><PersonIcon /></span>
                                <input
                                    id="signup-first-name"
                                    className={styles.input}
                                    placeholder={t.firstNamePlaceholder}
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="signup-last-name" className="tahoe-label">{t.lastName}</label>
                            <div className={styles.inputShell}>
                                <span className={styles.inputIcon}><PersonIcon /></span>
                                <input
                                    id="signup-last-name"
                                    className={styles.input}
                                    placeholder={t.lastNamePlaceholder}
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="signup-email" className="tahoe-label">{c.email}</label>
                        <div className={styles.inputShell}>
                            <span className={styles.inputIcon}><EnvelopeClosedIcon /></span>
                            <input
                                id="signup-email"
                                className={styles.input}
                                placeholder={c.emailPlaceholder}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="signup-password" className="tahoe-label">{t.password}</label>
                        <PasswordInput
                            id="signup-password"
                            value={password}
                            onChange={setPassword}
                            placeholder={t.passwordPlaceholder}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="signup-confirm-password" className="tahoe-label">{t.confirm}</label>
                        <PasswordInput
                            id="signup-confirm-password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder={t.confirmPlaceholder}
                            autoComplete="new-password"
                        />
                    </div>

                    <PasswordChecklist password={password} confirmPassword={confirmPassword} showMatch minLength={12} />

                    <button className="tahoe-button" type="submit" disabled={loading}>
                        {loading ? t.submitting : t.submit}
                    </button>
                </form>

                <div className={styles.footerLinks}>
                    <div>
                        {t.alreadyHave} <Link href={L('/login')} className={styles.authLink}>{c.signIn}</Link>
                    </div>
                </div>
            </div>
        </AuthShell>
    );
}
