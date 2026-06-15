'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, TahoeSelect } from '@/components/ui/tahoe-ui';
import {
    fetchCampaign,
    markEnrollmentBounced,
    markEnrollmentReplied,
    pauseCampaign,
    resumeCampaign,
    stopCampaign,
    type CampaignDetail,
    type EnrollmentSummary,
} from '@/lib/organization';
import styles from '../../outreach.module.css';

const PAGE_SIZE = 20;
type DetailTab = 'audience' | 'steps' | 'delivery';
type EnrollmentStatusFilter = EnrollmentSummary['status'] | 'all';

const enrollmentStatusOptions: Array<{ value: EnrollmentStatusFilter; label: string }> = [
    { value: 'all', label: 'All statuses' },
    { value: 'ready', label: 'Ready' },
    { value: 'sent', label: 'Sent' },
    { value: 'replied', label: 'Replied' },
    { value: 'bounced', label: 'Bounced' },
    { value: 'completed', label: 'Completed' },
    { value: 'suppressed', label: 'Suppressed' },
    { value: 'unsubscribed', label: 'Unsubscribed' },
];

const detailTabs: Array<{ key: DetailTab; label: string }> = [
    { key: 'audience', label: 'Audience' },
    { key: 'steps', label: 'Steps' },
    { key: 'delivery', label: 'Delivery' },
];

