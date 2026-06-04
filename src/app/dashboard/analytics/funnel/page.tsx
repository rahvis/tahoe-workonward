'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from '../analytics.module.css';
import { fetchAnalyticsFunnel, type AnalyticsFunnelResponse, type AnalyticsRangeKey } from '@/lib/organization';
import { readAnalyticsCache, writeAnalyticsCache } from '../_components/analytics-cache';
import {
    ANALYTICS_TABLE_PAGE_SIZE,
    AnalyticsTabs,
    FunnelChart,
    PaginationFooter,
    RangeTabs,
    RollupFreshness,
    formatDayLabel,
} from '../_components/charts';

type FunnelTab = 'funnel' | 'timing' | 'details';

const rangeOptions: AnalyticsRangeKey[] = ['7d', '30d', '90d', '365d'];
const funnelTabs: Array<{ key: FunnelTab; label: string }> = [
    { key: 'funnel', label: 'Funnel' },
    { key: 'timing', label: 'Timing' },
    { key: 'details', label: 'Details' },
];

function isRange(value: string | null): value is AnalyticsRangeKey {
    return rangeOptions.includes(value as AnalyticsRangeKey);
}

function isFunnelTab(value: string | null): value is FunnelTab {
    return funnelTabs.some((tab) => tab.key === value);
}

