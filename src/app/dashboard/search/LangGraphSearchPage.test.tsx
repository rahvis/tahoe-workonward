import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { apiRequest, getSearchSession } from "@/lib/api";
import LangGraphSearchPage from "./LangGraphSearchPage";

const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();
let currentSearchParams = new URLSearchParams();
let desktopViewport = true;

vi.mock("@/lib/api", () => ({
    apiRequest: vi.fn(),
    getSearchSession: vi.fn(),
}));

vi.mock("./CandidatePanel", () => ({
    __esModule: true,
    default: (props: {
        preview: { id: number; full_name: string | null };
        onSaveToList?: (id: number) => void;
    }) => (
        <aside aria-label="Candidate panel">
            <h2>{props.preview.full_name}</h2>
            {props.onSaveToList ? (
                <button type="button" onClick={() => props.onSaveToList?.(props.preview.id)}>
                    Save panel candidate
                </button>
            ) : null}
        </aside>
    ),
}));

vi.mock("../_components/SaveToListDialog", () => ({
    __esModule: true,
    default: (props: { open: boolean; candidates: Array<{ full_name?: string | null }> }) => (
        props.open ? (
            <div role="dialog" aria-label="Save candidates dialog">
                {props.candidates.map((candidate) => candidate.full_name).join(", ")}
            </div>
        ) : null
    ),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockRouterPush,
        replace: mockRouterReplace,
        prefetch: vi.fn(),
    }),
    usePathname: () => "/dashboard/search/new",
    useSearchParams: () => currentSearchParams,
}));

const mockedApiRequest = vi.mocked(apiRequest);
const mockedGetSearchSession = vi.mocked(getSearchSession);

function setViewportMode(next: "desktop" | "mobile") {
    desktopViewport = next === "desktop";
}

const metadataResponse = {
    version: "langgraph-v1",
    sections: [
        {
            id: "general",
            title: "General",
            fields: [
                { key: "general.min_experience_months", label: "Min Experience (Months)", control: "number", help_text: "", options: [], suggestions: [], allow_custom: false },
                { key: "general.max_experience_months", label: "Max Experience (Months)", control: "number", help_text: "", options: [], suggestions: [], allow_custom: false },
                { key: "general.is_currently_employed", label: "Currently Employed", control: "boolean", help_text: "", options: [], suggestions: [], allow_custom: false },
                { key: "general.is_decision_maker", label: "Decision Maker", control: "boolean", help_text: "", options: [], suggestions: [], allow_custom: false },
                { key: "general.min_followers", label: "Min Followers", control: "number", help_text: "", options: [], suggestions: [], allow_custom: false },
                { key: "general.min_connections", label: "Min Connections", control: "number", help_text: "", options: [], suggestions: [], allow_custom: false },
            ],
        },
        {
            id: "job",
            title: "Job",
            fields: [
                { key: "job.current_title_keywords", label: "Current Titles", control: "tags_with_suggestions", help_text: "", options: [], suggestions: ["Software Developers", "Registered Nurses"], allow_custom: true },
                { key: "job.departments", label: "Departments", control: "tags_with_suggestions", help_text: "", options: [], suggestions: ["Engineering and Technical", "Platform", "Warehouse Operations"], allow_custom: true },
                { key: "job.management_levels", label: "Management Levels", control: "tags_with_suggestions", help_text: "", options: [], suggestions: ["Director", "Shift Lead", "Individual Contributor"], allow_custom: true },
            ],
        },
        {
            id: "company",
            title: "Company",
            fields: [
                { key: "company.current_company_names", label: "Current Companies", control: "tags", help_text: "", options: [], suggestions: [], allow_custom: true },
                { key: "company.past_company_names", label: "Past Companies", control: "tags", help_text: "", options: [], suggestions: [], allow_custom: true },
                { key: "company.optional_company_names", label: "Optional Background Companies", control: "tags", help_text: "", options: [], suggestions: [], allow_custom: true },
                { key: "company.industries", label: "Industries", control: "tags", help_text: "", options: [], suggestions: [], allow_custom: true },
                { key: "company.company_size_ranges", label: "Company Sizes", control: "tags_with_suggestions", help_text: "", options: [], suggestions: ["11-50 employees", "51-200 employees"], allow_custom: true },
                { key: "company.company_hq_countries", label: "Company HQ Countries", control: "tags", help_text: "", options: [], suggestions: [], allow_custom: true },
                { key: "company.is_b2b_company", label: "B2B Company", control: "boolean", help_text: "", options: [], suggestions: [], allow_custom: false },
            ],
        },
        {
            id: "languages",
            title: "Languages",
            fields: [
                {
                    key: "languages",
                    label: "Languages",
                    control: "language_rows",
                    help_text: "",
                    options: [
                        "Elementary proficiency",
                        "Limited working proficiency",
                        "Professional working proficiency",
                        "Full professional proficiency",
                        "Native or bilingual proficiency",
                    ],
                    suggestions: ["English", "Korean"],
                    allow_custom: true,
                },
            ],
        },
    ],
    management_levels: ["Director"],
    departments: ["Engineering and Technical"],
    company_size_ranges: ["11-50 employees", "51-200 employees"],
    language_proficiencies: [
        "Elementary proficiency",
        "Limited working proficiency",
        "Professional working proficiency",
        "Full professional proficiency",
        "Native or bilingual proficiency",
    ],
    workforce_role_suggestions: ["Software Developers", "Registered Nurses"],
};

