import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProjectsPage from './page';
import { archiveProject, createList, createProject, fetchProjects, updateProject } from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    fetchProjects: vi.fn(),
    createProject: vi.fn(),
    createList: vi.fn(),
    archiveProject: vi.fn(),
    updateProject: vi.fn(),
}));

const mockedFetchProjects = vi.mocked(fetchProjects);
const mockedCreateProject = vi.mocked(createProject);
const mockedCreateList = vi.mocked(createList);
const mockedUpdateProject = vi.mocked(updateProject);
const mockedArchiveProject = vi.mocked(archiveProject);

const baseProject = {
    id: 'project-1',
    workspace_id: 'ws-1',
    name: 'Quantum Computing',
    list_count: 1,
    archived: false,
    created_at: '2026-05-10T12:00:00.000Z',
    updated_at: '2026-05-12T12:00:00.000Z',
};

beforeEach(() => {
    mockedFetchProjects.mockReset();
    mockedCreateProject.mockReset();
    mockedCreateList.mockReset();
    mockedUpdateProject.mockReset();
    mockedArchiveProject.mockReset();
    mockedFetchProjects.mockImplementation(({ archived = false }: { archived?: boolean } = {}) => Promise.resolve(
        archived
            ? []
            : [baseProject],
    ));
});

test('renders projects as a full-width compact table with row actions', async () => {
    const user = userEvent.setup();
    render(<ProjectsPage />);

    expect(await screen.findByText('Quantum Computing')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search projects...').closest('label')).toHaveClass('tui-textfield--size-3');
    expect(screen.getByRole('columnheader', { name: 'Project' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Lists' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quantum Computing' })).toHaveAttribute('href', '/dashboard/projects/project-1');
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/dashboard/projects/project-1');
    expect(screen.getByRole('link', { name: 'Lists' })).toHaveAttribute('href', '/dashboard/projects/lists?project_id=project-1');
    expect(screen.getByRole('link', { name: 'New list' })).toHaveAttribute('href', '/dashboard/projects/lists?project_id=project-1&new=1');
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Project details')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create Project' }));

    const createInput = screen.getByPlaceholderText('Series-B Backend Engineers');
    expect(createInput.closest('label')).toHaveClass('tui-textfield--size-3');
    expect(screen.getByRole('button', { name: 'Create project' })).toHaveClass('tui-button--size-3');
});

test('keeps a created project when optional first-list creation fails', async () => {
    const user = userEvent.setup();
    const createdProject = {
        id: 'project-new',
        workspace_id: 'ws-1',
        name: 'New Project',
        list_count: 0,
        archived: false,
        created_at: '2026-06-01T12:00:00.000Z',
        updated_at: '2026-06-01T12:00:00.000Z',
    };
    let includeCreated = false;
    mockedFetchProjects.mockImplementation(({ archived = false }: { archived?: boolean } = {}) => Promise.resolve(
        archived ? [] : includeCreated ? [createdProject, baseProject] : [baseProject],
    ));
    mockedCreateProject.mockImplementation(async () => {
        includeCreated = true;
        return createdProject;
    });
    mockedCreateList.mockRejectedValue(new Error('List API failed'));

    render(<ProjectsPage />);
    await screen.findAllByText('Quantum Computing');

    await user.click(screen.getByRole('button', { name: 'Create Project' }));
    await user.type(screen.getByLabelText('Project name'), 'New Project');
    await user.type(screen.getByLabelText('First list'), 'Outreach Round 1');
    await user.click(screen.getByRole('button', { name: 'Create project' }));

    await waitFor(() => {
        expect(mockedCreateProject).toHaveBeenCalledWith({ name: 'New Project' });
        expect(mockedCreateList).toHaveBeenCalledWith('project-new', { name: 'Outreach Round 1' });
    });
    expect(await screen.findByText('Project created. First list was not created: List API failed')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Project' })).toHaveAttribute('href', '/dashboard/projects/project-new');
});

test('edits a project name via the edit dialog', async () => {
    const user = userEvent.setup();
    mockedUpdateProject.mockResolvedValue({ ...baseProject, name: 'Quantum Team' });

    render(<ProjectsPage />);
    await screen.findByText('Quantum Computing');

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Project name'));
    await user.type(screen.getByLabelText('Project name'), 'Quantum Team');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
        expect(mockedUpdateProject).toHaveBeenCalledWith('project-1', { name: 'Quantum Team' });
    });
    expect(await screen.findByText('Quantum Team')).toBeInTheDocument();
});

test('edits a project color via the edit dialog', async () => {
    const user = userEvent.setup();
    mockedUpdateProject.mockResolvedValue({ ...baseProject, color: '#FF682C' });

    render(<ProjectsPage />);
    await screen.findByText('Quantum Computing');

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Use Orange' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
        expect(mockedUpdateProject).toHaveBeenCalledWith('project-1', { color: '#FF682C' });
    });
});

test('restores an archived project from the archived filter', async () => {
    const user = userEvent.setup();
    const archived = { ...baseProject, id: 'project-arch', name: 'Archived Co', archived: true };
    mockedFetchProjects.mockImplementation(({ archived: isArchived = false }: { archived?: boolean } = {}) =>
        Promise.resolve(isArchived ? [archived] : []),
    );
    mockedUpdateProject.mockResolvedValue({ ...archived, archived: false });

    render(<ProjectsPage />);
    await user.selectOptions(screen.getByLabelText('Project status'), 'archived');
    expect(await screen.findByText('Archived Co')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restore' }));

    await waitFor(() => {
        expect(mockedUpdateProject).toHaveBeenCalledWith('project-arch', { archived: false });
    });
});

test('filters project rows without showing a detail drawer', async () => {
    const user = userEvent.setup();
    mockedFetchProjects.mockImplementation(({ archived = false }: { archived?: boolean } = {}) => Promise.resolve(
        archived
            ? []
            : [
                baseProject,
                {
                    id: 'project-2',
                    workspace_id: 'ws-1',
                    name: 'Backend Platform',
                    list_count: 2,
                    archived: false,
                    created_at: '2026-05-11T12:00:00.000Z',
                    updated_at: '2026-05-13T12:00:00.000Z',
                },
            ],
    ));

    render(<ProjectsPage />);

    expect(await screen.findByText('Backend Platform')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search projects...'), 'Quantum');

    await waitFor(() => {
        expect(screen.queryByText('Backend Platform')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Quantum Computing' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Project details')).not.toBeInTheDocument();
});
