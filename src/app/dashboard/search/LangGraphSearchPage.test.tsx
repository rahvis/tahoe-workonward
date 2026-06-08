import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { answerSearchIntake, apiRequest, getSearchSession, startSearchIntake } from "@/lib/api";
import LangGraphSearchPage from "./LangGraphSearchPage";

const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();
let currentSearchParams = new URLSearchParams();
let desktopViewport = true;

vi.mock("@/lib/api", () => ({
    answerSearchIntake: vi.fn(),
    apiRequest: vi.fn(),
    getSearchSession: vi.fn(),
    startSearchIntake: vi.fn(),
}));

vi.mock("./CandidatePanel", () => ({
    __esModule: true,
    MISSING_PREVIEW_EVIDENCE: "Not enough preview data for this criterion",
    default: (props: {
        preview: { id: number; full_name: string | null };
        matchRationales?: Array<{ title: string; evidence: string; criterion: string }>;
        onSaveToList?: (id: number) => void;
    }) => (
        <aside aria-label="Candidate panel">
            <h2>{props.preview.full_name}</h2>
            {props.matchRationales?.length ? (
                <section>
                    <h3>Why this matched</h3>
                    {props.matchRationales.map((item) => (
                        <article key={`${item.title}-${item.criterion}`}>
                            <h4>{item.title}</h4>
                            <p>{item.evidence}</p>
                            <span>{item.criterion}</span>
                        </article>
                    ))}
                </section>
            ) : null}
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
const mockedStartSearchIntake = vi.mocked(startSearchIntake);
const mockedAnswerSearchIntake = vi.mocked(answerSearchIntake);

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

const intakePopupModelResponse = {
    ...popupModelResponse,
    job: {
        ...popupModelResponse.job,
        current_title_keywords: ["Senior Backend Engineer"],
    },
    keywords: {
        ...popupModelResponse.keywords,
        skills: ["Go"],
    },
};

const intakeAnsweredPopupModelResponse = {
    ...intakePopupModelResponse,
    locations: {
        countries: [],
        states: ["California"],
        cities: ["San Francisco", "San Jose", "Oakland"],
    },
};

const intakeQuestion = {
    id: "location_scope",
    slot: "location",
    question: "What geography should this search target?",
    type: "single_choice" as const,
    options: [
        { label: "United States", value: { locations: { countries: ["United States"] } } },
        { label: "Bay Area", value: { locations: { states: ["California"], cities: ["San Francisco", "San Jose", "Oakland"] } } },
        { label: "No location filter", value: { locations: { countries: [], states: [], cities: [] } } },
    ],
    default_option_index: 0,
    required_for_search: false,
};

const intakeStartResponse = {
    search_session_id: "intake-session-1",
    status: "needs_clarification" as const,
    popup_model: intakePopupModelResponse,
    parsed_intent: {},
    requirements_summary: {
        title: "Senior Backend Engineer",
        must_have: ["Go", "distributed systems"],
        nice_to_have: ["Kafka"],
        location: [],
        company_context: [],
        experience: "senior level",
        assumptions: [],
    },
    questions: [intakeQuestion],
    missing_slots: ["location"],
    confidence: "medium" as const,
    readiness_score: 68,
    reasoning_summary: "Tahoe mapped the JD to a senior backend search and needs geography before execution.",
    reasoning_items: [
        {
            id: "reason_skill_go",
            type: "filter_mapping" as const,
            title: "Go is a hard skill",
            plain_language_explanation: "The JD names Go as part of the backend services work.",
            source: "job_description" as const,
            source_excerpt_or_reference: "distributed services in Go",
            affected_filter_path: "keywords.skills",
            coresignal_fields: ["inferred_skills"],
            confidence: "high" as const,
            visible_to_recruiter: true,
        },
        {
            id: "reason_remote_assumption",
            type: "assumption" as const,
            title: "Remote is not a hard location",
            plain_language_explanation: "Remote language was kept as an assumption until the recruiter confirms geography.",
            source: "deterministic_default" as const,
            source_excerpt_or_reference: "remote ambiguity rule",
            affected_filter_path: "locations",
            coresignal_fields: ["location_country", "location_full"],
            confidence: "medium" as const,
            visible_to_recruiter: true,
        },
        {
            id: "reason_collaboration_not_used",
            type: "non_queryable_criterion" as const,
            title: "Collaborative culture was not used",
            plain_language_explanation: "Culture statements do not have a safe Coresignal filter.",
            source: "schema_rule" as const,
            source_excerpt_or_reference: "collaborative culture",
            affected_filter_path: null,
            coresignal_fields: [],
            confidence: "high" as const,
            visible_to_recruiter: true,
        },
    ],
    assistant_messages: [],
};

const intakeAnswerResponse = {
    ...intakeStartResponse,
    status: "ready_for_review" as const,
    popup_model: intakeAnsweredPopupModelResponse,
    requirements_summary: {
        ...intakeStartResponse.requirements_summary,
        location: ["Bay Area"],
    },
    questions: [],
    missing_slots: [],
    confidence: "high" as const,
    readiness_score: 84,
    reasoning_summary: "The recruiter chose Bay Area, so Tahoe added California and Bay Area city filters.",
    reasoning_items: [
        {
            id: "reason_answer_location_bay_area",
            type: "answer_update" as const,
            title: "Bay Area answer applied",
            plain_language_explanation: "Tahoe converted the geography into editable California and Bay Area city filters.",
            source: "recruiter_answer" as const,
            source_excerpt_or_reference: "Bay Area",
            affected_filter_path: "locations",
            coresignal_fields: ["location_state", "location_full"],
            confidence: "high" as const,
            visible_to_recruiter: true,
        },
    ],
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
    mockedStartSearchIntake.mockReset();
    mockedAnswerSearchIntake.mockReset();
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
    mockedStartSearchIntake.mockResolvedValue(intakeStartResponse);
    mockedAnswerSearchIntake.mockResolvedValue(intakeAnswerResponse);
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
    await user.click(screen.getAllByRole("button", { name: "Find candidates" })[0]);

    // Auto-run: parse then execute fire back-to-back; results render directly.
    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
    expect(mockedStartSearchIntake).not.toHaveBeenCalled();
    await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/search/new?session=session-1");
    });
});

test("source tabs switch visible inputs without changing prompt mode behavior", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    expect(await screen.findByRole("tab", { name: "Prompt" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Search prompt")).toBeInTheDocument();
    expect(screen.queryByLabelText("Job description")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Job description" }));
    expect(screen.getByRole("tab", { name: "Job description" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Role title")).toBeInTheDocument();
    expect(screen.getByLabelText("Job description")).toBeInTheDocument();
    expect(screen.queryByLabelText("Search prompt")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Prompt + JD" }));
    expect(screen.getByRole("tab", { name: "Prompt + JD" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Search prompt")).toBeInTheDocument();
    expect(screen.getByLabelText("Job description")).toBeInTheDocument();
});

test("source mode changes clear generated intake and result state before a new run", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("tab", { name: "Job description" }));
    await user.type(screen.getByLabelText("Job description"), "Senior Backend Engineer for Go services.");
    await user.click(screen.getAllByRole("button", { name: "Generate search plan" })[0]);
    await user.click(await screen.findByRole("button", { name: "Bay Area" }));
    await user.click(screen.getAllByRole("button", { name: "Find candidates" })[0]);

    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
    expect(mockedApiRequest.mock.calls.filter(([path]) => path === "/search/parse")).toHaveLength(0);

    await user.click(screen.getByRole("tab", { name: "Prompt" }));

    expect(screen.queryByText("Casey Cho")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Search prompt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search prompt"), "ml engineer");
    await user.click(screen.getByRole("button", { name: "Find candidates" }));

    await waitFor(() => {
        expect(mockedApiRequest.mock.calls.filter(([path]) => path === "/search/parse")).toHaveLength(1);
    });
});

test("JD bootstrap tolerates legacy empty requirements summary", async () => {
    render(
        <LangGraphSearchPage
            bootstrap={{
                mode: "langgraph",
                searchSessionId: "saved-jd-session",
                prompt: "",
                structuredFilters: {},
                parsedIntent: {},
                popupModel: intakePopupModelResponse,
                sourceType: "job_description",
                jobDescription: "Senior Backend Engineer for Go services.",
                roleTitle: "",
                requirementsSummary: {} as never,
                reasoningSummary: null,
                createdAtMs: Date.now(),
            }}
        />,
    );

    const assistant = await screen.findByLabelText("AI Search Assistant");
    expect(within(assistant).getByText("Must-have")).toBeInTheDocument();
    expect(within(assistant).getAllByText("Not set").length).toBeGreaterThan(0);
});

test("JD mode disables Generate search plan until a JD exists", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("tab", { name: "Job description" }));
    screen.getAllByRole("button", { name: "Generate search plan" }).forEach((button) => {
        expect(button).toBeDisabled();
    });

    await user.type(screen.getByLabelText("Job description"), "We need a Senior Backend Engineer using Go.");
    screen.getAllByRole("button", { name: "Generate search plan" }).forEach((button) => {
        expect(button).toBeEnabled();
    });
});

test("Generate search plan starts intake and does not execute search", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("tab", { name: "Job description" }));
    await user.type(screen.getByLabelText("Role title"), "Senior Backend Engineer");
    await user.type(screen.getByLabelText("Job description"), "We need a Senior Backend Engineer using Go and Kafka.");
    await user.click(screen.getAllByRole("button", { name: "Generate search plan" })[0]);

    expect(await screen.findByText("What geography should this search target?")).toBeInTheDocument();
    expect(mockedStartSearchIntake).toHaveBeenCalledWith({
        source_type: "job_description",
        search_prompt: null,
        job_description: "We need a Senior Backend Engineer using Go and Kafka.",
        role_title: "Senior Backend Engineer",
    });
    expect(mockedApiRequest.mock.calls.some(([path]) => path === "/search/execute")).toBe(false);
    await user.click(screen.getByRole("tab", { name: "Reasoning" }));
    expect(screen.getByText(/Tahoe mapped the JD to a senior backend search/i)).toBeInTheDocument();
    expect(screen.getByText("Go is a hard skill")).toBeInTheDocument();
});

test("answering an intake question updates filters and uses confirmed popup model for JD execute", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("tab", { name: "Job description" }));
    await user.type(screen.getByLabelText("Job description"), "Senior Backend Engineer for Go services.");
    await user.click(screen.getAllByRole("button", { name: "Generate search plan" })[0]);
    await user.click(await screen.findByRole("button", { name: "Bay Area" }));

    await waitFor(() => {
        expect(mockedAnswerSearchIntake).toHaveBeenCalledWith("intake-session-1", {
            question_id: "location_scope",
            answer: intakeQuestion.options[1],
        });
    });
    expect(await screen.findByText("Bay Area")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Reasoning" }));
    expect((await screen.findAllByText(/Bay Area city filters/i)).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: "Find candidates" })[0]);

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith(
            "/search/execute",
            expect.objectContaining({ method: "POST" }),
        );
    });

    const parseCalls = mockedApiRequest.mock.calls.filter(([path]) => path === "/search/parse");
    expect(parseCalls).toHaveLength(0);

    const executeCall = mockedApiRequest.mock.calls.find(([path]) => path === "/search/execute");
    const payload = executeCall?.[1]?.body as { confirmed_intent: typeof intakeAnsweredPopupModelResponse };
    expect(payload).toEqual(
        expect.objectContaining({
            search_session_id: "intake-session-1",
            checkpoint_id: "intake-session-1",
        }),
    );
    expect(payload.confirmed_intent.locations.states).toEqual(["California"]);
    expect(payload.confirmed_intent.locations.cities).toEqual(["San Francisco", "San Jose", "Oakland"]);
});

test("assistant drawer renders questions and grouped reasoning tabs", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("tab", { name: "Job description" }));
    await user.type(screen.getByLabelText("Job description"), "Senior Backend Engineer for Go services.");
    await user.click(screen.getAllByRole("button", { name: "Generate search plan" })[0]);

    const assistant = await screen.findByLabelText("AI Search Assistant");
    expect(within(assistant).getByText("What geography should this search target?")).toBeInTheDocument();
    expect(within(assistant).getByRole("tab", { name: "Questions" })).toHaveAttribute("aria-selected", "true");

    await user.click(within(assistant).getByRole("tab", { name: "Reasoning" }));
    expect(within(assistant).getByText("Why Tahoe chose this")).toBeInTheDocument();
    expect(within(assistant).getByText("Go is a hard skill")).toBeInTheDocument();

    await user.click(within(assistant).getByRole("button", { name: "Mapped filters" }));
    expect(within(assistant).getByText("inferred_skills")).toBeInTheDocument();

    await user.click(within(assistant).getByRole("button", { name: "Assumptions" }));
    expect(within(assistant).getByText("Remote is not a hard location")).toBeInTheDocument();

    await user.click(within(assistant).getByRole("button", { name: "Not used" }));
    expect(within(assistant).getByText("Collaborative culture was not used")).toBeInTheDocument();
});

