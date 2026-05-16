import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ListDetailPage from './page';
import {
    fetchCreditBalance,
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
    fetchCreditBalance: vi.fn(),
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
            extraColumns?: Array<{ key: string; render: (row: { id: number; full_name: string | null }) => React.ReactNode }>;
        }) => {
            lastPreviewGridProps = props as unknown as Record<string, unknown>;
            return (
                <div data-testid="preview-grid">
                    {props.rows.map((row) => (
                        <div key={row.id} data-testid={`row-${row.id}`}>
                            <span>{row.full_name}</span>
                            {props.extraColumns?.map((column) => (
                                <div key={column.key}>{column.render(row)}</div>
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
const mockedFetchCreditBalance = vi.mocked(fetchCreditBalance);
const mockedRemoveListCandidates = vi.mocked(removeListCandidates);

beforeEach(() => {
    lastPreviewGridProps = null;
    mockedFetchList.mockReset();
    mockedFetchListCandidates.mockReset();
    mockedFetchEnrichmentRuns.mockReset();
    mockedFetchEnrichmentRun.mockReset();
    mockedFetchCreditBalance.mockReset();
    mockedRemoveListCandidates.mockReset();

    mockedFetchCreditBalance.mockResolvedValue({
        workspace_id: 'ws-1',
        balance: 500,
        currency: 'credits',
    });
    mockedFetchList.mockResolvedValue({
        id: 'list-1',
        workspace_id: 'ws-1',
        project_id: 'project-1',
        name: 'Outreach Round 1',
        candidate_count: 1,
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
                    last_status: 'DONE',
                },
                enrichment_status: 'DONE',
            },
        ],
        next_cursor: 'cursor-2',
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
    expect(await screen.findByText(/DONE/i)).toBeInTheDocument();
    expect(await screen.findByText(/jane@tahoe.ai/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search this list').closest('label')).toHaveClass('tui-textfield--size-3');
    expect(screen.getByRole('button', { name: 'Load more' })).toHaveClass('tui-button--size-3');

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
        includeMetadata: true,
        showCandidateSubtitle: false,
        hiddenColumnKeys: ['id', 'headline', 'connections_count', 'followers_count', 'score', 'page', 'pipeline', 'search_prompt'],
    });
});
