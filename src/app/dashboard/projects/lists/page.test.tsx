import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ListsDirectoryPage from './page';
import { fetchLists } from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    fetchLists: vi.fn(),
}));

const mockedFetchLists = vi.mocked(fetchLists);

beforeEach(() => {
    mockedFetchLists.mockReset();
    mockedFetchLists.mockResolvedValue([
        {
            id: 'list-1',
            workspace_id: 'ws-1',
            project_id: 'project-1',
            project_name: 'Quantum Computing',
            name: 'Contact engineers',
            candidate_count: 20,
        },
    ]);
});

test('uses dashboard-sized controls on the lists directory', async () => {
    render(<ListsDirectoryPage />);

    const searchInput = await screen.findByPlaceholderText('Search lists');
    expect(searchInput.closest('label')).toHaveClass('tui-textfield--size-3');
    expect(screen.getByRole('link', { name: 'Open list' })).toHaveClass('tahoe-button');
});
