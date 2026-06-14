"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Box, Button, Dialog, Flex, Spinner, Text } from "@/components/ui/tahoe-ui";
import { fetchBillingCatalog, type BillingPlan } from "@/lib/organization";

import styles from "./upgrade-paywall.module.css";

export type PaywallReason = "subscription_required" | "insufficient_credits";

interface UpgradePaywallModalProps {
    open: boolean;
    reason: PaywallReason;
    onClose: () => void;
}

function formatPrice(usd: number): string {
    return `$${usd.toLocaleString("en-US")}`;
}

/**
 * Locking upgrade paywall for the search screen. Shown when a new (unsubscribed)
 * recruiter has used their one free search and tries to paginate or search again,
 * or when a subscribed recruiter runs out of credits. Lists the plan tiers and
 * routes to the existing subscribe/top-up flow on the billing page.
 */
export default function UpgradePaywallModal({ open, reason, onClose }: UpgradePaywallModalProps) {
    const router = useRouter();
    const [plans, setPlans] = useState<BillingPlan[] | null>(null);

    useEffect(() => {
        if (!open || plans) return;
        let cancelled = false;
        fetchBillingCatalog()
            .then((catalog) => {
                if (cancelled) return;
                // Self-serve tiers only; Enterprise ($0/custom) is handled via sales.
                setPlans(catalog.plans.filter((plan) => plan.key !== "enterprise"));
            })
            .catch(() => {
                if (!cancelled) setPlans([]);
            });
        return () => {
            cancelled = true;
        };
    }, [open, plans]);

    const subscribeCopy = reason === "insufficient_credits"
        ? {
            title: "You're out of credits",
            body: "Top up your credits or move to a higher plan to keep searching and unlock every result.",
            cta: "View plans & top up",
        }
        : {
            title: "Upgrade to keep searching",
            body: "You've used your free search. Subscribe to a plan to run unlimited searches, page through every result, and move straight into outreach.",
            cta: "View plans & subscribe",
        };

    return (
        <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
            <Dialog.Content maxWidth="640px" className={styles.paywallContent} aria-label="Upgrade to continue">
                <Box className={styles.paywallHeader}>
                    <Dialog.Title className={styles.paywallTitle}>{subscribeCopy.title}</Dialog.Title>
                    <Dialog.Description className={styles.paywallDescription}>
                        {subscribeCopy.body}
                    </Dialog.Description>
                </Box>

                <Box className={styles.planGrid} aria-label="Subscription plans">
                    {plans === null ? (
                        <Flex align="center" justify="center" className={styles.planLoading}><Spinner /></Flex>
                    ) : plans.length === 0 ? (
                        <Text size="2" color="gray">Plan details are on the billing page.</Text>
                    ) : (
                        plans.map((plan) => (
                            <div key={plan.key} className={styles.planCard}>
                                <Text className={styles.planName}>{plan.name}</Text>
                                <Text className={styles.planPrice}>
                                    {formatPrice(plan.monthly_price_usd)}<span className={styles.planPer}>/mo</span>
                                </Text>
                                <Text className={styles.planCredits}>
                                    {plan.monthly_credits.toLocaleString("en-US")} credits / month
                                </Text>
                            </div>
                        ))
                    )}
                </Box>

                <Flex className={styles.paywallActions} gap="3" justify="end" align="center" wrap="wrap">
                    <Button variant="soft" color="gray" size="3" onClick={onClose}>
                        Maybe later
                    </Button>
                    <Button
                        size="3"
                        onClick={() => router.push(
                            reason === "insufficient_credits"
                                ? "/dashboard/billing/plan?tab=topups"
                                : "/dashboard/billing/plan",
                        )}
                    >
                        {subscribeCopy.cta}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
