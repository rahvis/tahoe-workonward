'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Dialog, Flex, Text } from '@/components/ui/tahoe-ui';
import { fetchProviderCredits, type ProviderCreditsResponse } from '@/lib/organization';

const BUCKET_LABELS: Record<string, string> = {
    coresignal_search: 'Search',
    coresignal_collect: 'Collect',
    fullenrich: 'Enrich',
};
const BUCKET_ORDER = ['coresignal_search', 'coresignal_collect', 'fullenrich'];
const TOP_UPS_URL = 'https://tahoe.workonward.com/dashboard/billing/plan?tab=topups';
const TOP_UP_PROMPT_THRESHOLD = 0.95;

function getProviderCreditUsage(data: ProviderCreditsResponse | null) {
    if (!data?.enabled) {
        return { allocated: 0, used: 0, usageRatio: 0, overThreshold: false };
    }

    const totals = BUCKET_ORDER.reduce(
        (acc, key) => {
            const bucket = data.buckets[key];
            if (!bucket) return acc;
            return {
                allocated: acc.allocated + Math.max(0, bucket.allocated),
                used: acc.used + Math.max(0, bucket.used),
            };
        },
        { allocated: 0, used: 0 },
    );

    const usageRatio = totals.allocated > 0 ? totals.used / totals.allocated : 0;
    return {
        ...totals,
        usageRatio,
        overThreshold: totals.allocated > 0 && usageRatio >= TOP_UP_PROMPT_THRESHOLD,
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
    const usagePercent = Math.floor(usage.usageRatio * 100);
    const topUpPromptKey = usage.overThreshold ? `${usage.used}:${usage.allocated}` : null;
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
                        You have used {usagePercent}% of your Search, Collect, and Enrich provider credits. Add top-up credits to keep sourcing without interruption.
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
            ) : null}
        </>
    );
}
