import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import BillingLedgerPage from './page';
import { fetchBillingLedger, type BillingLedgerResponse } from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    fetchBillingLedger: vi.fn(),
}));

const mockedFetchBillingLedger = vi.mocked(fetchBillingLedger);

function makeLedgerRow(
    index: number,
    kind: BillingLedgerResponse['items'][number]['kind'] = 'search_charge',
): BillingLedgerResponse['items'][number] {
    return {
        id: `ledger-${index}`,
        workspace_id: 'ws-1',
        kind,
        amount: -index,
        created_at: '2026-06-01T12:00:00.000Z',
        reason: `Row ${index}`,
        source: 'tahoe',
        source_ref: `ref-${index}`,
        idempotency_key: `key-${index}`,
        metadata: {},
    };
}

beforeEach(() => {
    mockedFetchBillingLedger.mockReset();
});

test('paginates ledger rows in a fixed twenty-row page', async () => {
    mockedFetchBillingLedger.mockResolvedValue({
        current_balance: 1000,
        items: Array.from({ length: 25 }, (_, index) => makeLedgerRow(index + 1)),
    });

    render(<BillingLedgerPage />);

    expect(await screen.findByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Row 20')).toBeInTheDocument();
    expect(screen.queryByText('Row 21')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1-20 of 25')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Row 21')).toBeInTheDocument();
    expect(screen.getByText('Row 25')).toBeInTheDocument();
    expect(screen.queryByText('Row 1')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 21-25 of 25')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-20 of 25')).toBeInTheDocument();
});

test('changing the ledger filter reloads data and resets to the first page', async () => {
    mockedFetchBillingLedger.mockImplementation(async (kinds) => {
        if (kinds?.includes('search_charge')) {
            return {
                current_balance: 1000,
                items: [makeLedgerRow(101, 'search_charge')],
            };
        }
        return {
            current_balance: 1000,
            items: Array.from({ length: 25 }, (_, index) => makeLedgerRow(index + 1)),
        };
    });

    render(<BillingLedgerPage />);

    expect(await screen.findByText('Row 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Showing 21-25 of 25')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'search' } });

    await waitFor(() => {
        expect(mockedFetchBillingLedger).toHaveBeenLastCalledWith(['search_charge']);
    });
    expect(await screen.findByText('Row 101')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-1 of 1')).toBeInTheDocument();
});

test('renders the empty ledger state inside the table area', async () => {
    mockedFetchBillingLedger.mockResolvedValue({
        current_balance: 0,
        items: [],
    });

    render(<BillingLedgerPage />);

    expect(await screen.findByText('No ledger entries match this filter yet.')).toBeInTheDocument();
    expect(screen.getByText('0 entries')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
});
