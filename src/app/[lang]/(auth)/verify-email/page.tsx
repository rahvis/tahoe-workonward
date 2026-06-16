'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { ExclamationTriangleIcon, CheckCircledIcon } from '@/components/ui/icons';
import AuthShell from '@/components/auth/AuthShell';
import { authT } from '@/i18n/auth-dictionary';
import { useLocale } from '@/i18n/useLocale';
import styles from '../auth.module.css';

function VerifyEmailContent() {
    const lang = useLocale();
    const t = authT[lang].verify;
    const c = authT[lang].common;
    const L = (path: string) => `/${lang}${path}`;
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
        token ? 'loading' : 'error',
    );
    const [message, setMessage] = useState(token ? '' : t.invalidLink);

    useEffect(() => {
        if (!token) {
            return;
        }

        const verify = async () => {
            try {
                await apiRequest('/auth/verify-email', {
                    method: 'POST',
                    body: { token },
                });
                setStatus('success');
                setMessage(t.success);
            } catch (err) {
                setStatus('error');
                setMessage(err instanceof Error ? err.message : t.errFailed);
            }
        };

        verify();
    }, [token, t.success, t.errFailed]);

    return (
        <AuthShell title={t.title} subtitle={t.subtitle} panelNote={t.panelNote}>
            {status === 'loading' && (
                <div className={styles.loadingState}>
                    <span className="tahoe-spinner" />
                    <div>{t.verifying}</div>
                    <div className={styles.altchaHint}>{t.pleaseWait}</div>
                </div>
            )}

            {status === 'success' && (
                <div className={styles.stack}>
                    <div className="tahoe-banner tahoe-banner-success" role="status">
                        <CheckCircledIcon />
                        <span>{message}</span>
                    </div>
                    <div className={styles.footerLinks}>
                        <div>
                            {t.canSignIn} <Link href={L('/login')} className={styles.authLink}>{t.signInAccount}</Link>
                        </div>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className={styles.stack}>
                    <div className="tahoe-banner tahoe-banner-error" role="alert">
                        <ExclamationTriangleIcon />
                        <span>{message}</span>
                    </div>
                    <div className={styles.footerLinks}>
                        <div>
                            <Link href={L('/login')} className={styles.authLink}>{c.backToSignIn}</Link>
                        </div>
                    </div>
                </div>
            )}
        </AuthShell>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className={styles.loadingState}>
                <span className="tahoe-spinner" />
                <span>...</span>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
