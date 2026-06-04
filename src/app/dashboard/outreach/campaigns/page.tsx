'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/tahoe-ui';
import { fetchCampaigns, type CampaignSummary } from '@/lib/organization';
import styles from '../outreach.module.css';

function formatDate(value?: string | null) {
    if (!value) return 'Not launched';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const items = await fetchCampaigns();
                if (!cancelled) {
                    setCampaigns(items);
                    setError('');
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load campaigns.');
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
            <header className={styles.header}>
                <div className={styles.headerActions}>
                    <Link href="/dashboard/outreach/campaigns/new">
                        <Button size="3">New campaign</Button>
                    </Link>
                </div>
            </header>

            {error ? <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div> : null}

            {loading ? (
                <div className={styles.emptyState}>
                    <span className="tahoe-spinner" />
                    <p>Loading campaigns…</p>
                </div>
            ) : null}

            {!loading && campaigns.length === 0 ? (
                <div className={styles.emptyState}>
                    <h2>No campaigns yet</h2>
                    <p>Push an enriched list into outreach or start a new campaign from here.</p>
                    <Link href="/dashboard/projects/lists">
                        <Button size="3" variant="soft">Choose a list</Button>
                    </Link>
                </div>
            ) : null}

            {!loading && campaigns.length > 0 ? (
                <div className={styles.tableCard}>
                    <table className={`${styles.table} ${styles.compactTable}`}>
                        <thead>
                            <tr>
                                <th>Campaign</th>
                                <th>Status</th>
                                <th>Audience</th>
                                <th>Sent</th>
                                <th>Replies</th>
                                <th>Bounced</th>
                                <th>Launched</th>
                                <th>Next</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((campaign) => (
                                <tr key={campaign.id}>
                                    <td>
                                        <Link href={`/dashboard/outreach/campaigns/${campaign.id}`} className={styles.rowNameLink}>
                                            {campaign.name}
                                        </Link>
                                        <div className={styles.rowSubtext}>
                                            {campaign.list_name || 'List'} · {campaign.mailbox_email || 'Mailbox not selected'}
                                        </div>
                                    </td>
                                    <td><span className={styles.statusPill}>{campaign.status}</span></td>
                                    <td>{campaign.audience_count}</td>
                                    <td>{campaign.sent_count}</td>
                                    <td>{campaign.replied_count}</td>
                                    <td>{campaign.bounced_count}</td>
                                    <td>{formatDate(campaign.launched_at)}</td>
                                    <td>
                                        <Link href={`/dashboard/outreach/campaigns/${campaign.id}`}>
                                            <Button size="3" variant="soft">Open</Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </section>
    );
}
