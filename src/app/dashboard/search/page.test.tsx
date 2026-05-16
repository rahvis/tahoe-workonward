import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { apiRequest } from "@/lib/api";
import { LegacySearchPage } from "./page";
import type { SearchPageBootstrapPayload } from "@/lib/search-page-bootstrap";

vi.mock("@/lib/api", () => ({
    apiRequest: vi.fn(),
}));

vi.mock("./CandidatePanel", () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock("../_components/SaveSearchDialog", () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock("../_components/SaveToListDialog", () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

beforeEach(() => {
    mockedApiRequest.mockReset();
    window.sessionStorage.clear();
});

test("legacy rerun bootstrap auto-runs search using the supplied search session id", async () => {
    const bootstrap: SearchPageBootstrapPayload = {
        mode: "legacy",
        searchSessionId: "legacy-session-1",
        prompt: "backend engineers",
        structuredFilters: { job_titles: ["Backend Engineer"] },
        parsedIntent: {},
        popupModel: null,
        createdAtMs: Date.now(),
    };

    mockedApiRequest.mockResolvedValue({
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
                ui_page: 1,
            },
        ],
        total_results: 1,
        total_pages: 1,
        current_page: 1,
        ui_page: 1,
        has_next: false,
        has_prev: false,
        query_hash: "legacy-hash-1",
        search_session_id: "legacy-session-1",
    });

    render(<LegacySearchPage bootstrap={bootstrap} />);

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith(
            "/search/execute",
            expect.objectContaining({
                method: "POST",
                body: expect.objectContaining({
                    search_prompt: "backend engineers",
                    search_session_id: "legacy-session-1",
                    filters: expect.objectContaining({
                        job_titles: ["Backend Engineer"],
                    }),
                }),
            }),
        );
    });

    expect(await screen.findByText("Casey Cho")).toBeInTheDocument();
});
