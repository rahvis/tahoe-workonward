'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/tahoe-ui';
import type { BillingPlan } from '@/lib/organization';
import styles from './plan-cards.module.css';

// Accurate per-plan perks (the credits/seats/mailboxes/campaigns come straight from the
// plan record). No "unlimited search" — search costs credits.
const PLAN_HIGHLIGHTS: Record<string, string[]> = {
    starter: ['Email outreach + AI templates'],
    growth: ['Team collaboration', 'Priority support (email & chat)'],
    pro: ['Usage analytics', 'Priority support (email, chat & Slack)'],
};

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className={styles.check}>
            <path d="M13.5 4.5 6.5 11.5 3 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/**
 * The 3 self-serve plan cards (Starter / Growth / Pro) with a Monthly/Annual toggle,
 * "Most Popular" accent on Growth, and a feature checklist.
 * Shared by the in-app pricing modal and the Billing → Plans page so they stay identical.
 * `onChoose(planKey, interval)` is called when a plan's CTA is clicked.
 */
export default function PlanCards({
    plans,
    onChoose,
    busyPlan,
    currentPlanKey,
    defaultAnnual = true,
}: {
    plans: BillingPlan[];
    onChoose: (planKey: BillingPlan['key'], interval: 'month' | 'year') => void;
    busyPlan: string | null;
    currentPlanKey?: string | null;
    defaultAnnual?: boolean;
}) {
    const [annual, setAnnual] = useState(defaultAnnual);

    return (
        <div className={styles.root}>
            <div className={styles.toggleRow}>
                <label className={styles.billingToggle}>
                    <span className={!annual ? styles.toggleActive : styles.toggleMuted}>Monthly</span>
                    <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Toggle annual billing" />
                    <span className={annual ? styles.toggleActive : styles.toggleMuted}>Annual</span>
                    <span className={styles.savePill}>Save 20%</span>
                </label>
            </div>

            <div className={styles.planGrid}>
                {plans.map((plan) => {
                    const popular = plan.key === 'growth';
                    const perMonth = annual ? Math.round(plan.yearly_price_usd / 12) : plan.monthly_price_usd;
                    const seats = plan.limits.seats ?? 1;
                    const isCurrent = currentPlanKey != null && plan.key === currentPlanKey;
                    const features = [
                        `${plan.monthly_credits.toLocaleString()} credits / month`,
                        `${seats} seat${seats === 1 ? '' : 's'}`,
                        `${plan.limits.mailboxes} mailbox${plan.limits.mailboxes === 1 ? '' : 'es'}`,
                        `${plan.limits.active_campaigns} active campaigns`,
                        ...(PLAN_HIGHLIGHTS[plan.key] ?? []),
                    ];
                    return (
                        <div key={plan.key} className={popular ? `${styles.planCard} ${styles.planCardPopular}` : styles.planCard}>
                            {popular ? <span className={styles.popularBadge}>Most Popular</span> : null}
                            <span className={styles.planName}>{plan.name}</span>
                            <div className={styles.planPriceRow}>
                                <span className={styles.planPrice}>${perMonth.toLocaleString()}</span>
                                <span className={styles.planPer}>/mo</span>
                            </div>
                            <span className={styles.planBilled}>
                                {annual ? `billed annually ($${plan.yearly_price_usd.toLocaleString()}/yr)` : 'billed monthly'}
                            </span>
                            <ul className={styles.featureList}>
                                {features.map((feature) => (
                                    <li key={feature} className={styles.featureItem}><CheckIcon />{feature}</li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                className={popular ? `${styles.upgradeButton} ${styles.upgradeButtonPopular}` : styles.upgradeButton}
                                onClick={() => onChoose(plan.key, annual ? 'year' : 'month')}
                                disabled={busyPlan !== null || isCurrent}
                            >
                                {isCurrent ? 'Current plan' : busyPlan === plan.key ? 'Opening…' : 'Upgrade now →'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
