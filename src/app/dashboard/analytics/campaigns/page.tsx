'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from '../analytics.module.css';
import {
    fetchAnalyticsCampaignDetail,
    fetchAnalyticsCampaignPerformance,
    type AnalyticsCampaignDetailResponse,
    type AnalyticsCampaignLeaderboardRow,
    type AnalyticsCampaignPerformanceResponse,
    type AnalyticsRangeKey,
} from '@/lib/organization';
import { readAnalyticsCache, writeAnalyticsCache } from '../_components/analytics-cache';
import {
    ANALYTICS_TABLE_PAGE_SIZE,
    AnalyticsTabs,
    BarList,
    PaginationFooter,
    RangeTabs,
    RollupFreshness,
    Sparkline,
} from '../_components/charts';

type CampaignTab = 'summary' | 'leaderboard';
type DetailTab = 'overview' | 'trend' | 'audience' | 'delivery';

const rangeOptions: AnalyticsRangeKey[] = ['7d', '30d', '90d', '365d'];
const campaignTabs: Array<{ key: CampaignTab; label: string }> = [
    { key: 'summary', label: 'Summary' },
    { key: 'leaderboard', label: 'Leaderboard' },
];
const detailTabs: Array<{ key: DetailTab; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'trend', label: 'Trend' },
    { key: 'audience', label: 'Audience' },
    { key: 'delivery', label: 'Delivery' },
];

function isRange(value: string | null): value is AnalyticsRangeKey {
    return rangeOptions.includes(value as AnalyticsRangeKey);
}

function isCampaignTab(value: string | null): value is CampaignTab {
    return campaignTabs.some((tab) => tab.key === value);
}

function normalizeCampaignTab(value: string | null, campaignId: string | null): CampaignTab {
    if (isCampaignTab(value)) return value;
    return value === 'drilldown' && campaignId ? 'leaderboard' : 'summary';
}

