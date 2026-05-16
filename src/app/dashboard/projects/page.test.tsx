import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ProjectsPage from './page';
import { fetchProjects } from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    fetchProjects: vi.fn(),
    createProject: vi.fn(),
    archiveProject: vi.fn(),
}));

const mockedFetchProjects = vi.mocked(fetchProjects);

beforeEach(() => {
    mockedFetchProjects.mockReset();
    mockedFetchProjects.mockResolvedValue([
        {
            id: 'project-1',
            workspace_id: 'ws-1',
            name: 'Quantum Computing',
            list_count: 1,
            archived: false,
            created_at: '2026-05-10T12:00:00.000Z',
        },
    ]);
});

test('uses dashboard-sized controls for project creation and card actions', async () => {
    render(<ProjectsPage />);

    const createInput = await screen.findByPlaceholderText('Series-B Backend Engineers');
    expect(createInput.closest('label')).toHaveClass('tui-textfield--size-3');
    expect(screen.getByRole('button', { name: 'Create project' })).toHaveClass('tui-button--size-3');
    expect(screen.getByRole('button', { name: 'Archive' })).toHaveClass('tui-button--size-3');
    expect(screen.getByRole('link', { name: 'View all lists' })).toHaveClass('tahoe-button-secondary');
    expect(screen.getByRole('link', { name: 'Open project' })).toHaveClass('tahoe-button');
});
