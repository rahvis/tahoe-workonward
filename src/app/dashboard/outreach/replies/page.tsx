'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/tahoe-ui';
import { fetchCampaign, fetchCampaigns, type CampaignDetail, type EnrollmentSummary } from '@/lib/organization';
import styles from '../outreach.module.css';

type ReviewRow = EnrollmentSummary & { campaignName: string; campaignId: string };

export default function RepliesPage() {
    const [rows, setRows] = useState<ReviewRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unavailableCount, setUnavailableCount] = useState(0);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const campaigns = await fetchCampaigns();
                const settled = await Promise.allSettled(campaigns.map((campaign) => fetchCampaign(campaign.id)));
                if (cancelled) return;
                const details: CampaignDetail[] = [];
                let failed = 0;
                for (const result of settled) {
                    if (result.status === 'fulfilled') {
                        details.push(result.value);
                    } else {
                        failed += 1;
                    }
                }
                setRows(details.flatMap((campaign) => campaign.enrollments
                    .filter((enrollment) => ['sent', 'completed', 'ready'].includes(enrollment.status))
                    .map((enrollment) => ({ ...enrollment, campaignName: campaign.name, campaignId: campaign.id }))));
                setUnavailableCount(failed);
                setError('');
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load reply review.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section className={styles.page}>
            {error ? <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div> : null}
            {!loading && unavailableCount > 0 ? (
                <div className={styles.banner} role="status">
                    Couldn&apos;t load {unavailableCount} {unavailableCount === 1 ? 'campaign' : 'campaigns'}. Showing the rest.
                </div>
            ) : null}
            {loading ? <div className={styles.emptyState}><span className="tahoe-spinner" /><p>Loading reply review…</p></div> : null}
            {!loading && rows.length === 0 ? (
                <div className={styles.emptyState}>
                    <h2>No enrollments to review</h2>
                    <p>Sent and active enrollments will appear here for manual Gmail follow-up.</p>
                </div>
            ) : null}
            {!loading && rows.length > 0 ? (
                <section className={styles.card}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Candidate</th>
                                <th>Campaign</th>
                                <th>Status</th>
                                <th>Gmail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.candidate_name || row.candidate_email || 'Candidate'}</td>
                                    <td><Link href={`/dashboard/outreach/campaigns/${row.campaignId}`}>{row.campaignName}</Link></td>
                                    <td><span className={styles.statusPill}>{row.status}</span></td>
                                    <td>
                                        <a href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(row.candidate_email || '')}`} target="_blank" rel="noreferrer">
                                            <Button size="3" variant="soft">Open Gmail</Button>
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ) : null}
        </section>
    );
}
