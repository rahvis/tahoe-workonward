"use client";

import styles from "./preview-cap-banner.module.css";

export const PREVIEW_CAP = 100;
export const PREVIEW_PAGE_LIMIT = 5;

export interface PreviewCapBannerProps {
    totalResults: number;
    previewTotalResults: number;
    totalPages: number;
    className?: string;
}

export function buildPreviewCapMessage(props: {
    previewTotalResults: number;
    totalResults: number;
    totalPages: number;
}): string {
    const previewTotal = Math.max(0, Math.min(props.previewTotalResults, PREVIEW_CAP));
    const totalResults = Math.max(0, props.totalResults || 0);
    const totalPages = Math.max(1, Math.min(props.totalPages || PREVIEW_PAGE_LIMIT, PREVIEW_PAGE_LIMIT));
    return `Preview window: top ${previewTotal} of ${totalResults.toLocaleString()} total matches across ${totalPages} pages.`;
}

export default function PreviewCapBanner({
    totalResults,
    previewTotalResults,
    totalPages,
    className,
}: PreviewCapBannerProps) {
    if (!totalResults && !previewTotalResults) return null;
    const message = buildPreviewCapMessage({ previewTotalResults, totalResults, totalPages });
    return (
        <div className={`${styles.banner} ${className || ""}`.trim()} role="status">
            {message}
        </div>
    );
}
