"use client";

import { useEffect, useState } from "react";

import { Box, Button, Dialog, Flex, Spinner, Switch, Text } from "@/components/ui/tahoe-ui";
import { createSubscriptionCheckout, fetchBillingCatalog, type BillingPlan } from "@/lib/organization";
import { TopUpPacks } from "@/app/dashboard/_components/TopUpModal";

import styles from "./upgrade-paywall.module.css";

export type PaywallReason = "subscription_required" | "insufficient_credits";

interface UpgradePaywallModalProps {
    open: boolean;
    reason: PaywallReason;
    onClose: () => void;
}

// Short, accurate per-plan highlights (the data-driven credits/seats/mailboxes/campaigns
// come straight from the plan record; these add the qualitative perks). No "unlimited
// search" — search costs credits.
const PLAN_HIGHLIGHTS: Record<string, string[]> = {
    starter: ["Email outreach + AI templates"],
    growth: ["Team collaboration", "Priority support (email & chat)"],
    pro: ["Usage analytics", "Priority support (email, chat & Slack)"],
};

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className={styles.check}>
            <path d="M13.5 4.5 6.5 11.5 3 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function redirectToCheckout(url: string) {
    if (process.env.NODE_ENV === "test" || typeof window === "undefined") return;
    window.location.assign(url);
}

/**
 * In-app pricing modal. Opens when a trial recruiter exhausts their free search or
 * tries to enrich (`subscription_required`), or when a subscribed recruiter runs out
 * of credits (`insufficient_credits` → top-up packs). Upgrade buttons go straight to
 * Stripe Checkout. Self-serve plans only — no Enterprise / "Contact us".
 */
export default function UpgradePaywallModal({ open, reason, onClose }: UpgradePaywallModalProps) {
    const [plans, setPlans] = useState<BillingPlan[] | null>(null);
    const [annual, setAnnual] = useState(true);
    const [busyPlan, setBusyPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const showTopUps = reason === "insufficient_credits";

    useEffect(() => {
        if (!open || showTopUps || plans) return;
        let cancelled = false;
        fetchBillingCatalog()
            .then((catalog) => {
                if (cancelled) return;
                setPlans(catalog.plans.filter((plan) => plan.key !== "enterprise"));
            })
            .catch(() => { if (!cancelled) setPlans([]); });
        return () => { cancelled = true; };
    }, [open, showTopUps, plans]);

    async function subscribe(planKey: BillingPlan["key"]) {
        setBusyPlan(planKey);
        setError(null);
        try {
            const res = await createSubscriptionCheckout({
                plan_key: planKey,
                interval: annual ? "year" : "month",
                success_path: "/dashboard/search/new",
                cancel_path: "/dashboard/search/new",
            });
            redirectToCheckout(res.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to start checkout.");
            setBusyPlan(null);
        }
    }

    const title = showTopUps ? "You're out of credits" : "Choose a plan to keep going";
    const body = showTopUps
        ? "Top up your credit wallet instantly to keep searching and revealing contacts."
        : "You've used your free search. Pick a plan to search, reveal contacts, and run outreach — all from one credit wallet.";

    return (
        <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
            <Dialog.Content maxWidth={showTopUps ? "640px" : "860px"} className={styles.paywallContent} aria-label="Upgrade to continue">
                <Box className={styles.paywallHeader}>
                    <Flex justify="between" align="start" gap="3" wrap="wrap">
                        <div>
                            <Dialog.Title className={styles.paywallTitle}>{title}</Dialog.Title>
                            <Dialog.Description className={styles.paywallDescription}>{body}</Dialog.Description>
                        </div>
                        {!showTopUps ? (
                            <label className={styles.billingToggle}>
                                <span className={!annual ? styles.toggleActive : styles.toggleMuted}>Monthly</span>
                                <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Toggle annual billing" />
                                <span className={annual ? styles.toggleActive : styles.toggleMuted}>Annual</span>
                                <span className={styles.savePill}>Save 20%</span>
                            </label>
                        ) : null}
                    </Flex>
                </Box>

                {showTopUps ? (
                    <Box className={styles.topupBody}>
                        <TopUpPacks returnPath="/dashboard/search/new" />
                    </Box>
                ) : (
                    <Box className={styles.planGrid} aria-label="Subscription plans">
                        {plans === null ? (
                            <Flex align="center" justify="center" className={styles.planLoading}><Spinner /></Flex>
                        ) : plans.length === 0 ? (
                            <Text size="2" color="gray">Plan details are unavailable right now.</Text>
                        ) : (
                            plans.map((plan) => {
                                const popular = plan.key === "growth";
                                const perMonth = annual ? Math.round(plan.yearly_price_usd / 12) : plan.monthly_price_usd;
                                const seats = plan.limits.seats ?? 1;
                                const features = [
                                    `${plan.monthly_credits.toLocaleString()} credits / month`,
                                    `${seats} seat${seats === 1 ? "" : "s"}`,
                                    `${plan.limits.mailboxes} mailbox${plan.limits.mailboxes === 1 ? "" : "es"}`,
                                    `${plan.limits.active_campaigns} active campaigns`,
                                    ...(PLAN_HIGHLIGHTS[plan.key] ?? []),
                                ];
                                return (
                                    <div key={plan.key} className={popular ? `${styles.planCard} ${styles.planCardPopular}` : styles.planCard}>
                                        {popular ? <span className={styles.popularBadge}>Most Popular</span> : null}
                                        <Text className={styles.planName}>{plan.name}</Text>
                                        <div className={styles.planPriceRow}>
                                            <span className={styles.planPrice}>${perMonth.toLocaleString()}</span>
                                            <span className={styles.planPer}>/mo</span>
                                        </div>
                                        <Text className={styles.planBilled}>
                                            {annual ? `billed annually ($${plan.yearly_price_usd.toLocaleString()}/yr)` : "billed monthly"}
                                        </Text>
                                        <ul className={styles.featureList}>
                                            {features.map((feature) => (
                                                <li key={feature} className={styles.featureItem}><CheckIcon />{feature}</li>
                                            ))}
                                        </ul>
                                        <button
                                            type="button"
                                            className={popular ? `${styles.upgradeButton} ${styles.upgradeButtonPopular}` : styles.upgradeButton}
                                            onClick={() => void subscribe(plan.key)}
                                            disabled={busyPlan !== null}
                                        >
                                            {busyPlan === plan.key ? "Opening…" : "Upgrade now →"}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </Box>
                )}

                {error ? <Text size="2" color="red" className={styles.paywallError}>{error}</Text> : null}

                <Box className={styles.legend}>
                    Search 2 cr · Personal email 3 cr · Mobile phone 10 cr · Sending free · Failed reveals free
                </Box>

                <Flex className={styles.paywallActions} gap="3" justify="end" align="center" wrap="wrap">
                    <Button variant="soft" color="gray" size="3" onClick={onClose}>Maybe later</Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
