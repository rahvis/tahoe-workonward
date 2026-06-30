import { describe, expect, test } from "vitest";
import { scoreToMatch, MATCH_FLOOR, MATCH_CEIL } from "./match-score";

describe("scoreToMatch", () => {
    test("returns null for missing scores", () => {
        expect(scoreToMatch(null)).toBeNull();
        expect(scoreToMatch(undefined)).toBeNull();
        expect(scoreToMatch(Number.NaN)).toBeNull();
    });

    test("maps the FLOOR/CEIL anchors to 0% and 100%", () => {
        expect(scoreToMatch(MATCH_FLOOR)?.pct).toBe(0);
        expect(scoreToMatch(MATCH_CEIL)?.pct).toBe(100);
    });

    test("clamps out-of-band scores to [0, 100]", () => {
        expect(scoreToMatch(MATCH_FLOOR - 100)?.pct).toBe(0);
        expect(scoreToMatch(MATCH_CEIL + 100)?.pct).toBe(100);
    });

    test("live agentic top match (~54) reads as a Strong, high-percentage match", () => {
        const match = scoreToMatch(54.66);
        expect(match?.tier).toBe("strong");
        expect(match?.label).toBe("Strong");
        expect(match?.pct).toBeGreaterThanOrEqual(80);
    });

    test("mid-band scores read as Good", () => {
        const match = scoreToMatch(42.7);
        expect(match?.pct).toBe(65);
        expect(match?.tier).toBe("good");
        expect(match?.label).toBe("Good");
    });

    test("weak scores read as Possible", () => {
        const match = scoreToMatch(9.5);
        expect(match?.tier).toBe("possible");
        expect(match?.label).toBe("Possible");
    });

    test("Match % is monotonic with the raw score (never reorders rows)", () => {
        const low = scoreToMatch(20)!.pct;
        const mid = scoreToMatch(40)!.pct;
        const high = scoreToMatch(58)!.pct;
        expect(low).toBeLessThan(mid);
        expect(mid).toBeLessThan(high);
    });
});
