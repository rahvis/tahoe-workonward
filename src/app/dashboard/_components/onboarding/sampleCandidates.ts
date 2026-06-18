import type { PreviewGridRow } from '@/app/dashboard/search/preview-grid';

/**
 * Fixed EXAMPLE candidates shown during the onboarding tour — identical for every
 * new user, never from CoreSignal (so the free search is preserved). Synthetic
 * people; reuses the US landing-hero set. Clearly labelled "Example data" in the UI.
 */
function sample(
    id: number,
    fullName: string,
    jobTitle: string,
    company: string,
    location: string,
    score: number,
): PreviewGridRow {
    return {
        id,
        full_name: fullName,
        websites_linkedin: null, // no dead demo links
        headline: `${jobTitle} · ${company}`,
        location_full: location,
        location_country: 'United States',
        connections_count: null,
        follower_count: null,
        company_name: company,
        company_linkedin_url: null,
        company_website: null,
        company_industry: 'Fintech',
        job_title: jobTitle,
        department: 'Engineering',
        management_level: null,
        company_location_hq_full_address: null,
        company_location_hq_country: 'United States',
        score,
    };
}

export const SAMPLE_CANDIDATES: PreviewGridRow[] = [
    sample(901, 'Michael Rodriguez', 'Staff Backend Engineer', 'Stripe', 'San Francisco, United States', 96),
    sample(902, 'Emily Johnson', 'Senior Backend Engineer', 'Plaid', 'New York, United States', 94),
    sample(903, 'David Kim', 'Tech Lead', 'Brex', 'San Jose, United States', 91),
    sample(904, 'Jessica Martinez', 'Backend Engineer', 'Ramp', 'Brooklyn, United States', 88),
];

/** The example search prompt the tour pre-fills (matches the sample candidates). */
export const SAMPLE_QUERY = "Senior backend engineers in San Francisco who've shipped fintech";

/** Canned reveal used by the demo Enrich step (no real enrichment is run). */
export const SAMPLE_ENRICH = {
    masked: 'm•••@stripe.com',
    revealed: 'michael.rodriguez@stripe.com',
    phone: '+1 (415) 555-0142',
};
