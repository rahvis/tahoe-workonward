import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import UpgradePaywallModal from "./UpgradePaywallModal";
import { fetchBillingCatalog, createSubscriptionCheckout } from "@/lib/organization";

vi.mock("@/lib/organization", () => ({
    fetchBillingCatalog: vi.fn(),
    createSubscriptionCheckout: vi.fn(),
    createTopUpCheckout: vi.fn(),
}));

const mockedCatalog = vi.mocked(fetchBillingCatalog);
const mockedSubscribe = vi.mocked(createSubscriptionCheckout);

function plan(key: string, name: string, monthly: number, yearly: number, credits: number, seats: number) {
    return {
        key, name, monthly_price_usd: monthly, yearly_price_usd: yearly, monthly_credits: credits,
        limits: { seats, mailboxes: seats, active_campaigns: 2 },
        stripe_product_lookup_key: "", stripe_monthly_price_lookup_key: "", stripe_yearly_price_lookup_key: "",
    };
}

beforeEach(() => {
    mockedCatalog.mockReset();
    mockedSubscribe.mockReset();
    mockedSubscribe.mockResolvedValue({ url: "https://checkout.stripe.test/s" });
    mockedCatalog.mockResolvedValue({
        plans: [
            plan("starter", "Starter", 49, 468, 400, 1),
            plan("growth", "Growth", 129, 1236, 1200, 3),
            plan("enterprise", "Enterprise", 0, 0, 0, 0),
        ],
        topups: [], rate_card: {}, low_credit_thresholds: [], automatic_tax_enabled: false, portal_enabled: false,
    });
});

test("shows self-serve plan tiers with breakdown and starts Stripe checkout", async () => {
    const user = userEvent.setup();
    render(<UpgradePaywallModal open reason="subscription_required" onClose={vi.fn()} />);

    expect(screen.getByText("Choose a plan to keep going")).toBeInTheDocument();
    expect(await screen.findByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("400 credits / month")).toBeInTheDocument();
    // Enterprise ($0/custom) is filtered out of the self-serve grid.
    expect(screen.queryByText("Enterprise")).not.toBeInTheDocument();

    const upgradeButtons = await screen.findAllByRole("button", { name: /upgrade now/i });
    await user.click(upgradeButtons[0]);
    expect(mockedSubscribe).toHaveBeenCalledWith(expect.objectContaining({ plan_key: "starter", interval: "year" }));
});

test("shows the top-up view for a subscribed recruiter out of credits", async () => {
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
