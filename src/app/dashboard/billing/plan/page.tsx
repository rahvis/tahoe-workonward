'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from '../billing.module.css';
import {
    createSubscriptionCheckout,
    fetchBillingCatalog,
    fetchBillingSummary,
    type BillingCatalogResponse,
    type BillingPlan,
    type BillingSummary,
} from '@/lib/organization';
import PlanCards from '@/app/dashboard/_components/PlanCards';
import { TopUpPacks } from '@/app/dashboard/_components/TopUpModal';

type BillingTab = 'plans' | 'topups';

const DEFAULT_TAB: BillingTab = 'plans';

const tabs: Array<{ key: BillingTab; label: string }> = [
    { key: 'plans', label: 'Plans' },
    { key: 'topups', label: 'Top-ups' },
];

function isBillingTab(value: string | null): value is BillingTab {
    return tabs.some((tab) => tab.key === value);
}

function redirectToExternal(url: string) {
    if (process.env.NODE_ENV === 'test') return;
    window.location.assign(url);
}

function BillingPlanContent() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawTab = searchParams.get('tab');
    const validUrlTab = isBillingTab(rawTab);
    const urlTab: BillingTab = validUrlTab ? rawTab : DEFAULT_TAB;
    const searchParamsString = searchParams.toString();
    const [activeTab, setActiveTab] = useState<BillingTab>(urlTab);
    const [summary, setSummary] = useState<BillingSummary | null>(null);
    const [catalog, setCatalog] = useState<BillingCatalogResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryResponse, catalogResponse] = await Promise.all([
                fetchBillingSummary(),
                fetchBillingCatalog(),
            ]);
            setSummary(summaryResponse);
            setCatalog(catalogResponse);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Unable to load billing');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        setActiveTab(urlTab);
    }, [urlTab]);

    useEffect(() => {
        if (rawTab && !validUrlTab) {
            const params = new URLSearchParams(searchParamsString);
            params.set('tab', DEFAULT_TAB);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [pathname, rawTab, router, searchParamsString, validUrlTab]);

    const hasActiveEntitlements = (summary?.billing.active_entitlements?.length ?? 0) > 0;

    function switchTab(tab: BillingTab) {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    async function handlePlanCheckout(planKey: BillingPlan['key'], interval: 'month' | 'year') {
        setBusyKey(planKey);
        setError(null);
        try {
            const response = await createSubscriptionCheckout({
                plan_key: planKey,
                interval,
                success_path: '/dashboard/billing/plan',
                cancel_path: '/dashboard/billing/plan',
            });
            redirectToExternal(response.url);
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : 'Unable to start Stripe checkout.');
            setBusyKey(null);
        }
    }

    function renderPlans() {
        if (!catalog) return null;
        const plans = catalog.plans.filter((plan) => plan.key !== 'enterprise');
        if (plans.length === 0) {
            return <div className={styles.emptyState}>No subscription plans are available yet.</div>;
        }
        return (
            <PlanCards
                plans={plans}
                onChoose={handlePlanCheckout}
                busyPlan={busyKey}
                currentPlanKey={hasActiveEntitlements ? summary?.billing.plan_key ?? null : null}
            />
        );
    }

    function renderTopUps() {
        if (!catalog) return null;
        if (catalog.topups.length === 0) {
            return <div className={styles.emptyState}>No top-up packs are available yet.</div>;
        }
        return <TopUpPacks packs={catalog.topups} returnPath="/dashboard/billing/plan" />;
    }

    function renderActiveTab() {
        if (activeTab === 'topups') return renderTopUps();
        return renderPlans();
    }

    return (
        <section className={styles.page}>
            {error ? (
                <div className={styles.heroCard}>
                    <div className={styles.statusCritical}>Billing error</div>
                    <div className={styles.finePrint}>{error}</div>
                </div>
            ) : null}

            <nav className={styles.tabs} aria-label="Billing sections" role="tablist">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.key}
                        className={activeTab === tab.key ? styles.activeTab : styles.tab}
                        onClick={() => switchTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {loading || !summary || !catalog ? (
                <div className={styles.heroCard}>
                    <div className={styles.finePrint}>Loading billing…</div>
                </div>
            ) : (
                <section className={styles.sectionStack}>
                    {renderActiveTab()}
                </section>
            )}
        </section>
    );
}

export default function BillingPlanPage() {
    return (
        <Suspense fallback={
            <section className={styles.page}>
                <div className={styles.heroCard}>
                    <div className={styles.finePrint}>Loading billing…</div>
                </div>
            </section>
        }>
            <BillingPlanContent />
        </Suspense>
    );
}