const popupModelResponse = {
    general: {
        min_experience_months: null,
        max_experience_months: null,
        is_currently_employed: null,
        is_decision_maker: null,
        min_followers: null,
        min_connections: null,
    },
    locations: {
        countries: [],
        states: [],
        cities: [],
    },
    job: {
        current_title_keywords: ["ML Engineer"],
        departments: [],
        management_levels: [],
        recently_started: null,
        recently_left: null,
        recent_company_name: null,
    },
    company: {
        current_company_names: [],
        past_company_names: [],
        optional_company_names: ["Google", "Meta"],
        industries: [],
        optional_industries: [],
        company_size_ranges: [],
        optional_company_size_ranges: ["11-50 employees"],
        company_hq_countries: [],
        optional_company_hq_countries: [],
        is_b2b_company: null,
        optional_is_b2b_company: null,
    },
    keywords: {
        skills: ["Python"],
        headline_keywords: [],
        summary_keywords: [],
    },
    education: {
        institution_names: [],
        degree_keywords: [],
        graduation_year_min: null,
        graduation_year_max: null,
    },
    certifications: {
        title_keywords: [],
        issuers: [],
    },
    languages: [],
    ambiguities: [],
    semantic_expansions: {
        FAANG: ["Google", "Meta"],
    },
};

const executeResultsResponse = {
    state: "success_with_results",
    results: [
        {
            id: 101,
            full_name: "Casey Cho",
            websites_linkedin: "https://linkedin.com/in/casey-cho",
            headline: "Senior Backend Engineer",
            location_full: "San Francisco, California, United States",
            location_country: "United States",
            connections_count: 500,
            follower_count: 1200,
            company_name: "Tahoe",
            company_linkedin_url: "https://linkedin.com/company/tahoe",
            company_website: "https://tahoe.dev",
            company_industry: "Software",
            job_title: "Senior Backend Engineer",
            department: "Platform",
            management_level: "Senior",
            company_location_hq_full_address: "San Francisco, California",
            company_location_hq_country: "United States",
            score: 42.7,
        },
    ],
    total_results: 128,
    current_page: 1,
    total_pages: 5,
    has_next: true,
    has_prev: false,
    query_hash: "hash-1",
    preview_total_results: 100,
    preview_cap: 100,
    diagnosis: null,
    diagnosis_type: null,
    root_cause: null,
    suggestions: [],
    ambiguous_terms: [],
    search_session_id: "session-1",
    langsmith_run_id: null,
};

