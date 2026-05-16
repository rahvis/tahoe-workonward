'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from '../analytics.module.css';
import {
    fetchAnalyticsOverview,
    fetchAnalyticsPredictions,
    type AnalyticsOverviewResponse,
    type AnalyticsPredictionsResponse,
    type AnalyticsRangeKey,
} from '@/lib/organization';
import { readAnalyticsCache, writeAnalyticsCache } from '../_components/analytics-cache';
import {
    ActivityHeatStrip,
    AnalyticsTabs,
    BarList,
    RangeTabs,
    RollupFreshness,
    Sparkline,
    StackedSpendChart,
} from '../_components/charts';

type OverviewTab = 'summary' | 'credits' | 'workflow' | 'forecasts' | 'health';

const overviewTabs: Array<{ key: OverviewTab; label: string }> = [
    { key: 'summary', label: 'Summary' },
    { key: 'credits', label: 'Credits' },
    { key: 'workflow', label: 'Workflow' },
    { key: 'forecasts', label: 'Forecasts' },
    { key: 'health', label: 'Health' },
];

const rangeOptions: AnalyticsRangeKey[] = ['7d', '30d', '90d', '365d'];

function isRange(value: string | null): value is AnalyticsRangeKey {
    return rangeOptions.includes(value as AnalyticsRangeKey);
}

function isOverviewTab(value: string | null): value is OverviewTab {
    return overviewTabs.some((tab) => tab.key === value);
}