test("assistant drawer Use defaults applies the default question option", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("tab", { name: "Job description" }));
    await user.type(screen.getByLabelText("Job description"), "Senior Backend Engineer for Go services.");
    await user.click(screen.getAllByRole("button", { name: "Generate search plan" })[0]);

    const assistant = await screen.findByLabelText("AI Search Assistant");
    await user.click(within(assistant).getByRole("button", { name: "Use defaults" }));

    await waitFor(() => {
        expect(mockedAnswerSearchIntake).toHaveBeenCalledWith("intake-session-1", {
            question_id: "location_scope",
            answer: intakeQuestion.options[0],
        });
    });
});

test("assistant drawer Skip records a skipped question", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("tab", { name: "Job description" }));
    await user.type(screen.getByLabelText("Job description"), "Senior Backend Engineer for Go services.");
    await user.click(screen.getAllByRole("button", { name: "Generate search plan" })[0]);

    const assistant = await screen.findByLabelText("AI Search Assistant");
    await user.click(within(assistant).getByRole("button", { name: "Skip" }));

    await waitFor(() => {
        expect(mockedAnswerSearchIntake).toHaveBeenCalledWith("intake-session-1", {
            question_id: "location_scope",
            answer: { label: "Skip", skip: true },
        });
    });
});

test("assistant Open filters action opens the existing filter modal", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("tab", { name: "Job description" }));
    await user.type(screen.getByLabelText("Job description"), "Senior Backend Engineer for Go services.");
    await user.click(screen.getAllByRole("button", { name: "Generate search plan" })[0]);

    const assistant = await screen.findByLabelText("AI Search Assistant");
    await user.click(within(assistant).getByRole("button", { name: "Open filters" }));

    expect(await screen.findByLabelText("Search filters")).toBeInTheDocument();
});