function FunnelContent() {
    const pathname = usePathname();
    const router = useRouter();
    const replace = router.replace;
    const searchParams = useSearchParams();
    const searchParamsString = searchParams.toString();
    const initialRange = searchParams.get('range');
    const initialTab = searchParams.get('tab');
    const [range, setRange] = useState<AnalyticsRangeKey>(isRange(initialRange) ? initialRange : '7d');
    const [tab, setTab] = useState<FunnelTab>(isFunnelTab(initialTab) ? initialTab : 'funnel');
    const [data, setData] = useState<AnalyticsFunnelResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [revalidating, setRevalidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detailsPage, setDetailsPage] = useState(1);
    const requestSequence = useRef(0);

    useEffect(() => {
        const currentParams = new URLSearchParams(searchParamsString);
        const nextRange = currentParams.get('range');
        const nextTab = currentParams.get('tab');
        const normalizedRange = isRange(nextRange) ? nextRange : '7d';
        const normalizedTab = isFunnelTab(nextTab) ? nextTab : 'funnel';
        setRange(normalizedRange);
        setTab(normalizedTab);

        if ((nextRange && !isRange(nextRange)) || (nextTab && !isFunnelTab(nextTab))) {
            const params = new URLSearchParams(searchParamsString);
            params.set('range', normalizedRange);
            params.set('tab', normalizedTab);
            replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [pathname, replace, searchParamsString]);

    function updateUrl(next: { range?: AnalyticsRangeKey; tab?: FunnelTab }) {
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
        const cacheKey = `funnel:${range}`;
        const cached = readAnalyticsCache<AnalyticsFunnelResponse>(cacheKey);
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
                const response = await fetchAnalyticsFunnel({ range }, { signal: controller.signal });
                if (controller.signal.aborted || requestId !== requestSequence.current) return;
                writeAnalyticsCache(cacheKey, response);
                setData(response);
            } catch (loadError) {
                if (controller.signal.aborted || requestId !== requestSequence.current) return;
                setError(loadError instanceof Error ? loadError.message : 'Unable to load funnel analytics.');
            } finally {
                if (controller.signal.aborted || requestId !== requestSequence.current) return;
                setLoading(false);
                setRevalidating(false);
            }
        };

        void load();
        return () => controller.abort();
    }, [range]);

    const timingStages = data?.stages.filter((stage) => stage.avg_hours_from_previous != null) ?? [];
    const maxTiming = Math.max(1, ...timingStages.map((stage) => stage.avg_hours_from_previous ?? 0));
    const detailsTotalPages = Math.max(1, Math.ceil((data?.stages.length ?? 0) / ANALYTICS_TABLE_PAGE_SIZE));
    const safeDetailsPage = Math.min(detailsPage, detailsTotalPages);
    const visibleDetailStages = data?.stages.slice(
        (safeDetailsPage - 1) * ANALYTICS_TABLE_PAGE_SIZE,
        safeDetailsPage * ANALYTICS_TABLE_PAGE_SIZE,
    ) ?? [];

    useEffect(() => {
        setDetailsPage(1);
    }, [range]);

    useEffect(() => {
        setDetailsPage((currentPage) => Math.min(currentPage, detailsTotalPages));
    }, [detailsTotalPages]);

    return (
        <section className={`${styles.page} ${styles.animateIn}`}>
            <div className={styles.header}>
                <div className={styles.headerTools}>
                    {revalidating ? <span className={styles.finePrint}>Refreshing…</span> : null}
                    <RangeTabs value={range} onChange={(nextRange) => updateUrl({ range: nextRange })} />
                </div>
            </div>
            <AnalyticsTabs tabs={funnelTabs} value={tab} onChange={(nextTab) => updateUrl({ tab: nextTab })} label="Funnel sections" />

            <div className={styles.contentRegion}>
                {error && !data ? (
                    <div className={styles.emptyState}><h2>Funnel unavailable</h2><p>{error}</p></div>
                ) : loading || !data ? (
                    <div className={styles.emptyState}><h2>Loading funnel</h2><p>Reading stage rollups.</p></div>
                ) : (
                    <>
                        {error ? <div className={styles.noticeBanner}>{error}</div> : null}
                        <RollupFreshness data={data} />
                        {tab === 'funnel' ? (
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Conversion ladder</h2>
                                <FunnelChart stages={data.stages} />
                            </div>
                        ) : null}
                        {tab === 'timing' ? (
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Time between stages</h2>
                                <div className={styles.timelineStrip}>
                                    {timingStages.length ? timingStages.map((stage) => (
                                        <div key={stage.key} className={styles.timelinePoint}>
                                            <span className={styles.barLabel}>{stage.label}</span>
                                            <div className={styles.timeTrack}>
                                                <div className={styles.timeFill} style={{ width: `${Math.max(6, ((stage.avg_hours_from_previous ?? 0) / maxTiming) * 100)}%` }} />
                                            </div>
                                            <span className={styles.barValue}>{stage.avg_hours_from_previous?.toFixed(1)}h</span>
                                        </div>
                                    )) : <div className={styles.emptyState}><h2>No timing yet</h2><p>Timing appears after Tahoe can measure stage transitions.</p></div>}
                                </div>
                            </div>
                        ) : null}
                        {tab === 'details' ? (
                            <div className={styles.tableCard}>
                                <div className={styles.tableScroll}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr><th>Stage</th><th>Count</th><th>Conversion</th><th>Average time</th></tr>
                                        </thead>
                                        <tbody>
                                            {visibleDetailStages.map((stage) => (
                                                <tr key={stage.key}>
                                                    <td>{stage.label}<span className={styles.subtext}>{formatDayLabel(data.generated_at)}</span></td>
                                                    <td>{stage.count.toLocaleString()}</td>
                                                    <td>{stage.conversion_from_previous == null ? '—' : `${stage.conversion_from_previous.toFixed(1)}%`}</td>
                                                    <td>{stage.avg_hours_from_previous == null ? '—' : `${stage.avg_hours_from_previous.toFixed(1)}h`}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <PaginationFooter
                                    page={safeDetailsPage}
                                    totalItems={data.stages.length}
                                    label="stages"
                                    onPageChange={setDetailsPage}
                                />
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </section>
    );
}

export default function AnalyticsFunnelPage() {
    return (
        <Suspense fallback={<section className={styles.page}><div className={styles.emptyState} /></section>}>
            <FunnelContent />
        </Suspense>
    );
}
