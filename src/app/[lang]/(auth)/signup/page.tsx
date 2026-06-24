'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { PersonIcon, EnvelopeClosedIcon, ExclamationTriangleIcon, CheckCircledIcon } from '@/components/ui/icons';
import GoogleAuthSection from '@/components/auth/GoogleAuthSection';
import MicrosoftAuthSection from '@/components/auth/MicrosoftAuthSection';
import AuthShell from '@/components/auth/AuthShell';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordChecklist from '@/components/auth/PasswordChecklist';
import { authT } from '@/i18n/auth-dictionary';
import { useLocale } from '@/i18n/useLocale';
import styles from '../auth.module.css';

// Small client-side set of the most common free/public providers for instant inline
// feedback. The backend (services/email_domain_policy.py) holds the authoritative
// ~12k-domain blocklist and is the real gate.
const COMMON_FREE_DOMAINS = new Set([
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com',
    'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com',
    'pm.me', 'gmx.com', 'gmx.net', 'mail.com', 'zoho.com', 'yandex.com',
    'ieee.org', 'acm.org', 'qq.com', '163.com',
    'naver.com', 'hanmail.net', 'daum.net', 'nate.com',
]);

function detectFreeDomain(email: string): boolean {
    const at = email.lastIndexOf('@');
    if (at < 0) return false;
    const domain = email.slice(at + 1).trim().toLowerCase();
    return domain.includes('.') && COMMON_FREE_DOMAINS.has(domain);
}

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
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const emailDomainError = email.trim() && detectFreeDomain(email) ? t.errFreeEmail : '';
    const canSubmit = agreed && !emailDomainError && !loading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
            setError(t.errFill);
            return;
        }

        if (emailDomainError) {
            setError(t.errFreeEmail);
            return;
        }

        if (!agreed) {
            setError(t.errAgreeTerms);
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
                    accepted_terms: agreed,
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
                } else if (err.message.toLowerCase().includes('business email')) {
                    setError(t.errFreeEmail);
                } else if (err.message.toLowerCase().includes('accept the terms')) {
                    setError(t.errAgreeTerms);
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

                <p className={styles.businessHint}>{t.businessEmailHint}</p>

                <GoogleAuthSection
                    context="signup"
                    onError={setError}
                    onSuccess={() => router.push('/dashboard')}
                    disabled={!agreed}
                    disabledHint={t.googleDisabledHint}
                    acceptedTerms={agreed}
                    note={t.googleBusinessNote}
                />

                <MicrosoftAuthSection
                    context="signup"
                    onError={setError}
                    onSuccess={() => router.push('/dashboard')}
                    disabled={!agreed}
                    disabledHint={t.googleDisabledHint}
                    acceptedTerms={agreed}
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
                        <label htmlFor="signup-email" className="tahoe-label">{t.businessEmail}</label>
                        <div className={styles.inputShell}>
                            <span className={styles.inputIcon}><EnvelopeClosedIcon /></span>
                            <input
                                id="signup-email"
                                className={styles.input}
                                placeholder={t.businessEmailPlaceholder}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                aria-invalid={Boolean(emailDomainError)}
                                required
                            />
                        </div>
                        {emailDomainError && (
                            <p className={styles.fieldError} role="alert">{emailDomainError}</p>
                        )}
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

                    <div className={styles.termsRow}>
                        <input
                            id="signup-terms"
                            type="checkbox"
                            className={styles.checkbox}
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            aria-label={`${t.termsAgreePrefix}${t.termsLink}${t.termsAgreeMid}${t.privacyLink}${t.termsAgreeSuffix}`}
                        />
                        <span className={styles.termsLabel}>
                            {t.termsAgreePrefix}
                            <Link href={L('/terms')} target="_blank" rel="noopener noreferrer" className={styles.authLink}>{t.termsLink}</Link>
                            {t.termsAgreeMid}
                            <Link href={L('/privacy')} target="_blank" rel="noopener noreferrer" className={styles.authLink}>{t.privacyLink}</Link>
                            {t.termsAgreeSuffix}
                        </span>
                    </div>

                    <button className="tahoe-button" type="submit" disabled={!canSubmit}>
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
