'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/tahoe-ui';
import {
    fetchCampaign,
    markEnrollmentBounced,
    markEnrollmentReplied,
    pauseCampaign,
    resumeCampaign,
    stopCampaign,
    type CampaignDetail,
} from '@/lib/organization';
import styles from '../../outreach.module.css';

function gmailSearchLink(email?: string | null) {
    return email ? `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email)}` : 'https://mail.google.com/mail/u/0/';
}

export default function CampaignDetailPage() {
    const params = useParams<{ campaignId: string }>();
    const campaignId = String(params.campaignId);
    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState('');
    const loadAbort = useRef<AbortController | null>(null);

    const load = useCallback(async () => {
        loadAbort.current?.abort();
        const controller = new AbortController();
        loadAbort.current = controller;
        try {
            const item = await fetchCampaign(campaignId, { signal: controller.signal });
            if (controller.signal.aborted) return;
            setCampaign(item);
            setError('');
        } catch (err) {
            if (controller.signal.aborted) return;
            setError(err instanceof Error ? err.message : 'Unable to load campaign.');
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [campaignId]);

    useEffect(() => {
        void load();
        return () => {
            loadAbort.current?.abort();
        };
    }, [load]);

    async function runAction(name: string, action: () => Promise<unknown>) {
        setBusy(name);
        setError('');
        try {
            await action();
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update campaign.');
        } finally {
            setBusy('');
        }
    }

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className="tahoe-eyebrow">Campaign operations</span>
                    <h1 className={styles.title}>{campaign?.name || 'Campaign'}</h1>
                    <p className={styles.subtitle}>Track sent outreach and manually suppress future sends when candidates reply or bounce in Gmail.</p>
                </div>
                <div className={styles.headerActions}>
                    <Link href="/dashboard/outreach/campaigns">
                        <Button size="3" variant="soft">Back to campaigns</Button>
                    </Link>
                    {campaign?.status === 'paused' ? (
                        <Button size="3" onClick={() => void runAction('resume', () => resumeCampaign(campaignId))} disabled={busy === 'resume'}>Resume</Button>
                    ) : (
                        <Button size="3" variant="soft" onClick={() => void runAction('pause', () => pauseCampaign(campaignId))} disabled={busy === 'pause'}>Pause</Button>
                    )}
                    <Button size="3" color="red" variant="soft" onClick={() => void runAction('stop', () => stopCampaign(campaignId))} disabled={busy === 'stop'}>Stop</Button>
                </div>
            </header>

            {error ? <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div> : null}
            {loading ? (
                <div className={styles.emptyState}>
                    <span className="tahoe-spinner" />
                    <p>Loading campaign…</p>
                </div>
            ) : null}

            {campaign ? (
                <>
                    <section className={styles.card}>
                        <div className={styles.pills}>
                            <span className={styles.statusPill}>{campaign.status}</span>
                            <span className={styles.pill}>{campaign.mailbox_email || 'No mailbox'}</span>
                            <span className={styles.pill}>{campaign.audience_count} audience</span>
                            <span className={styles.pill}>{campaign.sent_count} sent</span>
                            <span className={styles.pill}>{campaign.suppressed_count} suppressed</span>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <h2 className={styles.sectionTitle}>Enrollments</h2>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Next send</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody aria-busy={busy ? true : undefined}>
                                {campaign.enrollments.map((enrollment) => (
                                    <tr key={enrollment.id}>
                                        <td>
                                            <strong>{enrollment.candidate_name || 'Candidate'}</strong>
                                            <div className={styles.muted}>{enrollment.job_title || ''} {enrollment.company_name ? `· ${enrollment.company_name}` : ''}</div>
                                        </td>
                                        <td>{enrollment.candidate_email || 'No email'}</td>
                                        <td><span className={styles.statusPill}>{enrollment.status}</span></td>
                                        <td>{enrollment.next_send_at ? new Date(enrollment.next_send_at).toLocaleString() : 'None'}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <a href={gmailSearchLink(enrollment.candidate_email)} target="_blank" rel="noreferrer">
                                                    <Button size="3" variant="soft">Open Gmail</Button>
                                                </a>
                                                <Button
                                                    size="3"
                                                    variant="soft"
                                                    disabled={busy === `reply-${enrollment.id}`}
                                                    onClick={() => void runAction(`reply-${enrollment.id}`, () => markEnrollmentReplied(campaignId, enrollment.id))}
                                                >
                                                    {busy === `reply-${enrollment.id}` ? 'Marking…' : 'Mark replied'}
                                                </Button>
                                                <Button
                                                    size="3"
                                                    color="red"
                                                    variant="soft"
                                                    disabled={busy === `bounce-${enrollment.id}`}
                                                    onClick={() => void runAction(`bounce-${enrollment.id}`, () => markEnrollmentBounced(campaignId, enrollment.id))}
                                                >
                                                    {busy === `bounce-${enrollment.id}` ? 'Marking…' : 'Mark bounced'}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </>
            ) : null}
        </section>
    );
}
