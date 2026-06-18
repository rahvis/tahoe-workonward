import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SaveToListDialog from './SaveToListDialog';
import {
    createList,
    createProject,
    fetchProjectLists,
    fetchProjects,
    importListCandidates,
} from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    fetchProjects: vi.fn(),
    fetchProjectLists: vi.fn(),
    createProject: vi.fn(),
    createList: vi.fn(),
    importListCandidates: vi.fn(),
}));

const mockedFetchProjects = vi.mocked(fetchProjects);
const mockedFetchProjectLists = vi.mocked(fetchProjectLists);
const mockedCreateProject = vi.mocked(createProject);
const mockedCreateList = vi.mocked(createList);
const mockedImportListCandidates = vi.mocked(importListCandidates);

const projects = [
    {
        id: 'project-1',
        workspace_id: 'ws-1',
        name: 'Quantum Computing',
        list_count: 3,
        archived: false,
    },
    {
        id: 'project-2',
        workspace_id: 'ws-1',
        name: 'HR in New York',
        list_count: 2,
        archived: false,
    },
    {
        id: 'project-3',
        workspace_id: 'ws-1',
        name: 'ML Engineer',
        list_count: 1,
        archived: false,
    },
    {
        id: 'project-4',
        workspace_id: 'ws-1',
        name: 'Growth Hiring',
        list_count: 0,
        archived: false,
    },
];

const listsByProject = {
    'project-1': [
        {
            id: 'list-1',
            workspace_id: 'ws-1',
            project_id: 'project-1',
            name: 'Contact engineers',
            candidate_count: 20,
        },
        {
            id: 'list-2',
            workspace_id: 'ws-1',
            project_id: 'project-1',
            name: 'Initial Reach',
            candidate_count: 12,
        },
        {
            id: 'list-3',
            workspace_id: 'ws-1',
            project_id: 'project-1',
            name: 'Cold outreach - ML Engineer',
            candidate_count: 9,
        },
    ],
    'project-2': [
        {
            id: 'list-4',
            workspace_id: 'ws-1',
            project_id: 'project-2',
            name: 'NYC HR leaders',
            candidate_count: 6,
        },
    ],
    'project-3': [],
    'project-4': [],
} as const;

function renderDialog() {
    return render(
        <SaveToListDialog
            open
            onOpenChange={vi.fn()}
            candidates={[
                {
                    id: 101,
                    full_name: 'Ada Lovelace',
                },
            ]}
        />,
    );
}

beforeEach(() => {
    mockedFetchProjects.mockReset();
    mockedFetchProjectLists.mockReset();
    mockedCreateProject.mockReset();
    mockedCreateList.mockReset();
    mockedImportListCandidates.mockReset();

    mockedFetchProjects.mockResolvedValue(projects);
    mockedFetchProjectLists.mockImplementation(async (projectId) => listsByProject[projectId as keyof typeof listsByProject] ?? []);
    mockedCreateProject.mockResolvedValue({
        id: 'project-new',
        workspace_id: 'ws-1',
        name: 'New Project',
        list_count: 0,
        archived: false,
    });
    mockedCreateList.mockResolvedValue({
        id: 'list-new',
        workspace_id: 'ws-1',
        project_id: 'project-new',
        name: 'New List',
        candidate_count: 0,
    });
    mockedImportListCandidates.mockResolvedValue({
        new_candidate_count: 1,
        existing_candidate_count: 0,
        new_membership_count: 1,
        already_in_list_count: 0,
    });
});

test('opens with no project preselected and keeps the list picker disabled', async () => {
    renderDialog();

    await waitFor(() => expect(mockedFetchProjects).toHaveBeenCalledTimes(1));

    const projectPicker = screen.getByLabelText('Project');
    const listPicker = screen.getByLabelText('List');

    expect(projectPicker).toHaveTextContent('Choose a project');
    expect(listPicker).toBeDisabled();
    expect(listPicker).toHaveTextContent('Choose a project first');
    expect(mockedFetchProjectLists).not.toHaveBeenCalled();
});

test('shows a searchable project picker and filters the available projects inline', async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => expect(mockedFetchProjects).toHaveBeenCalledTimes(1));

    await user.click(screen.getByLabelText('Project'));

    const projectPanel = screen.getByRole('listbox', { name: 'Choose a project' });
    expect(screen.getByPlaceholderText('Search projects')).toBeInTheDocument();
    expect(within(projectPanel).getByRole('option', { name: /Quantum Computing/i })).toBeInTheDocument();
    expect(within(projectPanel).getByRole('option', { name: /HR in New York/i })).toBeInTheDocument();
    expect(within(projectPanel).getByRole('option', { name: /ML Engineer/i })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search projects'), 'growth');

    expect(within(projectPanel).getByRole('option', { name: /Growth Hiring/i })).toBeInTheDocument();
    expect(within(projectPanel).queryByRole('option', { name: /Quantum Computing/i })).not.toBeInTheDocument();
});

