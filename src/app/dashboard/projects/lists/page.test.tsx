import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ListsDirectoryPage from './page';
import { createList, deleteList, fetchLists, fetchProjects, updateList } from '@/lib/organization';

let currentSearchParams = 'project_id=project-1';

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(currentSearchParams),
}));

vi.mock('@/lib/organization', () => ({
    fetchLists: vi.fn(),
    fetchProjects: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
}));

const mockedFetchLists = vi.mocked(fetchLists);
const mockedFetchProjects = vi.mocked(fetchProjects);
const mockedCreateList = vi.mocked(createList);
const mockedUpdateList = vi.mocked(updateList);
const mockedDeleteList = vi.mocked(deleteList);

const baseLists = [
    {
        id: 'list-1',
        workspace_id: 'ws-1',
        project_id: 'project-1',
        project_name: 'Quantum Computing',
        name: 'Contact engineers',
        candidate_count: 20,
        updated_at: '2026-05-12T12:00:00.000Z',
    },
    {
        id: 'list-2',
        workspace_id: 'ws-1',
        project_id: 'project-1',
        project_name: 'Quantum Computing',
        name: 'Backend alumni',
        candidate_count: 4,
        updated_at: '2026-05-11T12:00:00.000Z',
    },
];

const baseProjects = [
    {
        id: 'project-1',
        workspace_id: 'ws-1',
        name: 'Quantum Computing',
        list_count: 2,
        archived: false,
    },
    {
        id: 'project-2',
        workspace_id: 'ws-1',
        name: 'Backend Platform',
        list_count: 0,
        archived: false,
    },
];

beforeEach(() => {
    currentSearchParams = 'project_id=project-1';
    mockedFetchLists.mockReset();
    mockedFetchProjects.mockReset();
    mockedCreateList.mockReset();
    mockedUpdateList.mockReset();
    mockedDeleteList.mockReset();
    mockedFetchLists.mockResolvedValue(baseLists);
    mockedFetchProjects.mockResolvedValue(baseProjects);
});

test('renders lists as a full-width compact table with row actions', async () => {
    render(<ListsDirectoryPage />);

    expect(await screen.findByText('Contact engineers')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search lists or projects...').closest('label')).toHaveClass('tui-textfield--size-3');
    expect(screen.getByRole('columnheader', { name: 'List' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Project' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Candidates' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getAllByText('Quantum Computing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('20').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Contact engineers' })).toHaveAttribute('href', '/dashboard/projects/lists/list-1');
    expect(screen.getAllByRole('link', { name: 'Open' })[0]).toHaveAttribute('href', '/dashboard/projects/lists/list-1');
    expect(screen.getAllByRole('link', { name: 'Enrich' })[0]).toHaveAttribute('href', '/dashboard/projects/lists/list-1?enrich=1');
    expect(screen.getAllByRole('link', { name: 'Campaign' })[0]).toHaveAttribute('href', '/dashboard/outreach/campaigns/new?list_id=list-1');
    expect(screen.getAllByRole('button', { name: 'Edit' })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Delete' })[0]).toBeInTheDocument();
    expect(screen.queryByLabelText('List details')).not.toBeInTheDocument();
});

test('syncs new-list project from route and reopens once per project id', async () => {
    const user = userEvent.setup();
    currentSearchParams = 'project_id=project-1&new=1';
    const { rerender } = render(<ListsDirectoryPage />);

    expect(await screen.findByRole('heading', { name: 'New list' })).toBeInTheDocument();
    expect(screen.getByLabelText('Project')).toHaveValue('project-1');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'New list' })).not.toBeInTheDocument();
    });

    currentSearchParams = 'project_id=project-2&new=1';
    rerender(<ListsDirectoryPage />);

    expect(await screen.findByRole('heading', { name: 'New list' })).toBeInTheDocument();
    expect(screen.getByLabelText('Project')).toHaveValue('project-2');
});

test('clears create project selection when project_id is absent', async () => {
    const user = userEvent.setup();
    currentSearchParams = '';

    render(<ListsDirectoryPage />);
    await screen.findAllByText('Contact engineers');

    await user.click(screen.getByRole('button', { name: 'Create List' }));

    expect(screen.getByLabelText('Project')).toHaveValue('');
});

test('filters list rows without showing a detail drawer', async () => {
    const user = userEvent.setup();

    render(<ListsDirectoryPage />);

    expect(await screen.findByText('Backend alumni')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search lists or projects...'), 'Contact');

    await waitFor(() => {
        expect(screen.queryByText('Backend alumni')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Contact engineers' })).toBeInTheDocument();
    expect(screen.queryByLabelText('List details')).not.toBeInTheDocument();
});

test('clears create-list modal errors between sessions', async () => {
    const user = userEvent.setup();
    mockedCreateList.mockRejectedValue(new Error('Create list failed'));

    render(<ListsDirectoryPage />);
    await screen.findAllByText('Contact engineers');

    await user.click(screen.getByRole('button', { name: 'Create List' }));
    await user.type(screen.getByLabelText('List name'), 'Outbound list');
    await user.click(screen.getByRole('button', { name: 'Create list' }));

    expect(await screen.findByText('Create list failed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
        expect(screen.queryByText('Create list failed')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Create List' }));

    expect(screen.queryByText('Create list failed')).not.toBeInTheDocument();
});

test('clears edit-list modal errors between sessions', async () => {
    const user = userEvent.setup();
    mockedUpdateList.mockRejectedValue(new Error('Rename list failed'));

    render(<ListsDirectoryPage />);
    await screen.findAllByText('Contact engineers');

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    await user.clear(screen.getByLabelText('List name'));
    await user.type(screen.getByLabelText('List name'), 'Renamed list');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Rename list failed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
        expect(screen.queryByText('Rename list failed')).not.toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);

    expect(screen.queryByText('Rename list failed')).not.toBeInTheDocument();
    expect(screen.getByLabelText('List name')).toHaveValue('Contact engineers');
});

test('deletes a list after confirmation and removes it from the table', async () => {
    const user = userEvent.setup();
    mockedDeleteList.mockResolvedValue({ deleted: true, list_id: 'list-1' });

    render(<ListsDirectoryPage />);
    await screen.findByText('Contact engineers');

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    expect(await screen.findByRole('heading', { name: 'Delete list?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete list' }));

    await waitFor(() => {
        expect(mockedDeleteList).toHaveBeenCalledWith('list-1');
    });
    await waitFor(() => {
        expect(screen.queryByRole('link', { name: 'Contact engineers' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Backend alumni' })).toBeInTheDocument();
});

test('moves a list to a different project via the edit dialog', async () => {
    const user = userEvent.setup();
    mockedUpdateList.mockImplementation(async (listId, payload) => ({
        ...baseLists[0],
        id: listId,
        ...(payload as Record<string, unknown>),
        project_name: 'Backend Platform',
    }));

    render(<ListsDirectoryPage />);
    await screen.findByText('Contact engineers');

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    await user.selectOptions(screen.getByLabelText('Project'), 'project-2');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
        expect(mockedUpdateList).toHaveBeenCalledWith('list-1', { project_id: 'project-2' });
    });
});
