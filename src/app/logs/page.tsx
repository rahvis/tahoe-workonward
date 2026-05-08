"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./logs.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LogEntry {
    _id: string;
    created_at: string | null;
    user_id: string | null;
    user_email: string | null;
    search_prompt: string | null;
    ui_filters: Record<string, unknown> | null;
    pipeline_version: string | null;
    query_hash: string | null;
    is_cached: boolean | null;
    intent_raw: Record<string, unknown> | null;
    intent_expanded: Record<string, unknown> | null;
    dsl_query: Record<string, unknown> | null;
    ambiguous_terms: string[] | null;
    total_results: number | null;
    results_returned: number | null;
    ui_page: number | null;
    duration_ms: number | null;
    status: string | null;
    error_type: string | null;
    error_detail: string | null;
}

interface LogsData {
    logs: LogEntry[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export default function LogsPage() {
    const [data, setData] = useState<LogsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page) });
            if (statusFilter) params.set("status", statusFilter);
            const resp = await fetch(`${API_URL}/logs?${params}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json: LogsData = await resp.json();
            setData(json);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleStatusFilter = (s: string | null) => {
        setStatusFilter(s);
        setPage(1);
        setExpandedId(null);
    };

    const formatDate = (iso: string | null) => {
        if (!iso) return "—";
        const d = new Date(iso);
        return d.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
    };

    const formatDuration = (ms: number | null) => {
        if (ms === null || ms === undefined) return "—";
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatJson = (obj: unknown) => {
        if (!obj) return "null";
        try {
            return JSON.stringify(obj, null, 2);
        } catch {
            return String(obj);
        }
    };

    return (
        <div className={styles.container}>
            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <a href="/" className={styles.logoLink}>
                        ← TahoeAI
                    </a>
                    <div>
                        <h1 className={styles.title}>Search Logs</h1>
                        <p className={styles.subtitle}>Pipeline execution history</p>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <button
                        className={`${styles.filterButton} ${statusFilter === null ? styles.filterButtonActive : ""}`}
                        onClick={() => handleStatusFilter(null)}
                    >
                        All
                    </button>
                    <button
                        className={`${styles.filterButton} ${statusFilter === "success" ? styles.filterButtonActive : ""}`}
                        onClick={() => handleStatusFilter("success")}
                    >
                        ✓ Success
                    </button>
                    <button
                        className={`${styles.filterButton} ${statusFilter === "error" ? styles.filterButtonActive : ""}`}
                        onClick={() => handleStatusFilter("error")}
                    >
                        ✗ Errors
                    </button>
                    {data && (
                        <span className={styles.totalBadge}>
                            {data.total} total
                        </span>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className={styles.body}>
                {error && <div className={styles.errorBanner}>⚠ {error}</div>}

                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner} />
                        <span className={styles.loadingText}>Loading logs…</span>
                    </div>
                ) : !data || data.logs.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>📋</span>
                        <span className={styles.emptyText}>No logs found</span>
                        <span className={styles.emptySubtext}>
                            Run a search to generate log entries
                        </span>
                    </div>
                ) : (
                    <>
                        {data.logs.map((log) => {
                            const isOpen = expandedId === log._id;
                            return (
                                <div key={log._id} className={styles.logCard}>
                                    {/* ── Card header (always visible) ── */}
                                    <div
                                        className={styles.cardHeader}
                                        onClick={() => setExpandedId(isOpen ? null : log._id)}
                                    >
                                        <div className={styles.cardHeaderLeft}>
                                            <span
                                                className={`${styles.statusDot} ${log.status === "success"
                                                        ? styles.statusSuccess
                                                        : styles.statusError
                                                    }`}
                                            />
                                            <span className={styles.prompt}>
                                                {log.search_prompt || "—"}
                                            </span>
                                        </div>
                                        <div className={styles.cardMeta}>
                                            <span className={styles.metaItem}>
                                                🕐 <span className={styles.metaValue}>{formatDate(log.created_at)}</span>
                                            </span>
                                            <span className={styles.metaItem}>
                                                ⚡ <span className={styles.metaValue}>{formatDuration(log.duration_ms)}</span>
                                            </span>
                                            <span className={styles.metaItem}>
                                                📊 <span className={styles.metaValue}>{log.total_results ?? "—"}</span>
                                            </span>
                                            <span
                                                className={`${styles.pipelineBadge} ${log.pipeline_version === "v2"
                                                        ? styles.pipelineV2
                                                        : styles.pipelineV1
                                                    }`}
                                            >
                                                {log.pipeline_version || "?"}
                                            </span>
                                        </div>
                                        <span
                                            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""
                                                }`}
                                        >
                                            ▼
                                        </span>
                                    </div>

                                    {/* ── Expanded card body ── */}
                                    {isOpen && (
                                        <div className={styles.cardBody}>
                                            {/* Overview */}
                                            <div className={styles.section}>
                                                <div className={styles.sectionTitle}>Overview</div>
                                                <div className={styles.infoGrid}>
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.infoLabel}>User:</span>
                                                        <span className={styles.infoValue}>
                                                            {log.user_email || log.user_id || "—"}
                                                        </span>
                                                    </div>
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.infoLabel}>Status:</span>
                                                        <span className={styles.infoValue}>
                                                            {log.status || "—"}
                                                        </span>
                                                    </div>
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.infoLabel}>Duration:</span>
                                                        <span className={styles.infoValue}>
                                                            {formatDuration(log.duration_ms)}
                                                        </span>
                                                    </div>
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.infoLabel}>Results:</span>
                                                        <span className={styles.infoValue}>
                                                            {log.results_returned ?? "—"} / {log.total_results ?? "—"}
                                                        </span>
                                                    </div>
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.infoLabel}>Page:</span>
                                                        <span className={styles.infoValue}>
                                                            {log.ui_page ?? "—"}
                                                        </span>
                                                    </div>
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.infoLabel}>Cached:</span>
                                                        <span className={styles.infoValue}>
                                                            {log.is_cached ? "Yes" : "No"}
                                                        </span>
                                                    </div>
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.infoLabel}>Query Hash:</span>
                                                        <span className={styles.infoValue}>
                                                            {log.query_hash
                                                                ? `${log.query_hash.substring(0, 16)}…`
                                                                : "—"}
                                                        </span>
                                                    </div>
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.infoLabel}>Pipeline:</span>
                                                        <span className={styles.infoValue}>
                                                            {log.pipeline_version || "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Error details (if any) */}
                                            {log.error_type && (
                                                <div className={styles.section}>
                                                    <div className={styles.sectionTitle}>Error</div>
                                                    <div className={styles.tagList}>
                                                        <span className={`${styles.tag} ${styles.tagError}`}>
                                                            {log.error_type}
                                                        </span>
                                                    </div>
                                                    {log.error_detail && (
                                                        <div className={styles.jsonBlock} style={{ marginTop: 8 }}>
                                                            {log.error_detail}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Ambiguous terms */}
                                            {log.ambiguous_terms && log.ambiguous_terms.length > 0 && (
                                                <div className={styles.section}>
                                                    <div className={styles.sectionTitle}>
                                                        Ambiguous Terms
                                                    </div>
                                                    <div className={styles.tagList}>
                                                        {log.ambiguous_terms.map((t, i) => (
                                                            <span key={i} className={styles.tag}>
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* UI Filters */}
                                            {log.ui_filters && Object.keys(log.ui_filters).length > 0 && (
                                                <div className={styles.section}>
                                                    <div className={styles.sectionTitle}>UI Filters</div>
                                                    <div className={styles.jsonBlock}>
                                                        {formatJson(log.ui_filters)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Intent Raw */}
                                            {log.intent_raw && (
                                                <div className={styles.section}>
                                                    <div className={styles.sectionTitle}>
                                                        Stage 1 — Raw Intent (LLM Output)
                                                    </div>
                                                    <div className={styles.jsonBlock}>
                                                        {formatJson(log.intent_raw)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Intent Expanded */}
                                            {log.intent_expanded && (
                                                <div className={styles.section}>
                                                    <div className={styles.sectionTitle}>
                                                        Stage 2 — Expanded Intent
                                                    </div>
                                                    <div className={styles.jsonBlock}>
                                                        {formatJson(log.intent_expanded)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* DSL Query */}
                                            {log.dsl_query && (
                                                <div className={styles.section}>
                                                    <div className={styles.sectionTitle}>
                                                        Stage 3+4 — Final ES DSL Query
                                                    </div>
                                                    <div className={styles.jsonBlock}>
                                                        {formatJson(log.dsl_query)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* ── Pagination ── */}
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageButton}
                                disabled={!data.has_prev}
                                onClick={() => {
                                    setPage((p) => p - 1);
                                    setExpandedId(null);
                                }}
                            >
                                ← Prev
                            </button>
                            <span className={styles.pageInfo}>
                                Page{" "}
                                <span className={styles.pageInfoBold}>{data.page}</span> of{" "}
                                <span className={styles.pageInfoBold}>{data.total_pages}</span>
                            </span>
                            <button
                                className={styles.pageButton}
                                disabled={!data.has_next}
                                onClick={() => {
                                    setPage((p) => p + 1);
                                    setExpandedId(null);
                                }}
                            >
                                Next →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
