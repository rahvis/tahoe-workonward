import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SavedSearchesPage from "./SavedSearchesPage";
import { rerunSavedSearch } from "@/lib/api";
import { storeSearchPageBootstrap } from "@/lib/search-page-bootstrap";
import { deleteSavedSearch, fetchProjects, fetchSavedSearches } from "@/lib/organization";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

vi.mock("@/lib/api", () => ({
    rerunSavedSearch: vi.fn(),
}));

vi.mock("@/lib/search-page-bootstrap", () => ({
    storeSearchPageBootstrap: vi.fn(),
}));

vi.mock("@/lib/organization", () => ({
    fetchSavedSearches: vi.fn(),
    fetchProjects: vi.fn(),
    deleteSavedSearch: vi.fn(),
}));

const mockedFetchSavedSearches = vi.mocked(fetchSavedSearches);
const mockedFetchProjects = vi.mocked(fetchProjects);
const mockedDeleteSavedSearch = vi.mocked(deleteSavedSearch);
const mockedRerunSavedSearch = vi.mocked(rerunSavedSearch);
const mockedStoreSearchPageBootstrap = vi.mocked(storeSearchPageBootstrap);

const savedSearch = {
    id: "saved-1",
    workspace_id: "workspace-1",
    name: "ML engineers in LA",
    prompt: "ml engineers in los angeles",
    mode: "langgraph" as const,
    structured_filters: {
        job: {
            current_title_keywords: ["Machine Learning Engineer"],
        },
        locations: {
            cities: ["Los Angeles"],
        },
    },
    project_id: "project-1",
    created_at: "2026-05-09T12:00:00Z",
    updated_at: "2026-05-09T12:00:00Z",
};

beforeEach(() => {
    mockRouterPush.mockReset();
    mockedFetchSavedSearches.mockReset();
    mockedFetchProjects.mockReset();
    mockedDeleteSavedSearch.mockReset();
    mockedRerunSavedSearch.mockReset();
    mockedStoreSearchPageBootstrap.mockReset();

    mockedFetchSavedSearches.mockResolvedValue([savedSearch]);
    mockedFetchProjects.mockResolvedValue([
        {
            id: "project-1",
            workspace_id: "workspace-1",
            name: "Series B",
            list_count: 0,
            archived: false,
        },
    ]);
    mockedDeleteSavedSearch.mockResolvedValue({ deleted: true, saved_search_id: "saved-1" });
});

test("stores rerun bootstrap and navigates to a clean langgraph search url", async () => {
    const user = userEvent.setup();
    mockedRerunSavedSearch.mockResolvedValue({
        search_session_id: "session-1",
        mode: "langgraph",
        prompt: "ml engineers in los angeles",
        parsed_intent: {},
        structured_filters: {},
        popup_model: {},
    });

    render(<SavedSearchesPage />);

    await user.click(await screen.findByRole("button", { name: "Run again" }));

    await waitFor(() => {
        expect(mockedStoreSearchPageBootstrap).toHaveBeenCalledWith({
            search_session_id: "session-1",
            mode: "langgraph",
            prompt: "ml engineers in los angeles",
            parsed_intent: {},
            structured_filters: {},
            popup_model: {},
        });
        expect(mockRouterPush).toHaveBeenCalledWith("/dashboard/search/new?mode=langgraph");
    });
});

test("stores rerun bootstrap and navigates to a clean legacy search url", async () => {
    const user = userEvent.setup();
    mockedRerunSavedSearch.mockResolvedValue({
        search_session_id: "legacy-session-1",
        mode: "legacy",
        prompt: "backend engineers",
        parsed_intent: {},
        structured_filters: { job_titles: ["Backend Engineer"] },
        popup_model: null,
    });

    render(<SavedSearchesPage />);

    await user.click(await screen.findByRole("button", { name: "Run again" }));

    await waitFor(() => {
        expect(mockedStoreSearchPageBootstrap).toHaveBeenCalledWith({
            search_session_id: "legacy-session-1",
            mode: "legacy",
            prompt: "backend engineers",
            parsed_intent: {},
            structured_filters: { job_titles: ["Backend Engineer"] },
            popup_model: null,
        });
        expect(mockRouterPush).toHaveBeenCalledWith("/dashboard/search/new?mode=legacy");
    });
});

test("renders saved searches as scannable rows and opens an inspection modal", async () => {
    const user = userEvent.setup();
    render(<SavedSearchesPage />);

    expect(await screen.findByRole("columnheader", { name: "Search Name" })).toBeInTheDocument();
    expect(screen.getAllByText("Series B").length).toBeGreaterThan(0);
    expect(screen.getByText("2 filters")).toBeInTheDocument();
    expect(screen.getAllByText("LangGraph").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "ML engineers in LA" }));

    const dialog = await screen.findByRole("dialog", { name: "Saved search details" });
    expect(within(dialog).getByText("Inspect the prompt and filters before starting a fresh run.")).toBeInTheDocument();
    expect(within(dialog).getByText("Machine Learning Engineer")).toBeInTheDocument();
    expect(within(dialog).getByText("Los Angeles")).toBeInTheDocument();
});

test("confirms before deleting a saved search", async () => {
    const user = userEvent.setup();
    render(<SavedSearchesPage />);

    const row = (await screen.findByRole("button", { name: "ML engineers in LA" })).closest("tr");
    expect(row).not.toBeNull();

    await user.click(within(row as HTMLTableRowElement).getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete saved search confirmation" });
    expect(within(dialog).getByText(/This will not delete saved candidates or project lists/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Delete saved search" }));

    await waitFor(() => {
        expect(mockedDeleteSavedSearch).toHaveBeenCalledWith("saved-1");
        expect(screen.queryByRole("button", { name: "ML engineers in LA" })).not.toBeInTheDocument();
    });
});
