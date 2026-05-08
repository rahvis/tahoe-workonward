import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import DslPage from "./page";

const fetchMock = vi.fn();

const responsePayload = {
    entries: [
        {
            _id: "1",
            created_at: "2026-03-13T12:00:00+00:00",
            search_prompt: "Senior backend engineers in San Francisco",
            dsl_query: {
                query: {
                    bool: {
                        filter: [{ term: { location_country: "United States" } }],
                    },
                },
            },
            status: "success",
            pipeline: "langgraph",
            query_hash: "hash-1",
            search_session_id: "session-1",
        },
    ],
    total: 1,
    page: 1,
    page_size: 10,
    total_pages: 1,
    has_next: false,
    has_prev: false,
};

beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
        ok: true,
        json: async () => responsePayload,
    });
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

test("loads the public DSL feed and pretty prints the generated query", async () => {
    render(<DslPage />);

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/dsl?page=1");
    expect(await screen.findByText("DSL Audit Feed")).toBeInTheDocument();
    expect(screen.getByText("Senior backend engineers in San Francisco")).toBeInTheDocument();
    expect(screen.getByText(/"location_country": "United States"/)).toBeInTheDocument();
    expect(screen.getByText("langgraph")).toBeInTheDocument();
});

test("applies a public status filter when selected", async () => {
    const user = userEvent.setup();
    render(<DslPage />);

    await screen.findByText("Senior backend engineers in San Francisco");
    await user.click(screen.getByRole("button", { name: "Errors" }));

    await waitFor(() => {
        expect(fetchMock).toHaveBeenLastCalledWith("http://localhost:8000/dsl?page=1&status=error");
    });
});
