'use client';

import { useEffect, useState } from 'react';
import { Button, Dialog, Flex, Spinner, Text } from '@/components/ui/tahoe-ui';
import { createTopUpCheckout, fetchBillingCatalog, type TopUpPack } from '@/lib/organization';
import styles from './topup.module.css';

function redirectToCheckout(url: string) {
    if (process.env.NODE_ENV === 'test' || typeof window === 'undefined') return;
    window.location.assign(url);
}

/**
 * The 3 top-up packs as orange-highlighted cards. Buying redirects straight to Stripe
 * Checkout. Reused by the sidebar "Top up" button and the out-of-credits paywall view.
 */
export function TopUpPacks({ returnPath = '/dashboard/search/new' }: { returnPath?: string }) {
    const [packs, setPacks] = useState<TopUpPack[] | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchBillingCatalog()
            .then((catalog) => { if (!cancelled) setPacks(catalog.topups); })
            .catch(() => { if (!cancelled) setPacks([]); });
        return () => { cancelled = true; };
    }, []);

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
        return <Flex align="center" justify="center" style={{ minHeight: 120 }}><Spinner /></Flex>;
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
                            <span className={styles.packCredits}>{pack.credits.toLocaleString()} credits</span>
                            <span className={styles.packPrice}>${pack.price_usd}</span>
                            <span className={styles.packPer}>${perCredit.toFixed(3)} / credit</span>
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
            <p className={styles.packNote}>
                Credits top up your plan instantly and are used this billing cycle (no rollover). Sending outreach is always free.
            </p>
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
            <Dialog.Content maxWidth="600px" aria-label="Top up credits" style={{ padding: 24 }}>
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
