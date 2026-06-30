'use client';

import { useState, type ReactNode } from 'react';
import { Button, Dialog, Flex, Text } from '@/components/ui/tahoe-ui';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    body: ReactNode;
    confirmLabel?: string;
    /** Label shown while `onConfirm` is in flight. */
    pendingLabel?: string;
    cancelLabel?: string;
    /** Red confirm button for irreversible/destructive actions. */
    destructive?: boolean;
    /**
     * Runs when the user confirms. Resolve to close the dialog; throw to surface
     * the error inline and keep the dialog open so the user can retry or cancel.
     */
    onConfirm: () => void | Promise<void>;
}

/**
 * Generic confirm/cancel dialog for one-off (usually destructive) actions.
 * Owns its pending + error state: on confirm it runs `onConfirm`, closes on
 * success, and shows the thrown message inline on failure. While the action is
 * in flight the dialog cannot be dismissed.
 */
export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    body,
    confirmLabel = 'Confirm',
    pendingLabel = 'Working…',
    cancelLabel = 'Cancel',
    destructive = false,
    onConfirm,
}: ConfirmDialogProps) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');

    function handleOpenChange(next: boolean) {
        if (pending) return; // block dismissal while the action runs
        if (!next) setError('');
        onOpenChange(next);
    }

    async function handleConfirm() {
        if (pending) return;
        setPending(true);
        setError('');
        try {
            await onConfirm();
            setPending(false);
            setError('');
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            setPending(false);
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Content maxWidth="440px" aria-label={title} style={{ padding: 24 }}>
                <Dialog.Title>{title}</Dialog.Title>
                <Dialog.Description size="2" mb="2">
                    {body}
                </Dialog.Description>
                {error ? <Text as="p" size="2" color="red" mb="2">{error}</Text> : null}
                <Flex gap="3" justify="end" mt="4">
                    <Button size="3" variant="soft" color="gray" type="button" disabled={pending} onClick={() => handleOpenChange(false)}>
                        {cancelLabel}
                    </Button>
                    <Button
                        size="3"
                        type="button"
                        color={destructive ? 'red' : undefined}
                        disabled={pending}
                        onClick={() => void handleConfirm()}
                    >
                        {pending ? pendingLabel : confirmLabel}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
