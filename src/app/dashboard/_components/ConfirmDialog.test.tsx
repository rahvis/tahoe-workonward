import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog';

function Harness({ onConfirm }: { onConfirm: () => void | Promise<void> }) {
    const [open, setOpen] = useState(true);
    return (
        <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Delete list?"
            body="This can't be undone."
            confirmLabel="Delete list"
            pendingLabel="Deleting..."
            destructive
            onConfirm={onConfirm}
        />
    );
}

test('runs onConfirm and closes on success', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(<Harness onConfirm={onConfirm} />);
    expect(screen.getByRole('heading', { name: 'Delete list?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete list' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Delete list?' })).not.toBeInTheDocument();
    });
});

test('surfaces the error and stays open when onConfirm throws', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new Error('Server said no'));

    render(<Harness onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Delete list' }));

    expect(await screen.findByText('Server said no')).toBeInTheDocument();
    // Dialog stays open so the user can retry or cancel.
    expect(screen.getByRole('heading', { name: 'Delete list?' })).toBeInTheDocument();
});

test('cancel closes without invoking onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<Harness onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Delete list?' })).not.toBeInTheDocument();
    });
    expect(onConfirm).not.toHaveBeenCalled();
});