const previewPageTwoResponse = {
    results: [
        {
            id: 102,
            full_name: "Mina Park",
            websites_linkedin: "https://linkedin.com/in/mina-park",
            headline: "Staff Platform Engineer",
            location_full: "Seattle, Washington, United States",
            location_country: "United States",
            connections_count: 300,
            follower_count: 800,
            company_name: "Tahoe",
            company_linkedin_url: "https://linkedin.com/company/tahoe",
            company_website: "https://tahoe.dev",
            company_industry: "Software",
            job_title: "Staff Platform Engineer",
            department: "Infrastructure",
            management_level: "Senior",
            company_location_hq_full_address: "San Francisco, California",
            company_location_hq_country: "United States",
            score: 39.2,
        },
    ],
    total_results: 128,
    current_page: 2,
    total_pages: 5,
    has_next: true,
    has_prev: true,
    query_hash: "hash-1",
    preview_total_results: 100,
    preview_cap: 100,
};

function setupApiMocks() {
    mockedApiRequest.mockImplementation(async (path, init) => {
        if (path === "/search/filter-metadata") {
            return metadataResponse;
        }
        if (path === "/search/parse") {
            return {
                search_session_id: "session-1",
                checkpoint_id: "session-1",
                parsed_intent: {},
                confidence: "medium",
                ambiguities: [],
                semantic_expansions: popupModelResponse.semantic_expansions,
                popup_model: popupModelResponse,
                cache_hit: null,
                langsmith_run_id: null,
            };
        }
        if (path === "/search/execute") {
            return executeResultsResponse;
        }
        if (path === "/search/preview-page?query_hash=hash-1&page=2") {
            return previewPageTwoResponse;
        }
        throw new Error(`Unhandled path: ${String(path)} ${JSON.stringify(init)}`);
    });
}

function getPopupInput(label: string): HTMLInputElement {
    const fieldLabel = screen.getByText(label);
    const fieldBlock = fieldLabel.closest("div");
    const input = fieldBlock?.querySelector("input");
    if (!(input instanceof HTMLInputElement)) {
        throw new Error(`Unable to find input for ${label}`);
    }
    return input;
}

function createDeferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

beforeEach(() => {
    mockedApiRequest.mockReset();
    mockedGetSearchSession.mockReset();
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
    currentSearchParams = new URLSearchParams();
    setViewportMode("desktop");
    window.sessionStorage.clear();
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: query === "(min-width: 769px)" ? desktopViewport : false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
    setupApiMocks();
});

test("desktop page keeps Filters visible and opens the Tahoe popup with backend-declared controls", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    expect(await screen.findByRole("button", { name: "Filters" })).toBeInTheDocument();
    expect(screen.queryByText("Min Followers")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filters" }));

    expect(await screen.findByLabelText("Search filters")).toBeInTheDocument();
    expect(await screen.findByText("Min Followers")).toBeInTheDocument();
    expect(screen.getByText("Min Connections")).toBeInTheDocument();
    expect(getPopupInput("Min Followers")).toHaveAttribute("placeholder", "");
    expect(getPopupInput("Ambiguities")).toHaveAttribute("placeholder", "");

    await user.click(screen.getByRole("button", { name: "Job" }));
    expect(screen.queryByRole("button", { name: "Software Developers" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Platform" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Individual Contributor" })).not.toBeInTheDocument();
    expect(getPopupInput("Current Titles")).toHaveAttribute("placeholder", "");
    expect(getPopupInput("Departments")).toHaveAttribute("placeholder", "");
    expect(getPopupInput("Management Levels")).toHaveAttribute("placeholder", "");

    await user.click(screen.getByRole("button", { name: "Company" }));
    expect(screen.getByText("B2B Company")).toBeInTheDocument();
    expect(screen.queryByText("Public Company")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "11-50 employees" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Languages" }));
    await user.click(screen.getByRole("button", { name: /Add language/i }));
    expect(screen.getByRole("textbox", { name: "Language 1" })).toHaveAttribute("placeholder", "");
    expect(screen.getByRole("textbox", { name: "Proficiency 1" })).toHaveAttribute("placeholder", "");
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Native or bilingual proficiency" })).toBeInTheDocument();
}, 10000);

test("desktop popup closes from Done and persists active filter count on the Filters button", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("button", { name: "Filters" }));
    await user.click(screen.getByRole("button", { name: "Job" }));
    await user.type(getPopupInput("Departments"), "Platform{enter}");

    await user.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() => {
        expect(screen.queryByLabelText("Search filters")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Filters (1)" })).toBeInTheDocument();
});

test("clicking Find candidates parses + runs in one shot and syncs session url", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.type(screen.getByPlaceholderText(/Senior ML engineers/i), "ml engineer");
    await user.click(screen.getByRole("button", { name: "Find candidates" }));

    // Auto-run: parse then execute fire back-to-back; results render directly.
    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
    await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/search/new?session=session-1");
    });
});

