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
import { AnalyticsTabs, BarList, RangeTabs, RollupFreshness, Sparkline } from '../_components/charts';

type CampaignTab = 'summary' | 'leaderboard' | 'drilldown';
type DetailTab = 'overview' | 'trend' | 'audience' | 'delivery';

const rangeOptions: AnalyticsRangeKey[] = ['7d', '30d', '90d', '365d'];
const campaignTabs: Array<{ key: CampaignTab; label: string }> = [
    { key: 'summary', label: 'Summary' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'drilldown', label: 'Drilldown' },
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

function CampaignsContent() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRange = searchParams.get('range');
    const initialTab = searchParams.get('tab');
    const [range, setRange] = useState<AnalyticsRangeKey>(isRange(initialRange) ? initialRange : '7d');
    const [tab, setTab] = useState<CampaignTab>(isCampaignTab(initialTab) ? initialTab : 'summary');
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(searchParams.get('campaign_id'));
    const [detailTab, setDetailTab] = useState<DetailTab>('overview');
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
        const nextRange = searchParams.get('range');
        const nextTab = searchParams.get('tab');
        setRange(isRange(nextRange) ? nextRange : '7d');
        setTab(isCampaignTab(nextTab) ? nextTab : 'summary');
        setSelectedCampaign(searchParams.get('campaign_id'));
    }, [searchParams]);

    function updateUrl(next: { range?: AnalyticsRangeKey; tab?: CampaignTab; campaignId?: string | null }) {
        const nextRange = next.range ?? range;
        const nextTab = next.tab ?? tab;
        const nextCampaign = next.campaignId === undefined ? selectedCampaign : next.campaignId;
        setRange(nextRange);
        setTab(nextTab);
        setSelectedCampaign(nextCampaign);
        const params = new URLSearchParams(searchParams.toString());
        params.set('range', nextRange);
        params.set('tab', nextTab);
        if (nextCampaign) params.set('campaign_id', nextCampaign);
        else params.delete('campaign_id');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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

    function openCampaign(campaign: AnalyticsCampaignLeaderboardRow) {
        setDetailTab('overview');
        updateUrl({ tab: 'drilldown', campaignId: campaign.campaign_id });
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
                <table className={styles.table}>
                    <thead>
                        <tr><th>Campaign</th><th>Status</th><th>Sent</th><th>Replies</th><th>Bounced</th><th>Reply rate</th><th>Active</th></tr>
                    </thead>
                    <tbody>
                        {current.campaign_leaderboard.map((campaign) => (
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
        );
    }

    function renderDrilldown(current: AnalyticsCampaignPerformanceResponse) {
        const selected = current.campaign_leaderboard.find((campaign) => campaign.campaign_id === selectedCampaign);
        if (!selected) {
            return <div className={styles.emptyState}><h2>Select a campaign</h2><p>Open a leaderboard row to inspect campaign detail.</p></div>;
        }
        return <div className={styles.card}><h2 className={styles.cardTitle}>{selected.campaign_name}</h2><p className={styles.finePrint}>Use the drawer for granular audience, delivery, and trend details.</p></div>;
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
                            <h2 className={styles.drawerTitle}>{detail?.campaign.campaign_name ?? 'Campaign'}</h2>
                        </div>
                        <button type="button" className="tahoe-button-secondary" onClick={() => updateUrl({ campaignId: null })}>Close</button>
                    </div>
                    <AnalyticsTabs tabs={detailTabs} value={detailTab} onChange={setDetailTab} label="Campaign detail sections" />
                    {detailError && !detail ? <div className={styles.emptyState}><h2>Detail unavailable</h2><p>{detailError}</p></div> : null}
                    {detailLoading && !detail ? <div className={styles.emptyState}><h2>Loading detail</h2><p>Reading campaign rollups.</p></div> : null}
                    {detail ? (
                        <div className={styles.sectionStack}>
                            <RollupFreshness data={detail} />
                            {detailTab === 'overview' ? (
                                <div className={styles.metricStrip}>
                                    <div className={styles.metricPanel}><div className={styles.metricLabel}>Sent</div><div className={styles.metricValue}>{detail.campaign.sent.toLocaleString()}</div></div>
                                    <div className={styles.metricPanel}><div className={styles.metricLabel}>Replies</div><div className={styles.metricValue}>{detail.campaign.replied.toLocaleString()}</div></div>
                                    <div className={styles.metricPanel}><div className={styles.metricLabel}>Bounced</div><div className={styles.metricValue}>{detail.campaign.bounced.toLocaleString()}</div></div>
                                    <div className={styles.metricPanel}><div className={styles.metricLabel}>Reply rate</div><div className={styles.metricValue}>{detail.campaign.reply_rate.toFixed(1)}%</div></div>
                                </div>
                            ) : null}
                            {detailTab === 'trend' ? (
                                <div className={styles.gridTwo}>
                                    <div className={styles.card}><h2 className={styles.cardTitle}>Daily sends</h2><Sparkline values={detail.daily.map((point) => point.value)} /></div>
                                    <div className={styles.card}><h2 className={styles.cardTitle}>Reply rate</h2><Sparkline values={detail.reply_rate_trend.map((point) => point.value)} stroke="var(--tahoe-color-success)" /></div>
                                </div>
                            ) : null}
                            {detailTab === 'audience' ? (
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>Audience status</h2>
                                    <BarList rows={detail.status_breakdown.map((row) => ({ key: row.status, label: row.status, value: row.count, percentage: row.percentage, metadata: {} }))} emptyTitle="No enrollments yet" emptyCopy="Launch this campaign to see audience state." />
                                </div>
                            ) : null}
                            {detailTab === 'delivery' ? (
                                <div className={styles.sectionStack}>
                                    <div className={styles.card}>
                                        <h2 className={styles.cardTitle}>Task health</h2>
                                        <div className={styles.metricStrip}>
                                            {detail.task_health.map((item) => <div key={item.key} className={styles.metricPanel}><div className={styles.metricLabel}>{item.label}</div><div className={styles.metricValue}>{item.display_value}</div></div>)}
                                            {detail.task_health.length === 0 ? <div className={styles.finePrint}>No delivery tasks found for this campaign.</div> : null}
                                        </div>
                                    </div>
                                    <div className={styles.tableCard}>
                                        <table className={styles.table}>
                                            <thead><tr><th>Candidate</th><th>Status</th><th>Step</th><th>Next send</th></tr></thead>
                                            <tbody>
                                                {detail.enrollments.map((enrollment) => (
                                                    <tr key={enrollment.id}>
                                                        <td>{enrollment.candidate_name || 'Candidate'}<span className={styles.subtext}>{enrollment.job_title || ''} {enrollment.company_name ? `· ${enrollment.company_name}` : ''}</span></td>
                                                        <td>{enrollment.status}</td>
                                                        <td>{enrollment.current_step_order}</td>
                                                        <td>{enrollment.next_send_at ? new Date(enrollment.next_send_at).toLocaleString() : '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
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
                    {tab === 'drilldown' ? renderDrilldown(data) : null}
                </>
            )}
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
