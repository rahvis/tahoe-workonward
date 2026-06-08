"use client";

import { Badge, Button, Text } from "@/components/ui/tahoe-ui";
import type { AIReasoningItem } from "@/lib/api";
import styles from "./langgraph-search.module.css";

type ReasoningView = "summary" | "evidence" | "filters" | "assumptions" | "not_used";

const REASONING_TABS: Array<{ value: ReasoningView; label: string }> = [
    { value: "summary", label: "Reasoning" },
    { value: "evidence", label: "Evidence from JD" },
    { value: "filters", label: "Mapped filters" },
    { value: "assumptions", label: "Assumptions" },
    { value: "not_used", label: "Not used" },
];

function confidenceColor(confidence: AIReasoningItem["confidence"]): "orange" | "gray" {
    return confidence === "high" || confidence === "medium" ? "orange" : "gray";
}

function itemMatchesView(item: AIReasoningItem, view: ReasoningView): boolean {
    if (view === "summary") return true;
    if (view === "evidence") {
        return item.source === "job_description" || item.source === "search_prompt" || item.source === "recruiter_answer";
    }
    if (view === "filters") {
        return Boolean(item.affected_filter_path) || item.type === "filter_mapping" || item.type === "answer_update";
    }
    if (view === "assumptions") {
        return item.type === "assumption" || item.type === "confidence_note";
    }
    if (view === "not_used") {
        return item.type === "non_queryable_criterion" || item.type === "schema_guardrail";
    }
    return false;
}

function groupTitle(view: ReasoningView): string {
    if (view === "evidence") return "Evidence from JD";
    if (view === "filters") return "Mapped filters";
    if (view === "assumptions") return "Assumptions";
    if (view === "not_used") return "Not used";
    return "Why Tahoe chose this";
}

export default function AIReasoningPanel({
    reasoningSummary,
    items,
    activeView,
    onViewChange,
    onEditFilters,
}: {
    reasoningSummary: string | null;
    items: AIReasoningItem[];
    activeView: ReasoningView;
    onViewChange: (view: ReasoningView) => void;
    onEditFilters: () => void;
}) {
    const visibleItems = items
        .filter((item) => item.visible_to_recruiter)
        .filter((item) => itemMatchesView(item, activeView))
        .slice(0, activeView === "summary" ? 5 : 8);

    return (
        <section className={styles.reasoningPanel} aria-label="AI reasoning">
            <div className={styles.intakeReasoningTabs}>
                {REASONING_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        className={`${styles.intakeReasoningTab} ${activeView === tab.value ? styles.intakeReasoningTabActive : ""}`}
                        onClick={() => onViewChange(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.reasoningPanelHeader}>
                <Text size="1" weight="bold">{groupTitle(activeView)}</Text>
                <Button size="1" variant="soft" onClick={onEditFilters}>
                    Edit filters
                </Button>
            </div>

            {activeView === "summary" && reasoningSummary ? (
                <Text size="2" className={styles.reasoningSummaryText}>{reasoningSummary}</Text>
            ) : null}

            {visibleItems.length > 0 ? (
                <ul className={styles.reasoningItemList}>
                    {visibleItems.map((item) => (
                        <li key={item.id} className={styles.reasoningItem}>
                            <div className={styles.reasoningItemHeader}>
                                <strong>{item.title}</strong>
                                {item.confidence ? (
                                    <Badge color={confidenceColor(item.confidence)} variant="soft" radius="full">
                                        {item.confidence}
                                    </Badge>
                                ) : null}
                            </div>
                            <span>{item.plain_language_explanation}</span>
                            <div className={styles.reasoningMeta}>
                                {item.source_excerpt_or_reference ? <span>{item.source_excerpt_or_reference}</span> : null}
                                {item.affected_filter_path ? <span>{item.affected_filter_path}</span> : null}
                                {item.coresignal_fields.length ? <span>{item.coresignal_fields.join(", ")}</span> : null}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <Text size="2" color="gray">
                    No items in this group yet.
                </Text>
            )}
        </section>
    );
}
