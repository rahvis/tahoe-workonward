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
                <div>
                    <span className="tahoe-eyebrow">Gmail send-only outreach</span>
                    <h1 className={styles.title}>Campaigns</h1>
                    <p className={styles.subtitle}>
                        Build AI-assisted recruiter sequences from enriched lists. Replies remain in Gmail; Tahoe tracks sends and manual outcomes.
                    </p>
                </div>
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
                <div className={styles.grid}>
                    {campaigns.map((campaign) => (
                        <article key={campaign.id} className={styles.card}>
                            <div className={styles.header}>
                                <div>
                                    <h2 className={styles.sectionTitle}>{campaign.name}</h2>
                                    <div className={styles.pills}>
                                        <span className={styles.statusPill}>{campaign.status}</span>
                                        <span className={styles.pill}>{campaign.list_name || 'List'}</span>
                                        <span className={styles.pill}>{campaign.mailbox_email || 'Mailbox not selected'}</span>
                                    </div>
                                </div>
                                <Link href={`/dashboard/outreach/campaigns/${campaign.id}`}>
                                    <Button size="3" variant="soft">Open</Button>
                                </Link>
                            </div>
                            <p className={styles.muted}>
                                {campaign.sent_count} sent · {campaign.replied_count} replied · {campaign.bounced_count} bounced · launched {formatDate(campaign.launched_at)}
                            </p>
                        </article>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