function formatDateTime(value?: string | null) {
    if (!value) return 'None';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function stepPreview(text: string) {
    const trimmed = text.replace(/\s+/g, ' ').trim();
    if (trimmed.length <= 140) return trimmed || 'No body';
    return `${trimmed.slice(0, 137)}...`;
}

export default function CampaignDetailPage() {
    const params = useParams<{ campaignId: string }>();
    const campaignId = String(params.campaignId);
    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState('');
    const [tab, setTab] = useState<DetailTab>('audience');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<EnrollmentStatusFilter>('all');
    const [page, setPage] = useState(1);
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
    const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
    const loadAbort = useRef<AbortController | null>(null);
    const loadSequence = useRef(0);

    const load = useCallback(async () => {
        loadAbort.current?.abort();
        const controller = new AbortController();
        const sequence = loadSequence.current + 1;
        loadSequence.current = sequence;
        loadAbort.current = controller;
        try {
            const item = await fetchCampaign(campaignId, { signal: controller.signal });
            if (controller.signal.aborted || loadSequence.current !== sequence) return;
            setCampaign(item);
            setError('');
            setSelectedEnrollmentId((current) => (
                current && item.enrollments.some((enrollment) => enrollment.id === current) ? current : null
            ));
        } catch (err) {
            if (controller.signal.aborted || loadSequence.current !== sequence) return;
            setError(err instanceof Error ? err.message : 'Unable to load campaign.');
        } finally {
            if (!controller.signal.aborted && loadSequence.current === sequence) setLoading(false);
        }
    }, [campaignId]);

    useEffect(() => {
        setCampaign(null);
        setLoading(true);
        setError('');
        setBusy('');
        setSearch('');
        setStatusFilter('all');
        setPage(1);
        setSelectedEnrollmentId(null);
        setStopConfirmOpen(false);
        void load();
        return () => {
            loadAbort.current?.abort();
        };
    }, [load]);

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, tab]);

    async function runAction(name: string, action: () => Promise<unknown>) {
        if (busy) return;
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

    const selectedEnrollment = useMemo(
        () => campaign?.enrollments.find((enrollment) => enrollment.id === selectedEnrollmentId) ?? null,
        [campaign, selectedEnrollmentId],
    );

    const filteredEnrollments = useMemo(() => {
        const query = search.trim().toLowerCase();
        return (campaign?.enrollments ?? []).filter((enrollment) => {
            // Only candidates with an enriched email were actually targeted by the
            // campaign (emails were only sent to them). Candidates without an email
            // are suppressed at launch — hide them from the audience view.
            if (!enrollment.candidate_email) return false;
            if (statusFilter !== 'all' && enrollment.status !== statusFilter) return false;
            if (!query) return true;
            return [
                enrollment.candidate_name,
                enrollment.candidate_email,
                enrollment.company_name,
                enrollment.job_title,
                enrollment.status,
            ].some((value) => String(value || '').toLowerCase().includes(query));
        });
    }, [campaign, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const visibleEnrollments = filteredEnrollments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const rangeStart = filteredEnrollments.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(filteredEnrollments.length, safePage * PAGE_SIZE);

    const statusRows = useMemo(() => {
        const counts = new Map<string, number>();
        for (const enrollment of campaign?.enrollments ?? []) {
            counts.set(enrollment.status, (counts.get(enrollment.status) ?? 0) + 1);
        }
        return Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
    }, [campaign]);

    const noEmailSuppressed = useMemo(
        () => (campaign?.enrollments ?? []).filter((item) => item.status === 'suppressed' && !item.candidate_email).length,
        [campaign],
    );

    const canPause = Boolean(campaign && campaign.status !== 'paused' && campaign.status !== 'stopped' && campaign.status !== 'completed');
    const canResume = campaign?.status === 'paused';
    const canStop = Boolean(campaign && campaign.status !== 'stopped' && campaign.status !== 'completed');

    return (
        <section className={styles.workspacePage}>
            <header className={styles.workspaceToolbar}>
                <div className={styles.campaignTitleBlock}>
                    <span className={styles.compactEyebrow}>Campaign operations</span>
                    <span className={styles.compactTitle}>{campaign?.name || 'Campaign'}</span>
                    {campaign ? <span className={styles.compactSubtext}>{campaign.list_name || 'List'} · {campaign.mailbox_email || 'No mailbox'}</span> : null}
                </div>
                <div className={styles.toolbarActions}>
                    <Link href="/dashboard/outreach/campaigns" className="tui-button tui-button--soft tui-button--size-3">Back</Link>
                    {canResume ? (
                        <Button size="3" onClick={() => void runAction('resume', () => resumeCampaign(campaignId))} disabled={Boolean(busy)}>Resume</Button>
                    ) : (
                        <Button size="3" variant="soft" onClick={() => void runAction('pause', () => pauseCampaign(campaignId))} disabled={!canPause || Boolean(busy)}>Pause</Button>
                    )}
                    <Button size="3" color="red" variant="soft" onClick={() => setStopConfirmOpen(true)} disabled={!canStop || Boolean(busy)}>Stop</Button>
                </div>
            </header>

            {error ? <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div> : null}

            {loading ? (
                <div className={styles.tableShell}>
                    <div className={styles.tableMessage}>
                        <span className="tahoe-spinner" />
                        <p>Loading campaign...</p>
                    </div>
                </div>
            ) : null}

            {!loading && error && !campaign ? (
                <div className={styles.tableShell}>
                    <div className={styles.tableMessage}>Campaign did not load.</div>
                </div>
            ) : null}

            {campaign ? (
                <>
                    <section className={styles.metricStrip} aria-label="Campaign metrics">
                        <div className={styles.metricCell}><span>Audience</span><strong>{campaign.audience_count.toLocaleString()}</strong></div>
                        <div className={styles.metricCell}><span>Eligible</span><strong>{campaign.eligible_count.toLocaleString()}</strong></div>
                        <div className={styles.metricCell}><span>Sent</span><strong>{campaign.sent_count.toLocaleString()}</strong></div>
                        <div className={styles.metricCell}><span>Bounced</span><strong>{campaign.bounced_count.toLocaleString()}</strong></div>
                    </section>

                    <nav className={styles.workspaceTabs} aria-label="Campaign detail sections" role="tablist">
                        {detailTabs.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                role="tab"
                                aria-selected={tab === item.key}
                                className={tab === item.key ? styles.workspaceTabActive : styles.workspaceTab}
                                onClick={() => setTab(item.key)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {tab === 'audience' ? (
                        <section className={styles.tableShell}>
                            <div className={styles.tableFilters}>
                                <input
                                    className={styles.toolbarInput}
                                    value={search}
                                    placeholder="Search audience..."
                                    aria-label="Search audience"
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                                <TahoeSelect
                                    size="3"
                                    className={styles.toolbarSelectControl}
                                    value={statusFilter}
                                    aria-label="Filter audience by status"
                                    onChange={(event) => setStatusFilter(event.target.value as EnrollmentStatusFilter)}
                                >
                                    {enrollmentStatusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </TahoeSelect>
                            </div>
                            <div className={styles.tableScroll}>
                                <table className={`${styles.table} ${styles.workspaceTable}`}>
                                    <thead>
                                        <tr>
                                            <th>Candidate</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Step</th>
                                            <th>Next send</th>
                                        </tr>
                                    </thead>
                                    <tbody aria-busy={busy ? true : undefined}>
                                        {visibleEnrollments.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className={styles.tableMessage}>No audience rows match this view.</td>
                                            </tr>
                                        ) : null}
                                        {visibleEnrollments.map((enrollment) => (
                                            <tr
                                                key={enrollment.id}
                                                className={styles.clickableRow}
                                                onClick={() => setSelectedEnrollmentId(enrollment.id)}
                                            >
                                                <td>
                                                    <strong>{enrollment.candidate_name || 'Candidate'}</strong>
                                                    <div className={styles.rowSubtext}>
                                                        {enrollment.job_title || 'Role not available'}{enrollment.company_name ? ` · ${enrollment.company_name}` : ''}
                                                    </div>
                                                </td>
                                                <td>{enrollment.candidate_email || 'No email'}</td>
                                                <td><span className={styles.statusPill}>{enrollment.status}</span></td>
                                                <td>{enrollment.current_step_order}</td>
                                                <td>{formatDateTime(enrollment.next_send_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <footer className={styles.tableFooter}>
                                <span>
                                    {filteredEnrollments.length === 0
                                        ? '0 enrollments'
                                        : `Rows ${rangeStart}-${rangeEnd} of ${filteredEnrollments.length} enrollments`}
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
                        </section>
                    ) : null}

                    {tab === 'steps' ? (
                        <section className={styles.tableShell}>
                            <div className={styles.tableScroll}>
                                <table className={`${styles.table} ${styles.workspaceTable}`}>
                                    <thead><tr><th>Step</th><th>Delay</th><th>Subject</th><th>Body preview</th></tr></thead>
                                    <tbody>
                                        {campaign.steps.length === 0 ? <tr><td colSpan={4} className={styles.tableMessage}>No email steps are configured.</td></tr> : null}
                                        {campaign.steps.map((step) => (
                                            <tr key={step.step_order}>
                                                <td>{step.step_order}</td>
                                                <td>{step.delay_days === 0 ? 'Immediately' : `${step.delay_days}d later`}</td>
                                                <td>{step.subject}</td>
                                                <td>{stepPreview(step.body_text)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ) : null}

                    {tab === 'delivery' ? (
                        <section className={styles.deliveryGrid}>
                            <div className={styles.tableShell}>
                                <div className={styles.tableSummary}>Status breakdown</div>
                                <div className={styles.tableScroll}>
                                    <table className={`${styles.table} ${styles.workspaceTable}`}>
                                        <thead><tr><th>Status</th><th>Count</th><th>Share</th></tr></thead>
                                        <tbody>
                                            {statusRows.length === 0 ? <tr><td colSpan={3} className={styles.tableMessage}>No delivery state yet.</td></tr> : null}
                                            {statusRows.map(([status, count]) => (
                                                <tr key={status}>
                                                    <td><span className={styles.statusPill}>{status}</span></td>
                                                    <td>{count.toLocaleString()}</td>
                                                    <td>{campaign.enrollments.length ? `${((count / campaign.enrollments.length) * 100).toFixed(1)}%` : '0.0%'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className={styles.issuePanel}>
                                <h2>Delivery checks</h2>
                                <div className={styles.issueRow}><span>Status</span><strong>{campaign.status}</strong></div>
                                <div className={styles.issueRow}><span>No-email suppressed</span><strong>{noEmailSuppressed.toLocaleString()}</strong></div>
                                <div className={styles.issueRow}><span>Mailbox</span><strong>{campaign.mailbox_email || 'Missing'}</strong></div>
                                <div className={styles.issueNote}>
                                    Replies stay in Gmail. Mark replied or bounced here to suppress future sends.
                                </div>
                            </div>
                        </section>
                    ) : null}

                    {selectedEnrollment ? (
                        <>
                            <div className={styles.drawerBackdrop} onClick={() => setSelectedEnrollmentId(null)} />
                            <aside className={styles.recipientDrawer} aria-label="Recipient detail">
                                <div className={styles.drawerHeader}>
                                    <div>
                                        <span className={styles.compactEyebrow}>Recipient</span>
                                        <h2>{selectedEnrollment.candidate_name || 'Candidate'}</h2>
                                    </div>
                                    <button type="button" className={styles.textAction} onClick={() => setSelectedEnrollmentId(null)}>Close</button>
                                </div>
                                <div className={styles.drawerContent}>
                                    <div className={styles.drawerField}><span>Title</span><strong>{selectedEnrollment.job_title || 'Not available'}</strong></div>
                                    <div className={styles.drawerField}><span>Company</span><strong>{selectedEnrollment.company_name || 'Not available'}</strong></div>
                                    <div className={styles.drawerField}><span>Email</span><strong>{selectedEnrollment.candidate_email || 'No email'}</strong></div>
                                    <div className={styles.drawerField}><span>Status</span><strong>{selectedEnrollment.status}</strong></div>
                                    <div className={styles.drawerField}><span>Current step</span><strong>{selectedEnrollment.current_step_order}</strong></div>
                                    <div className={styles.drawerField}><span>Next send</span><strong>{formatDateTime(selectedEnrollment.next_send_at)}</strong></div>
                                    {selectedEnrollment.last_error ? (
                                        <div className={styles.drawerField}><span>Last error</span><strong>{selectedEnrollment.last_error}</strong></div>
                                    ) : null}
                                </div>
                                <div className={styles.drawerActions}>
                                    <button
                                        type="button"
                                        className={styles.secondaryAction}
                                        disabled={Boolean(busy)}
                                        onClick={() => void runAction(`reply-${selectedEnrollment.id}`, () => markEnrollmentReplied(campaignId, selectedEnrollment.id))}
                                    >
                                        {busy === `reply-${selectedEnrollment.id}` ? 'Marking...' : 'Mark replied'}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.secondaryAction}
                                        disabled={Boolean(busy)}
                                        onClick={() => void runAction(`bounce-${selectedEnrollment.id}`, () => markEnrollmentBounced(campaignId, selectedEnrollment.id))}
                                    >
                                        {busy === `bounce-${selectedEnrollment.id}` ? 'Marking...' : 'Mark bounced'}
                                    </button>
                                </div>
                            </aside>
                        </>
                    ) : null}

                    {stopConfirmOpen ? (
                        <div className={styles.modalBackdrop} role="presentation">
                            <div className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="stop-campaign-title">
                                <h2 id="stop-campaign-title">Stop campaign?</h2>
                                <p>Queued sends will be cancelled and this campaign will stop running.</p>
                                <div className={styles.confirmActions}>
                                    <button type="button" className={styles.secondaryAction} disabled={Boolean(busy)} onClick={() => setStopConfirmOpen(false)}>Cancel</button>
                                    <button
                                        type="button"
                                        className={styles.dangerAction}
                                        disabled={Boolean(busy)}
                                        onClick={() => {
                                            setStopConfirmOpen(false);
                                            void runAction('stop', () => stopCampaign(campaignId));
                                        }}
                                    >
                                        Stop campaign
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </>
            ) : null}
        </section>
    );
}
