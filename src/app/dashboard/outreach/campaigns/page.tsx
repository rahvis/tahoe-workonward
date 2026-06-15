'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchCampaigns, type CampaignSummary } from '@/lib/organization';
import { TahoeSelect } from '@/components/ui/tahoe-ui';
import styles from '../outreach.module.css';

const PAGE_SIZE = 20;
const statusOptions: Array<{ value: CampaignSummary['status'] | 'all'; label: string }> = [
    { value: 'all', label: 'All statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'launched', label: 'Launched' },
    { value: 'paused', label: 'Paused' },
    { value: 'stopped', label: 'Stopped' },
    { value: 'completed', label: 'Completed' },
];

type SortMode = 'updated_desc' | 'launched_desc' | 'name_asc' | 'reply_rate_desc' | 'sent_desc';

function formatDate(value?: string | null) {
    if (!value) return 'Not launched';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function replyRate(campaign: CampaignSummary) {
    return campaign.sent_count > 0 ? (campaign.replied_count / campaign.sent_count) * 100 : 0;
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<CampaignSummary['status'] | 'all'>('all');
    const [sort, setSort] = useState<SortMode>('updated_desc');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            setLoading(true);
            try {
                const items = await fetchCampaigns({ signal: controller.signal });
                setCampaigns(items);
                setError('');
            } catch (err) {
                if (controller.signal.aborted) return;
                setError(err instanceof Error ? err.message : 'Unable to load campaigns.');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        void load();
        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        setPage(1);
    }, [search, status, sort]);

    const filteredCampaigns = useMemo(() => {
        const query = search.trim().toLowerCase();
        const next = campaigns.filter((campaign) => {
            if (status !== 'all' && campaign.status !== status) return false;
            if (!query) return true;
            return [
                campaign.name,
                campaign.list_name,
                campaign.mailbox_email,
                campaign.status,
            ].some((value) => String(value || '').toLowerCase().includes(query));
        });

        return [...next].sort((left, right) => {
            if (sort === 'name_asc') return left.name.localeCompare(right.name);
            if (sort === 'reply_rate_desc') return replyRate(right) - replyRate(left);
            if (sort === 'sent_desc') return right.sent_count - left.sent_count;
            const leftDate = sort === 'launched_desc' ? left.launched_at : left.updated_at ?? left.created_at;
            const rightDate = sort === 'launched_desc' ? right.launched_at : right.updated_at ?? right.created_at;
            return new Date(rightDate || 0).getTime() - new Date(leftDate || 0).getTime();
        });
    }, [campaigns, search, sort, status]);

    const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const visibleCampaigns = filteredCampaigns.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const rangeStart = filteredCampaigns.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(filteredCampaigns.length, safePage * PAGE_SIZE);

    return (
        <section className={styles.workspacePage}>
            <header className={styles.workspaceToolbar}>
                <div className={styles.toolbarControls}>
                    <input
                        className={styles.toolbarInput}
                        value={search}
                        placeholder="Search campaigns..."
                        aria-label="Search campaigns"
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <TahoeSelect
                        size="3"
                        className={styles.toolbarSelectControl}
                        value={status}
                        aria-label="Filter by status"
                        onChange={(event) => setStatus(event.target.value as CampaignSummary['status'] | 'all')}
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </TahoeSelect>
                    <TahoeSelect
                        size="3"
                        className={styles.toolbarSelectControl}
                        value={sort}
                        aria-label="Sort campaigns"
                        onChange={(event) => setSort(event.target.value as SortMode)}
                    >
                        <option value="updated_desc">Updated</option>
                        <option value="launched_desc">Launched</option>
                        <option value="name_asc">Name</option>
                        <option value="reply_rate_desc">Reply rate</option>
                        <option value="sent_desc">Sent</option>
                    </TahoeSelect>
                </div>
                <Link href="/dashboard/outreach/campaigns/new" className={styles.primaryAction}>
                    Create campaign
                </Link>
            </header>

            {error ? <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div> : null}

            <div className={styles.tableShell}>
                <div className={styles.tableSummary}>
                    <span>{campaigns.length} total</span>
                    <span>{filteredCampaigns.length} shown</span>
                </div>
                <div className={styles.tableScroll}>
                    <table className={`${styles.table} ${styles.workspaceTable}`}>
                        <thead>
                            <tr>
                                <th>Campaign</th>
                                <th>Status</th>
                                <th>Audience</th>
                                <th>Sent</th>
                                <th>Replies</th>
                                <th>Reply rate</th>
                                <th>Bounced</th>
                                <th>Suppressed</th>
                                <th>Launched</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={10} className={styles.tableMessage}>Loading campaigns...</td></tr>
                            ) : null}
                            {!loading && error ? (
                                <tr>
                                    <td colSpan={10} className={styles.tableMessage}>
                                        Campaigns did not load.
                                    </td>
                                </tr>
                            ) : null}
                            {!loading && !error && campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className={styles.tableMessage}>
                                        No campaigns yet. Create one from an enriched list.
                                    </td>
                                </tr>
                            ) : null}
                            {!loading && !error && campaigns.length > 0 && visibleCampaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className={styles.tableMessage}>
                                        No campaigns match this view.
                                    </td>
                                </tr>
                            ) : null}
                            {!loading && visibleCampaigns.map((campaign) => (
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
                                    <td>{campaign.audience_count.toLocaleString()}</td>
                                    <td>{campaign.sent_count.toLocaleString()}</td>
                                    <td>{campaign.replied_count.toLocaleString()}</td>
                                    <td>{replyRate(campaign).toFixed(1)}%</td>
                                    <td>{campaign.bounced_count.toLocaleString()}</td>
                                    <td>{campaign.suppressed_count.toLocaleString()}</td>
                                    <td>{formatDate(campaign.launched_at)}</td>
                                    <td>
                                        <Link href={`/dashboard/outreach/campaigns/${campaign.id}`} className={styles.tableAction}>
                                            Open
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <footer className={styles.tableFooter}>
                    <span>
                        {filteredCampaigns.length === 0
                            ? '0 campaigns'
                            : `Rows ${rangeStart}-${rangeEnd} of ${filteredCampaigns.length} campaigns`}
                    </span>
                    <div className={styles.paginationControls}>
                        <button
                            type="button"
                            className={styles.paginationButton}
                            disabled={safePage <= 1}
                            onClick={() => setPage(Math.max(1, safePage - 1))}
                        >
                            Previous
                        </button>
                        <span>{safePage} / {totalPages}</span>
                        <button
                            type="button"
                            className={styles.paginationButton}
                            disabled={safePage >= totalPages}
                            onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                        >
                            Next
                        </button>
                    </div>
                </footer>
            </div>
        </section>
    );
}