test("candidate side panel can save the active result to a list", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.type(screen.getByPlaceholderText(/Senior ML engineers/i), "backend engineer");
    await user.click(screen.getByRole("button", { name: "Find candidates" }));

    await screen.findByText("Casey Cho");
    const candidateRow = screen.getByRole("checkbox", { name: "Select Casey Cho" }).closest("tr");
    expect(candidateRow).not.toBeNull();
    await user.click(candidateRow as HTMLTableRowElement);
    await user.click(screen.getByRole("button", { name: "Save panel candidate" }));

    const dialog = await screen.findByRole("dialog", { name: "Save candidates dialog" });
    expect(dialog).toHaveTextContent("Casey Cho");
});

test("desktop popup can run a filter-only search and then show results", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("button", { name: "Filters" }));
    const dialog = await screen.findByLabelText("Search filters");
    await user.type(getPopupInput("Min Followers"), "300");
    await user.click(within(dialog).getByRole("button", { name: "Find candidates" }));

    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
    await waitFor(() => {
        expect(screen.queryByLabelText("Search filters")).not.toBeInTheDocument();
        expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/search/new?session=session-1");
    });

    const parseCall = mockedApiRequest.mock.calls.find(([path]) => path === "/search/parse");
    expect(parseCall).toBeDefined();
    expect(parseCall?.[1]?.body).toEqual(
        expect.objectContaining({
            search_prompt: expect.stringMatching(/\S/),
        }),
    );
});

test("desktop popup shows a loading overlay while popup-launched search is in progress", async () => {
    const executeDeferred = createDeferred<typeof executeResultsResponse>();
    mockedApiRequest.mockImplementation(async (path, init) => {
        if (path === "/search/filter-metadata") return metadataResponse;
        if (path === "/search/parse") {
            return {
                search_session_id: "session-1",
                checkpoint_id: "session-1",
                parsed_intent: {},
                confidence: "medium",
                ambiguities: [],
                semantic_expansions: popupModelResponse.semantic_expansions,
                popup_model: popupModelResponse,
                cache_hit: null,
                langsmith_run_id: null,
            };
        }
        if (path === "/search/execute") {
            return executeDeferred.promise;
        }
        throw new Error(`Unhandled path: ${String(path)} ${JSON.stringify(init)}`);
    });

    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("button", { name: "Filters" }));
    const dialog = await screen.findByLabelText("Search filters");
    await user.type(getPopupInput("Min Followers"), "300");
    await user.click(within(dialog).getByRole("button", { name: "Find candidates" }));

    expect(await screen.findByText("Searching candidates...")).toBeInTheDocument();
    expect(screen.getByText(/Applying your filters, validating the search, and fetching the first preview matches\./i)).toBeInTheDocument();
    expect(screen.getByLabelText("Search filters")).toBeInTheDocument();

    executeDeferred.resolve(executeResultsResponse);

    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
    await waitFor(() => {
        expect(screen.queryByLabelText("Search filters")).not.toBeInTheDocument();
    });
});

