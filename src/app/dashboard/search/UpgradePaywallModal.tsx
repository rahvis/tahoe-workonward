"use client";

import { useEffect, useState } from "react";

import { Box, Button, Dialog, Flex, Spinner, Text } from "@/components/ui/tahoe-ui";
import { createSubscriptionCheckout, fetchBillingCatalog, type BillingPlan } from "@/lib/organization";
import { TopUpPacks } from "@/app/dashboard/_components/TopUpModal";
import PlanCards from "@/app/dashboard/_components/PlanCards";

import styles from "./upgrade-paywall.module.css";

export type PaywallReason = "subscription_required" | "insufficient_credits";

interface UpgradePaywallModalProps {
    open: boolean;
    reason: PaywallReason;
    onClose: () => void;
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

    async function subscribe(planKey: BillingPlan["key"], interval: "month" | "year") {
        setBusyPlan(planKey);
        setError(null);
        try {
            const res = await createSubscriptionCheckout({
                plan_key: planKey,
                interval,
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
            <Dialog.Content maxWidth={showTopUps ? "760px" : "880px"} className={styles.paywallContent} aria-label="Upgrade to continue">
                <Box className={styles.paywallHeader}>
                    <Dialog.Title className={styles.paywallTitle}>{title}</Dialog.Title>
                    <Dialog.Description className={styles.paywallDescription}>{body}</Dialog.Description>
                </Box>

                <Box className={styles.bodyRegion}>
                    {showTopUps ? (
                        <TopUpPacks returnPath="/dashboard/search/new" />
                    ) : plans === null ? (
                        <Flex align="center" justify="center" className={styles.planLoading}><Spinner /></Flex>
                    ) : plans.length === 0 ? (
                        <Text size="2" color="gray">Plan details are unavailable right now.</Text>
                    ) : (
                        <PlanCards plans={plans} onChoose={subscribe} busyPlan={busyPlan} />
                    )}
                </Box>

                {error ? <Text size="2" color="red" className={styles.paywallError}>{error}</Text> : null}

                <Flex className={styles.paywallActions} gap="3" justify="end" align="center" wrap="wrap">
                    <Button variant="soft" color="gray" size="3" onClick={onClose}>Maybe later</Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
