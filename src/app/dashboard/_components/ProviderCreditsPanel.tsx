'use client';

import { useEffect, useState } from 'react';
import { fetchProviderCredits, type ProviderCreditsResponse } from '@/lib/organization';

const BUCKET_LABELS: Record<string, string> = {
    coresignal_search: 'Search',
    coresignal_collect: 'Collect',
    fullenrich: 'Enrich',
};
const BUCKET_ORDER = ['coresignal_search', 'coresignal_collect', 'fullenrich'];

/**
 * Realtime per-workspace provider credit balances. Refreshes whenever a search or
 * enrichment dispatches the `tahoe:credits-updated` window event.
 */
export default function ProviderCreditsPanel({ collapsed = false }: { collapsed?: boolean }) {
    const [data, setData] = useState<ProviderCreditsResponse | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const res = await fetchProviderCredits();
                if (!cancelled) setData(res);
            } catch {
                if (!cancelled) setData(null);
            }
        }
        void load();
        window.addEventListener('tahoe:credits-updated', load);
        return () => {
            cancelled = true;
            window.removeEventListener('tahoe:credits-updated', load);
        };
    }, []);

    if (collapsed || !data || !data.enabled) {
        return null;
    }

    return (
        <div
            aria-label="Provider credits"
            style={{
                display: 'grid',
                gap: 6,
                padding: '10px 12px',
                margin: '0 0 8px',
                borderRadius: 10,
                border: '1px solid var(--tahoe-color-border-subtle)',
                background: 'var(--tahoe-color-canvas)',
                fontSize: 12,
            }}
        >
            <div style={{ color: 'var(--tahoe-color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Credits
            </div>
            {BUCKET_ORDER.map((key) => {
                const bucket = data.buckets[key];
                if (!bucket) return null;
                const low = bucket.remaining <= 0;
                return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ color: 'var(--tahoe-color-text-secondary)' }}>{BUCKET_LABELS[key] ?? key}</span>
                        <span
                            style={{
                                fontVariantNumeric: 'tabular-nums',
                                color: low ? 'var(--tahoe-color-danger)' : 'var(--tahoe-color-text-primary)',
                            }}
                        >
                            {bucket.remaining}/{bucket.allocated}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
