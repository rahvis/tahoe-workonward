'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Button, Dialog, Flex, Text } from '@/components/ui/tahoe-ui';
import { creditLabel, isCreditConfirmSuppressed, setCreditConfirmSuppressed } from '@/lib/credits';

interface ConfirmOptions {
    /** Short action label, e.g. "Run this search". */
    actionLabel: string;
    /** Credits this action will spend. */
    cost: number;
    /** Current balance, if known — shows "balance after". */
    balance?: number | null;
}

interface PendingConfirm extends ConfirmOptions {
    resolve: (ok: boolean) => void;
}

/**
 * Per-action credit confirmation. `confirmSpend(opts)` resolves `true` to proceed.
 * If the recruiter has ticked "Don't show this again" (stored per device), it resolves
 * immediately without a dialog. Render `creditConfirmDialog` once in the component.
 */
export function useCreditConfirm(): {
    confirmSpend: (opts: ConfirmOptions) => Promise<boolean>;
    creditConfirmDialog: ReactNode;
} {
    const [pending, setPending] = useState<PendingConfirm | null>(null);
    const [dontAsk, setDontAsk] = useState(false);

    const confirmSpend = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        if (isCreditConfirmSuppressed()) return Promise.resolve(true);
        return new Promise<boolean>((resolve) => {
            setDontAsk(false);
            setPending({ ...opts, resolve });
        });
    }, []);

    const close = useCallback((ok: boolean) => {
        setPending((current) => {
            if (current) {
                if (ok && dontAsk) setCreditConfirmSuppressed(true);
                current.resolve(ok);
            }
            return null;
        });
    }, [dontAsk]);

    const cost = pending?.cost ?? 0;
    const balanceAfter =
        typeof pending?.balance === 'number' ? Math.max(0, pending.balance - cost) : null;

    const creditConfirmDialog = (
        <Dialog.Root open={pending !== null} onOpenChange={(open) => { if (!open) close(false); }}>
            <Dialog.Content maxWidth="420px" aria-label="Confirm credit usage" style={{ padding: 24 }}>
                <Dialog.Title>{pending?.actionLabel ?? 'Confirm'}</Dialog.Title>
                <Dialog.Description size="2" mb="2">
                    This uses <strong>{creditLabel(cost)}</strong>.
                    {balanceAfter !== null ? ` Balance after: ${balanceAfter.toLocaleString()}.` : ''}
                </Dialog.Description>
                <Text as="p" size="1" color="gray" mb="4">
                    You only pay when an action succeeds — failed reveals are free.
                </Text>
                <label
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        marginBottom: 18,
                        fontSize: 13,
                        color: 'var(--tahoe-color-text-secondary)',
                        cursor: 'pointer',
                    }}
                >
                    <input type="checkbox" checked={dontAsk} onChange={(event) => setDontAsk(event.target.checked)} />
                    Don&apos;t show this again
                </label>
                <Flex gap="3" justify="end">
                    <Button variant="soft" color="gray" onClick={() => close(false)}>Cancel</Button>
                    <Button onClick={() => close(true)}>Continue · {creditLabel(cost)}</Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );

    return { confirmSpend, creditConfirmDialog };
}