test('selecting a project clears new project text and loads that project lists', async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => expect(mockedFetchProjects).toHaveBeenCalledTimes(1));

    const newProjectInput = screen.getByPlaceholderText('Or create a new project');
    await user.type(newProjectInput, 'Temporary Project');
    expect(newProjectInput).toHaveValue('Temporary Project');

    await user.click(screen.getByLabelText('Project'));
    await user.click(screen.getByRole('option', { name: /HR in New York/i }));

    await waitFor(() => expect(mockedFetchProjectLists).toHaveBeenCalledWith('project-2'));

    expect(newProjectInput).toHaveValue('');
    expect(screen.getByLabelText('Project')).toHaveTextContent('HR in New York');
    expect(screen.getByLabelText('List')).not.toBeDisabled();
});

test('typing a new project name clears the selected project and disables list selection again', async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => expect(mockedFetchProjects).toHaveBeenCalledTimes(1));

    await user.click(screen.getByLabelText('Project'));
    await user.click(screen.getByRole('option', { name: /Quantum Computing/i }));
    await waitFor(() => expect(mockedFetchProjectLists).toHaveBeenCalledWith('project-1'));

    const newProjectInput = screen.getByPlaceholderText('Or create a new project');
    await user.type(newProjectInput, 'Recruiting Ops');

    expect(screen.getByLabelText('Project')).toHaveTextContent('Choose a project');
    expect(screen.getByLabelText('List')).toBeDisabled();
});

test('the list picker filters project-scoped lists and selecting one clears the new list input', async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => expect(mockedFetchProjects).toHaveBeenCalledTimes(1));

    await user.click(screen.getByLabelText('Project'));
    await user.click(screen.getByRole('option', { name: /Quantum Computing/i }));
    await waitFor(() => expect(mockedFetchProjectLists).toHaveBeenCalledWith('project-1'));

    const newListInput = screen.getByPlaceholderText('Or create a new list');
    await user.type(newListInput, 'Warm intro list');
    expect(newListInput).toHaveValue('Warm intro list');

    await user.click(screen.getByLabelText('List'));
    const listPanel = screen.getByRole('listbox', { name: 'Choose a list' });
    expect(screen.getByPlaceholderText('Search lists')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search lists'), 'initial');

    expect(within(listPanel).getByRole('option', { name: /Initial Reach/i })).toBeInTheDocument();
    expect(within(listPanel).queryByRole('option', { name: /Contact engineers/i })).not.toBeInTheDocument();

    await user.click(within(listPanel).getByRole('option', { name: /Initial Reach/i }));

    expect(screen.getByLabelText('List')).toHaveTextContent('Initial Reach');
    expect(newListInput).toHaveValue('');
});

test('shows next-step success actions after importing selected candidates', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSaved = vi.fn();
    const onOpenList = vi.fn();
    const onEnrichList = vi.fn();

    render(
        <SaveToListDialog
            open
            onOpenChange={onOpenChange}
            candidates={[
                {
                    id: 101,
                    full_name: 'Ada Lovelace',
                },
            ]}
            onSaved={onSaved}
            onOpenList={onOpenList}
            onEnrichList={onEnrichList}
        />,
    );

    await waitFor(() => expect(mockedFetchProjects).toHaveBeenCalledTimes(1));

    await user.click(screen.getByLabelText('Project'));
    await user.click(screen.getByRole('option', { name: /Quantum Computing/i }));
    await waitFor(() => expect(mockedFetchProjectLists).toHaveBeenCalledWith('project-1'));

    await user.click(screen.getByLabelText('List'));
    await user.click(screen.getByRole('option', { name: /Contact engineers/i }));
    // "Stay on search" is the default now — opt into the next-steps flow for this test.
    await user.click(screen.getByLabelText('Show next steps'));
    await user.click(screen.getByRole('button', { name: 'Save candidates' }));

    expect(await screen.findByRole('heading', { name: 'Saved 1 candidate' })).toBeInTheDocument();
    expect(screen.getByText(/1 added, 0 already in this list/i)).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ id: 'list-1' }));

    await user.click(screen.getByRole('button', { name: 'Open list' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onOpenList).toHaveBeenCalledWith(expect.objectContaining({ id: 'list-1' }));
    expect(onEnrichList).not.toHaveBeenCalled();
});
