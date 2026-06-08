"use client";

import type { SearchSourceType } from "@/lib/api";
import styles from "./langgraph-search.module.css";

const SEARCH_SOURCE_OPTIONS: Array<{ value: SearchSourceType; label: string }> = [
    { value: "prompt", label: "Prompt" },
    { value: "job_description", label: "Job description" },
    { value: "prompt_and_job_description", label: "Prompt + JD" },
];

export default function SearchSourceTabs({
    value,
    disabled = false,
    onChange,
}: {
    value: SearchSourceType;
    disabled?: boolean;
    onChange: (value: SearchSourceType) => void;
}) {
    return (
        <div className={styles.sourceTabs} role="tablist" aria-label="Search source">
            {SEARCH_SOURCE_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={value === option.value}
                    disabled={disabled}
                    className={`${styles.sourceTab} ${value === option.value ? styles.sourceTabActive : ""}`}
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
