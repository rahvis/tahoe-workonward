import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import EnrichModal from './EnrichModal';
import {
    createEnrichmentRun,
    estimateEnrichmentRun,
    fetchCreditBalance,
} from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    createEnrichmentRun: vi.fn(),
    estimateEnrichmentRun: vi.fn(),
    fetchCreditBalance: vi.fn(),
}));

const mockedCreateEnrichmentRun = vi.mocked(createEnrichmentRun);
const mockedEstimateEnrichmentRun = vi.mocked(estimateEnrichmentRun);
const mockedFetchCreditBalance = vi.mocked(fetchCreditBalance);

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

beforeEach(() => {
    mockedCreateEnrichmentRun.mockReset();
    mockedEstimateEnrichmentRun.mockReset();
    mockedFetchCreditBalance.mockReset();
    mockedFetchCreditBalance.mockResolvedValue({
        workspace_id: 'ws-1',
        balance: 500,
        currency: 'credits',
    });
    mockedEstimateEnrichmentRun.mockResolvedValue({
        target_candidate_count: 5,
        estimated_credits: 5,
        balance: 500,
        balance_after: 495,
        skipped_inflight: 0,
    });
    mockedCreateEnrichmentRun.mockResolvedValue({
        id: 'run-1',
        workspace_id: 'ws-1',
        list_id: 'list-1',
        status: 'pending',
        requested_fields: ['work_email', 'phone'],
        target_candidate_count: 5,
        estimated_credits: 55,
        actual_credits: 0,
        skipped_inflight: 0,
        webhook_events_received: 0,
    });
});

test('estimate updates when fields toggle', async () => {
    const user = userEvent.setup();
    render(
        <EnrichModal open onOpenChange={() => {}} listId="list-1" selectedCandidateIds={['cand-1', 'cand-2']} />
    );

    expect(await screen.findByText(/Estimate:/i)).toHaveTextContent('5 × 1 = 5 credits');

    mockedEstimateEnrichmentRun.mockResolvedValueOnce({
        target_candidate_count: 5,
        estimated_credits: 70,
        balance: 500,
        balance_after: 430,
        skipped_inflight: 0,
    });
    await user.click(screen.getByLabelText(/Mobile phone/i));

    await waitFor(() => {
        expect(screen.getByText(/Estimate:/i)).toHaveTextContent('5 × 11 = 70 credits');
    });
});

test('submit button disables when estimate exceeds balance', async () => {
    mockedEstimateEnrichmentRun.mockResolvedValue({
        target_candidate_count: 5,
        estimated_credits: 700,
        balance: 100,
        balance_after: -600,
        skipped_inflight: 0,
    });

    render(
        <EnrichModal open onOpenChange={() => {}} listId="list-1" selectedCandidateIds={['cand-1']} />
    );

    expect(await screen.findByText(/Balance is lower than the requested estimate/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start enrichment/i })).toBeDisabled();
});

test('submit posts the chosen scope fields and idempotency key', async () => {
    const user = userEvent.setup();
    render(
        <EnrichModal open onOpenChange={() => {}} listId="list-1" selectedCandidateIds={['cand-1']} />
    );

    await screen.findByText(/Estimate:/i);
    await user.click(screen.getByLabelText(/Mobile phone/i));
    await user.click(screen.getByRole('button', { name: /Start enrichment/i }));

    await waitFor(() => {
        expect(mockedCreateEnrichmentRun).toHaveBeenCalledWith(
            expect.objectContaining({
                list_id: 'list-1',
                scope: 'selected_candidate_ids',
                candidate_ids: ['cand-1'],
                fields: expect.arrayContaining(['work_email', 'phone']),
                idempotency_key: expect.any(String),
            }),
        );
    });
});

test('balance-after stays on the estimate result when the balance request resolves later', async () => {
    const balanceRequest = deferred<{ workspace_id: string; balance: number; currency: 'credits' }>();
    const estimateRequest = deferred<{
        target_candidate_count: number;
        estimated_credits: number;
        balance: number;
        balance_after: number;
        skipped_inflight: number;
    }>();
    mockedFetchCreditBalance.mockReturnValueOnce(balanceRequest.promise);
    mockedEstimateEnrichmentRun.mockReturnValueOnce(estimateRequest.promise);

    render(
        <EnrichModal open onOpenChange={() => {}} listId="list-1" selectedCandidateIds={['cand-1']} />
    );

    await act(async () => {
        estimateRequest.resolve({
            target_candidate_count: 5,
            estimated_credits: 5,
            balance: 500,
            balance_after: 495,
            skipped_inflight: 0,
        });
        await estimateRequest.promise;
    });

    expect(await screen.findByText(/Balance after run:/i)).toHaveTextContent('Balance after run: 495');

    await act(async () => {
        balanceRequest.resolve({
            workspace_id: 'ws-1',
            balance: 500,
            currency: 'credits',
        });
        await balanceRequest.promise;
    });

    await waitFor(() => {
        expect(screen.getByText(/Balance after run:/i)).toHaveTextContent('Balance after run: 495');
    });
});

test('balance-after falls back to the raw balance when no fields are selected', async () => {
    const user = userEvent.setup();
    render(
        <EnrichModal open onOpenChange={() => {}} listId="list-1" selectedCandidateIds={['cand-1']} />
    );

    expect(await screen.findByText(/Balance after run:/i)).toHaveTextContent('Balance after run: 495');
    await user.click(screen.getByLabelText(/Work email/i));

    await waitFor(() => {
        expect(screen.getByText(/Estimate:/i)).toHaveTextContent('0 × 0 = 0 credits');
        expect(screen.getByText(/Balance after run:/i)).toHaveTextContent('Balance after run: 500');
    });
});
