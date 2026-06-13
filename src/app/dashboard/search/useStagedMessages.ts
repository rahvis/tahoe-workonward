"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through `messages` on a timer while `active` is true, returning the
 * current message. Used to keep recruiters engaged during the parse and search
 * phases with rotating "we're working on it" copy.
 *
 * Honours `prefers-reduced-motion`: when the user prefers reduced motion we hold
 * the first message instead of rotating. When `active` flips false the index
 * resets so the next run starts from the top.
 */
export function useStagedMessages(
    messages: string[],
    active: boolean,
    intervalMs = 1800,
): string {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!active || messages.length <= 1) return;
        const prefersReducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) return;
        const timer = setInterval(() => {
            // Advance but hold on the last message rather than looping, so it
            // reads as progress rather than a spinner.
            setIndex((current) => Math.min(current + 1, messages.length - 1));
        }, intervalMs);
        // Reset on teardown so the next activation starts from the first message.
        return () => {
            clearInterval(timer);
            setIndex(0);
        };
    }, [active, messages.length, intervalMs]);

    // While inactive we always show the first message (the effect's cleanup has
    // also reset the index for the next run); guard the transition frame here.
    const effectiveIndex = active ? Math.min(index, messages.length - 1) : 0;
    return messages[effectiveIndex] ?? "";
}

export const PARSE_STAGE_MESSAGES = [
    "Understanding your request…",
    "Identifying role, location & skills…",
    "Mapping to live search filters…",
    "Almost there…",
];

export const SEARCH_STAGE_MESSAGES = [
    "Validating your filters…",
    "Searching across 700M+ profiles…",
    "Ranking the best matches…",
    "Fetching your preview…",
];
