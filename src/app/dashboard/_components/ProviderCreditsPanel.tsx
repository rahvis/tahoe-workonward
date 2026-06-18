'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Dialog, Flex, Text } from '@/components/ui/tahoe-ui';
import { fetchProviderCredits, type ProviderCreditsResponse } from '@/lib/organization';

const BUCKET_LABELS: Record<string, string> = {
    coresignal_search: 'Search',
    fullenrich: 'Enrich',
};
// Search and Enrich only — Collect is not an active product feature.
const BUCKET_ORDER = ['coresignal_search', 'fullenrich'];
const TOP_UPS_URL = 'https://tahoe.workonward.com/dashboard/billing/plan?tab=topups';
const TOP_UP_PROMPT_THRESHOLD = 0.95;

function getProviderCreditUsage(data: ProviderCreditsResponse | null) {
    if (!data?.enabled) {
        return { allocated: 0, used: 0, usageRatio: 0, overThreshold: false, lowLabels: [] as string[], promptKey: null as string | null };
    }

    let allocated = 0;
    let used = 0;
    const lowLabels: string[] = [];
    const keyParts: string[] = [];
    for (const key of BUCKET_ORDER) {
        const bucket = data.buckets[key];
        if (!bucket) continue;
        allocated += Math.max(0, bucket.allocated);
        used += Math.max(0, bucket.used);
        keyParts.push(`${key}:${bucket.used}/${bucket.allocated}`);
        const ratio = bucket.allocated > 0 ? bucket.used / bucket.allocated : 0;
        // Prompt when ANY funded bucket is depleted or nearly so (per-bucket).
        if (bucket.allocated > 0 && (bucket.remaining <= 0 || ratio >= TOP_UP_PROMPT_THRESHOLD)) {
            lowLabels.push(BUCKET_LABELS[key] ?? key);
        }
    }
    return {
        allocated,
        used,
        usageRatio: allocated > 0 ? used / allocated : 0,
        overThreshold: lowLabels.length > 0,
        lowLabels,
        promptKey: lowLabels.length > 0 ? keyParts.join('|') : null,
    };
}

/**
 * Realtime per-workspace provider credit balances. Refreshes whenever a search or
 * enrichment dispatches the `tahoe:credits-updated` window event.
 */
export default function ProviderCreditsPanel({ collapsed = false }: { collapsed?: boolean }) {
    const [data, setData] = useState<ProviderCreditsResponse | null>(null);
    const [dismissedTopUpPromptKey, setDismissedTopUpPromptKey] = useState<string | null>(null);

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

    const usage = useMemo(() => getProviderCreditUsage(data), [data]);
    const topUpPromptKey = usage.promptKey;
    const topUpPromptOpen = Boolean(topUpPromptKey && topUpPromptKey !== dismissedTopUpPromptKey);

    if (!data || !data.enabled) {
        return null;
    }

    return (
        <>
            <Dialog.Root open={topUpPromptOpen} onOpenChange={(open) => {
                if (!open && topUpPromptKey) {
                    setDismissedTopUpPromptKey(topUpPromptKey);
                }
            }}>
                <Dialog.Content maxWidth="460px" aria-label="Add credits" style={{ padding: 24 }}>
                    <Dialog.Title>Add credits</Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                        Your {usage.lowLabels.join(' and ') || 'provider'} credit{usage.lowLabels.length === 1 ? ' is' : 's are'} running low. Top up to keep sourcing without interruption.
                    </Dialog.Description>
                    <Text as="p" size="2" color="gray" mb="4">
                        {usage.used.toLocaleString()} of {usage.allocated.toLocaleString()} provider credits consumed.
                    </Text>
                    <Flex gap="3" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">Not now</Button>
                        </Dialog.Close>
                        <a className="tui-button tui-button--solid tui-button--size-2" href={TOP_UPS_URL}>
                            Add credits
                        </a>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            {!collapsed ? (
                <div
                    aria-label="Provider credits"
                    style={{
                        display: 'grid',
                        gap: 6,
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
            ) : null}
        </>
    );
}
