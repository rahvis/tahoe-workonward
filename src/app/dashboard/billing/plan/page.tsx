'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from '../billing.module.css';
import {
    createSubscriptionCheckout,
    createTopUpCheckout,
    fetchBillingCatalog,
    fetchBillingSummary,
    type BillingCatalogResponse,
    type BillingPlan,
    type BillingSummary,
} from '@/lib/organization';

type BillingTab = 'overview' | 'plans' | 'topups' | 'credits';

const tabs: Array<{ key: BillingTab; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'plans', label: 'Plans' },
    { key: 'topups', label: 'Top-ups' },
    { key: 'credits', label: 'Credits' },
];

function formatPrice(value: number) {
    return `$${value.toLocaleString()}`;
}

function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
}

function isBillingTab(value: string | null): value is BillingTab {
    return tabs.some((tab) => tab.key === value);
}

function creditStatusLabel(state: BillingSummary['low_credit_state']) {
    if (state === 'healthy') return 'Healthy credit runway';
    if (state === 'low') return 'Low credit runway';
    if (state === 'critical') return 'Critical credit runway';
    return 'No available credits';
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
    const urlTab: BillingTab = validUrlTab ? rawTab : 'overview';
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
            params.set('tab', 'overview');
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [pathname, rawTab, router, searchParamsString, validUrlTab]);

    const activePlan = useMemo(() => {
        if (!catalog || !summary?.billing.plan_key) return null;
        return catalog.plans.find((plan) => plan.key === summary.billing.plan_key) ?? null;
    }, [catalog, summary]);

    const hasActiveEntitlements = (summary?.billing.active_entitlements?.length ?? 0) > 0;

    function switchTab(tab: BillingTab) {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    async function handlePlanCheckout(planKey: BillingPlan['key'], interval: 'month' | 'year') {
        setBusyKey(`${planKey}:${interval}`);
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
        } finally {
            setBusyKey(null);
        }
    }

    async function handleTopUp(packKey: string) {
        setBusyKey(packKey);
        setError(null);
        try {
            const response = await createTopUpCheckout({
                pack_key: packKey,
                success_path: '/dashboard/billing/plan',
                cancel_path: '/dashboard/billing/plan',
            });
            redirectToExternal(response.url);
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : 'Unable to start top-up checkout.');
        } finally {
            setBusyKey(null);
        }
    }

    function renderOverview() {
        if (!summary || !catalog) return null;
        return (
            <div className={styles.heroCard}>
                <div className={styles.row}>
                    <div>
                        <div className={styles.eyebrow}>Current plan</div>
                        <div className={styles.valueText}>
                            {hasActiveEntitlements ? activePlan?.name ?? 'Starter' : 'No active subscription'}
                        </div>
                        <div className={styles.planPriceMeta}>
                            {hasActiveEntitlements && summary.billing.interval === 'year'
                                ? `${formatPrice(activePlan?.yearly_price_usd ?? 0)} / year`
                                : hasActiveEntitlements
                                ? `${formatPrice(activePlan?.monthly_price_usd ?? 0)} / month`
                                : 'Buy a plan or use top-up credits only'}
                        </div>
                    </div>
                    <div className={styles[`status${summary.low_credit_state.charAt(0).toUpperCase()}${summary.low_credit_state.slice(1)}`]}>
                        {creditStatusLabel(summary.low_credit_state)}
                    </div>
                </div>
                <div className={styles.metricRow}>
                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Available credits</div>
                        <div className={styles.metricValue}>{summary.available_credits.toLocaleString()}</div>
                        <div className={styles.metricMeta}>Spendable now</div>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Included monthly</div>
                        <div className={styles.metricValue}>{summary.monthly_included_credits.toLocaleString()}</div>
                        <div className={styles.metricMeta}>Search, enrichment, and outreach</div>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Renews on</div>
                        <div className={styles.metricValue}>{formatDate(summary.billing.current_period_end)}</div>
                        <div className={styles.metricMeta}>
                            {summary.billing.interval === 'year' && summary.billing.next_credit_grant_at
                                ? `Next grant ${formatDate(summary.billing.next_credit_grant_at)}`
                                : summary.billing.subscription_status ?? 'Inactive'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderPlans() {
        if (!catalog) return null;
        if (catalog.plans.length === 0) {
            return <div className={styles.emptyState}>No subscription plans are available yet.</div>;
        }
        return (
            <div className={styles.planGrid}>
                {catalog.plans.map((plan) => (
                    <div key={plan.key} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <div className={styles.eyebrow}>{plan.name}</div>
                                <div className={styles.finePrint}>Subscription plan</div>
                            </div>
                            <div className={styles.priceBlock}>
                                <div className={styles.priceValue}>{formatPrice(plan.monthly_price_usd)} / month</div>
                                <div className={styles.planPriceMeta}>or {formatPrice(plan.yearly_price_usd)} / year</div>
                            </div>
                        </div>
                        <div className={styles.row}><span>Credits / month</span><strong>{plan.monthly_credits.toLocaleString()}</strong></div>
                        <div className={styles.row}><span>Mailboxes</span><strong>{plan.limits.mailboxes}</strong></div>
                        <div className={styles.row}><span>Active campaigns</span><strong>{plan.limits.active_campaigns}</strong></div>
                        <div className={styles.buttonRow}>
                            <button
                                type="button"
                                className="tahoe-button-secondary"
                                onClick={() => void handlePlanCheckout(plan.key, 'month')}
                                disabled={busyKey === `${plan.key}:month`}
                            >
                                {busyKey === `${plan.key}:month` ? 'Opening…' : 'Choose monthly'}
                            </button>
                            <button
                                type="button"
                                className="tahoe-button"
                                onClick={() => void handlePlanCheckout(plan.key, 'year')}
                                disabled={busyKey === `${plan.key}:year`}
                            >
                                {busyKey === `${plan.key}:year` ? 'Opening…' : 'Choose yearly'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    function renderTopUps() {
        if (!catalog) return null;
        if (catalog.topups.length === 0) {
            return <div className={styles.emptyState}>No top-up packs are available yet.</div>;
        }
        return (
            <div className={styles.topupGrid}>
                {catalog.topups.map((pack) => {
                    const bucketLabel = pack.bucket === 'coresignal_search'
                        ? 'Search'
                        : pack.bucket === 'fullenrich'
                          ? 'Enrich'
                          : null;
                    return (
                    <div key={pack.key} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <div className={styles.eyebrow}>{bucketLabel ? `${bucketLabel} top-up` : 'Top-up credits'}</div>
                                <div className={styles.finePrint}>
                                    {bucketLabel ? `Refills your ${bucketLabel} credits for this cycle.` : 'Non-expiring credits for burst capacity.'}
                                </div>
                            </div>
                            <div className={styles.priceBlock}>
                                <div className={styles.priceValue}>{pack.credits.toLocaleString()}</div>
                                <div className={styles.planPriceMeta}>{formatPrice(pack.price_usd)} one time</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="tahoe-button"
                            onClick={() => void handleTopUp(pack.key)}
                            disabled={busyKey === pack.key}
                        >
                            {busyKey === pack.key ? 'Opening…' : `Buy ${pack.credits.toLocaleString()}`}
                        </button>
                    </div>
                    );
                })}
            </div>
        );
    }

    function renderCredits() {
        if (!summary) return null;
        return (
            <div className={styles.summaryGrid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Credit buckets</h2>
                    {summary.buckets.length === 0 ? (
                        <div className={styles.finePrint}>No credit buckets have been granted yet.</div>
                    ) : (
                        summary.buckets.map((bucket, index) => (
                            <div key={`${bucket.kind}-${index}`} className={styles.row}>
                                <div>
                                    <div>{bucket.label}</div>
                                    <span className={styles.subtext}>
                                        {bucket.expires_at ? `Expires ${formatDate(bucket.expires_at)}` : 'Never expires'}
                                    </span>
                                </div>
                                <strong>{bucket.available.toLocaleString()}</strong>
                            </div>
                        ))
                    )}
                </div>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Usage this cycle</h2>
                    <div className={styles.row}><span>Search</span><strong>{summary.usage_this_cycle.search.toLocaleString()}</strong></div>
                    <div className={styles.row}><span>Enrichment</span><strong>{summary.usage_this_cycle.enrichment.toLocaleString()}</strong></div>
                    <div className={styles.row}><span>Outreach</span><strong>{summary.usage_this_cycle.outreach.toLocaleString()}</strong></div>
                </div>
            </div>
        );
    }

    function renderActiveTab() {
        if (activeTab === 'plans') return renderPlans();
        if (activeTab === 'topups') return renderTopUps();
        if (activeTab === 'credits') return renderCredits();
        return renderOverview();
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
