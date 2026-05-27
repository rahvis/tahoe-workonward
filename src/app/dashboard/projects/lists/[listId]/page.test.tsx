import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ListDetailPage from './page';
import {
    createEnrichmentRun,
    estimateEnrichmentRun,
    fetchBillingSummary,
    fetchEnrichmentRun,
    fetchEnrichmentRuns,
    fetchList,
    fetchListCandidates,
    removeListCandidates,
} from '@/lib/organization';

let lastPreviewGridProps: Record<string, unknown> | null = null;

vi.mock('next/navigation', () => ({
    useParams: () => ({ listId: 'list-1' }),
}));

vi.mock('@/lib/organization', () => ({
    createEnrichmentRun: vi.fn(),
    estimateEnrichmentRun: vi.fn(),
    fetchBillingSummary: vi.fn(),
    fetchEnrichmentRun: vi.fn(),
    fetchEnrichmentRuns: vi.fn(),
    fetchList: vi.fn(),
    fetchListCandidates: vi.fn(),
    removeListCandidates: vi.fn(),
}));

vi.mock('../../../search/CandidatePanel', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('../../../search/preview-grid', async () => {
    const React = await import('react');
    return {
        __esModule: true,
        default: (props: {
            rows: Array<{ id: number; full_name: string | null }>;
            selectable?: boolean;
            selectedRowIds?: Set<number>;
            onToggleAllSelection?: (checked: boolean) => void;
            onToggleRowSelection?: (row: { id: number; full_name: string | null }) => void;
            extraColumns?: Array<{ key: string; label: string; render: (row: { id: number; full_name: string | null }) => React.ReactNode }>;
        }) => {
            lastPreviewGridProps = props as unknown as Record<string, unknown>;
            return (
                <div data-testid="preview-grid">
                    <div data-testid="column-order">
                        {['Candidate', ...(props.extraColumns ?? []).map((column) => column.label)].join('|')}
                    </div>
                    {props.selectable ? (
                        <input
                            type="checkbox"
                            aria-label="Select all rows"
                            checked={props.rows.length > 0 && props.rows.every((row) => props.selectedRowIds?.has(row.id))}
                            onChange={(event) => props.onToggleAllSelection?.(event.target.checked)}
                        />
                    ) : null}
                    {props.rows.map((row) => (
                        <div key={row.id} data-testid={`row-${row.id}`}>
                            {props.selectable ? (
                                <input
                                    type="checkbox"
                                    aria-label={`Select ${row.full_name}`}
                                    checked={Boolean(props.selectedRowIds?.has(row.id))}
                                    onChange={() => props.onToggleRowSelection?.(row)}
                                />
                            ) : null}
                            <span>{row.full_name}</span>
                            {props.extraColumns?.map((column) => (
                                <div key={column.key} data-testid={`cell-${column.key}-${row.id}`}>{column.render(row)}</div>
                            ))}
                        </div>
                    ))}
                </div>
            );
        },
    };
});

const mockedFetchList = vi.mocked(fetchList);
const mockedFetchListCandidates = vi.mocked(fetchListCandidates);
const mockedFetchEnrichmentRuns = vi.mocked(fetchEnrichmentRuns);
const mockedFetchEnrichmentRun = vi.mocked(fetchEnrichmentRun);
const mockedFetchBillingSummary = vi.mocked(fetchBillingSummary);
const mockedRemoveListCandidates = vi.mocked(removeListCandidates);
const mockedEstimateEnrichmentRun = vi.mocked(estimateEnrichmentRun);
const mockedCreateEnrichmentRun = vi.mocked(createEnrichmentRun);

beforeEach(() => {
    lastPreviewGridProps = null;
    mockedFetchList.mockReset();
    mockedFetchListCandidates.mockReset();
    mockedFetchEnrichmentRuns.mockReset();
    mockedFetchEnrichmentRun.mockReset();
    mockedFetchBillingSummary.mockReset();
    mockedRemoveListCandidates.mockReset();
    mockedEstimateEnrichmentRun.mockReset();
    mockedCreateEnrichmentRun.mockReset();

    mockedFetchBillingSummary.mockResolvedValue({
        workspace_id: 'ws-1',
        billing: {},
        available_credits: 500,
        reserved_credits: 0,
        monthly_included_credits: 500,
        buckets: [],
        usage_this_cycle: { search: 0, enrichment: 0, outreach: 0 },
        low_credit_thresholds: [25, 10, 0],
        low_credit_state: 'healthy',
    });
    mockedEstimateEnrichmentRun.mockResolvedValue({
        target_candidate_count: 1,
        estimated_credits: 1,
        balance: 500,
        balance_after: 499,
        skipped_inflight: 0,
    });
    mockedCreateEnrichmentRun.mockResolvedValue({
        id: 'run-new',
        workspace_id: 'ws-1',
        list_id: 'list-1',
        status: 'pending',
        requested_fields: ['work_email'],
        target_candidate_count: 1,
        estimated_credits: 1,
        actual_credits: 0,
        skipped_inflight: 0,
        webhook_events_received: 0,
    });
    mockedFetchList.mockResolvedValue({
        id: 'list-1',
        workspace_id: 'ws-1',
        project_id: 'project-1',
        name: 'Outreach Round 1',
        candidate_count: 2020,
        project_name: 'Series-B Backend Engineers',
    });
    mockedFetchListCandidates.mockResolvedValue({
        items: [
            {
                membership_id: 'membership-1',
                candidate_id: 'candidate-1',
                id: 101,
                source: 'coresignal',
                source_id: '101',
                full_name: 'Jane Doe',
                job_title: 'Backend Engineer',
                company_name: 'Tahoe',
                source_preview_page: 1,
                contact: {
                    work_email: { value: 'jane@tahoe.ai', status: 'DELIVERABLE' },
                    field_statuses: {
                        personal_email: { status: 'not_found' },
                    },
                    last_status: 'DONE',
                },
                contact_field_states: {
                    phone: { status: 'pending', run_id: 'run-1' },
                    work_email: { status: 'pending', run_id: 'run-1' },
                    personal_email: { status: 'not_found' },
                },
                enrichment_status: 'DONE',
            },
        ],
        next_cursor: 'cursor-2',
        total: 2020,
        page: 1,
        per_page: 20,
        total_pages: 101,
    });
    mockedFetchEnrichmentRuns.mockResolvedValue({
        items: [
            {
                id: 'run-1',
                workspace_id: 'ws-1',
                list_id: 'list-1',
                status: 'pending',
                requested_fields: ['work_email'],
                target_candidate_count: 1,
                estimated_credits: 1,
                actual_credits: 0,
                skipped_inflight: 0,
                webhook_events_received: 0,
            },
        ],
    });
    mockedFetchEnrichmentRun.mockReset();
});

test('renders contact status and refreshes list data when the active run completes', async () => {
    type CompletedRun = {
        id: string;
        workspace_id: string;
        list_id: string;
        status: 'completed';
        requested_fields: string[];
        target_candidate_count: number;
        estimated_credits: number;
        actual_credits: number;
        skipped_inflight: number;
        webhook_events_received: number;
        task_summary: {
            total: number;
            pending: number;
            claimed: number;
            submitted: number;
            completed: number;
            failed: number;
        };
    };
    let resolveRun: ((value: CompletedRun) => void) | null = null;
    mockedFetchEnrichmentRun.mockImplementation(
        () =>
            new Promise((resolve) => {
                resolveRun = resolve;
            }),
    );

    render(<ListDetailPage />);

    expect(await screen.findByText(/An enrichment run for 1 contact is in progress/i)).toBeInTheDocument();
    expect(screen.getByTestId('column-order')).toHaveTextContent(
        'Candidate|Current Title|Company Name|Phone|Work Email|Personal Email|Enrichment',
    );
    expect(await screen.findByText(/DONE/i)).toBeInTheDocument();
    expect(await screen.findByText(/jane@tahoe.ai/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Enrichment pending/i)).toBeInTheDocument();
    expect(screen.getByText('N/A').className).toContain('contactUnavailable');
    expect(screen.getByPlaceholderText('Search this list').closest('label')).toHaveClass('tui-textfield--size-3');
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toHaveClass('tui-button--size-1', 'tui-button--solid');
    expect(screen.getByRole('button', { name: '2' })).toHaveClass('tui-button--size-1', 'tui-button--soft');
    expect(screen.getByRole('button', { name: '…' })).toHaveClass('tui-button--size-1', 'tui-button--ghost');
    expect(screen.getByRole('button', { name: /Previous/i })).toHaveClass('tui-button--size-1', 'tui-button--soft');

    resolveRun?.({
        id: 'run-1',
        workspace_id: 'ws-1',
        list_id: 'list-1',
        status: 'completed',
        requested_fields: ['work_email'],
        target_candidate_count: 1,
        estimated_credits: 1,
        actual_credits: 1,
        skipped_inflight: 0,
        webhook_events_received: 1,
        task_summary: { total: 1, pending: 0, claimed: 0, submitted: 0, completed: 1, failed: 0 },
    });

    await waitFor(() => {
        expect(mockedFetchEnrichmentRun).toHaveBeenCalledTimes(1);
        expect(mockedFetchListCandidates).toHaveBeenCalledTimes(2);
    });

    expect(lastPreviewGridProps).toMatchObject({
        showCandidateSubtitle: false,
        hiddenColumnKeys: [
            'id',
            'profile_url',
            'headline',
            'location_full',
            'location_country',
            'connections_count',
            'followers_count',
            'company_name',
            'company_url',
            'company_website',
            'company_industry',
            'active_experience_title',
            'department',
            'management_level',
            'company_hq_full_address',
            'company_hq_country',
            'score',
        ],
    });
});

test('active run polling refreshes candidates without replacing the table with loading state', async () => {
    let resolveBackgroundLoad: ((value: Awaited<ReturnType<typeof fetchListCandidates>>) => void) | null = null;
    const candidatePage = {
        items: [
            {
                membership_id: 'membership-1',
                candidate_id: 'candidate-1',
                id: 101,
                source: 'coresignal',
                source_id: 'not-a-number',
                full_name: 'Jane Doe',
                job_title: 'Backend Engineer',
                company_name: 'Tahoe',
                source_preview_page: 1,
                enrichment_status: 'PENDING' as const,
            },
        ],
        next_cursor: null,
        total: 1,
        page: 1,
        per_page: 20,
        total_pages: 1,
    };
    mockedFetchListCandidates
        .mockResolvedValueOnce(candidatePage)
        .mockReturnValueOnce(new Promise((resolve) => {
            resolveBackgroundLoad = resolve;
        }));
    mockedFetchEnrichmentRun.mockResolvedValue({
        id: 'run-1',
        workspace_id: 'ws-1',
        list_id: 'list-1',
        status: 'in_progress',
        requested_fields: ['work_email'],
        target_candidate_count: 1,
        estimated_credits: 1,
        actual_credits: 0,
        skipped_inflight: 0,
        webhook_events_received: 0,
        task_summary: { total: 1, pending: 0, claimed: 0, submitted: 1, completed: 0, failed: 0 },
    });

    render(<ListDetailPage />);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    await waitFor(() => {
        expect(mockedFetchListCandidates).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.queryByText(/Loading list candidates/i)).not.toBeInTheDocument();

    resolveBackgroundLoad?.(candidatePage);
});

test('numbered pagination keeps selected basket across page changes', async () => {
    const user = userEvent.setup();
    mockedFetchEnrichmentRuns.mockResolvedValue({ items: [] });
    mockedFetchListCandidates.mockImplementation(async (_listId, params) => ({
        items: [
            {
                membership_id: `membership-${params?.page ?? 1}`,
                candidate_id: `candidate-${params?.page ?? 1}`,
                id: params?.page === 2 ? 102 : 101,
                source: 'coresignal',
                source_id: params?.page === 2 ? '' : 'not-a-number',
                full_name: params?.page === 2 ? 'Jordan Lee' : 'Jane Doe',
                job_title: 'Backend Engineer',
                company_name: 'Tahoe',
                source_preview_page: params?.page ?? 1,
                enrichment_status: 'NOT_REQUESTED',
            },
        ],
        next_cursor: params?.page === 2 ? null : 'cursor-2',
        total: 40,
        page: params?.page ?? 1,
        per_page: 20,
        total_pages: 2,
    }));

    render(<ListDetailPage />);

    await user.click(await screen.findByRole('checkbox', { name: 'Select Jane Doe' }));
    expect(screen.getByRole('button', { name: /Remove 1 from list/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
        expect(mockedFetchListCandidates).toHaveBeenLastCalledWith(
            'list-1',
            expect.objectContaining({ page: 2, perPage: 20 }),
        );
    });
    expect(await screen.findByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remove 1 from list/i })).toBeInTheDocument();
});

test('selected-candidate enrichment uses candidates selected across pages and shows started notice', async () => {
    const user = userEvent.setup();
    mockedFetchEnrichmentRuns.mockResolvedValue({ items: [] });
    mockedEstimateEnrichmentRun.mockResolvedValue({
        target_candidate_count: 2,
        estimated_credits: 2,
        balance: 500,
        balance_after: 498,
        skipped_inflight: 0,
    });
    mockedCreateEnrichmentRun.mockResolvedValueOnce({
        id: 'run-new',
        workspace_id: 'ws-1',
        list_id: 'list-1',
        status: 'pending',
        requested_fields: ['work_email'],
        target_candidate_count: 2,
        estimated_credits: 2,
        actual_credits: 0,
        skipped_inflight: 0,
        webhook_events_received: 0,
    });
    mockedFetchListCandidates.mockImplementation(async (_listId, params) => ({
        items: [
            {
                membership_id: `membership-${params?.page ?? 1}`,
                candidate_id: `candidate-${params?.page ?? 1}`,
                id: params?.page === 2 ? 102 : 101,
                source: 'coresignal',
                source_id: params?.page === 2 ? '' : 'not-a-number',
                full_name: params?.page === 2 ? 'Jordan Lee' : 'Jane Doe',
                job_title: 'Backend Engineer',
                company_name: 'Tahoe',
                source_preview_page: params?.page ?? 1,
                enrichment_status: 'NOT_REQUESTED',
            },
        ],
        next_cursor: params?.page === 2 ? null : 'cursor-2',
        total: 40,
        page: params?.page ?? 1,
        per_page: 20,
        total_pages: 2,
    }));

    render(<ListDetailPage />);

    await user.click(await screen.findByRole('checkbox', { name: 'Select Jane Doe' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Select Jordan Lee' }));
    expect(screen.getByRole('button', { name: /Remove 2 from list/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enrich' }));
    await screen.findByText(/2 credits for 2 candidates/i);
    await user.click(screen.getByRole('button', { name: /Start enrichment/i }));

    await waitFor(() => {
        expect(mockedCreateEnrichmentRun).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: 'selected_candidate_ids',
                candidate_ids: ['candidate-1', 'candidate-2'],
            }),
        );
    });
    expect(await screen.findByText(/You can keep working or come back to this list later/i)).toBeInTheDocument();
});

test('completed zero-target enrichment shows no-op notice instead of in-progress banner', async () => {
    const user = userEvent.setup();
    mockedFetchEnrichmentRuns.mockResolvedValue({ items: [] });
    mockedCreateEnrichmentRun.mockResolvedValueOnce({
        id: 'run-empty',
        workspace_id: 'ws-1',
        list_id: 'list-1',
        status: 'completed',
        requested_fields: ['work_email'],
        target_candidate_count: 0,
        estimated_credits: 0,
        actual_credits: 0,
        skipped_inflight: 1,
        webhook_events_received: 0,
    });

    render(<ListDetailPage />);

    await user.click(await screen.findByRole('checkbox', { name: 'Select Jane Doe' }));
    await user.click(screen.getByRole('button', { name: 'Enrich' }));
    await screen.findByText(/1 credit for 1 candidate/i);
    await user.click(screen.getByRole('button', { name: /Start enrichment/i }));

    expect(await screen.findByText(/No new enrichment was started/i)).toBeInTheDocument();
    expect(screen.queryByText(/is in progress/i)).not.toBeInTheDocument();
});
