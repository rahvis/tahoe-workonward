import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProjectsPage from './page';
import { createList, createProject, fetchProjects } from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    fetchProjects: vi.fn(),
    createProject: vi.fn(),
    createList: vi.fn(),
    archiveProject: vi.fn(),
}));

const mockedFetchProjects = vi.mocked(fetchProjects);
const mockedCreateProject = vi.mocked(createProject);
const mockedCreateList = vi.mocked(createList);

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
    mockedFetchProjects.mockImplementation(({ archived = false }: { archived?: boolean } = {}) => Promise.resolve(
        archived
            ? []
            : [baseProject],
    ));
});

test('renders projects as a compact directory table with drawer actions', async () => {
    const user = userEvent.setup();
    render(<ProjectsPage />);

    expect(await screen.findAllByText('Quantum Computing')).toHaveLength(2);
    expect(screen.getByPlaceholderText('Search projects...').closest('label')).toHaveClass('tui-textfield--size-3');
    expect(screen.getByRole('columnheader', { name: 'Project' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Lists' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Open' })[0]).toHaveAttribute('href', '/dashboard/projects/project-1');
    expect(screen.getAllByRole('link', { name: 'Lists' })[0]).toHaveAttribute('href', '/dashboard/projects/lists?project_id=project-1');
    expect(screen.getByRole('link', { name: 'View lists' })).toHaveAttribute('href', '/dashboard/projects/lists?project_id=project-1');
    expect(screen.getByRole('link', { name: 'New list' })).toHaveAttribute('href', '/dashboard/projects/lists?project_id=project-1&new=1');
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ Project' }));

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

    await user.click(screen.getByRole('button', { name: '+ Project' }));
    await user.type(screen.getByLabelText('Project name'), 'New Project');
    await user.type(screen.getByLabelText('First list'), 'Outreach Round 1');
    await user.click(screen.getByRole('button', { name: 'Create project' }));

    await waitFor(() => {
        expect(mockedCreateProject).toHaveBeenCalledWith({ name: 'New Project' });
        expect(mockedCreateList).toHaveBeenCalledWith('project-new', { name: 'Outreach Round 1' });
    });
    expect(await screen.findByText('Project created. First list was not created: List API failed')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'New Project' })).toBeInTheDocument();
});

test('drawer falls back to a visible project after search hides the selected row', async () => {
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

    await user.click(await screen.findByRole('button', { name: 'Backend Platform' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Backend Platform' })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search projects...'), 'Quantum');

    await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'Quantum Computing' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { level: 2, name: 'Backend Platform' })).not.toBeInTheDocument();
});
