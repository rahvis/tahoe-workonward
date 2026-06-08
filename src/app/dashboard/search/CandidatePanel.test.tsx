import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import CandidatePanel, { MISSING_PREVIEW_EVIDENCE, type PreviewData } from "./CandidatePanel";

const preview: PreviewData = {
    id: 101,
    full_name: "Casey Cho",
    headline: "Senior Backend Engineer",
    job_title: "Senior Backend Engineer",
    company_name: "Tahoe",
    location_full: "San Francisco, California, United States",
    location_country: "United States",
    management_level: "Senior",
    company_industry: "Software",
    websites_linkedin: "https://linkedin.com/in/casey-cho",
    connections_count: 500,
    follower_count: 1200,
    company_linkedin_url: "https://linkedin.com/company/tahoe",
    company_website: "https://tahoe.dev",
    department: "Platform",
    company_location_hq_full_address: "San Francisco, California",
    company_location_hq_country: "United States",
    score: 42.7,
};

test("renders candidate match rationales from preview evidence", () => {
    render(
        <CandidatePanel
            preview={preview}
            onClose={vi.fn()}
            matchRationales={[
                {
                    title: "Current title matched",
                    criterion: "Title: Senior Backend Engineer",
                    evidence: "Current title: Senior Backend Engineer",
                    confidence: "high",
                },
            ]}
        />,
    );

    expect(screen.getByText("Why this matched")).toBeInTheDocument();
    expect(screen.getByText("Current title matched")).toBeInTheDocument();
    expect(screen.getByText("Current title: Senior Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Title: Senior Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
});

test("renders missing preview data copy for unsupported criteria", () => {
    render(
        <CandidatePanel
            preview={preview}
            onClose={vi.fn()}
            matchRationales={[
                {
                    title: "Experience evidence unavailable",
                    criterion: "Experience: 5+ years",
                    evidence: MISSING_PREVIEW_EVIDENCE,
                    confidence: "low",
                },
            ]}
        />,
    );

    expect(screen.getByText("Experience evidence unavailable")).toBeInTheDocument();
    expect(screen.getByText("Experience: 5+ years")).toBeInTheDocument();
    expect(screen.getByText(MISSING_PREVIEW_EVIDENCE)).toBeInTheDocument();
});

test("keeps save-to-list payload unchanged", async () => {
    const user = userEvent.setup();
    const onSaveToList = vi.fn();
    render(
        <CandidatePanel
            preview={preview}
            onClose={vi.fn()}
            onSaveToList={onSaveToList}
            matchRationales={[
                {
                    title: "Location matched",
                    criterion: "Location: San Francisco",
                    evidence: "Location: San Francisco, California, United States",
                    confidence: "high",
                },
            ]}
        />,
    );

    await user.click(screen.getByRole("button", { name: "Save to List" }));

    expect(onSaveToList).toHaveBeenCalledWith(101);
});
