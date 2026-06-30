'use client';

import { useEffect, useMemo, useState } from 'react';
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
 * Top-up credits as a slider. Top-ups are sold in fixed pack sizes (set by the
 * Stripe catalog), so the slider snaps across those packs — drag to pick a size
 * and the credits, one-time price, and $/credit update live, then buy in one
 * click → Stripe. Reused by the sidebar "Top up" button, the out-of-credits
 * paywall, and the Billing → Top-ups page. Pass `packs` to avoid a second
 * catalog fetch when the caller already has it.
 */
export function TopUpPacks({ returnPath = '/dashboard/search/new', packs: packsProp }: { returnPath?: string; packs?: TopUpPack[] }) {
    const [fetchedPacks, setFetchedPacks] = useState<TopUpPack[] | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // `null` until the user moves the slider — then the slider defaults to the
    // largest pack (best $/credit) without needing a state-syncing effect.
    const [index, setIndex] = useState<number | null>(null);
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

    // Smallest → largest, so sliding right buys more credits.
    const sortedPacks = useMemo(
        () => (packs ? [...packs].sort((a, b) => a.credits - b.credits) : []),
        [packs],
    );

    async function buy(packKey: string) {
        setBusy(true);
        setError(null);
        try {
            const res = await createTopUpCheckout({ pack_key: packKey, success_path: returnPath, cancel_path: returnPath });
            redirectToCheckout(res.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to start checkout.');
            setBusy(false);
        }
    }

    if (packs === null) {
        return <Flex align="center" justify="center" style={{ minHeight: 140 }}><Spinner /></Flex>;
    }
    if (sortedPacks.length === 0) {
        return <Text size="2" color="gray">Top-up packs are unavailable right now.</Text>;
    }

    const maxIndex = sortedPacks.length - 1;
    // Default to the largest (best-value) pack until the user picks a size.
    const safeIndex = index === null ? maxIndex : Math.min(Math.max(index, 0), maxIndex);
    const selected = sortedPacks[safeIndex];
    const perCredit = selected.credits > 0 ? selected.price_usd / selected.credits : 0;
    const isBest = safeIndex === maxIndex;

    return (
        <div className={styles.sliderCard}>
            <div className={styles.sliderHead}>
                <span className={styles.packEyebrow}>Top-up credits</span>
                {isBest ? <span className={styles.bestBadge}>Best value</span> : null}
            </div>
            <div className={styles.packCreditsRow}>
                <span className={styles.packCredits}>{selected.credits.toLocaleString()}</span>
                <span className={styles.packCreditsUnit}>credits</span>
            </div>
            <div className={styles.sliderPriceRow}>
                <span className={styles.packPrice}>${selected.price_usd} <span className={styles.packPriceMeta}>one-time</span></span>
                <span className={styles.packPer}>${perCredit.toFixed(3)} / credit</span>
            </div>

            <input
                type="range"
                className={styles.slider}
                min={0}
                max={maxIndex}
                step={1}
                value={safeIndex}
                onChange={(event) => setIndex(Number(event.target.value))}
                aria-label="Credits to buy"
                aria-valuetext={`${selected.credits.toLocaleString()} credits for $${selected.price_usd}`}
                disabled={busy}
            />
            <div className={styles.sliderTicks}>
                {sortedPacks.map((pack, tickIndex) => (
                    <button
                        key={pack.key}
                        type="button"
                        className={tickIndex === safeIndex ? `${styles.tick} ${styles.tickActive}` : styles.tick}
                        aria-pressed={tickIndex === safeIndex}
                        onClick={() => setIndex(tickIndex)}
                        disabled={busy}
                    >
                        {pack.credits.toLocaleString()}
                    </button>
                ))}
            </div>

            <ul className={styles.packBullets}>
                {PACK_BULLETS.map((bullet) => (
                    <li key={bullet} className={styles.packBullet}><CheckIcon />{bullet}</li>
                ))}
            </ul>
            <p className={styles.packNote}>
                Top-ups come in set pack sizes — slide to choose. Charged once; this is not a subscription.
            </p>

            <button
                type="button"
                className={`${styles.buyButton} ${styles.buyBest}`}
                onClick={() => void buy(selected.key)}
                disabled={busy}
            >
                {busy ? 'Opening…' : `Buy ${selected.credits.toLocaleString()} credits · $${selected.price_usd}`}
            </button>
            {error ? <Text size="2" color="red">{error}</Text> : null}
        </div>
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
