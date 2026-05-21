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
    const totalResults = Math.max(0, props.totalResults || 0);
    return `Found ${totalResults.toLocaleString()} matches`;
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
