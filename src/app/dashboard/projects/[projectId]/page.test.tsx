import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ProjectDetailPage from './page';
import { fetchProjectLists } from '@/lib/organization';

vi.mock('next/navigation', () => ({
    useParams: () => ({ projectId: 'project-1' }),
}));

vi.mock('@/lib/organization', () => ({
    fetchProjectLists: vi.fn(),
    createList: vi.fn(),
}));

const mockedFetchProjectLists = vi.mocked(fetchProjectLists);

beforeEach(() => {
    mockedFetchProjectLists.mockReset();

    mockedFetchProjectLists.mockResolvedValue([
        {
            id: 'list-1',
            workspace_id: 'ws-1',
            project_id: 'project-1',
            project_name: 'Quantum Computing',
            name: 'Contact engineers',
            candidate_count: 20,
            updated_at: '2026-05-12T12:00:00.000Z',
        },
    ]);
});

test('renders project lists as a compact table without project title or saved searches', async () => {
    render(<ProjectDetailPage />);

    const createInput = await screen.findByPlaceholderText('New list name...');
    expect(createInput.closest('label')).toHaveClass('tui-textfield--size-3');
    expect(screen.getByRole('button', { name: '+ List' })).toHaveClass('tui-button--size-3');
    expect(screen.getByRole('link', { name: 'Back' })).toHaveClass('tahoe-button-secondary');
    expect(screen.getByRole('columnheader', { name: 'List' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Candidates' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact engineers' })).toHaveAttribute('href', '/dashboard/projects/lists/list-1');
    expect(screen.getByRole('link', { name: 'Open' })).toHaveClass('tahoe-button-secondary');
    expect(screen.getByRole('link', { name: 'Enrich' })).toHaveAttribute('href', '/dashboard/projects/lists/list-1?enrich=1');
    expect(screen.queryByText('Quantum Computing')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved searches')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage saved searches' })).not.toBeInTheDocument();
});
