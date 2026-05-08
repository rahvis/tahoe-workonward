"use client";

import type { ReactNode } from "react";
import styles from "./preview-grid.module.css";

export interface PreviewGridRow {
    id: number;
    full_name: string | null;
    websites_linkedin: string | null;
    headline: string | null;
    location_full: string | null;
    location_country: string | null;
    connections_count: number | null;
    follower_count: number | null;
    company_name: string | null;
    company_linkedin_url: string | null;
    company_website: string | null;
    company_industry: string | null;
    job_title: string | null;
    department: string | null;
    management_level: string | null;
    company_location_hq_full_address: string | null;
    company_location_hq_country: string | null;
    score: number | null;
    page?: number | null;
    page_rank?: number | null;
    pipeline?: string | null;
    search_prompt?: string | null;
    searched_at?: string | null;
}

type PreviewGridColumn = {
    key: string;
    label: string;
    className?: string;
    sticky?: boolean;
    render: (row: PreviewGridRow) => ReactNode;
};

function textValue(value: string | null | undefined) {
    return value?.trim() || "—";
}

function externalLink(value: string | null | undefined) {
    if (!value) return "—";
    const href = value.startsWith("http") ? value : `https://${value}`;
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            title={value}
            onClick={(event) => event.stopPropagation()}
        >
            <span className={styles.truncate}>{value}</span>
        </a>
    );
}

function formatNumber(value: number | null | undefined) {
    if (value == null) return "—";
    return value.toLocaleString();
}

function formatTimestamp(value: string | null | undefined) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

const BASE_COLUMNS: PreviewGridColumn[] = [
    {
        key: "candidate",
        label: "Candidate",
        className: `${styles.candidateCell} ${styles.stickyCell}`,
        sticky: true,
        render: (row) => (
            <div className={styles.metaBlock}>
                {row.websites_linkedin ? (
                    <a
                        href={row.websites_linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.link} ${styles.candidateName}`}
                        title={row.full_name || ""}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <span className={styles.truncate}>{textValue(row.full_name)}</span>
                    </a>
                ) : (
                    <span className={styles.candidateName}>{textValue(row.full_name)}</span>
                )}
                <span className={styles.subtle}>{textValue(row.job_title)}</span>
            </div>
        ),
    },
    {
        key: "id",
        label: "ID",
        className: styles.numericCell,
        render: (row) => formatNumber(row.id),
    },
    {
        key: "profile_url",
        label: "Professional Profile URL",
        className: styles.wideTextCell,
        render: (row) => externalLink(row.websites_linkedin),
    },
    {
        key: "headline",
        label: "Headline",
        className: styles.wideTextCell,
        render: (row) => <span className={styles.truncate} title={row.headline || ""}>{textValue(row.headline)}</span>,
    },
    {
        key: "location_full",
        label: "Full Location",
        className: styles.textCell,
        render: (row) => <span className={styles.truncate} title={row.location_full || ""}>{textValue(row.location_full)}</span>,
    },
    {
        key: "location_country",
        label: "Country",
        className: styles.narrowCell,
        render: (row) => textValue(row.location_country),
    },
    {
        key: "connections_count",
        label: "Connections",
        className: styles.numericCell,
        render: (row) => formatNumber(row.connections_count),
    },
    {
        key: "followers_count",
        label: "Followers",
        className: styles.numericCell,
        render: (row) => formatNumber(row.follower_count),
    },
    {
        key: "company_name",
        label: "Company Name",
        className: styles.textCell,
        render: (row) => <span className={styles.truncate} title={row.company_name || ""}>{textValue(row.company_name)}</span>,
    },
    {
        key: "company_url",
        label: "Company URL",
        className: styles.wideTextCell,
        render: (row) => externalLink(row.company_linkedin_url),
    },
    {
        key: "company_website",
        label: "Company Website",
        className: styles.wideTextCell,
        render: (row) => externalLink(row.company_website),
    },
    {
        key: "company_industry",
        label: "Company Industry",
        className: styles.textCell,
        render: (row) => <span className={styles.truncate} title={row.company_industry || ""}>{textValue(row.company_industry)}</span>,
    },
    {
        key: "active_experience_title",
        label: "Current Title",
        className: styles.textCell,
        render: (row) => <span className={styles.truncate} title={row.job_title || ""}>{textValue(row.job_title)}</span>,
    },
    {
        key: "department",
        label: "Department",
        className: styles.textCell,
        render: (row) => <span className={styles.truncate} title={row.department || ""}>{textValue(row.department)}</span>,
    },
    {
        key: "management_level",
        label: "Management Level",
        className: styles.textCell,
        render: (row) => row.management_level ? <span className={styles.levelBadge}>{row.management_level}</span> : "—",
    },
    {
        key: "company_hq_full_address",
        label: "Company HQ Address",
        className: styles.wideTextCell,
        render: (row) => (
            <span className={styles.truncate} title={row.company_location_hq_full_address || ""}>
                {textValue(row.company_location_hq_full_address)}
            </span>
        ),
    },
    {
        key: "company_hq_country",
        label: "Company HQ Country",
        className: styles.narrowCell,
        render: (row) => textValue(row.company_location_hq_country),
    },
    {
        key: "score",
        label: "Score",
        className: styles.numericCell,
        render: (row) => (row.score != null ? row.score.toFixed(2) : "—"),
    },
];

const METADATA_COLUMNS: PreviewGridColumn[] = [
    {
        key: "page",
        label: "Preview Page",
        className: styles.numericCell,
        render: (row) => (row.page != null ? row.page : "—"),
    },
    {
        key: "pipeline",
        label: "Pipeline",
        className: styles.narrowCell,
        render: (row) => textValue(row.pipeline),
    },
    {
        key: "searched_at",
        label: "Saved At",
        className: styles.textCell,
        render: (row) => formatTimestamp(row.searched_at),
    },
    {
        key: "search_prompt",
        label: "Search Prompt",
        className: styles.wideTextCell,
        render: (row) => <span className={styles.truncate} title={row.search_prompt || ""}>{textValue(row.search_prompt)}</span>,
    },
];

export function previewGridColumns(includeMetadata: boolean): PreviewGridColumn[] {
    return includeMetadata ? [...BASE_COLUMNS, ...METADATA_COLUMNS] : BASE_COLUMNS;
}

export default function PreviewGrid({
    rows,
    activeRowId,
    emptyMessage,
    includeMetadata = false,
    onRowClick,
}: {
    rows: PreviewGridRow[];
    activeRowId?: number | null;
    emptyMessage: string;
    includeMetadata?: boolean;
    onRowClick?: (row: PreviewGridRow) => void;
}) {
    const columns = previewGridColumns(includeMetadata);
    return (
        <div className={styles.tableShell}>
            <div className={styles.tableScroll}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={column.sticky ? styles.stickyHeader : undefined}
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <span className={styles.emptyMessage}>{emptyMessage}</span>
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr
                                    key={`${row.id}-${row.page ?? 1}`}
                                    className={`${styles.row} ${activeRowId === row.id ? styles.rowActive : ""}`.trim()}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={column.className}
                                        >
                                            {column.render(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
