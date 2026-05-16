import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ProjectDetailPage from './page';
import { fetchProject, fetchProjectLists, fetchSavedSearches } from '@/lib/organization';

vi.mock('next/navigation', () => ({
    useParams: () => ({ projectId: 'project-1' }),
}));

vi.mock('@/lib/organization', () => ({
    fetchProject: vi.fn(),
    fetchProjectLists: vi.fn(),
    fetchSavedSearches: vi.fn(),
    createList: vi.fn(),
}));

const mockedFetchProject = vi.mocked(fetchProject);
const mockedFetchProjectLists = vi.mocked(fetchProjectLists);
const mockedFetchSavedSearches = vi.mocked(fetchSavedSearches);

beforeEach(() => {
    mockedFetchProject.mockReset();
    mockedFetchProjectLists.mockReset();
    mockedFetchSavedSearches.mockReset();

    mockedFetchProject.mockResolvedValue({
        id: 'project-1',
        workspace_id: 'ws-1',
        name: 'Quantum Computing',
        list_count: 1,
        archived: false,
        created_at: '2026-05-10T12:00:00.000Z',
    });
    mockedFetchProjectLists.mockResolvedValue([
        {
            id: 'list-1',
            workspace_id: 'ws-1',
            project_id: 'project-1',
            project_name: 'Quantum Computing',
            name: 'Contact engineers',
            candidate_count: 20,
        },
    ]);
    mockedFetchSavedSearches.mockResolvedValue([
        {
            id: 'search-1',
            workspace_id: 'ws-1',
            project_id: 'project-1',
            name: 'Quantum talent',
            prompt: 'quantum engineers',
            mode: 'langgraph',
            created_at: '2026-05-10T12:00:00.000Z',
        },
    ]);
});

test('uses dashboard-sized controls in the project workspace', async () => {
    render(<ProjectDetailPage />);

    const createInput = await screen.findByPlaceholderText('Outreach Round 1');
    expect(createInput.closest('label')).toHaveClass('tui-textfield--size-3');
    expect(screen.getByRole('button', { name: 'Create list' })).toHaveClass('tui-button--size-3');
    expect(screen.getByRole('link', { name: 'Back to projects' })).toHaveClass('tahoe-button-secondary');
    expect(screen.getByRole('link', { name: 'Open list' })).toHaveClass('tahoe-button-secondary');
    expect(screen.getByRole('link', { name: 'Manage saved searches' })).toHaveClass('tahoe-button-secondary');
});
