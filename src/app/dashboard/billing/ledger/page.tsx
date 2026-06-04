'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../billing.module.css';
import { fetchBillingLedger, type BillingLedgerResponse } from '@/lib/organization';

const FILTER_OPTIONS = [
    { value: 'all', label: 'All activity' },
    { value: 'grants', label: 'Purchases and grants' },
    { value: 'search', label: 'Search' },
    { value: 'enrichment', label: 'Enrichment' },
    { value: 'outreach', label: 'Outreach' },
];

const LEDGER_PAGE_SIZE = 20;

const KIND_LABELS: Record<string, string> = {
    plan_grant: 'Plan credit grant',
    topup_grant: 'Top-up credit grant',
    search_charge: 'Search charge',
    enrichment_hold: 'Enrichment hold',
    enrichment_release: 'Enrichment release',
    enrichment_settle: 'Enrichment settlement',
    send_hold: 'Outreach hold',
    send_release: 'Outreach release',
    send_settle: 'Outreach settlement',
    refund_credit: 'Credit refund',
    manual_adjustment: 'Manual adjustment',
};

function formatLedgerDetails(row: BillingLedgerResponse['items'][number]) {
    if (row.kind === 'enrichment_settle' || row.kind === 'send_settle') {
        const estimated = typeof row.metadata.estimated_amount === 'number' ? row.metadata.estimated_amount : null;
        const actual = typeof row.metadata.actual_amount === 'number' ? row.metadata.actual_amount : null;
        if (estimated != null && actual != null) {
            return `Estimated ${estimated.toLocaleString()}, actual ${actual.toLocaleString()}`;
        }
    }
    if (row.kind === 'enrichment_hold' || row.kind === 'send_hold') {
        const estimated = typeof row.metadata.estimated_total_emails === 'number'
            ? row.metadata.estimated_total_emails
            : typeof row.metadata.estimated_amount === 'number'
            ? row.metadata.estimated_amount
            : null;
        if (estimated != null) {
            return `Estimated usage ${estimated.toLocaleString()}`;
        }
    }
    return row.reason ?? '—';
}

function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
}

export default function BillingLedgerPage() {
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<BillingLedgerResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const activeKinds = useMemo(() => {
        if (filter === 'grants') return ['plan_grant', 'topup_grant', 'refund_credit', 'manual_adjustment'];
        if (filter === 'search') return ['search_charge'];
        if (filter === 'enrichment') return ['enrichment_hold', 'enrichment_release', 'enrichment_settle'];
        if (filter === 'outreach') return ['send_hold', 'send_release', 'send_settle'];
        return undefined;
    }, [filter]);

    const ledgerItems = useMemo(() => data?.items ?? [], [data?.items]);
    const totalPages = Math.max(1, Math.ceil(ledgerItems.length / LEDGER_PAGE_SIZE));
    const visibleItems = useMemo(() => {
        const start = (page - 1) * LEDGER_PAGE_SIZE;
        return ledgerItems.slice(start, start + LEDGER_PAGE_SIZE);
    }, [ledgerItems, page]);
    const rowStart = ledgerItems.length === 0 ? 0 : (page - 1) * LEDGER_PAGE_SIZE + 1;
    const rowEnd = Math.min(ledgerItems.length, page * LEDGER_PAGE_SIZE);

    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetchBillingLedger(activeKinds);
                if (!cancelled) {
                    setData(response);
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(loadError instanceof Error ? loadError.message : 'Unable to load ledger');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [activeKinds]);

    function handleFilterChange(nextFilter: string) {
        setFilter(nextFilter);
        setPage(1);
    }

    return (
        <section className={`${styles.page} ${styles.ledgerPage}`}>
            <div className={styles.tableCard}>
                <div className={styles.filterRow}>
                    <div>
                        <div className={styles.cardTitle}>Current balance</div>
                        <div className={styles.valueText}>{data?.current_balance.toLocaleString() ?? '—'}</div>
                    </div>
                    <label>
                        <span className={styles.eyebrow}>Filter</span>
                        <select className="tahoe-select tahoe-select--size-3" value={filter} onChange={(event) => handleFilterChange(event.target.value)}>
                            {FILTER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>
                </div>

                {error ? <div className={styles.finePrint}>{error}</div> : null}
                <div className={styles.ledgerTableRegion}>
                    {loading ? (
                        <div className={styles.finePrint}>Loading ledger…</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Activity</th>
                                    <th>Amount</th>
                                    <th>Reference</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleItems.map((row) => (
                                    <tr key={row.id || row.idempotency_key}>
                                        <td>{formatDate(row.created_at)}</td>
                                        <td>
                                            {KIND_LABELS[row.kind] ?? row.kind}
                                            <span className={styles.subtext}>{row.source ?? 'tahoe'}</span>
                                        </td>
                                        <td className={row.amount >= 0 ? styles.positive : styles.negative}>
                                            {row.amount > 0 ? '+' : ''}
                                            {row.amount.toLocaleString()}
                                        </td>
                                        <td>
                                            {row.source_ref ?? '—'}
                                            <span className={styles.subtext}>{row.idempotency_key}</span>
                                        </td>
                                        <td>{formatLedgerDetails(row)}</td>
                                    </tr>
                                ))}
                                {!ledgerItems.length ? (
                                    <tr>
                                        <td colSpan={5} className={styles.finePrint}>No ledger entries match this filter yet.</td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className={styles.ledgerFooter}>
                    <span>
                        {ledgerItems.length > 0 ? `Showing ${rowStart}-${rowEnd} of ${ledgerItems.length}` : '0 entries'}
                    </span>
                    <div className={styles.ledgerPaginationControls}>
                        <button
                            type="button"
                            className="tahoe-button-secondary"
                            disabled={loading || page <= 1}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            className="tahoe-button-secondary"
                            disabled={loading || page >= totalPages}
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