test("desktop popup keeps filters open when popup-launched search fails", async () => {
    mockedApiRequest.mockImplementation(async (path, init) => {
        if (path === "/search/filter-metadata") return metadataResponse;
        if (path === "/search/parse") {
            return {
                search_session_id: "session-1",
                checkpoint_id: "session-1",
                parsed_intent: {},
                confidence: "medium",
                ambiguities: [],
                semantic_expansions: popupModelResponse.semantic_expansions,
                popup_model: popupModelResponse,
                cache_hit: null,
                langsmith_run_id: null,
            };
        }
        if (path === "/search/execute") {
            throw new Error("Unable to run recruiter search.");
        }
        throw new Error(`Unhandled path: ${String(path)} ${JSON.stringify(init)}`);
    });

    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("button", { name: "Filters" }));
    const dialog = await screen.findByLabelText("Search filters");
    await user.type(getPopupInput("Min Followers"), "300");
    await user.click(within(dialog).getByRole("button", { name: "Find candidates" }));

    expect(await screen.findByText("Unable to run recruiter search.")).toBeInTheDocument();
    expect(screen.getByLabelText("Search filters")).toBeInTheDocument();
    await waitFor(() => {
        expect(screen.queryByText("Searching candidates...")).not.toBeInTheDocument();
    });
});

test("hydrates a parse-only session into the review modal and clears the session url", async () => {
    currentSearchParams = new URLSearchParams("session=resume-review");
    mockedGetSearchSession.mockResolvedValue({
        session_id: "resume-review",
        workspace_id: "workspace-1",
        owner_user_id: "user-1",
        prompt: "ml engineers in nyc",
        normalized_query_hash: null,
        mode: "langgraph",
        parsed_intent: {},
        structured_filters: {},
        popup_model: popupModelResponse,
        total_results: 0,
        total_pages: 0,
        preview_total_results: 0,
        last_page_loaded: 0,
        pages_loaded: {},
        created_at: null,
        last_accessed_at: null,
    });

    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    expect(await screen.findByLabelText("Search filters")).toBeInTheDocument();
    expect(await screen.findByText("Min Followers")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Job" }));
    expect(await screen.findByText("ML Engineer")).toBeInTheDocument();
    await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/search/new");
    });
});

test("hydrates a results session from the server without reopening the review modal", async () => {
    currentSearchParams = new URLSearchParams("session=resume-results");
    mockedGetSearchSession.mockResolvedValue({
        session_id: "resume-results",
        workspace_id: "workspace-1",
        owner_user_id: "user-1",
        prompt: "backend engineers",
        normalized_query_hash: "hash-1",
        mode: "langgraph",
        parsed_intent: {},
        structured_filters: {},
        popup_model: popupModelResponse,
        total_results: 128,
        total_pages: 5,
        preview_total_results: 100,
        last_page_loaded: 1,
        pages_loaded: { "1": {} },
        created_at: null,
        last_accessed_at: null,
        latest_page: {
            page: 1,
            results: executeResultsResponse.results,
            total_results: 128,
            total_pages: 5,
            preview_total_results: 100,
            query_hash: "hash-1",
        },
    });

    render(<LangGraphSearchPage />);

    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
    expect(screen.queryByLabelText("Search filters")).not.toBeInTheDocument();
});

