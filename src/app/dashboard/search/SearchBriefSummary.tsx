"use client";

import { Badge, Button, Text } from "@/components/ui/tahoe-ui";
import type { SearchRequirementsSummary } from "@/lib/api";
import styles from "./langgraph-search.module.css";

function listText(items: string[], fallback = "Not set"): string {
    return items.length ? items.join(", ") : fallback;
}

function summaryList(
    summary: SearchRequirementsSummary,
    key: "must_have" | "nice_to_have" | "location" | "company_context" | "assumptions",
): string[] {
    const value = summary[key];
    return Array.isArray(value) ? value : [];
}

export default function SearchBriefSummary({
    summary,
    roleTitle,
    missingSlots,
    readinessScore,
    compact = false,
    onOpen,
}: {
    summary: SearchRequirementsSummary | null;
    roleTitle: string;
    missingSlots: string[];
    readinessScore: number;
    compact?: boolean;
    onOpen?: () => void;
}) {
    if (!summary) {
        return (
            <div className={compact ? styles.searchBriefCollapsed : styles.searchBriefSummary}>
                <Text size="2" color="gray">
                    Paste a job description and generate a plan before spending Coresignal credits.
                </Text>
                {onOpen ? (
                    <Button size="1" variant="soft" onClick={onOpen}>
                        Search brief
                    </Button>
                ) : null}
            </div>
        );
    }

    if (compact) {
        return (
            <div className={styles.searchBriefCollapsed}>
                <div className={styles.searchBriefCollapsedText}>
                    <Text size="1" weight="bold">Search brief</Text>
                    <Text size="2">
                        {summary.title || roleTitle || "Untitled role"}
                        {summaryList(summary, "must_have").length
                            ? `, ${summaryList(summary, "must_have").slice(0, 3).join(", ")}`
                            : ""}
                    </Text>
                </div>
                <Badge color="orange" variant="soft" radius="full">
                    {readinessScore}
                </Badge>
                {onOpen ? (
                    <Button size="1" variant="soft" onClick={onOpen}>
                        Open
                    </Button>
                ) : null}
            </div>
        );
    }

    return (
        <div className={styles.intakeSummaryGrid}>
            <div>
                <Text size="1" weight="bold">Title</Text>
                <Text size="2">{summary.title || roleTitle || "Not set"}</Text>
            </div>
            <div>
                <Text size="1" weight="bold">Must-have</Text>
                <Text size="2">{listText(summaryList(summary, "must_have"))}</Text>
            </div>
            <div>
                <Text size="1" weight="bold">Nice-to-have</Text>
                <Text size="2">{listText(summaryList(summary, "nice_to_have"))}</Text>
            </div>
            <div>
                <Text size="1" weight="bold">Missing</Text>
                <Text size="2">{listText(missingSlots, "None")}</Text>
            </div>
            <div>
                <Text size="1" weight="bold">Location</Text>
                <Text size="2">{listText(summaryList(summary, "location"))}</Text>
            </div>
            <div>
                <Text size="1" weight="bold">Company context</Text>
                <Text size="2">{listText(summaryList(summary, "company_context"))}</Text>
            </div>
            <div>
                <Text size="1" weight="bold">Experience</Text>
                <Text size="2">{summary.experience || "Not set"}</Text>
            </div>
            <div>
                <Text size="1" weight="bold">Assumptions</Text>
                <Text size="2">{listText(summaryList(summary, "assumptions"), "None")}</Text>
            </div>
        </div>
    );
}