function CampaignsContent() {
    const pathname = usePathname();
    const router = useRouter();
    const replace = router.replace;
    const searchParams = useSearchParams();
    const searchParamsString = searchParams.toString();
    const initialRange = searchParams.get('range');
    const initialTab = searchParams.get('tab');
    const initialCampaign = searchParams.get('campaign_id');
    const [range, setRange] = useState<AnalyticsRangeKey>(isRange(initialRange) ? initialRange : '7d');
    const [tab, setTab] = useState<CampaignTab>(normalizeCampaignTab(initialTab, initialCampaign));
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(initialCampaign);
    const [detailTab, setDetailTab] = useState<DetailTab>('overview');
    const [leaderboardPage, setLeaderboardPage] = useState(1);
    const [deliveryPage, setDeliveryPage] = useState(1);
    const [data, setData] = useState<AnalyticsCampaignPerformanceResponse | null>(null);
    const [detail, setDetail] = useState<AnalyticsCampaignDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [revalidating, setRevalidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const requestSequence = useRef(0);
    const detailSequence = useRef(0);

    useEffect(() => {
        const currentParams = new URLSearchParams(searchParamsString);
        const nextRange = currentParams.get('range');
        const nextTab = currentParams.get('tab');
        const nextCampaign = currentParams.get('campaign_id');
        const normalizedRange = isRange(nextRange) ? nextRange : '7d';
        const normalizedTab = normalizeCampaignTab(nextTab, nextCampaign);
        setRange(normalizedRange);
        setTab(normalizedTab);
        setSelectedCampaign(nextCampaign);

        if ((nextRange && !isRange(nextRange)) || (nextTab && !isCampaignTab(nextTab))) {
            const params = new URLSearchParams(searchParamsString);
            params.set('range', normalizedRange);
            params.set('tab', normalizedTab);
            replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [pathname, replace, searchParamsString]);

    function updateUrl(next: { range?: AnalyticsRangeKey; tab?: CampaignTab; campaignId?: string | null }) {
        const nextRange = next.range ?? range;
        const nextTab = next.tab ?? tab;
        const nextCampaign = next.campaignId === undefined ? selectedCampaign : next.campaignId;
        setRange(nextRange);
        setTab(nextTab);
        setSelectedCampaign(nextCampaign);
        const params = new URLSearchParams(searchParamsString);
        params.set('range', nextRange);
        params.set('tab', nextTab);
        if (nextCampaign) params.set('campaign_id', nextCampaign);
        else params.delete('campaign_id');
        replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    useEffect(() => {
        const controller = new AbortController();
        const requestId = ++requestSequence.current;
        const cacheKey = `campaigns:${range}`;
        const cached = readAnalyticsCache<AnalyticsCampaignPerformanceResponse>(cacheKey);
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
                const response = await fetchAnalyticsCampaignPerformance({ range }, { signal: controller.signal });
                if (controller.signal.aborted || requestId !== requestSequence.current) return;
                writeAnalyticsCache(cacheKey, response);
                setData(response);
            } catch (loadError) {
                if (controller.signal.aborted || requestId !== requestSequence.current) return;
                setError(loadError instanceof Error ? loadError.message : 'Unable to load campaign analytics.');
            } finally {
                if (controller.signal.aborted || requestId !== requestSequence.current) return;
                setLoading(false);
                setRevalidating(false);
            }
        };

        void load();
        return () => controller.abort();
    }, [range]);

    useEffect(() => {
        if (!selectedCampaign) {
            setDetail(null);
            return;
        }
        const controller = new AbortController();
        const requestId = ++detailSequence.current;
        const cacheKey = `campaign-detail:${selectedCampaign}:${range}`;
        const cached = readAnalyticsCache<AnalyticsCampaignDetailResponse>(cacheKey);
        if (cached) {
            setDetail(cached);
            setDetailLoading(false);
        } else {
            setDetail(null);
            setDetailLoading(true);
        }
        setDetailError(null);

        const load = async () => {
            try {
                const response = await fetchAnalyticsCampaignDetail(selectedCampaign, { range, limit: 50 }, { signal: controller.signal });
                if (controller.signal.aborted || requestId !== detailSequence.current) return;
                writeAnalyticsCache(cacheKey, response);
                setDetail(response);
            } catch (loadError) {
                if (controller.signal.aborted || requestId !== detailSequence.current) return;
                setDetailError(loadError instanceof Error ? loadError.message : 'Unable to load campaign detail.');
            } finally {
                if (controller.signal.aborted || requestId !== detailSequence.current) return;
                setDetailLoading(false);
            }
        };

        void load();
        return () => controller.abort();
    }, [range, selectedCampaign]);

    const currentDetail = detail?.campaign.campaign_id === selectedCampaign ? detail : null;
    const leaderboardRows = data?.campaign_leaderboard ?? [];
    const leaderboardTotalPages = Math.max(1, Math.ceil(leaderboardRows.length / ANALYTICS_TABLE_PAGE_SIZE));
    const safeLeaderboardPage = Math.min(leaderboardPage, leaderboardTotalPages);
    const visibleLeaderboardRows = leaderboardRows.slice(
        (safeLeaderboardPage - 1) * ANALYTICS_TABLE_PAGE_SIZE,
        safeLeaderboardPage * ANALYTICS_TABLE_PAGE_SIZE,
    );
    const deliveryRows = currentDetail?.enrollments ?? [];
    const deliveryTotalPages = Math.max(1, Math.ceil(deliveryRows.length / ANALYTICS_TABLE_PAGE_SIZE));
    const safeDeliveryPage = Math.min(deliveryPage, deliveryTotalPages);
    const visibleDeliveryRows = deliveryRows.slice(
        (safeDeliveryPage - 1) * ANALYTICS_TABLE_PAGE_SIZE,
        safeDeliveryPage * ANALYTICS_TABLE_PAGE_SIZE,
    );

    useEffect(() => {
        setLeaderboardPage(1);
    }, [range]);

    useEffect(() => {
        setLeaderboardPage((currentPage) => Math.min(currentPage, leaderboardTotalPages));
    }, [leaderboardTotalPages]);

    useEffect(() => {
        setDetailTab('overview');
        setDeliveryPage(1);
    }, [selectedCampaign]);

    useEffect(() => {
        setDeliveryPage((currentPage) => Math.min(currentPage, deliveryTotalPages));
    }, [deliveryTotalPages]);

    function openCampaign(campaign: AnalyticsCampaignLeaderboardRow) {
        setDetailTab('overview');
        setDeliveryPage(1);
        updateUrl({ tab: 'leaderboard', campaignId: campaign.campaign_id });
    }

    function renderSummary(current: AnalyticsCampaignPerformanceResponse) {
        return (
            <div className={styles.sectionStack}>
                <div className={styles.heroCard}>
                    <div className={styles.metricStrip}>
                        {current.summary.map((item) => (
                            <div key={item.key} className={styles.metricPanel}>
                                <div className={styles.metricLabel}>{item.label}</div>
                                <div className={styles.metricValue}>{item.display_value}</div>
                                <div className={styles.metricMeta}>{item.detail ?? 'Campaign metric'}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.gridTwo}>
                    <div className={styles.card}><h2 className={styles.cardTitle}>Reply rate</h2><Sparkline values={current.reply_rate_trend.map((point) => point.value)} /></div>
                    <div className={styles.card}><h2 className={styles.cardTitle}>Send volume</h2><Sparkline values={current.send_volume_trend.map((point) => point.value)} stroke="var(--tahoe-color-success)" /></div>
                </div>
            </div>
        );
    }

    function renderLeaderboard(current: AnalyticsCampaignPerformanceResponse) {
        return (
            <div className={styles.tableCard}>
                <div className={styles.tableScroll}>
                    <table className={styles.table}>
                        <thead>
                            <tr><th>Campaign</th><th>Status</th><th>Sent</th><th>Replies</th><th>Bounced</th><th>Reply rate</th><th>Active</th></tr>
                        </thead>
                        <tbody>
                            {visibleLeaderboardRows.map((campaign) => (
                                <tr key={campaign.campaign_id} className={styles.clickableRow} onClick={() => openCampaign(campaign)}>
                                    <td><button type="button" className="tahoe-button-ghost" onClick={(event) => { event.stopPropagation(); openCampaign(campaign); }}>{campaign.campaign_name}</button><span className={styles.subtext}>{campaign.project_name ?? 'No project attached'}</span></td>
                                    <td>{campaign.status}</td>
                                    <td>{campaign.sent.toLocaleString()}</td>
                                    <td>{campaign.replied.toLocaleString()}</td>
                                    <td>{campaign.bounced.toLocaleString()}</td>
                                    <td>{campaign.reply_rate.toFixed(1)}%</td>
                                    <td>{campaign.active_enrollments.toLocaleString()}</td>
                                </tr>
                            ))}
                            {current.campaign_leaderboard.length === 0 ? <tr><td colSpan={7} className={styles.finePrint}>Launch a campaign to unlock campaign analytics.</td></tr> : null}
                        </tbody>
                    </table>
                </div>
                <PaginationFooter
                    page={safeLeaderboardPage}
                    totalItems={current.campaign_leaderboard.length}
                    label="campaigns"
                    onPageChange={setLeaderboardPage}
                />
            </div>
        );
    }

    function renderDrawer() {
        if (!selectedCampaign) return null;
        return (
            <>
                <div className={styles.drawerBackdrop} onClick={() => updateUrl({ campaignId: null })} />
                <aside className={styles.drawer} aria-label="Campaign analytics detail">
                    <div className={styles.drawerHeader}>
                        <div>
                            <div className={styles.eyebrow}>Campaign detail</div>
                            <h2 className={styles.drawerTitle}>{currentDetail?.campaign.campaign_name ?? 'Campaign'}</h2>
                        </div>
                        <button type="button" className="tahoe-button-secondary" onClick={() => updateUrl({ campaignId: null })}>Close</button>
                    </div>
                    <AnalyticsTabs tabs={detailTabs} value={detailTab} onChange={setDetailTab} label="Campaign detail sections" />
                    <div className={styles.drawerContent}>
                        {detailError && !currentDetail ? <div className={styles.emptyState}><h2>Detail unavailable</h2><p>{detailError}</p></div> : null}
                        {detailLoading && !currentDetail ? <div className={styles.emptyState}><h2>Loading detail</h2><p>Reading campaign rollups.</p></div> : null}
                        {currentDetail ? (
                            <div className={styles.sectionStack}>
                                <RollupFreshness data={currentDetail} />
                                {detailTab === 'overview' ? (
                                    <div className={styles.metricStrip}>
                                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Sent</div><div className={styles.metricValue}>{currentDetail.campaign.sent.toLocaleString()}</div></div>
                                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Replies</div><div className={styles.metricValue}>{currentDetail.campaign.replied.toLocaleString()}</div></div>
                                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Bounced</div><div className={styles.metricValue}>{currentDetail.campaign.bounced.toLocaleString()}</div></div>
                                        <div className={styles.metricPanel}><div className={styles.metricLabel}>Reply rate</div><div className={styles.metricValue}>{currentDetail.campaign.reply_rate.toFixed(1)}%</div></div>
                                    </div>
                                ) : null}
                                {detailTab === 'trend' ? (
                                    <div className={styles.gridTwo}>
                                        <div className={styles.card}><h2 className={styles.cardTitle}>Daily sends</h2><Sparkline values={currentDetail.daily.map((point) => point.value)} /></div>
                                        <div className={styles.card}><h2 className={styles.cardTitle}>Reply rate</h2><Sparkline values={currentDetail.reply_rate_trend.map((point) => point.value)} stroke="var(--tahoe-color-success)" /></div>
                                    </div>
                                ) : null}
                                {detailTab === 'audience' ? (
                                    <div className={styles.card}>
                                        <h2 className={styles.cardTitle}>Audience status</h2>
                                        <BarList rows={currentDetail.status_breakdown.map((row) => ({ key: row.status, label: row.status, value: row.count, percentage: row.percentage, metadata: {} }))} emptyTitle="No enrollments yet" emptyCopy="Launch this campaign to see audience state." />
                                    </div>
                                ) : null}
                                {detailTab === 'delivery' ? (
                                    <div className={styles.sectionStack}>
                                        <div className={styles.card}>
                                            <h2 className={styles.cardTitle}>Task health</h2>
                                            <div className={styles.metricStrip}>
                                                {currentDetail.task_health.map((item) => <div key={item.key} className={styles.metricPanel}><div className={styles.metricLabel}>{item.label}</div><div className={styles.metricValue}>{item.display_value}</div></div>)}
                                                {currentDetail.task_health.length === 0 ? <div className={styles.finePrint}>No delivery tasks found for this campaign.</div> : null}
                                            </div>
                                        </div>
                                        <div className={styles.tableCard}>
                                            <div className={styles.tableScroll}>
                                                <table className={styles.table}>
                                                    <thead><tr><th>Candidate</th><th>Status</th><th>Step</th><th>Next send</th></tr></thead>
                                                    <tbody>
                                                        {visibleDeliveryRows.map((enrollment) => (
                                                            <tr key={enrollment.id}>
                                                                <td>{enrollment.candidate_name || 'Candidate'}<span className={styles.subtext}>{enrollment.job_title || ''} {enrollment.company_name ? `· ${enrollment.company_name}` : ''}</span></td>
                                                                <td>{enrollment.status}</td>
                                                                <td>{enrollment.current_step_order}</td>
                                                                <td>{enrollment.next_send_at ? new Date(enrollment.next_send_at).toLocaleString() : '—'}</td>
                                                            </tr>
                                                        ))}
                                                        {currentDetail.enrollments.length === 0 ? <tr><td colSpan={4} className={styles.finePrint}>No enrollments found for this campaign.</td></tr> : null}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <PaginationFooter
                                                page={safeDeliveryPage}
                                                totalItems={currentDetail.enrollments.length}
                                                label="enrollments"
                                                onPageChange={setDeliveryPage}
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </aside>
            </>
        );
    }

    return (
        <section className={`${styles.page} ${styles.animateIn}`}>
            <div className={styles.header}>
                <div className={styles.headerTools}>
                    {revalidating ? <span className={styles.finePrint}>Refreshing…</span> : null}
                    <RangeTabs value={range} onChange={(nextRange) => updateUrl({ range: nextRange })} />
                </div>
            </div>
            <AnalyticsTabs tabs={campaignTabs} value={tab} onChange={(nextTab) => updateUrl({ tab: nextTab })} label="Campaign performance sections" />
            <div className={styles.contentRegion}>
                {error && !data ? (
                    <div className={styles.emptyState}><h2>Campaign analytics unavailable</h2><p>{error}</p></div>
                ) : loading || !data ? (
                    <div className={styles.emptyState}><h2>Loading campaign performance</h2><p>Reading campaign rollups.</p></div>
                ) : (
                    <>
                        {error ? <div className={styles.noticeBanner}>{error}</div> : null}
                        <RollupFreshness data={data} />
                        {tab === 'summary' ? renderSummary(data) : null}
                        {tab === 'leaderboard' ? renderLeaderboard(data) : null}
                    </>
                )}
            </div>
            {renderDrawer()}
        </section>
    );
}

export default function AnalyticsCampaignsPage() {
    return (
        <Suspense fallback={<section className={styles.page}><div className={styles.emptyState} /></section>}>
            <CampaignsContent />
        </Suspense>
    );
}
