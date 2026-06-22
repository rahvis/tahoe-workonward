"use client";

/**
 * Focused filter panel for the Coresignal agentic search mode.
 *
 * The agentic backend turns these structured filters into one natural-language
 * query (Claude Haiku→Sonnet) before calling /v2/agentic_search/fast, so this
 * panel only needs the fields that map onto the backend `SearchFilters` model —
 * not the full LangGraph PopupIntentModel.
 *
 * Two requirements drive the design:
 *   1. Autocomplete fields must ALSO accept arbitrary free text (the recruiter
 *      may want a value that isn't in the suggestion list). `TagAutocomplete`
 *      commits whatever is typed on Enter / comma / blur — suggestions are just
 *      a convenience.
 *   2. Values must survive switching between filter sub-sections. The `filters`
 *      object is owned by the parent page; this component only renders it, and
 *      half-typed text is committed on blur, so nothing is lost when the active
 *      section changes.
 */

import { useEffect, useRef, useState } from "react";
import { Badge, Box, Button, Flex, Text, TextField } from "@/components/ui/tahoe-ui";
import { Cross2Icon } from "@/components/ui/icons";
import {
    autocompleteCompany,
    autocompleteJobs,
    autocompleteLocations,
} from "@/lib/organization";

export interface AgenticFilters {
    job_titles: string[];
    companies: string[];
    location_countries: string[];
    location_states: string[];
    location_cities: string[];
    industries: string[];
    management_levels: string[];
    skills: string[];
    is_working: boolean | null;
    min_experience_months: number | null;
    max_experience_months: number | null;
}

export function emptyAgenticFilters(): AgenticFilters {
    return {
        job_titles: [],
        companies: [],
        location_countries: [],
        location_states: [],
        location_cities: [],
        industries: [],
        management_levels: [],
        skills: [],
        is_working: null,
        min_experience_months: null,
        max_experience_months: null,
    };
}

export function countActiveAgenticFilters(f: AgenticFilters): number {
    let n = 0;
    n += f.job_titles.length;
    n += f.companies.length;
    n += f.location_countries.length;
    n += f.location_states.length;
    n += f.location_cities.length;
    n += f.industries.length;
    n += f.management_levels.length;
    n += f.skills.length;
    if (f.is_working !== null) n += 1;
    if (f.min_experience_months !== null) n += 1;
    if (f.max_experience_months !== null) n += 1;
    return n;
}

export function agenticFiltersAreEmpty(f: AgenticFilters): boolean {
    return countActiveAgenticFilters(f) === 0;
}

// ---------------------------------------------------------------------------
// Free-text tag input with optional async suggestions
// ---------------------------------------------------------------------------

interface TagAutocompleteProps {
    label: string;
    placeholder?: string;
    values: string[];
    onChange: (next: string[]) => void;
    /** Optional async suggestion source. Free text is always allowed regardless. */
    fetchSuggestions?: (query: string) => Promise<string[]>;
}

