import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProjectDetailPage from './page';
import { archiveProject, fetchProject, fetchProjectLists, updateProject } from '@/lib/organization';

vi.mock('next/navigation', () => ({
    useParams: () => ({ projectId: 'project-1' }),
}));

vi.mock('@/lib/organization', () => ({
    fetchProject: vi.fn(),
    fetchProjectLists: vi.fn(),
    createList: vi.fn(),
    updateProject: vi.fn(),
    archiveProject: vi.fn(),
}));

const mockedFetchProject = vi.mocked(fetchProject);
const mockedFetchProjectLists = vi.mocked(fetchProjectLists);
const mockedUpdateProject = vi.mocked(updateProject);
const mockedArchiveProject = vi.mocked(archiveProject);

const baseProject = {
    id: 'project-1',
    workspace_id: 'ws-1',
    name: 'Quantum Computing',
    color: '#202020',
    archived: false,
    list_count: 1,
    updated_at: '2026-05-12T12:00:00.000Z',
};

beforeEach(() => {
    mockedFetchProject.mockReset();
    mockedFetchProjectLists.mockReset();
    mockedUpdateProject.mockReset();
    mockedArchiveProject.mockReset();

    mockedFetchProject.mockResolvedValue(baseProject);
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

test('renders the project header and lists as a compact table', async () => {
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
    // The project name is now surfaced as the page heading.
    expect(await screen.findByRole('heading', { name: 'Quantum Computing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    expect(screen.queryByText('Saved searches')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage saved searches' })).not.toBeInTheDocument();
});

test('archives the project from the detail header', async () => {
    const user = userEvent.setup();
    mockedArchiveProject.mockResolvedValue({ ...baseProject, archived: true });

    render(<ProjectDetailPage />);
    await screen.findByRole('heading', { name: 'Quantum Computing' });

    await user.click(screen.getByRole('button', { name: 'Archive' }));

    await waitFor(() => {
        expect(mockedArchiveProject).toHaveBeenCalledWith('project-1');
    });
    expect(await screen.findByRole('button', { name: 'Restore' })).toBeInTheDocument();
});

test('renames the project via the edit dialog', async () => {
    const user = userEvent.setup();
    mockedUpdateProject.mockResolvedValue({ ...baseProject, name: 'Quantum Team' });

    render(<ProjectDetailPage />);
    await screen.findByRole('heading', { name: 'Quantum Computing' });

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Project name'));
    await user.type(screen.getByLabelText('Project name'), 'Quantum Team');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
        expect(mockedUpdateProject).toHaveBeenCalledWith('project-1', { name: 'Quantum Team' });
    });
    expect(await screen.findByRole('heading', { name: 'Quantum Team' })).toBeInTheDocument();
});