test("Start new search clears explicit session results without rehydrating the old session", async () => {
    currentSearchParams = new URLSearchParams("session=resume-results");
    mockedGetSearchSession.mockResolvedValue({
        session_id: "resume-results",
        workspace_id: "workspace-1",
        owner_user_id: "user-1",
        prompt: "backend engineers",
        normalized_query_hash: "hash-1",
        mode: "langgraph",
        parsed_intent: {},
        structured_filters: {},
        popup_model: popupModelResponse,
        total_results: 128,
        total_pages: 5,
        preview_total_results: 100,
        last_page_loaded: 1,
        pages_loaded: { "1": {} },
        created_at: null,
        last_accessed_at: null,
        latest_page: {
            page: 1,
            results: executeResultsResponse.results,
            total_results: 128,
            total_pages: 5,
            preview_total_results: 100,
            query_hash: "hash-1",
        },
    });

    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start new search" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start new search" }));

    await waitFor(() => {
        expect(screen.queryByText("Casey Cho")).not.toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/Senior ML engineers/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
    expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/search/new");
    expect(mockedGetSearchSession).toHaveBeenCalledTimes(1);
});

test("Reset filters clears recruiter edits from the desktop popup", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await screen.findByRole("button", { name: "Filters" });
    await user.type(screen.getByPlaceholderText(/Senior ML engineers/i), "ml engineer");
    await user.click(screen.getByRole("button", { name: "Find candidates" }));
    await screen.findByText("Casey Cho");

    await user.click(screen.getByRole("button", { name: /Filters \(\d+\)/ }));
    await user.click(screen.getByRole("button", { name: "Job" }));
    expect(await screen.findByText("ML Engineer")).toBeInTheDocument();

    // Clear filters — button should become disabled afterward.
    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.queryByText("ML Engineer")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset filters" })).toBeDisabled();
});

test("invalid session urls are cleared and show a recruiter-readable error", async () => {
    currentSearchParams = new URLSearchParams("session=missing");
    mockedGetSearchSession.mockRejectedValue(new Error("Search session not found"));

    render(<LangGraphSearchPage />);

    expect(await screen.findByText(/This search session is no longer available/i)).toBeInTheDocument();
    await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/search/new");
    });
});

test("stale persisted search state is not restored on New Search page load", async () => {
    window.sessionStorage.setItem("langgraph_search_preview_state_v1", JSON.stringify({
        query: "old query",
        error: "body.search_prompt: String should have at least 1 character",
        viewState: "results",
        popupModel: popupModelResponse,
        pagesByNumber: { 1: executeResultsResponse.results },
        currentPage: 1,
        totalResults: executeResultsResponse.total_results,
        totalPages: executeResultsResponse.total_pages,
        previewTotalResults: executeResultsResponse.preview_total_results,
    }));

    render(<LangGraphSearchPage />);

    expect(await screen.findByRole("button", { name: "Filters" })).toBeInTheDocument();
    expect(screen.queryByText("body.search_prompt: String should have at least 1 character")).not.toBeInTheDocument();
    expect(screen.queryByText("Casey Cho")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Senior ML engineers/i)).toHaveValue("");
});

test("popup edits before Find candidates win over the parse response (popupDirty preserved)", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.type(screen.getByPlaceholderText(/Senior ML engineers/i), "ml engineer");
    await user.click(await screen.findByRole("button", { name: "Filters" }));
    await screen.findByText("Min Followers");

    // Edit the popup BEFORE running. These edits set popupDirty=true so they
    // survive the next /search/parse call and become the confirmed_intent.
    await user.click(screen.getByRole("button", { name: "Job" }));
    const departmentInput = getPopupInput("Departments");
    await user.type(departmentInput, "Platform{enter}");

    await user.click(screen.getByRole("button", { name: "Company" }));
    const companySizeInput = getPopupInput("Company Sizes");
    await user.type(companySizeInput, "startup{enter}");

    await user.click(screen.getByRole("button", { name: "General" }));
    const followersInput = getPopupInput("Min Followers");
    await user.type(followersInput, "500");

    await user.click(screen.getByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("button", { name: "Find candidates" }));

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith(
            "/search/execute",
            expect.objectContaining({ method: "POST" }),
        );
    });

    const executeCall = mockedApiRequest.mock.calls.find(([path]) => path === "/search/execute");
    expect(executeCall).toBeDefined();

    const payload = executeCall?.[1]?.body as { confirmed_intent: typeof popupModelResponse };
    expect(payload.confirmed_intent.job.departments).toEqual(["Platform"]);
    expect(payload.confirmed_intent.company.company_size_ranges).toEqual(["startup"]);
    expect(payload.confirmed_intent.general.min_followers).toBe(500);
});

