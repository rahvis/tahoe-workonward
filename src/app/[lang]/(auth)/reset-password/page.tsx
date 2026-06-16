'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { ExclamationTriangleIcon, CheckCircledIcon } from '@/components/ui/icons';
import AuthShell from '@/components/auth/AuthShell';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordChecklist from '@/components/auth/PasswordChecklist';
import { authT } from '@/i18n/auth-dictionary';
import { useLocale } from '@/i18n/useLocale';
import styles from '../auth.module.css';

const MIN_LENGTH = 12;

function ResetPasswordContent() {
    const lang = useLocale();
    const t = authT[lang].reset;
    const c = authT[lang].common;
    const L = (path: string) => `/${lang}${path}`;
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
            setError(t.errFill);
            return;
        }
        if (password !== confirmPassword) {
            setError(t.errNoMatch);
            return;
        }
        if (password.length < MIN_LENGTH) {
            setError(t.errMin);
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
            setError(err instanceof Error ? err.message : t.errReset);
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

                {!token ? (
                    <>
                        <div className="tahoe-banner tahoe-banner-error" role="alert">
                            <ExclamationTriangleIcon />
                            <span>{t.invalidLink}</span>
                        </div>
                        <div className={styles.footerLinks}>
                            <div>
                                <Link href={L('/forgot-password')} className={styles.authLink}>{t.requestNew}</Link>
                            </div>
                        </div>
                    </>
                ) : success ? (
                    <>
                        <div className="tahoe-banner tahoe-banner-success" role="status">
                            <CheckCircledIcon />
                            <span>{t.success}</span>
                        </div>
                        <div className={styles.footerLinks}>
                            <div>
                                <Link href={L('/login')} className={styles.authLink}>{c.signIn}</Link>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className={styles.form} noValidate>
                            <div className={styles.field}>
                                <label htmlFor="reset-password" className="tahoe-label">{t.newPassword}</label>
                                <PasswordInput
                                    id="reset-password"
                                    value={password}
                                    onChange={setPassword}
                                    placeholder={t.newPasswordPlaceholder}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="reset-confirm-password" className="tahoe-label">{t.confirm}</label>
                                <PasswordInput
                                    id="reset-confirm-password"
                                    value={confirmPassword}
                                    onChange={setConfirmPassword}
                                    placeholder={t.confirmPlaceholder}
                                    autoComplete="new-password"
                                />
                            </div>

                            <PasswordChecklist password={password} confirmPassword={confirmPassword} showMatch minLength={MIN_LENGTH} />

                            <button className="tahoe-button" type="submit" disabled={loading}>
                                {loading ? t.submitting : t.submit}
                            </button>
                        </form>

                        <div className={styles.footerLinks}>
                            <div>
                                <Link href={L('/login')} className={styles.authLink}>{c.backToSignIn}</Link>
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
        <Suspense fallback={<div className={styles.loadingState}><span className="tahoe-spinner" /><span>...</span></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