test("mobile JD mode opens the assistant as a bottom sheet", async () => {
    setViewportMode("mobile");
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("tab", { name: "Job description" }));

    expect(await screen.findByRole("dialog", { name: "AI Search Assistant" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close AI assistant" })).toBeInTheDocument();
});

test("candidate panel replaces the assistant after JD results", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.click(await screen.findByRole("tab", { name: "Job description" }));
    await user.type(screen.getByLabelText("Job description"), "Senior Backend Engineer for Go services.");
    await user.click(screen.getAllByRole("button", { name: "Generate search plan" })[0]);
    await user.click(await screen.findByRole("button", { name: "Bay Area" }));
    await user.click(screen.getAllByRole("button", { name: "Find candidates" })[0]);

    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
    expect(screen.queryByLabelText("AI Search Assistant")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();

    const candidateRow = screen.getByRole("checkbox", { name: "Select Casey Cho" }).closest("tr");
    expect(candidateRow).not.toBeNull();
    await user.click(candidateRow as HTMLTableRowElement);

    expect(await screen.findByLabelText("Candidate panel")).toBeInTheDocument();
    expect(screen.queryByLabelText("AI Search Assistant")).not.toBeInTheDocument();
    expect(screen.getByText("Why this matched")).toBeInTheDocument();
    expect(screen.getByText("Current title matched")).toBeInTheDocument();
    expect(screen.getByText("Location matched")).toBeInTheDocument();
    expect(screen.getAllByText("Not enough preview data for this criterion").length).toBeGreaterThan(0);
    expect(mockedApiRequest.mock.calls.some(([path]) => String(path).toLowerCase().includes("collect"))).toBe(false);
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

test("hydrates an intake session with JD context and reasoning", async () => {
    currentSearchParams = new URLSearchParams("session=resume-intake");
    mockedGetSearchSession.mockResolvedValue({
        session_id: "resume-intake",
        workspace_id: "workspace-1",
        owner_user_id: "user-1",
        prompt: "focus infrastructure",
        normalized_query_hash: null,
        mode: "langgraph",
        parsed_intent: {},
        structured_filters: {},
        popup_model: intakePopupModelResponse,
        total_results: 0,
        total_pages: 0,
        preview_total_results: 0,
        last_page_loaded: 0,
        pages_loaded: {},
        created_at: null,
        last_accessed_at: null,
        source_type: "job_description",
        job_description: "Senior Backend Engineer JD",
        role_title: "Senior Backend Engineer",
        intake_status: "needs_clarification",
        requirements_summary: intakeStartResponse.requirements_summary,
        assistant_messages: [],
        clarification_questions: [intakeQuestion],
        answered_questions: {},
        missing_slots: ["location"],
        readiness_score: 68,
        reasoning_summary: intakeStartResponse.reasoning_summary,
        reasoning_items: intakeStartResponse.reasoning_items,
        input_context_hash: "hash-intake",
    });

    render(<LangGraphSearchPage />);

    expect(await screen.findByRole("tab", { name: "Job description" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Job description")).toHaveValue("Senior Backend Engineer JD");
    expect(screen.getByLabelText("Role title")).toHaveValue("Senior Backend Engineer");
    expect(screen.getByText("What geography should this search target?")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("tab", { name: "Reasoning" }));
    expect(screen.getByText(/Tahoe mapped the JD to a senior backend search/i)).toBeInTheDocument();
    expect(await screen.findByLabelText("Search filters")).toBeInTheDocument();
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
