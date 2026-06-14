import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import UpgradePaywallModal from "./UpgradePaywallModal";
import { fetchBillingCatalog } from "@/lib/organization";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/organization", () => ({
    fetchBillingCatalog: vi.fn(),
}));

const mockedCatalog = vi.mocked(fetchBillingCatalog);

beforeEach(() => {
    pushMock.mockReset();
    mockedCatalog.mockReset();
    mockedCatalog.mockResolvedValue({
        plans: [
            {
                key: "starter", name: "Starter", monthly_price_usd: 60, yearly_price_usd: 576,
                monthly_credits: 500, limits: { mailboxes: 1, active_campaigns: 2 },
                stripe_product_lookup_key: "", stripe_monthly_price_lookup_key: "", stripe_yearly_price_lookup_key: "",
            },
            {
                key: "enterprise", name: "Enterprise", monthly_price_usd: 0, yearly_price_usd: 0,
                monthly_credits: 0, limits: { mailboxes: 0, active_campaigns: 0 },
                stripe_product_lookup_key: "", stripe_monthly_price_lookup_key: "", stripe_yearly_price_lookup_key: "",
            },
        ],
        topups: [], rate_card: {}, low_credit_thresholds: [], automatic_tax_enabled: false, portal_enabled: false,
    });
});

test("shows the subscribe paywall with self-serve plan tiers and routes to billing", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UpgradePaywallModal open reason="subscription_required" onClose={onClose} />);

    expect(screen.getByText("Upgrade to keep searching")).toBeInTheDocument();
    expect(await screen.findByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("500 credits / month")).toBeInTheDocument();
    // Enterprise ($0/custom) is filtered out of the self-serve grid.
    expect(screen.queryByText("Enterprise")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /view plans & subscribe/i }));
    expect(pushMock).toHaveBeenCalledWith("/dashboard/billing/plan");
});

test("shows the top-up copy for a subscribed recruiter out of credits", async () => {
    render(<UpgradePaywallModal open reason="insufficient_credits" onClose={vi.fn()} />);
    expect(screen.getByText("You're out of credits")).toBeInTheDocument();
});

test("Maybe later closes the modal", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UpgradePaywallModal open reason="subscription_required" onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /maybe later/i }));
    expect(onClose).toHaveBeenCalled();
});
