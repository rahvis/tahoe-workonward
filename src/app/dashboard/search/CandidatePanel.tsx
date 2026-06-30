"use client";

import {
    Cross2Icon,
    ExternalLinkIcon,
    PersonIcon,
} from "@/components/ui/icons";
import styles from "./search.module.css";
import { scoreToMatch } from "./match-score";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Preview data that's already available without a collect call
export interface PreviewData {
    id: number;
    full_name: string | null;
    headline: string | null;
    job_title: string | null;
    company_name: string | null;
    location_full: string | null;
    location_country: string | null;
    management_level: string | null;
    company_industry: string | null;
    websites_linkedin: string | null;
    connections_count: number | null;
    follower_count: number | null;
    company_linkedin_url: string | null;
    company_website: string | null;
    department: string | null;
    company_location_hq_full_address: string | null;
    company_location_hq_country: string | null;
    score: number | null;
}

export interface CandidateMatchRationale {
    title: string;
    evidence: string;
    criterion: string;
    confidence?: "high" | "medium" | "low";
}

interface CandidatePanelProps {
    preview: PreviewData;
    onClose: () => void;
    onSaveToList?: (id: number) => void;
    matchRationales?: CandidateMatchRationale[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEVEL_COLORS: Record<string, "gold" | "blue" | "violet" | "green" | "gray"> = {
    "C-Suite": "gold",
    "VP": "blue",
    "Director": "violet",
    "Manager": "green",
    "Individual Contributor": "gray",
};

function levelColor(level: string | null): "gold" | "blue" | "violet" | "green" | "gray" {
    if (!level) return "gray";
    return LEVEL_COLORS[level] ?? "gray";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MISSING_PREVIEW_EVIDENCE = "Not enough preview data for this criterion";

export default function CandidatePanel({
    preview,
    onClose,
    onSaveToList,
    matchRationales = [],
}: CandidatePanelProps) {
    return (
        <aside className={styles.candidatePanel} role="complementary" aria-label="Candidate details">
            <div className={styles.panelHeader}>
                <div className={styles.panelIdentity}>
                    <div className={styles.avatarPlaceholder}>
                        <PersonIcon width={24} height={24} />
                    </div>
                    <div>
                        <h2 className={styles.panelTitle}>{preview.full_name ?? "Unknown"}</h2>
                        {preview.headline && (
                            <p className={styles.panelSubtitle}>{preview.headline}</p>
                        )}
                    </div>
                </div>
                <button className={styles.panelClose} type="button" onClick={onClose} aria-label="Close candidate panel">
                    <Cross2Icon />
                </button>
            </div>

            <section className={styles.panelSection}>
                <div className={styles.panelLabel}>Current Role</div>
                <div className={styles.panelSectionBody}>
                    {preview.job_title && (
                        <div className={styles.panelPrimaryText}>{preview.job_title}</div>
                    )}
                    {preview.company_name && (
                        <div className={styles.panelSecondaryText}>{preview.company_name}</div>
                    )}
                    <div className={styles.panelBadgeRow}>
                        {preview.management_level && (
                            <span className={`${styles.panelBadge} ${styles[`badge${levelColor(preview.management_level)}`]}`}>{preview.management_level}</span>
                        )}
                        {preview.company_industry && (
                            <span className={styles.panelBadgeMuted}>{preview.company_industry}</span>
                        )}
                    </div>
                </div>
            </section>

            {preview.department && (
                <section className={styles.panelSection}>
                    <div className={styles.panelLabel}>Department</div>
                    <div className={styles.panelSecondaryText}>{preview.department}</div>
                </section>
            )}

            {(preview.connections_count !== null || preview.follower_count !== null) && (
                <section className={styles.panelSection}>
                    <div className={styles.panelLabel}>Network</div>
                    <div className={styles.panelMetricRow}>
                        {preview.connections_count !== null && (
                            <span><strong>{preview.connections_count.toLocaleString()}</strong> connections</span>
                        )}
                        {preview.follower_count !== null && (
                            <span><strong>{preview.follower_count.toLocaleString()}</strong> followers</span>
                        )}
                    </div>
                </section>
            )}

            {(preview.company_location_hq_full_address || preview.company_location_hq_country || preview.company_website || preview.company_linkedin_url) && (
                <section className={styles.panelSection}>
                    <div className={styles.panelLabel}>Company Info</div>
                    <div className={styles.panelSectionBody}>
                        {(preview.company_location_hq_full_address || preview.company_location_hq_country) && (
                            <div className={styles.panelSecondaryText}>
                                HQ: {preview.company_location_hq_full_address ? `${preview.company_location_hq_full_address}, ` : ""}{preview.company_location_hq_country}
                            </div>
                        )}
                        <div className={styles.panelActionRow}>
                            {preview.company_website && (
                                <a href={preview.company_website.startsWith("http") ? preview.company_website : `https://${preview.company_website}`} target="_blank" rel="noopener noreferrer" className={styles.panelLink}>
                                    Website
                                </a>
                            )}
                            {preview.company_linkedin_url && (
                                <a href={preview.company_linkedin_url} target="_blank" rel="noopener noreferrer" className={styles.panelLink}>
                                    Company LinkedIn
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {(preview.location_full || preview.location_country) && (
                <section className={styles.panelSection}>
                    <div className={styles.panelLabel}>Location</div>
                    <div className={styles.panelSecondaryText}>{preview.location_full ?? preview.location_country}</div>
                </section>
            )}

            {matchRationales.length > 0 && (
                <section className={styles.panelSection}>
                    <div className={styles.panelLabel}>Why this matched</div>
                    <div className={styles.matchRationaleList}>
                        {matchRationales.map((item, index) => {
                            const missingEvidence = item.evidence === MISSING_PREVIEW_EVIDENCE;
                            return (
                                <div key={`${item.title}-${item.criterion}-${index}`} className={styles.matchRationaleItem}>
                                    <div className={styles.matchRationaleHeader}>
                                        <span className={styles.matchRationaleTitle}>{item.title}</span>
                                        {item.confidence ? (
                                            <span className={styles.matchConfidence}>{item.confidence}</span>
                                        ) : null}
                                    </div>
                                    <div className={missingEvidence ? styles.matchMissingEvidence : styles.matchEvidence}>
                                        {item.evidence}
                                    </div>
                                    <div className={styles.matchCriterion}>{item.criterion}</div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            <div className={styles.panelActionRow}>
                {preview.websites_linkedin && (
                    <a className="tahoe-button-secondary" href={preview.websites_linkedin} target="_blank" rel="noopener noreferrer">
                        <ExternalLinkIcon /> LinkedIn
                    </a>
                )}
                {onSaveToList && (
                    <button className="tahoe-button-ghost" type="button" onClick={() => onSaveToList(preview.id)}>
                        Save to List
                    </button>
                )}
            </div>

            {(() => {
                const match = scoreToMatch(preview.score);
                if (!match) return null;
                return (
                    <div
                        className={styles.scoreMeta}
                        title={`Relevance score ${(preview.score as number).toFixed(2)}`}
                    >
                        Match: {match.pct}% · {match.label}
                    </div>
                );
            })()}
        </aside>
    );
}