export function TagAutocomplete({
    label,
    placeholder,
    values,
    onChange,
    fetchSuggestions,
}: TagAutocompleteProps) {
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const commit = (raw: string) => {
        const value = raw.trim();
        if (!value) return;
        const exists = values.some((v) => v.toLowerCase() === value.toLowerCase());
        if (!exists) onChange([...values, value]);
        setInput("");
        setSuggestions([]);
        setOpen(false);
    };

    const remove = (value: string) => {
        onChange(values.filter((v) => v !== value));
    };

    // Debounced suggestion fetch (best-effort; failures are silently ignored so
    // typing is never blocked).
    useEffect(() => {
        if (!fetchSuggestions) return;
        const q = input.trim();
        const controller = new AbortController();
        // All state changes happen inside the deferred callback (never synchronously
        // in the effect body) so a keystroke doesn't trigger a cascading render.
        const handle = setTimeout(async () => {
            if (q.length < 2) {
                setSuggestions([]);
                setOpen(false);
                return;
            }
            try {
                const items = await fetchSuggestions(q);
                if (!controller.signal.aborted) {
                    const lower = new Set(values.map((v) => v.toLowerCase()));
                    setSuggestions(items.filter((s) => !lower.has(s.toLowerCase())).slice(0, 8));
                    setOpen(true);
                }
            } catch {
                /* ignore — free text still works */
            }
        }, 180);
        return () => {
            controller.abort();
            clearTimeout(handle);
        };
    }, [input, fetchSuggestions, values]);

    useEffect(() => () => {
        if (blurTimer.current) clearTimeout(blurTimer.current);
    }, []);

    return (
        <Box mb="4">
            <Text as="label" size="2" weight="medium" style={{ display: "block", marginBottom: 6 }}>
                {label}
            </Text>
            {values.length > 0 && (
                <Flex gap="2" wrap="wrap" mb="2">
                    {values.map((value) => (
                        <Badge key={value} variant="soft" color="gray" style={{ alignItems: "center", gap: 4 }}>
                            {value}
                            <button
                                type="button"
                                aria-label={`Remove ${value}`}
                                onClick={() => remove(value)}
                                style={{ display: "inline-flex", cursor: "pointer", background: "none", border: "none", padding: 0 }}
                            >
                                <Cross2Icon width={12} height={12} />
                            </button>
                        </Badge>
                    ))}
                </Flex>
            )}
            <Box style={{ position: "relative" }}>
                <TextField.Root
                    size="2"
                    placeholder={placeholder ?? "Type and press Enter…"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            commit(input);
                        } else if (e.key === "Backspace" && !input && values.length > 0) {
                            remove(values[values.length - 1]);
                        }
                    }}
                    onFocus={() => {
                        if (suggestions.length > 0) setOpen(true);
                    }}
                    onBlur={() => {
                        // Commit half-typed custom text so it survives a section switch.
                        blurTimer.current = setTimeout(() => {
                            commit(input);
                        }, 120);
                    }}
                />
                {open && suggestions.length > 0 && (
                    <Box
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 30,
                            marginTop: 4,
                            maxHeight: 220,
                            overflowY: "auto",
                            background: "var(--color-panel-solid, #fff)",
                            border: "1px solid var(--gray-5, #e2e2e2)",
                            borderRadius: 8,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        }}
                    >
                        {suggestions.map((s) => (
                            <button
                                key={s}
                                type="button"
                                // onMouseDown (not onClick) so it fires before the input's blur.
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    if (blurTimer.current) clearTimeout(blurTimer.current);
                                    commit(s);
                                }}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "8px 12px",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 14,
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Tri-state toggle (Any / Yes / No) for employment status
// ---------------------------------------------------------------------------

function TriState({
    label,
    value,
    onChange,
}: {
    label: string;
    value: boolean | null;
    onChange: (v: boolean | null) => void;
}) {
    const options: Array<{ label: string; v: boolean | null }> = [
        { label: "Any", v: null },
        { label: "Yes", v: true },
        { label: "No", v: false },
    ];
    return (
        <Box mb="4">
            <Text as="label" size="2" weight="medium" style={{ display: "block", marginBottom: 6 }}>
                {label}
            </Text>
            <Flex gap="2">
                {options.map((opt) => (
                    <Button
                        key={opt.label}
                        type="button"
                        size="2"
                        variant={value === opt.v ? "solid" : "soft"}
                        onClick={() => onChange(opt.v)}
                    >
                        {opt.label}
                    </Button>
                ))}
            </Flex>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Filter panel (section-tabbed). State is owned by the parent and only rendered
// here, so switching sections never drops values.
// ---------------------------------------------------------------------------

type SectionId = "role" | "company" | "location" | "experience";

const SECTIONS: Array<{ id: SectionId; title: string }> = [
    { id: "role", title: "Role & skills" },
    { id: "company", title: "Company" },
    { id: "location", title: "Location" },
    { id: "experience", title: "Experience" },
];

function yearsToMonths(years: string): number | null {
    const n = parseInt(years, 10);
    return Number.isFinite(n) && n > 0 ? n * 12 : null;
}

function monthsToYears(months: number | null): string {
    if (months == null) return "";
    return String(Math.round(months / 12));
}

export function AgenticFilterPanel({
    filters,
    onChange,
}: {
    filters: AgenticFilters;
    onChange: (next: AgenticFilters) => void;
}) {
    const [activeSection, setActiveSection] = useState<SectionId>("role");
    const patch = (partial: Partial<AgenticFilters>) => onChange({ ...filters, ...partial });

    return (
        <Flex gap="5" style={{ minHeight: 340 }}>
            {/* Section nav */}
            <Box style={{ minWidth: 168, borderRight: "1px solid var(--tahoe-color-border-subtle)", paddingRight: 16 }}>
                <Flex direction="column" gap="2">
                    {SECTIONS.map((s) => (
                        <Button
                            key={s.id}
                            type="button"
                            size="2"
                            variant={activeSection === s.id ? "soft" : "ghost"}
                            style={{ justifyContent: "flex-start" }}
                            onClick={() => setActiveSection(s.id)}
                        >
                            {s.title}
                        </Button>
                    ))}
                </Flex>
            </Box>

            {/* Section body */}
            <Box style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>
                {activeSection === "role" && (
                    <>
                        <TagAutocomplete
                            label="Job titles"
                            placeholder="e.g. Sushi Chef"
                            values={filters.job_titles}
                            onChange={(v) => patch({ job_titles: v })}
                            fetchSuggestions={(q) => autocompleteJobs({ field: "title", query: q }).then((r) => r.suggestions)}
                        />
                        <TagAutocomplete
                            label="Seniority / management level"
                            placeholder="e.g. Head, Senior, Owner"
                            values={filters.management_levels}
                            onChange={(v) => patch({ management_levels: v })}
                            fetchSuggestions={(q) =>
                                autocompleteJobs({ field: "management_level", query: q }).then((r) => r.suggestions)
                            }
                        />
                        <TagAutocomplete
                            label="Skills"
                            placeholder="e.g. Omakase (free text)"
                            values={filters.skills}
                            onChange={(v) => patch({ skills: v })}
                        />
                    </>
                )}

                {activeSection === "company" && (
                    <>
                        <TagAutocomplete
                            label="Companies"
                            placeholder="e.g. Nobu"
                            values={filters.companies}
                            onChange={(v) => patch({ companies: v })}
                            fetchSuggestions={(q) =>
                                autocompleteCompany({ field: "company_name", query: q }).then((r) => r.suggestions)
                            }
                        />
                        <TagAutocomplete
                            label="Industries"
                            placeholder="e.g. Restaurants"
                            values={filters.industries}
                            onChange={(v) => patch({ industries: v })}
                            fetchSuggestions={(q) =>
                                autocompleteCompany({ field: "industry", query: q }).then((r) => r.suggestions)
                            }
                        />
                    </>
                )}

                {activeSection === "location" && (
                    <>
                        <TagAutocomplete
                            label="Countries"
                            placeholder="e.g. United States"
                            values={filters.location_countries}
                            onChange={(v) => patch({ location_countries: v })}
                            fetchSuggestions={(q) =>
                                autocompleteLocations({ field: "country", query: q }).then((r) => r.suggestions)
                            }
                        />
                        <TagAutocomplete
                            label="States / Regions"
                            placeholder="e.g. California"
                            values={filters.location_states}
                            onChange={(v) => patch({ location_states: v })}
                            fetchSuggestions={(q) =>
                                autocompleteLocations({
                                    field: "state",
                                    query: q,
                                    countries: filters.location_countries,
                                }).then((r) => r.suggestions)
                            }
                        />
                        <TagAutocomplete
                            label="Cities"
                            placeholder="e.g. New York"
                            values={filters.location_cities}
                            onChange={(v) => patch({ location_cities: v })}
                            fetchSuggestions={(q) =>
                                autocompleteLocations({
                                    field: "city",
                                    query: q,
                                    countries: filters.location_countries,
                                    states: filters.location_states,
                                }).then((r) => r.suggestions)
                            }
                        />
                    </>
                )}

                {activeSection === "experience" && (
                    <>
                        <TriState
                            label="Currently employed"
                            value={filters.is_working}
                            onChange={(v) => patch({ is_working: v })}
                        />
                        <Box mb="4">
                            <Text as="label" size="2" weight="medium" style={{ display: "block", marginBottom: 6 }}>
                                Years of experience
                            </Text>
                            <Flex gap="2" align="center">
                                <TextField.Root
                                    size="2"
                                    type="number"
                                    min="0"
                                    placeholder="Min"
                                    value={monthsToYears(filters.min_experience_months)}
                                    onChange={(e) => patch({ min_experience_months: yearsToMonths(e.target.value) })}
                                    style={{ width: 100 }}
                                />
                                <Text size="2" color="gray">
                                    to
                                </Text>
                                <TextField.Root
                                    size="2"
                                    type="number"
                                    min="0"
                                    placeholder="Max"
                                    value={monthsToYears(filters.max_experience_months)}
                                    onChange={(e) => patch({ max_experience_months: yearsToMonths(e.target.value) })}
                                    style={{ width: 100 }}
                                />
                            </Flex>
                        </Box>
                    </>
                )}
            </Box>
        </Flex>
    );
}