function OverviewContent() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRange = searchParams.get('range');
    const initialTab = searchParams.get('tab');
    const [range, setRange] = useState<AnalyticsRangeKey>(isRange(initialRange) ? initialRange : '7d');
    const [tab, setTab] = useState<OverviewTab>(isOverviewTab(initialTab) ? initialTab : 'summary');
    const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
    const [predictions, setPredictions] = useState<AnalyticsPredictionsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [revalidating, setRevalidating] = useState(false);
    const [predictionLoading, setPredictionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [predictionError, setPredictionError] = useState<string | null>(null);
    const overviewSequence = useRef(0);
    const predictionSequence = useRef(0);

    useEffect(() => {
        const nextRange = searchParams.get('range');
        const nextTab = searchParams.get('tab');
        setRange(isRange(nextRange) ? nextRange : '7d');
        setTab(isOverviewTab(nextTab) ? nextTab : 'summary');
    }, [searchParams]);

    function updateUrl(next: { range?: AnalyticsRangeKey; tab?: OverviewTab }) {
        const nextRange = next.range ?? range;
        const nextTab = next.tab ?? tab;
        setRange(nextRange);
        setTab(nextTab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('range', nextRange);
        params.set('tab', nextTab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    useEffect(() => {
        const controller = new AbortController();
        const requestId = ++overviewSequence.current;
        const cacheKey = `overview:${range}`;
        const cached = readAnalyticsCache<AnalyticsOverviewResponse>(cacheKey);
        if (cached) {
            setOverview(cached);
            setLoading(false);
            setRevalidating(true);
        } else {
            setLoading(true);
        }
        setError(null);

        const load = async () => {
            try {
                const response = await fetchAnalyticsOverview({ range }, { signal: controller.signal });
                if (controller.signal.aborted || requestId !== overviewSequence.current) return;
                writeAnalyticsCache(cacheKey, response);
                setOverview(response);
            } catch (loadError) {
                if (controller.signal.aborted || requestId !== overviewSequence.current) return;
                setError(loadError instanceof Error ? loadError.message : 'Unable to load analytics overview.');
            } finally {
                if (controller.signal.aborted || requestId !== overviewSequence.current) return;
                setLoading(false);
                setRevalidating(false);
            }
        };

        void load();
        return () => controller.abort();
    }, [range]);

    useEffect(() => {
        if (tab !== 'forecasts') return;
        const controller = new AbortController();
        const requestId = ++predictionSequence.current;
        const cacheKey = `predictions:${range}`;
        const cached = readAnalyticsCache<AnalyticsPredictionsResponse>(cacheKey);
        if (cached) {
            setPredictions(cached);
            setPredictionLoading(false);
        } else {
            setPredictionLoading(true);
        }
        setPredictionError(null);

        const load = async () => {
            try {
                const response = await fetchAnalyticsPredictions({ range }, { signal: controller.signal });
                if (controller.signal.aborted || requestId !== predictionSequence.current) return;
                writeAnalyticsCache(cacheKey, response);
                setPredictions(response);
            } catch (loadError) {
                if (controller.signal.aborted || requestId !== predictionSequence.current) return;
                setPredictionError(loadError instanceof Error ? loadError.message : 'Unable to load forecasts.');
            } finally {
                if (controller.signal.aborted || requestId !== predictionSequence.current) return;
                setPredictionLoading(false);
            }
        };

        void load();
        return () => controller.abort();
    }, [range, tab]);

    function renderSummary(current: AnalyticsOverviewResponse) {
        return (
            <div className={styles.sectionStack}>
                <div className={styles.heroCard}>
                    <div className={styles.kpiGrid}>
                        {current.kpis.map((kpi) => (
                            <div key={kpi.key} className={styles.kpiCard}>
                                <div className={styles.kpiLabel}>{kpi.label}</div>
                                <div className={styles.kpiValue}>{kpi.display_value}</div>
                                <Sparkline values={kpi.trend} />
                                <div className={`${styles.kpiMeta} ${kpi.delta_pct != null && kpi.delta_pct >= 0 ? styles.positiveMeta : kpi.delta_pct != null ? styles.negativeMeta : ''}`}>
                                    {kpi.delta_pct == null ? (kpi.detail ?? 'No prior window') : `${kpi.delta_pct >= 0 ? '+' : ''}${kpi.delta_pct.toFixed(1)}%`}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Recruiter activity</h2>
                    <ActivityHeatStrip points={current.activity_trend} />
                </div>
            </div>
        );
    }

    function renderCredits(current: AnalyticsOverviewResponse) {
        return (
            <div className={styles.sectionStack}>
                <div className={styles.heroCard}>
                    <div className={styles.metricStrip}>
                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Available</div><div className={styles.metricValue}>{current.credit_snapshot.available.toLocaleString()}</div><div className={styles.metricMeta}>Spendable now</div></div>
                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Reserved</div><div className={styles.metricValue}>{current.credit_snapshot.reserved.toLocaleString()}</div><div className={styles.metricMeta}>In-flight work</div></div>
                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Included</div><div className={styles.metricValue}>{current.credit_snapshot.monthly_included.toLocaleString()}</div><div className={styles.metricMeta}>Monthly allocation</div></div>
                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Runway</div><div className={styles.metricValue}>{current.credit_snapshot.credit_runway_days == null ? '—' : `${current.credit_snapshot.credit_runway_days.toFixed(1)}d`}</div><div className={styles.metricMeta}>Recent pace</div></div>
                    </div>
                </div>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Credit spend</h2>
                    <StackedSpendChart points={current.credit_spend_trend} />
                </div>
            </div>
        );
    }

    function renderWorkflow(current: AnalyticsOverviewResponse) {
        return (
            <div className={styles.gridTwo}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Workflow mix</h2>
                    <BarList rows={current.workflow_mix} emptyTitle="No workflow mix yet" emptyCopy="Run search, save, enrich, or send outreach to unlock this view." />
                </div>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Source mix</h2>
                    <BarList rows={current.source_mix} emptyTitle="No source mix yet" emptyCopy="Save candidates to see source distribution." />
                </div>
            </div>
        );
    }

    function renderForecasts() {
        if (predictionError && !predictions) return <div className={styles.emptyState}><h2>Forecasts unavailable</h2><p>{predictionError}</p></div>;
        if (predictionLoading && !predictions) return <div className={styles.emptyState}><h2>Loading forecasts</h2><p>Preparing Tahoe-only estimates.</p></div>;
        if (!predictions) return null;
        return (
            <div className={styles.predictionGrid}>
                {predictions.predictions.map((prediction) => (
                    <div key={prediction.key} className={styles.predictionCard}>
                        <div className={styles.metricLabel}>{prediction.label}</div>
                        <div className={styles.predictionValue}>{prediction.display_value}</div>
                        <div className={styles.predictionMethod}>{prediction.method_label}</div>
                        <div className={styles.finePrint}>{prediction.explanation}</div>
                    </div>
                ))}
            </div>
        );
    }

    function renderHealth(current: AnalyticsOverviewResponse) {
        return (
            <div className={styles.sectionStack}>
                <RollupFreshness data={current} />
                {current.rollup_message ? <div className={styles.noticeBanner}>{current.rollup_message}</div> : null}
                <div className={styles.signalGrid}>
                    {current.release_signals.map((signal) => (
                        <div key={signal.key} className={`${styles.signalCard} ${signal.status === 'healthy' ? styles.signalHealthy : signal.status === 'warning' ? styles.signalWarning : styles.signalCritical}`}>
                            <div className={styles.metricLabel}>{signal.label}</div>
                            <div className={styles.metricValue}>{signal.value}</div>
                            <div className={styles.metricMeta}>{signal.detail ?? 'No detail'}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className={`${styles.page} ${styles.animateIn}`}>
            <div className={styles.header}>
                <div>
                    <div className={styles.eyebrow}>Analytics</div>
                    <h1 className={styles.title}>Operational overview</h1>
                </div>
                <div className={styles.headerTools}>
                    {revalidating ? <span className={styles.finePrint}>Refreshing…</span> : null}
                    <RangeTabs value={range} onChange={(nextRange) => updateUrl({ range: nextRange })} />
                </div>
            </div>
            <AnalyticsTabs tabs={overviewTabs} value={tab} onChange={(nextTab) => updateUrl({ tab: nextTab })} label="Overview sections" />

            {error && !overview ? (
                <div className={styles.emptyState}><h2>Analytics unavailable</h2><p>{error}</p></div>
            ) : loading || !overview ? (
                <div className={styles.emptyState}><h2>Loading overview</h2><p>Reading analytics rollups.</p></div>
            ) : (
                <>
                    {error ? <div className={styles.noticeBanner}>{error}</div> : null}
                    {tab !== 'health' ? <RollupFreshness data={overview} /> : null}
                    {tab === 'summary' ? renderSummary(overview) : null}
                    {tab === 'credits' ? renderCredits(overview) : null}
                    {tab === 'workflow' ? renderWorkflow(overview) : null}
                    {tab === 'forecasts' ? renderForecasts() : null}
                    {tab === 'health' ? renderHealth(overview) : null}
                </>
            )}
        </section>
    );
}

export default function AnalyticsOverviewPage() {
    return (
        <Suspense fallback={<section className={styles.page}><div className={styles.emptyState} /></section>}>
            <OverviewContent />
        </Suspense>
    );
}
