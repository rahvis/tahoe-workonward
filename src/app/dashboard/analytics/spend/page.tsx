'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from '../analytics.module.css';
import {
    fetchAnalyticsSpend,
    type AnalyticsRangeKey,
    type AnalyticsSpendResponse,
} from '@/lib/organization';
import { readAnalyticsCache, writeAnalyticsCache } from '../_components/analytics-cache';
import {
    ANALYTICS_TABLE_PAGE_SIZE,
    AnalyticsTabs,
    BarList,
    PaginationFooter,
    RangeTabs,
    RollupFreshness,
    StackedSpendChart,
} from '../_components/charts';

type SpendTab = 'summary' | 'categories' | 'attribution' | 'events';

const rangeOptions: AnalyticsRangeKey[] = ['7d', '30d', '90d', '365d'];
const spendTabs: Array<{ key: SpendTab; label: string }> = [
    { key: 'summary', label: 'Summary' },
    { key: 'categories', label: 'Categories' },
    { key: 'attribution', label: 'Attribution' },
    { key: 'events', label: 'Events' },
];

function isRange(value: string | null): value is AnalyticsRangeKey {
    return rangeOptions.includes(value as AnalyticsRangeKey);
}

function isSpendTab(value: string | null): value is SpendTab {
    return spendTabs.some((tab) => tab.key === value);
}

