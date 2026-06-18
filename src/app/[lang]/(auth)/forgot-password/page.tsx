'use client';
import { useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { EnvelopeClosedIcon, ExclamationTriangleIcon, CheckCircledIcon } from '@/components/ui/icons';
import AuthShell from '@/components/auth/AuthShell';
import { authT } from '@/i18n/auth-dictionary';
import { useLocale } from '@/i18n/useLocale';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
    const lang = useLocale();
    const t = authT[lang].forgot;
    const c = authT[lang].common;
    const L = (path: string) => `/${lang}${path}`;
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError(t.errEmail);
            return;
        }

        setLoading(true);

        try {
            await apiRequest('/auth/forgot-password', {
                method: 'POST',
                body: { email: email.trim().toLowerCase() },
            });
            // Same generic response whether or not the email exists (no account
            // enumeration). Briefly confirm, then auto-dismiss after 1s.
            setShowSuccess(true);
            window.setTimeout(() => setShowSuccess(false), 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : t.errSend);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title={t.title}>
            <div className={styles.stack}>
                {error && (
                    <div className="tahoe-banner tahoe-banner-error" role="alert">
                        <ExclamationTriangleIcon />
                        <span>{error}</span>
                    </div>
                )}

                {showSuccess && (
                    <div className="tahoe-banner tahoe-banner-success" role="status">
                        <CheckCircledIcon />
                        <span>{t.success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <div className={styles.field}>
                        <label htmlFor="forgot-email" className="tahoe-label" style={{ color: 'var(--tahoe-color-accent)' }}>
                            {t.subtitle}
                        </label>
                        <div className={styles.inputShell}>
                            <span className={styles.inputIcon}><EnvelopeClosedIcon /></span>
                            <input
                                id="forgot-email"
                                className={styles.input}
                                placeholder={c.emailPlaceholder}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button className={`tahoe-button ${styles.submitAccent}`} type="submit" disabled={loading}>
                        {loading ? t.submitting : t.submit}
                    </button>
                </form>

                <div className={styles.footerLinks}>
                    <div>
                        {t.remember} <Link href={L('/login')} className={styles.authLink}>{c.signIn}</Link>
                    </div>
                </div>
            </div>
        </AuthShell>
    );
}
