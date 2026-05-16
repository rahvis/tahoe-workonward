import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SavedSearchesPage from "./SavedSearchesPage";
import { rerunSavedSearch } from "@/lib/api";
import { storeSearchPageBootstrap } from "@/lib/search-page-bootstrap";
import { fetchProjects, fetchSavedSearches } from "@/lib/organization";

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
const mockedRerunSavedSearch = vi.mocked(rerunSavedSearch);
const mockedStoreSearchPageBootstrap = vi.mocked(storeSearchPageBootstrap);

const savedSearch = {
    id: "saved-1",
    workspace_id: "workspace-1",
    name: "ML engineers in LA",
    prompt: "ml engineers in los angeles",
    mode: "langgraph" as const,
    structured_filters: {},
    project_id: null,
    created_at: "2026-05-09T12:00:00Z",
    updated_at: "2026-05-09T12:00:00Z",
};

beforeEach(() => {
    mockRouterPush.mockReset();
    mockedFetchSavedSearches.mockReset();
    mockedFetchProjects.mockReset();
    mockedRerunSavedSearch.mockReset();
    mockedStoreSearchPageBootstrap.mockReset();

    mockedFetchSavedSearches.mockResolvedValue([savedSearch]);
    mockedFetchProjects.mockResolvedValue([]);
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