function SpendContent() {
    const pathname = usePathname();
    const router = useRouter();
    const replace = router.replace;
    const searchParams = useSearchParams();
    const searchParamsString = searchParams.toString();
    const initialRange = searchParams.get('range');
    const initialTab = searchParams.get('tab');
    const [range, setRange] = useState<AnalyticsRangeKey>(isRange(initialRange) ? initialRange : '7d');
    const [tab, setTab] = useState<SpendTab>(isSpendTab(initialTab) ? initialTab : 'summary');
    const [data, setData] = useState<AnalyticsSpendResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [revalidating, setRevalidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [eventsPage, setEventsPage] = useState(1);
    const requestSequence = useRef(0);

    useEffect(() => {
        const currentParams = new URLSearchParams(searchParamsString);
        const nextRange = currentParams.get('range');
        const nextTab = currentParams.get('tab');
        const normalizedRange = isRange(nextRange) ? nextRange : '7d';
        const normalizedTab = isSpendTab(nextTab) ? nextTab : 'summary';
        setRange(normalizedRange);
        setTab(normalizedTab);

        if ((nextRange && !isRange(nextRange)) || (nextTab && !isSpendTab(nextTab))) {
            const params = new URLSearchParams(searchParamsString);
            params.set('range', normalizedRange);
            params.set('tab', normalizedTab);
            replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [pathname, replace, searchParamsString]);

    function updateUrl(next: { range?: AnalyticsRangeKey; tab?: SpendTab }) {
        const nextRange = next.range ?? range;
        const nextTab = next.tab ?? tab;
        setRange(nextRange);
        setTab(nextTab);
        const params = new URLSearchParams(searchParamsString);
        params.set('range', nextRange);
        params.set('tab', nextTab);
        replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    useEffect(() => {
        const controller = new AbortController();
        const requestId = ++requestSequence.current;
        const cacheKey = `spend:${range}`;
        const cached = readAnalyticsCache<AnalyticsSpendResponse>(cacheKey);
        if (cached) {
            setData(cached);
            setLoading(false);
            setRevalidating(true);
        } else {
            setLoading(true);
        }
        setError(null);

        const load = async () => {
            try {
                const response = await fetchAnalyticsSpend({ range }, { signal: controller.signal });
                if (controller.signal.aborted || requestId !== requestSequence.current) return;
                writeAnalyticsCache(cacheKey, response);
                setData(response);
            } catch (loadError) {
                if (controller.signal.aborted || requestId !== requestSequence.current) return;
                setError(loadError instanceof Error ? loadError.message : 'Unable to load credit spend analytics.');
            } finally {
                if (controller.signal.aborted || requestId !== requestSequence.current) return;
                setLoading(false);
                setRevalidating(false);
            }
        };

        void load();
        return () => controller.abort();
    }, [range]);

    const eventRows = data?.high_cost_events ?? [];
    const eventTotalPages = Math.max(1, Math.ceil(eventRows.length / ANALYTICS_TABLE_PAGE_SIZE));
    const safeEventsPage = Math.min(eventsPage, eventTotalPages);
    const visibleEventRows = eventRows.slice(
        (safeEventsPage - 1) * ANALYTICS_TABLE_PAGE_SIZE,
        safeEventsPage * ANALYTICS_TABLE_PAGE_SIZE,
    );

    useEffect(() => {
        setEventsPage(1);
    }, [range]);

    useEffect(() => {
        setEventsPage((currentPage) => Math.min(currentPage, eventTotalPages));
    }, [eventTotalPages]);

    function renderSummary(current: AnalyticsSpendResponse) {
        return (
            <div className={styles.sectionStack}>
                <div className={styles.heroCard}>
                    <div className={styles.metricStrip}>
                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Available</div><div className={styles.metricValue}>{current.credit_snapshot.available.toLocaleString()}</div><div className={styles.metricMeta}>Spendable now</div></div>
                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Reserved</div><div className={styles.metricValue}>{current.credit_snapshot.reserved.toLocaleString()}</div><div className={styles.metricMeta}>In-flight work</div></div>
                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Spent</div><div className={styles.metricValue}>{current.credit_snapshot.spent_in_range.toLocaleString()}</div><div className={styles.metricMeta}>Selected window</div></div>
                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Runway</div><div className={styles.metricValue}>{current.credit_snapshot.credit_runway_days == null ? '—' : `${current.credit_snapshot.credit_runway_days.toFixed(1)}d`}</div><div className={styles.metricMeta}>Recent pace</div></div>
                    </div>
                </div>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Unit economics</h2>
                    <div className={styles.metricStrip}>
                        {current.unit_economics.map((item) => (
                            <div key={item.key} className={styles.metricPanel}>
                                <div className={styles.metricLabel}>{item.label}</div>
                                <div className={styles.metricValue}>{item.display_value}</div>
                                <div className={styles.metricMeta}>{item.detail ?? 'Derived from rollups'}</div>
                            </div>
                        ))}
                        {current.unit_economics.length === 0 ? <div className={styles.finePrint}>Unit economics appear after saved, enriched, and replied outcomes exist.</div> : null}
                    </div>
                </div>
            </div>
        );
    }

    function renderCategories(current: AnalyticsSpendResponse) {
        return (
            <div className={styles.gridTwo}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Credit trend</h2>
                    <StackedSpendChart points={current.daily} />
                </div>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Category split</h2>
                    <BarList
                        rows={current.categories.map((category) => ({
                            key: category.key,
                            label: category.label,
                            value: category.credits,
                            percentage: category.percentage,
                            metadata: {},
                        }))}
                        emptyTitle="No credit spend yet"
                        emptyCopy="Search, enrichment, and outreach spend appears after credit-consuming work."
                    />
                </div>
            </div>
        );
    }

    function renderAttribution(current: AnalyticsSpendResponse) {
        return (
            <div className={styles.gridTwo}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Projects</h2>
                    <BarList
                        rows={current.by_project.map((row) => ({ key: row.key, label: row.label, value: row.credits, percentage: row.percentage, metadata: {} }))}
                        emptyTitle="No project attribution"
                        emptyCopy="Attribution appears when spend can be traced through lists or campaigns."
                    />
                </div>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Campaigns</h2>
                    <BarList
                        rows={current.by_campaign.map((row) => ({ key: row.key, label: row.label, value: row.credits, percentage: row.percentage, metadata: {} }))}
                        emptyTitle="No campaign attribution"
                        emptyCopy="Launch outreach to see campaign-level spend."
                    />
                </div>
            </div>
        );
    }

    function renderEvents(current: AnalyticsSpendResponse) {
        return (
            <div className={styles.tableCard}>
                <div className={styles.tableScroll}>
                    <table className={styles.table}>
                        <thead>
                            <tr><th>Event</th><th>Credits</th><th>Project</th><th>Campaign</th><th>Time</th></tr>
                        </thead>
                        <tbody>
                            {visibleEventRows.map((event) => (
                                <tr key={event.idempotency_key}>
                                    <td>{event.label}<span className={styles.subtext}>{event.kind}</span></td>
                                    <td>{event.credits.toLocaleString()}</td>
                                    <td>{event.project_name ?? '—'}</td>
                                    <td>{event.campaign_name ?? '—'}</td>
                                    <td>{event.created_at ? new Date(event.created_at).toLocaleString() : '—'}</td>
                                </tr>
                            ))}
                            {current.high_cost_events.length === 0 ? (
                                <tr><td colSpan={5} className={styles.finePrint}>High-cost events appear after credit-consuming activity starts.</td></tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
                <PaginationFooter
                    page={safeEventsPage}
                    totalItems={current.high_cost_events.length}
                    label="events"
                    onPageChange={setEventsPage}
                />
            </div>
        );
    }

    return (
        <section className={`${styles.page} ${styles.animateIn}`}>
            <AnalyticsTabs
                tabs={spendTabs}
                value={tab}
                onChange={(nextTab) => updateUrl({ tab: nextTab })}
                label="Spend sections"
                actions={(
                    <>
                        {revalidating ? <span className={styles.finePrint}>Refreshing…</span> : null}
                        <RangeTabs value={range} onChange={(nextRange) => updateUrl({ range: nextRange })} />
                    </>
                )}
            />

            <div className={styles.contentRegion}>
                {error && !data ? (
                    <div className={styles.emptyState}><h2>Spend analytics unavailable</h2><p>{error}</p></div>
                ) : loading || !data ? (
                    <div className={styles.emptyState}><h2>Loading spend</h2><p>Reading credit rollups.</p></div>
                ) : (
                    <>
                        {error ? <div className={styles.noticeBanner}>{error}</div> : null}
                        <RollupFreshness data={data} />
                        {tab === 'summary' ? renderSummary(data) : null}
                        {tab === 'categories' ? renderCategories(data) : null}
                        {tab === 'attribution' ? renderAttribution(data) : null}
                        {tab === 'events' ? renderEvents(data) : null}
                    </>
                )}
            </div>
        </section>
    );
}

export default function AnalyticsSpendPage() {
    return (
        <Suspense fallback={<section className={styles.page}><div className={styles.emptyState} /></section>}>
            <SpendContent />
        </Suspense>
    );
}
