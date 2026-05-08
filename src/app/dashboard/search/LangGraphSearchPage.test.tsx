import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { apiRequest } from "@/lib/api";
import LangGraphSearchPage from "./LangGraphSearchPage";

vi.mock("@/lib/api", () => ({
    apiRequest: vi.fn(),
}));

vi.mock("./CandidatePanel", () => ({
    __esModule: true,
    default: () => null,
}));

const mockedApiRequest = vi.mocked(apiRequest);

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
                { key: "job.management_levels", label: "Management Levels", control: "tags_with_suggestions", help_text: "", options: [], suggestions: ["Director", "Shift Lead"], allow_custom: true },
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

beforeEach(() => {
    mockedApiRequest.mockReset();
    setupApiMocks();
});

test("renders backend-declared controls and language proficiency options", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.type(screen.getByPlaceholderText(/Senior ML engineers/i), "ml engineer");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("Min Followers")).toBeInTheDocument();
    expect(screen.getByText("Min Connections")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Job" }));
    expect(screen.getByRole("button", { name: "Software Developers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Platform" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Company" }));
    expect(screen.getByText("B2B Company")).toBeInTheDocument();
    expect(screen.queryByText("Public Company")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "11-50 employees" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Languages" }));
    await user.click(screen.getByRole("button", { name: /Add language/i }));
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Native or bilingual proficiency" })).toBeInTheDocument();
});

test("preserves optional company background and custom open-taxonomy values in the execute payload", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.type(screen.getByPlaceholderText(/Senior ML engineers/i), "ml engineer");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await user.click(screen.getByRole("button", { name: "Job" }));
    const departmentInput = await screen.findByPlaceholderText("Add departments");
    await user.type(departmentInput, "Platform{enter}");

    await user.click(screen.getByRole("button", { name: "Company" }));
    const companySizeInput = await screen.findByPlaceholderText("Add company sizes");
    await user.type(companySizeInput, "startup{enter}");

    await user.click(screen.getByRole("button", { name: "General" }));
    const followersInput = await screen.findByPlaceholderText("Enter min followers");
    await user.type(followersInput, "500");
    await user.click(screen.getByRole("button", { name: "Run Search" }));

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith(
            "/search/execute",
            expect.objectContaining({ method: "POST" }),
        );
    });

    const executeCall = mockedApiRequest.mock.calls.find(([path]) => path === "/search/execute");
    expect(executeCall).toBeDefined();

    const payload = executeCall?.[1]?.body as { confirmed_intent: typeof popupModelResponse };
    expect(payload.confirmed_intent.company.optional_company_names).toEqual(["Google", "Meta"]);
    expect(payload.confirmed_intent.company.optional_company_size_ranges).toEqual(["11-50 employees"]);
    expect(payload.confirmed_intent.job.departments).toEqual(["Platform"]);
    expect(payload.confirmed_intent.company.company_size_ranges).toEqual(["startup"]);
    expect(payload.confirmed_intent.general.min_followers).toBe(500);
});

test("renders the full preview grid and reuses cached page 1 when paging back", async () => {
    const user = userEvent.setup();
    render(<LangGraphSearchPage />);

    await user.type(screen.getByPlaceholderText(/Senior ML engineers/i), "backend engineers");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await user.click(await screen.findByRole("button", { name: "Run Search" }));

    expect(await screen.findByText("Professional Profile URL")).toBeInTheDocument();
    expect(screen.getByText("Company HQ Country")).toBeInTheDocument();
    expect(screen.getByText("Casey Cho")).toBeInTheDocument();
    expect(screen.queryByText(/128 candidates found/)).not.toBeInTheDocument();
    expect(screen.getByText(/preview limited to the top 100 across 5 pages/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith("/search/preview-page?query_hash=hash-1&page=2");
    });

    expect(await screen.findByText("Mina Park")).toBeInTheDocument();

    const previewPageCallsAfterPageTwo = mockedApiRequest.mock.calls.filter(
        ([path]) => path === "/search/preview-page?query_hash=hash-1&page=2"
    ).length;

    await user.click(screen.getByRole("button", { name: "1" }));

    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
    const previewPageCallsAfterReturn = mockedApiRequest.mock.calls.filter(
        ([path]) => String(path).startsWith("/search/preview-page")
    ).length;

    expect(previewPageCallsAfterPageTwo).toBe(1);
    expect(previewPageCallsAfterReturn).toBe(1);
});
