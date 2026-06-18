'use client';

import { useEffect, useState } from 'react';
import { fetchBillingSummary, type BillingSummary } from '@/lib/organization';
import TopUpModal from './TopUpModal';

/**
 * Unified credit wallet in the sidebar. One balance ("available / monthly included"),
 * orange panel, and a one-click "Top up" button. Refreshes whenever a search or
 * enrichment dispatches the `tahoe:credits-updated` window event. Hidden for trial
 * workspaces with no plan and no credits.
 */
export default function ProviderCreditsPanel({ collapsed = false }: { collapsed?: boolean }) {
    const [summary, setSummary] = useState<BillingSummary | null>(null);
    const [topUpOpen, setTopUpOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const res = await fetchBillingSummary();
                if (!cancelled) setSummary(res);
            } catch {
                if (!cancelled) setSummary(null);
            }
        }
        void load();
        window.addEventListener('tahoe:credits-updated', load);
        return () => {
            cancelled = true;
            window.removeEventListener('tahoe:credits-updated', load);
        };
    }, []);

    if (!summary) return null;
    const included = summary.monthly_included_credits || 0;
    const available = summary.available_credits || 0;
    // Trial / no plan — nothing to show.
    if (included <= 0 && available <= 0) return null;
    if (collapsed) return null;

    const low = summary.low_credit_state === 'critical' || summary.low_credit_state === 'empty';
    const amountColor = low ? 'var(--tahoe-color-danger)' : 'var(--tahoe-color-text-primary)';

    return (
        <>
            <div
                aria-label="Credits"
                style={{
                    display: 'grid',
                    gap: 8,
                    padding: '10px 12px',
                    margin: '0 0 8px',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 104, 44, 0.45)',
                    background: 'linear-gradient(180deg, rgba(255, 104, 44, 0.12) 0%, rgba(255, 104, 44, 0.04) 100%)',
                    fontSize: 12,
                }}
            >
                <div style={{ color: 'var(--tahoe-color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Credits
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: amountColor }}>
                        {available.toLocaleString()}
                    </span>
                    {included > 0 ? (
                        <span style={{ color: 'var(--tahoe-color-text-tertiary)' }}>/ {included.toLocaleString()} /mo</span>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={() => setTopUpOpen(true)}
                    style={{
                        marginTop: 2,
                        minHeight: 30,
                        borderRadius: 'var(--tahoe-radius-full)',
                        border: '1px solid var(--tahoe-color-accent)',
                        background: 'var(--tahoe-color-accent)',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Top up
                </button>
            </div>
            <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
        </>
    );
}
