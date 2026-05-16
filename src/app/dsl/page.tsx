"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./dsl.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type DslStatus = "success" | "diagnosis" | "dsl_invalid" | "error";

interface DslEntry {
    _id: string;
    created_at: string | null;
    search_prompt: string | null;
    dsl_query: Record<string, unknown> | null;
    status: DslStatus;
    pipeline: string;
    query_hash: string | null;
    search_session_id: string | null;
}

interface DslResponse {
    entries: DslEntry[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

const FILTERS: Array<{ label: string; value: DslStatus | null }> = [
    { label: "All", value: null },
    { label: "Success", value: "success" },
    { label: "Diagnosis", value: "diagnosis" },
    { label: "Invalid DSL", value: "dsl_invalid" },
    { label: "Errors", value: "error" },
];

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    const date = new Date(iso);
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

function formatJson(obj: unknown): string {
    if (!obj) return "null";
    try {
        return JSON.stringify(obj, null, 2);
    } catch {
        return String(obj);
    }
}

function statusLabel(status: DslStatus): string {
    switch (status) {
        case "dsl_invalid":
            return "Invalid DSL";
        case "diagnosis":
            return "Diagnosis";
        case "error":
            return "Error";
        default:
            return "Success";
    }
}

export default function DslPage() {
    const [data, setData] = useState<DslResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<DslStatus | null>(null);

    const fetchDslEntries = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page) });
            if (statusFilter) {
                params.set("status", statusFilter);
            }
            const response = await fetch(`${API_URL}/dsl?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const payload: DslResponse = await response.json();
            setData(payload);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to fetch DSL audit records");
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchDslEntries();
    }, [fetchDslEntries]);

    const handleStatusChange = (nextStatus: DslStatus | null) => {
        setStatusFilter(nextStatus);
        setPage(1);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.logoLink}>
                        ← TahoeAI
                    </Link>
                    <div>
                        <h1 className={styles.title}>DSL Audit Feed</h1>
                        <p className={styles.subtitle}>Executed recruiter prompts and generated Elasticsearch DSL</p>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.label}
                            className={`${styles.filterButton} ${statusFilter === filter.value ? styles.filterButtonActive : ""}`}
                            onClick={() => handleStatusChange(filter.value)}
                            type="button"
                        >
                            {filter.label}
                        </button>
                    ))}
                    {data && <span className={styles.totalBadge}>{data.total} total</span>}
                </div>
            </div>

            <div className={styles.body}>
                {error && <div className={styles.errorBanner}>⚠ {error}</div>}

                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner} />
                        <span className={styles.loadingText}>Loading DSL records…</span>
                    </div>
                ) : !data || data.entries.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>∅</span>
                        <span className={styles.emptyText}>No DSL records found</span>
                        <span className={styles.emptySubtext}>Run a search to populate the public audit feed.</span>
                    </div>
                ) : (
                    <>
                        <div className={styles.feed}>
                            {data.entries.map((entry) => (
                                <article key={entry._id} className={styles.entryCard}>
                                    <div className={styles.entryHeader}>
                                        <div className={styles.entryMeta}>
                                            <span className={`${styles.statusBadge} ${styles[`status_${entry.status}`]}`}>
                                                {statusLabel(entry.status)}
                                            </span>
                                            <span className={styles.pipelineBadge}>{entry.pipeline}</span>
                                        </div>
                                        <span className={styles.timestamp}>{formatDate(entry.created_at)}</span>
                                    </div>

                                    <div className={styles.entryGrid}>
                                        <section className={styles.pane}>
                                            <div className={styles.paneLabel}>Recruiter Search</div>
                                            <p className={styles.promptText}>{entry.search_prompt || "—"}</p>
                                        </section>

                                        <section className={styles.pane}>
                                            <div className={styles.paneLabel}>Generated DSL</div>
                                            <pre className={styles.codeBlock}>{formatJson(entry.dsl_query)}</pre>
                                        </section>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className={styles.pagination}>
                            <button
                                type="button"
                                className={styles.paginationButton}
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                disabled={!data.has_prev}
                            >
                                Previous
                            </button>
                            <span className={styles.paginationText}>
                                Page {data.page} of {data.total_pages}
                            </span>
                            <button
                                type="button"
                                className={styles.paginationButton}
                                onClick={() => setPage((current) => current + 1)}
                                disabled={!data.has_next}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