test("mobile Filters button opens the existing bottom sheet filter surface", async () => {
    setViewportMode("mobile");
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("button", { name: "Filters" }));

    expect(await screen.findByLabelText("Search filters")).toBeInTheDocument();
    expect(await screen.findByText("Min Followers")).toBeInTheDocument();
});

test("renders the full preview grid and reuses cached page 1 when paging back", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.type(screen.getByPlaceholderText(/Senior ML engineers/i), "backend engineers");
    await user.click(screen.getByRole("button", { name: "Find candidates" }));

    expect(await screen.findByText("Professional Profile URL")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select all rows" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select Casey Cho" })).toBeInTheDocument();
    expect(screen.queryByText("ID")).not.toBeInTheDocument();
    expect(screen.getByText("Company HQ Country")).toBeInTheDocument();
    expect(screen.getByText("Casey Cho")).toBeInTheDocument();
    expect(screen.queryByText(/128 candidates found/)).not.toBeInTheDocument();
    const previewBanner = screen.getByText("Found 128 matches");
    expect(previewBanner).toBeInTheDocument();
    expect(screen.getAllByText("Found 128 matches")).toHaveLength(1);
    expect(screen.getByPlaceholderText(/Senior ML engineers/i).compareDocumentPosition(previewBanner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start new search" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Find candidates" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save search" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save 1 to list" })).not.toBeInTheDocument();

    const row = screen.getByText("Casey Cho").closest("tr");
    expect(row).not.toBeNull();
    const candidateCell = within(row as HTMLTableRowElement).getAllByRole("cell")[1];
    expect(within(candidateCell).queryByText("Senior Backend Engineer")).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Select Casey Cho" }));
    expect(screen.queryByRole("button", { name: "Save search" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save 1 to list" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith("/search/preview-page?query_hash=hash-1&page=2");
    });

    expect(await screen.findByText("Mina Park")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save 1 to list" })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Select Mina Park" }));
    expect(screen.getByRole("button", { name: "Save 2 to list" })).toBeInTheDocument();

    const previewPageCallsAfterPageTwo = mockedApiRequest.mock.calls.filter(
        ([path]) => path === "/search/preview-page?query_hash=hash-1&page=2"
    ).length;

    await user.click(screen.getByRole("button", { name: "1" }));

    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select Casey Cho" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Save 2 to list" })).toBeInTheDocument();
    const previewPageCallsAfterReturn = mockedApiRequest.mock.calls.filter(
        ([path]) => String(path).startsWith("/search/preview-page")
    ).length;

    expect(previewPageCallsAfterPageTwo).toBe(1);
    expect(previewPageCallsAfterReturn).toBe(1);
});

test("Start new search clears results, selection, storage, and session URL state", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.type(screen.getByPlaceholderText(/Senior ML engineers/i), "backend engineers");
    await user.click(screen.getByRole("button", { name: "Find candidates" }));

    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Select Casey Cho" }));
    expect(screen.getByRole("button", { name: "Save 1 to list" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start new search" }));

    expect(screen.queryByText("Casey Cho")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save 1 to list" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Senior ML engineers/i)).toHaveValue("");
    expect(window.sessionStorage.getItem("langgraph_search_preview_state_v1")).toBeNull();
    expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/search/new");
});

test("reopening the desktop popup preserves recruiter filter edits", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("button", { name: "Filters" }));
    await user.click(screen.getByRole("button", { name: "Job" }));
    await user.type(getPopupInput("Departments"), "Platform{enter}");
    await user.click(screen.getByRole("button", { name: "Done" }));

    await user.click(screen.getByRole("button", { name: "Filters (1)" }));
    expect(await screen.findByText("Platform")).toBeInTheDocument();
});
