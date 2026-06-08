"use client";

import { useState } from "react";
import { Badge, Button, Heading, Spinner, Text } from "@/components/ui/tahoe-ui";
import type {
    AIReasoningItem,
    SearchIntakeQuestion,
    SearchIntakeStatus,
    SearchRequirementsSummary,
} from "@/lib/api";
import AIReasoningPanel from "./AIReasoningPanel";
import SearchBriefSummary from "./SearchBriefSummary";
import styles from "./langgraph-search.module.css";

type ReasoningView = "summary" | "evidence" | "filters" | "assumptions" | "not_used";
type AssistantTab = "summary" | "questions" | "reasoning";

export interface AIIntakeSurfaceProps {
    status: SearchIntakeStatus;
    summary: SearchRequirementsSummary | null;
    roleTitle: string;
    questions: SearchIntakeQuestion[];
    missingSlots: string[];
    readinessScore: number;
    reasoningSummary: string | null;
    reasoningItems: AIReasoningItem[];
    reasoningView: ReasoningView;
    pendingQuestionId: string | null;
    isBusy: boolean;
    canGeneratePlan: boolean;
    canFindCandidates: boolean;
    onGeneratePlan: () => void;
    onAnswerQuestion: (question: SearchIntakeQuestion, answer: unknown) => void;
    onUseDefault: (question: SearchIntakeQuestion) => void;
    onSkip: (question: SearchIntakeQuestion) => void;
    onOpenFilters: () => void;
    onFindCandidates: () => void;
    onReasoningViewChange: (view: ReasoningView) => void;
    onCollapse?: () => void;
}

function statusTitle(status: SearchIntakeStatus, questionCount: number): string {
    if (status === "generating") return "Building search plan";
    if (status === "needs_clarification") {
        return `${questionCount} question${questionCount === 1 ? "" : "s"} before search`;
    }
    if (status === "ready_for_review" || status === "executed") return "Ready to search";
    if (status === "failed") return "Needs attention";
    return "AI Search Assistant";
}

function nextTabForState(status: SearchIntakeStatus, questions: SearchIntakeQuestion[]): AssistantTab {
    if (questions.length > 0 || status === "needs_clarification") return "questions";
    if (status === "ready_for_review" || status === "executed") return "summary";
    return "summary";
}

export function AIIntakeContent(props: AIIntakeSurfaceProps) {
    const [manualTab, setManualTab] = useState<AssistantTab | null>(null);
    const activeTab = manualTab ?? nextTabForState(props.status, props.questions);
    const visibleQuestions = props.questions.slice(0, 3);

    return (
        <>
            <div className={styles.intakeSurfaceHeader}>
                <div>
                    <Text size="1" weight="bold" className={styles.intakeEyebrow}>AI Search Assistant</Text>
                    <Heading size="3" className={styles.intakeTitle}>
                        {statusTitle(props.status, props.questions.length)}
                    </Heading>
                </div>
                <Badge color="orange" variant="soft" radius="full">
                    Readiness {props.readinessScore}
                </Badge>
            </div>

            <div className={styles.assistantTabs} role="tablist" aria-label="AI intake views">
                {([
                    ["summary", "Summary"],
                    ["questions", "Questions"],
                    ["reasoning", "Reasoning"],
                ] as const).map(([tab, label]) => (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        className={`${styles.assistantTab} ${activeTab === tab ? styles.assistantTabActive : ""}`}
                        onClick={() => setManualTab(tab)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {props.status === "generating" ? (
                <div className={styles.intakeLoadingState} role="status" aria-live="polite">
                    <Spinner size="3" />
                    <Text size="2">Reading the JD and mapping it to searchable filters.</Text>
                </div>
            ) : null}

            {activeTab === "summary" ? (
                <div className={styles.assistantTabPanel}>
                    <SearchBriefSummary
                        summary={props.summary}
                        roleTitle={props.roleTitle}
                        missingSlots={props.missingSlots}
                        readinessScore={props.readinessScore}
                    />
                    <div className={styles.intakeActionRow}>
                        {!props.summary ? (
                            <Button
                                size="2"
                                variant="soft"
                                disabled={!props.canGeneratePlan || props.isBusy}
                                onClick={props.onGeneratePlan}
                            >
                                {props.status === "generating" ? <Spinner /> : "Generate search plan"}
                            </Button>
                        ) : null}
                        <Button size="2" variant="soft" onClick={props.onOpenFilters}>
                            Open filters
                        </Button>
                        <Button size="2" disabled={!props.canFindCandidates || props.isBusy} onClick={props.onFindCandidates}>
                            {props.isBusy ? <Spinner /> : "Find candidates"}
                        </Button>
                    </div>
                </div>
            ) : null}

            {activeTab === "questions" ? (
                <div className={styles.assistantTabPanel}>
                    {visibleQuestions.length > 0 ? (
                        visibleQuestions.map((question) => (
                            <div key={question.id} className={styles.intakeQuestion}>
                                <Text size="1" weight="bold">{question.question}</Text>
                                {question.options.length > 0 ? (
                                    <div className={styles.intakeOptionRow}>
                                        {question.options.map((option) => (
                                            <Button
                                                key={option.label}
                                                size="1"
                                                variant="soft"
                                                disabled={props.pendingQuestionId === question.id || props.isBusy}
                                                onClick={() => props.onAnswerQuestion(question, option)}
                                            >
                                                {props.pendingQuestionId === question.id ? <Spinner /> : option.label}
                                            </Button>
                                        ))}
                                    </div>
                                ) : null}
                                <div className={styles.intakeActionRow}>
                                    <Button
                                        size="1"
                                        variant="soft"
                                        disabled={props.pendingQuestionId === question.id || props.isBusy}
                                        onClick={() => props.onUseDefault(question)}
                                    >
                                        Use defaults
                                    </Button>
                                    <Button
                                        size="1"
                                        variant="ghost"
                                        disabled={props.pendingQuestionId === question.id || props.isBusy}
                                        onClick={() => props.onSkip(question)}
                                    >
                                        Skip
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <Text size="2" color="gray">No open questions. Review filters or run the search.</Text>
                    )}
                    <div className={styles.intakePrimaryFooter}>
                        <Button size="2" variant="soft" onClick={props.onOpenFilters}>
                            Open filters
                        </Button>
                        <Button size="2" disabled={!props.canFindCandidates || props.isBusy} onClick={props.onFindCandidates}>
                            {props.isBusy ? <Spinner /> : "Find candidates"}
                        </Button>
                    </div>
                </div>
            ) : null}

            {activeTab === "reasoning" ? (
                <AIReasoningPanel
                    reasoningSummary={props.reasoningSummary}
                    items={props.reasoningItems}
                    activeView={props.reasoningView}
                    onViewChange={props.onReasoningViewChange}
                    onEditFilters={props.onOpenFilters}
                />
            ) : null}
        </>
    );
}

export default function AIIntakeDrawer(props: AIIntakeSurfaceProps) {
    return (
        <aside className={styles.aiIntakeDrawer} aria-label="AI Search Assistant">
            <AIIntakeContent {...props} />
            {props.onCollapse ? (
                <Button size="1" variant="ghost" className={styles.drawerCollapseButton} onClick={props.onCollapse}>
                    Collapse
                </Button>
            ) : null}
        </aside>
    );
}
