import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SavedCandidatesPage from './SavedCandidatesPage';
import { fetchSavedCandidates } from '@/lib/organization';

vi.mock('@/lib/organization', async () => {
    const actual = await vi.importActual<typeof import('@/lib/organization')>('@/lib/organization');
    return {
        ...actual,
        fetchSavedCandidates: vi.fn(),
    };
});

vi.mock('../_components/SaveToListDialog', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

const mockedFetchSavedCandidates = vi.mocked(fetchSavedCandidates);

const savedCandidatesResponse = {
    candidates: [
        {
            id: 'saved-1',
            candidate_id: 'candidate-1',
            coresignal_id: 101,
            full_name: 'Casey Cho',
            websites_linkedin: 'https://linkedin.com/in/casey-cho',
            headline: 'Senior Backend Engineer',
            location_full: 'San Francisco, California, United States',
            location_country: 'United States',
            connections_count: 500,
            follower_count: 1200,
            company_name: 'Tahoe',
            company_linkedin_url: 'https://linkedin.com/company/tahoe',
            company_website: 'https://tahoe.dev',
            company_industry: 'Software',
            job_title: 'Senior Backend Engineer',
            department: 'Platform',
            management_level: 'Senior',
            company_location_hq_full_address: 'San Francisco, California',
            company_location_hq_country: 'United States',
            score: 42.7,
            page: 1,
            page_rank: 1,
            pipeline: 'langgraph_search',
            query_hash: 'hash-1',
            search_session_id: 'session-1',
            search_prompt: 'backend engineers',
            searched_at: '2026-05-10T00:00:00.000Z',
            saved_origin: 'durable_list' as const,
            list_count: 1,
        },
        {
            id: 'saved-2',
            candidate_id: 'candidate-2',
            coresignal_id: 102,
            full_name: 'Mina Park',
            websites_linkedin: 'https://linkedin.com/in/mina-park',
            headline: 'Staff Platform Engineer',
            location_full: 'Seattle, Washington, United States',
            location_country: 'United States',
            connections_count: 300,
            follower_count: 800,
            company_name: 'Tahoe',
            company_linkedin_url: 'https://linkedin.com/company/tahoe',
            company_website: 'https://tahoe.dev',
            company_industry: 'Software',
            job_title: 'Staff Platform Engineer',
            department: 'Infrastructure',
            management_level: 'Senior',
            company_location_hq_full_address: 'San Francisco, California',
            company_location_hq_country: 'United States',
            score: 39.2,
            page: 1,
            page_rank: 2,
            pipeline: 'langgraph_search',
            query_hash: 'hash-1',
            search_session_id: 'session-1',
            search_prompt: 'backend engineers',
            searched_at: '2026-05-10T00:00:00.000Z',
            saved_origin: 'legacy_preview_compat' as const,
            list_count: 2,
        },
    ],
    total: 2020,
    page: 1,
    per_page: 20,
    total_pages: 101,
};

beforeEach(() => {
    mockedFetchSavedCandidates.mockReset();
    mockedFetchSavedCandidates.mockResolvedValue(savedCandidatesResponse);
});

test('saved candidates uses the aligned Tahoe search input sizing and pagination button styles', async () => {
    render(<SavedCandidatesPage />);

    expect(await screen.findByText('Casey Cho')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'ID' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Pipeline' })).not.toBeInTheDocument();
    expect(screen.queryByText('langgraph_search')).not.toBeInTheDocument();

    // Relevance score is presented as a recruiter-facing "Match" %/tier, not a raw number.
    expect(screen.getByRole('columnheader', { name: 'Match' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Score' })).not.toBeInTheDocument();
    expect(screen.getByText(/65%\s*·\s*Good/)).toBeInTheDocument(); // score 42.7
    expect(screen.getByText(/58%\s*·\s*Good/)).toBeInTheDocument(); // score 39.2
    expect(screen.queryByText('42.70')).not.toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search candidates...');
    expect(searchInput.closest('label')).toHaveClass('tui-textfield--size-3');

    const activePageButton = screen.getByRole('button', { name: '1' });
    const nextPageButton = screen.getByRole('button', { name: '2' });
    const ellipsisButton = screen.getByRole('button', { name: '…' });
    const previousButton = screen.getByRole('button', { name: /Previous/i });

    expect(activePageButton).toHaveClass('tui-button--size-1', 'tui-button--solid');
    expect(nextPageButton).toHaveClass('tui-button--size-1', 'tui-button--soft');
    expect(ellipsisButton).toHaveClass('tui-button--size-1', 'tui-button--ghost');
    expect(previousButton).toHaveClass('tui-button--size-1', 'tui-button--soft');
});

test('saved candidates reuses the shared fixed candidate panel and closes cleanly', async () => {
    const user = userEvent.setup();
    render(<SavedCandidatesPage />);

    const firstRow = (await screen.findByRole('checkbox', { name: 'Select Casey Cho' })).closest('tr');
    expect(firstRow).not.toBeNull();
    await user.click(firstRow as HTMLTableRowElement);

    const firstPanel = screen.getByRole('complementary');
    const firstPanelClassName = firstPanel.className;
    expect(screen.getByRole('heading', { name: 'Casey Cho' })).toBeInTheDocument();

    const secondRow = screen.getByRole('checkbox', { name: 'Select Mina Park' }).closest('tr');
    expect(secondRow).not.toBeNull();
    await user.click(secondRow as HTMLTableRowElement);

    const secondPanel = screen.getByRole('complementary');
    expect(secondPanel.className).toBe(firstPanelClassName);
    expect(screen.getByRole('heading', { name: 'Mina Park' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close candidate panel' }));

    await waitFor(() => {
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });
});
