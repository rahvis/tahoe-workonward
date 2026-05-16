'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@/components/ui/tahoe-ui';
import AltchaField, { type AltchaFieldHandle } from '@/components/auth/AltchaField';
import { apiRequest } from '@/lib/api';
import { trackLandingEvent } from '@/lib/public-analytics';
import styles from '@/app/partner/partner.module.css';

interface PartnerApplyModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface PartnerApplicationResponse {
    message: string;
    application_id: string;
}

const COUNTRY_OPTIONS = [
    'United States',
    'Canada',
    'United Kingdom',
    'Ireland',
    'Germany',
    'France',
    'Spain',
    'Portugal',
    'Italy',
    'Netherlands',
    'Belgium',
    'Switzerland',
    'Austria',
    'Sweden',
    'Norway',
    'Denmark',
    'Finland',
    'Poland',
    'Czechia',
    'Romania',
    'Greece',
    'Turkey',
    'Israel',
    'United Arab Emirates',
    'Saudi Arabia',
    'India',
    'Singapore',
    'Indonesia',
    'Japan',
    'South Korea',
    'Hong Kong',
    'Taiwan',
    'Australia',
    'New Zealand',
    'Brazil',
    'Mexico',
    'Argentina',
    'Chile',
    'Colombia',
    'South Africa',
    'Nigeria',
    'Kenya',
    'Egypt',
    'Other',
];

function CheckmarkIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 13 4 4L19 7" />
        </svg>
    );
}

function ChevronIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.modalSelectChevron}>
            <path d="m6 8 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function PartnerApplyModal({ open, onOpenChange }: PartnerApplyModalProps) {
    const altchaRef = useRef<AltchaFieldHandle>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('');
    const [websiteOrSocial, setWebsiteOrSocial] = useState('');
    const [audience, setAudience] = useState('');
    const [motivation, setMotivation] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (open) {
            setError('');
        } else {
            const timer = setTimeout(() => {
                setName('');
                setEmail('');
                setCountry('');
                setWebsiteOrSocial('');
                setAudience('');
                setMotivation('');
                setSubmitting(false);
                setError('');
                setSuccess(false);
                altchaRef.current?.reset();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [open]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitting) return;
        setError('');
        setSubmitting(true);
        try {
            const altchaPayload = await altchaRef.current?.ensureVerified();
            if (!altchaPayload) {
                throw new Error('Human verification is required');
            }
            await apiRequest<PartnerApplicationResponse>('/partner/apply', {
                method: 'POST',
                body: {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    country: country.trim(),
                    website_or_social: websiteOrSocial.trim(),
                    audience: audience.trim(),
                    motivation: motivation.trim(),
                    altcha: altchaPayload,
                },
            });
            trackLandingEvent('partner_apply_submitted', { country: country.trim() });
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not submit application. Try again.');
            altchaRef.current?.reset();
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content
                aria-label="Apply to the Tahoe Partner Program"
                className={styles.applyModal}
                maxWidth="600px"
            >
                {success ? (
                    <div className={styles.modalSuccess}>
                        <div className={styles.modalSuccessBadge}>
                            <CheckmarkIcon />
                        </div>
                        <Dialog.Title className={styles.modalSuccessTitle}>
                            Application received
                        </Dialog.Title>
                        <p className={styles.modalSuccessBody}>
                            Thanks — we just emailed you a confirmation. Our partnerships team
                            reviews every application within 2-3 business days and will follow up
                            with next steps and your unique partner link.
                        </p>
                        <Dialog.Close>
                            <button type="button" className={styles.modalSubmit}>Close</button>
                        </Dialog.Close>
                    </div>
                ) : (
                    <>
                        <header className={styles.modalHeader}>
                            <Dialog.Title className={styles.modalTitle}>
                                Apply to the Tahoe Partner Program
                            </Dialog.Title>
                            <Dialog.Description className={styles.modalDescription}>
                                Tell us a little about you. We review every application within 2-3
                                business days.
                            </Dialog.Description>
                        </header>

                        <form onSubmit={handleSubmit} className={styles.modalBody}>
                            {error ? <div className={styles.modalError}>{error}</div> : null}

                            <div className={styles.modalGridTwo}>
                                <div className={styles.modalField}>
                                    <label htmlFor="partner-name" className={styles.modalLabel}>
                                        Full name
                                    </label>
                                    <input
                                        id="partner-name"
                                        type="text"
                                        className={styles.modalInput}
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        autoComplete="name"
                                        required
                                        minLength={2}
                                        maxLength={120}
                                    />
                                </div>

                                <div className={styles.modalField}>
                                    <label htmlFor="partner-email" className={styles.modalLabel}>
                                        Email
                                    </label>
                                    <input
                                        id="partner-email"
                                        type="email"
                                        className={styles.modalInput}
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.modalField}>
                                <label htmlFor="partner-country" className={styles.modalLabel}>
                                    Country
                                </label>
                                <div className={styles.modalSelectShell}>
                                    <select
                                        id="partner-country"
                                        className={styles.modalSelect}
                                        value={country}
                                        onChange={(event) => setCountry(event.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Select country</option>
                                        {COUNTRY_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                    <ChevronIcon />
                                </div>
                            </div>

                            <div className={styles.modalField}>
                                <label htmlFor="partner-website" className={styles.modalLabel}>
                                    Website / Social channel
                                </label>
                                <input
                                    id="partner-website"
                                    type="text"
                                    className={styles.modalInput}
                                    value={websiteOrSocial}
                                    onChange={(event) => setWebsiteOrSocial(event.target.value)}
                                    required
                                    minLength={3}
                                    maxLength={400}
                                />
                                <span className={styles.modalHint}>
                                    URL or @handle — newsletter, podcast, YouTube, LinkedIn, X.
                                </span>
                            </div>

                            <div className={styles.modalField}>
                                <label htmlFor="partner-audience" className={styles.modalLabel}>
                                    Tell us about your audience
                                </label>
                                <textarea
                                    id="partner-audience"
                                    className={styles.modalTextarea}
                                    value={audience}
                                    onChange={(event) => setAudience(event.target.value)}
                                    rows={3}
                                    required
                                    minLength={10}
                                    maxLength={2000}
                                />
                            </div>

                            <div className={styles.modalField}>
                                <label htmlFor="partner-motivation" className={styles.modalLabel}>
                                    Why partner with Tahoe?
                                </label>
                                <textarea
                                    id="partner-motivation"
                                    className={styles.modalTextarea}
                                    value={motivation}
                                    onChange={(event) => setMotivation(event.target.value)}
                                    rows={3}
                                    required
                                    minLength={10}
                                    maxLength={2000}
                                />
                            </div>

                            <AltchaField ref={altchaRef} flow="partner-application" />

                            <div className={styles.modalActions}>
                                <Dialog.Close>
                                    <button type="button" className={styles.modalCancel}>Cancel</button>
                                </Dialog.Close>
                                <button
                                    type="submit"
                                    className={styles.modalSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Sending…' : 'Submit application'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </Dialog.Content>
        </Dialog.Root>
    );
}
