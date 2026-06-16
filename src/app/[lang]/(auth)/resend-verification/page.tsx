'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { EnvelopeClosedIcon, ExclamationTriangleIcon, CheckCircledIcon } from '@/components/ui/icons';
import AuthShell from '@/components/auth/AuthShell';
import { authT } from '@/i18n/auth-dictionary';
import { useLocale } from '@/i18n/useLocale';
import styles from '../auth.module.css';

function ResendVerificationContent() {
    const lang = useLocale();
    const t = authT[lang].resend;
    const c = authT[lang].common;
    const L = (path: string) => `/${lang}${path}`;
    const searchParams = useSearchParams();
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

        if (!email.trim()) {
            setError(t.errEmail);
            return;
        }

        setLoading(true);

        try {
            await apiRequest('/auth/resend-verification', {
                method: 'POST',
                body: { email: email.trim().toLowerCase() },
            });
            setSuccess(t.success);
        } catch (err) {
            setError(err instanceof Error ? err.message : t.errSend);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title={t.title} subtitle={t.subtitle} panelNote={t.panelNote}>
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

                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <div className={styles.field}>
                        <label htmlFor="resend-email" className="tahoe-label">{c.email}</label>
                        <div className={styles.inputShell}>
                            <span className={styles.inputIcon}><EnvelopeClosedIcon /></span>
                            <input
                                id="resend-email"
                                className={styles.input}
                                placeholder={c.emailPlaceholder}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button className="tahoe-button" type="submit" disabled={loading}>
                        {loading ? t.submitting : t.submit}
                    </button>
                </form>

                <div className={styles.footerLinks}>
                    <div>
                        {t.alreadyVerified} <Link href={L('/login')} className={styles.authLink}>{c.signIn}</Link>
                    </div>
                </div>
            </div>
        </AuthShell>
    );
}

export default function ResendVerificationPage() {
    return (
        <Suspense fallback={<div className={styles.loadingState}><span className="tahoe-spinner" /><span>...</span></div>}>
            <ResendVerificationContent />
        </Suspense>
    );
}
