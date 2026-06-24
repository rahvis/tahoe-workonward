'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, setToken } from '@/lib/api';
import { EnvelopeClosedIcon, ExclamationTriangleIcon } from '@/components/ui/icons';
import GoogleAuthSection from '@/components/auth/GoogleAuthSection';
import MicrosoftAuthSection from '@/components/auth/MicrosoftAuthSection';
import AuthShell from '@/components/auth/AuthShell';
import PasswordInput from '@/components/auth/PasswordInput';
import { authT } from '@/i18n/auth-dictionary';
import { useLocale } from '@/i18n/useLocale';
import styles from '../auth.module.css';

export default function LoginPage() {
    const router = useRouter();
    const lang = useLocale();
    const t = authT[lang].login;
    const c = authT[lang].common;
    const L = (path: string) => `/${lang}${path}`;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError(t.errFill);
            return;
        }

        setLoading(true);

        try {
            const data = await apiRequest<{ access_token: string }>('/auth/login', {
                method: 'POST',
                body: { email, password },
            });
            setToken(data.access_token);
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : t.errFailed);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title={t.title} subtitle={t.subtitle}>
            <div className={styles.stack}>
                {error && (
                    <div className="tahoe-banner tahoe-banner-error" role="alert">
                        <ExclamationTriangleIcon />
                        <span>
                            {error}
                            {error.toLowerCase().includes('verify your email') && (
                                <span className={styles.bannerLinks}>
                                    <Link href={L(`/resend-verification?email=${encodeURIComponent(email.trim().toLowerCase())}`)} className={styles.authLink}>{t.resendVerification}</Link>
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

                <MicrosoftAuthSection
                    context="signin"
                    onError={setError}
                    onSuccess={() => router.push('/dashboard')}
                />

                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <div className={styles.field}>
                        <label htmlFor="login-email" className="tahoe-label">{c.email}</label>
                        <div className={styles.inputShell}>
                            <span className={styles.inputIcon}><EnvelopeClosedIcon /></span>
                            <input
                                id="login-email"
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
                        <div className={styles.labelRow}>
                            <label htmlFor="login-password" className="tahoe-label">{c.password}</label>
                            <Link href={L('/forgot-password')} className={styles.authLink}>{t.forgot}</Link>
                        </div>
                        <PasswordInput
                            id="login-password"
                            value={password}
                            onChange={setPassword}
                            placeholder={t.passwordPlaceholder}
                            autoComplete="current-password"
                        />
                    </div>

                    <button className="tahoe-button" type="submit" disabled={loading}>
                        {loading ? t.submitting : t.submit}
                    </button>
                </form>

                <div className={styles.footerLinks}>
                    <div>
                        {t.noAccount} <Link href={L('/signup')} className={styles.authLink}>{c.signUp}</Link>
                    </div>
                </div>
            </div>
        </AuthShell>
    );
}
