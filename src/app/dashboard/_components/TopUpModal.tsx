'use client';

import { useEffect, useState } from 'react';
import { Button, Dialog, Flex, Spinner, Text } from '@/components/ui/tahoe-ui';
import { createTopUpCheckout, fetchBillingCatalog, type TopUpPack } from '@/lib/organization';
import styles from './topup.module.css';

// Every pack carries the same simple, honest terms — shown as bullets so the cards
// are detailed rather than empty.
const PACK_BULLETS = [
    'Added to your wallet instantly',
    'Used this billing cycle (no rollover)',
    'Sending outreach is always free',
];

function redirectToCheckout(url: string) {
    if (process.env.NODE_ENV === 'test' || typeof window === 'undefined') return;
    window.location.assign(url);
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className={styles.check}>
            <path d="M13.5 4.5 6.5 11.5 3 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/**
 * The top-up packs as detailed, orange-highlighted cards (credits, price, $/credit,
 * what you get, and a one-click buy → Stripe). Reused by the sidebar "Top up" button,
 * the out-of-credits paywall, and the Billing → Top-ups page. Pass `packs` to avoid a
 * second catalog fetch when the caller already has it.
 */
export function TopUpPacks({ returnPath = '/dashboard/search/new', packs: packsProp }: { returnPath?: string; packs?: TopUpPack[] }) {
    const [fetchedPacks, setFetchedPacks] = useState<TopUpPack[] | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // When the caller passes `packs`, use them directly (no fetch); otherwise load once.
    const packs = packsProp ?? fetchedPacks;

    useEffect(() => {
        if (packsProp) return;
        let cancelled = false;
        fetchBillingCatalog()
            .then((catalog) => { if (!cancelled) setFetchedPacks(catalog.topups); })
            .catch(() => { if (!cancelled) setFetchedPacks([]); });
        return () => { cancelled = true; };
    }, [packsProp]);

    async function buy(packKey: string) {
        setBusyKey(packKey);
        setError(null);
        try {
            const res = await createTopUpCheckout({ pack_key: packKey, success_path: returnPath, cancel_path: returnPath });
            redirectToCheckout(res.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to start checkout.');
            setBusyKey(null);
        }
    }

    if (packs === null) {
        return <Flex align="center" justify="center" style={{ minHeight: 140 }}><Spinner /></Flex>;
    }
    if (packs.length === 0) {
        return <Text size="2" color="gray">Top-up packs are unavailable right now.</Text>;
    }

    // The largest pack is the best $/credit — highlight it.
    const bestKey = packs.reduce((best, pack) => (pack.credits > best.credits ? pack : best), packs[0]).key;

    return (
        <>
            <div className={styles.packGrid}>
                {packs.map((pack) => {
                    const best = pack.key === bestKey;
                    const perCredit = pack.credits > 0 ? pack.price_usd / pack.credits : 0;
                    return (
                        <div key={pack.key} className={best ? `${styles.pack} ${styles.packBest}` : styles.pack}>
                            {best ? <span className={styles.bestBadge}>Best value</span> : null}
                            <span className={styles.packEyebrow}>Top-up credits</span>
                            <div className={styles.packCreditsRow}>
                                <span className={styles.packCredits}>{pack.credits.toLocaleString()}</span>
                                <span className={styles.packCreditsUnit}>credits</span>
                            </div>
                            <span className={styles.packPrice}>${pack.price_usd} <span className={styles.packPriceMeta}>one-time</span></span>
                            <span className={styles.packPer}>${perCredit.toFixed(3)} / credit</span>
                            <ul className={styles.packBullets}>
                                {PACK_BULLETS.map((bullet) => (
                                    <li key={bullet} className={styles.packBullet}><CheckIcon />{bullet}</li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                className={best ? `${styles.buyButton} ${styles.buyBest}` : styles.buyButton}
                                onClick={() => void buy(pack.key)}
                                disabled={busyKey !== null}
                            >
                                {busyKey === pack.key ? 'Opening…' : `Buy · $${pack.price_usd}`}
                            </button>
                        </div>
                    );
                })}
            </div>
            {error ? <Text size="2" color="red">{error}</Text> : null}
        </>
    );
}

/** Standalone top-up dialog (used by the sidebar credits panel). */
export default function TopUpModal({
    open,
    onClose,
    returnPath,
}: {
    open: boolean;
    onClose: () => void;
    returnPath?: string;
}) {
    return (
        <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
            <Dialog.Content maxWidth="760px" aria-label="Top up credits" style={{ padding: 24 }}>
                <Dialog.Title>Top up credits</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                    Add credits to your wallet — instant, one click, no sales call.
                </Dialog.Description>
                <TopUpPacks returnPath={returnPath} />
                <Flex justify="end" mt="4">
                    <Button variant="soft" color="gray" onClick={onClose}>Close</Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
