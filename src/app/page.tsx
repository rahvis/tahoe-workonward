'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Inter, Montserrat } from 'next/font/google';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { trackLandingEvent } from '@/lib/public-analytics';
import styles from './page.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-body',
    display: 'swap',
});

const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-display',
    weight: ['400', '500', '600'],
    display: 'swap',
});

const HERO_QUERIES = [
    "Senior backend engineers in Berlin who've shipped fintech",
    'Product designers in Brooklyn open to remote, 5+ yrs at B2B SaaS',
    'ML engineers with PyTorch, ex-FAANG, willing to relocate',
];

const HERO_RESULTS = [
    { name: 'Marcus Chen', role: 'Staff Backend Eng · Klarna', location: 'Berlin', match: 96 },
    { name: 'Aisha Okonkwo', role: 'Senior Backend · N26', location: 'Berlin', match: 94 },
    { name: 'Lukas Berger', role: 'Tech Lead · Trade Republic', location: 'Berlin', match: 91 },
    { name: 'Sofia Marchetti', role: 'Backend · Solarisbank', location: 'Berlin', match: 88 },
];

const PROOF_TABS = [
    {
        label: '800M+ profiles',
        headline: "Search the world's talent.",
        body: 'One search in plain words across 800M+ profiles.',
        cta: { label: 'Start for free', href: '/signup' },
        visual: 'search' as const,
    },
    {
        label: 'Verified emails and phones',
        headline: 'Reach people for real.',
        body: 'Work email, personal email, and mobile, verified before you spend a credit.',
        cta: { label: 'See pricing', href: '/pricing' },
        visual: 'contact' as const,
    },
    {
        label: 'Send from your own inbox',
        headline: 'Outreach that lands.',
        body: 'Sequences send from your connected Gmail, so replies come back to you.',
        cta: { label: 'Explore features', href: '/features' },
        visual: 'inbox' as const,
    },
    {
        label: 'No credit card to start',
        headline: 'Start free in minutes.',
        body: 'Run your first search today. Add a card only when you are ready.',
        cta: { label: 'Start for free', href: '/signup' },
        visual: 'start' as const,
    },
];

const FEATURES = [
    {
        tag: '01',
        title: 'Search in your own words',
        body: "Describe the hire the way you'd say it out loud. No Boolean, no filter syntax. Tahoe turns it into a recruiter-grade search.",
    },
    {
        tag: '02',
        title: 'See results you can act on',
        body: 'Fast, honest previews show exactly who you can reach right now, with no inflated match counts.',
    },
    {
        tag: '03',
        title: 'Build shortlists that keep their context',
        body: 'Save the right people into focused lists and move from sourcing to outreach without losing your place.',
    },
    {
        tag: '04',
        title: 'Verified contact details, priced up front',
        body: 'Work email, personal email, and mobile. You see the cost before you spend a credit.',
    },
    {
        tag: '05',
        title: 'Send from your own inbox',
        body: 'Outreach goes out from the inbox candidates already trust, so Tahoe fits your workflow instead of replacing it.',
    },
    {
        tag: '06',
        title: "See what's working",
        body: 'Searches, lists, enrichments, sends, replies, and credit usage, all in one clear view.',
    },
];

const SCREEN_TABS = [
    { id: 'search', label: 'Search' },
    { id: 'lists', label: 'Lists + Enrich' },
    { id: 'campaigns', label: 'Campaigns + Mailboxes' },
    { id: 'billing', label: 'Billing + Analytics' },
] as const;

type ScreenTab = (typeof SCREEN_TABS)[number]['id'];

const TESTIMONIALS = [
    {
        stat: '800M+',
        label: 'profiles to search',
        quote: "Describe who you're looking for in your own words and get a shortlist you can actually work, not a wall of filters.",
        name: 'Find the right people',
        role: 'Search to shortlist in minutes',
    },
    {
        stat: '1 inbox',
        label: 'your own',
        quote: 'Outreach sends from the mailbox your candidates already trust, so your workflow stays exactly where it is.',
        name: 'Reach out with confidence',
        role: 'Send from your own mailbox',
    },
    {
        stat: '$0',
        label: 'to start',
        quote: 'See enrichment and credit costs before you spend, and start free with no credit card.',
        name: 'Know your costs',
        role: 'Clear pricing, no surprises',
    },
];

const PRICE_COMPARE = [
    { name: 'LinkedIn Recruiter', price: 999, contract: 'Annual contract' },
    { name: 'Recruiter Lite', price: 170, contract: 'Annual contract' },
    { name: 'SeekOut', price: 749, contract: 'Custom contract' },
    { name: 'hireEZ', price: 599, contract: 'Annual contract' },
];

const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: 'Tahoe AI',
            alternateName: ['Tahoe', 'WorkOnward Tahoe'],
            url: SITE_URL,
            logo: `${SITE_URL}/logo/workonward_logo.svg`,
            email: 'info@workonward.com',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '124 E 14th St',
                addressLocality: 'New York',
                addressRegion: 'NY',
                postalCode: '10003',
                addressCountry: 'US',
            },
            sameAs: [
                'https://www.linkedin.com/company/workonward',
                'https://www.facebook.com/workonward',
                'https://x.com/workonward',
                'https://www.instagram.com/workonward',
                'https://www.youtube.com/@workonward',
            ],
        },
        {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            name: 'Tahoe AI',
            url: SITE_URL,
            publisher: {
                '@id': `${SITE_URL}/#organization`,
            },
        },
        {
            '@type': 'SoftwareApplication',
            '@id': `${SITE_URL}/#software`,
            name: 'Tahoe AI',
            applicationCategory: 'BusinessApplication',
            applicationSubCategory: 'AI recruiting software',
            operatingSystem: 'Web',
            url: SITE_URL,
            description:
                'AI recruiting software for natural-language candidate sourcing, candidate lists, contact enrichment, native outreach sequencing, mailbox controls, and recruiting analytics.',
            publisher: {
                '@id': `${SITE_URL}/#organization`,
            },
            offers: {
                '@type': 'Offer',
                price: '49',
                priceCurrency: 'USD',
                priceSpecification: {
                    '@type': 'UnitPriceSpecification',
                    price: '49',
                    priceCurrency: 'USD',
                    unitText: 'month',
                },
                availability: 'https://schema.org/InStock',
                url: `${SITE_URL}/pricing`,
            },
        },
    ],
};

function ArrowIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.inlineIcon}>
            <path d="M4 10h12m0 0-4-4m4 4-4 4" />
        </svg>
    );
}

function ArrowUpRightIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.inlineIcon}>
            <path d="M6 14 14 6m0 0H7m7 0v7" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

function SparkIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.inlineIcon}>
            <path d="M12 3 13.5 9 19.5 10.5 13.5 12 12 18 10.5 12 4.5 10.5 10.5 9z" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.checkIcon}>
            <path d="m4 8 3 3 5-6" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.miniIcon}>
            <path d="M8 3v10M3 8h10" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.miniIcon}>
            <path d="m4 4 8 8M12 4l-8 8" />
        </svg>
    );
}

function Logo({ compact = false }: { compact?: boolean }) {
    return (
        <div className={styles.logo}>
            <svg
                viewBox="0 0 160 90"
                aria-hidden="true"
                className={compact ? styles.logoMarkCompact : styles.logoMark}
            >
                <path d="M0 90 L40 0 L80 90 Z" fill="none" stroke="var(--color-accent)" strokeWidth="10" strokeLinejoin="round" />
                <path d="M80 90 L120 0 L160 90 Z" fill="none" stroke="var(--color-text-primary)" strokeWidth="10" strokeLinejoin="round" />
            </svg>
            <div className={styles.logoTextWrap}>
                <span className={styles.logoWordmark}>
                    tahoe<span className={styles.logoDot}>.</span>ai
                </span>
                {!compact && <span className={styles.logoMeta}>powered by WorkOnward</span>}
            </div>
        </div>
    );
}

function SearchScreen() {
    return (
        <div className={styles.screenShell}>
            <div className={styles.screenHeader}>
                <div className={styles.screenNav}>Tahoe | Find | Projects | Campaigns | Mailboxes | Analytics</div>
                <div className={styles.creditBadge}>Credits: 1099</div>
            </div>
            <div className={styles.screenProjectBar}>Project: Series-B Backend Engineers</div>
            <div className={styles.screenSearchRow}>
                <div className={styles.screenSearchField}>
                    <SearchIcon />
                    Senior backend engineers in the Bay Area with Go experience
                </div>
                <button className={styles.mockPrimaryButton}>Find candidates</button>
            </div>
            <div className={styles.searchMockLayout}>
                <aside className={styles.mockSidebar}>
                    <div className={styles.mockSectionTitle}>Filters</div>
                    <div className={styles.filterLine}>Title <span>Senior Eng ×</span></div>
                    <div className={styles.filterLine}>Seniority <span>Senior ×</span></div>
                    <div className={styles.filterLine}>Location <span>Bay Area ×</span></div>
                    <div className={styles.filterLine}>Skills <span>Go ×</span></div>
                </aside>
                <section className={styles.mockResults}>
                    <div className={styles.mockResultsHeader}>
                        <span>Results (47 of 3120 matches, preview page 1/5)</span>
                        <span className={styles.mockHint}>Interactive preview limit: up to 100 results</span>
                    </div>
                    {[
                        ['Jane Doe', 'Sr Backend Eng', 'Acme'],
                        ['John Smith', 'Staff Engineer', 'Orbit'],
                        ['Priya Patel', 'Platform Eng', 'Helios'],
                        ['Alex Lee', 'Software Eng', 'Northstar'],
                    ].map((row) => (
                        <div key={row[0]} className={styles.mockRow}>
                            <label className={styles.rowCheck}>
                                <input type="checkbox" defaultChecked={row[0] !== 'Priya Patel'} />
                                <span />
                            </label>
                            <span>{row[0]}</span>
                            <span>{row[1]}</span>
                            <span>{row[2]}</span>
                        </div>
                    ))}
                    <div className={styles.mockActionBar}>
                        <span>47 selected</span>
                        <button className={styles.mockGhostButton}>Add to list</button>
                        <button className={styles.mockGhostButton}>Enrich</button>
                        <button className={styles.mockGhostButton}>Save search</button>
                    </div>
                </section>
            </div>
        </div>
    );
}

function ListsAndEnrichScreen() {
    return (
        <div className={styles.screenSplit}>
            <div className={styles.screenShell}>
                <div className={styles.screenHeader}>
                    <div className={styles.screenNav}>Series-B Backend Engineers</div>
                </div>
                <div className={styles.tableLike}>
                    <div className={`${styles.mockTableRow} ${styles.mockRowHeader}`}>
                        <span>Name</span>
                        <span>Email</span>
                        <span>Phone</span>
                        <span>Status</span>
                    </div>
                    <div className={styles.mockTableRow}>
                        <span>Jane Doe</span>
                        <span>jane@acme.com</span>
                        <span>+1415...</span>
                        <span className={styles.statusGood}>DONE</span>
                    </div>
                    <div className={styles.mockTableRow}>
                        <span>John Smith</span>
                        <span>john@orbit.com</span>
                        <span>--</span>
                        <span className={styles.statusMuted}>NOT FOUND</span>
                    </div>
                    <div className={styles.mockTableRow}>
                        <span>Priya Patel</span>
                        <span>Enriching...</span>
                        <span>Enriching...</span>
                        <span className={styles.statusAccent}>RUNNING</span>
                    </div>
                    <div className={styles.mockTableRow}>
                        <span>David Lee</span>
                        <span>david@startup.io</span>
                        <span>+1650...</span>
                        <span className={styles.statusGood}>DONE</span>
                    </div>
                    <div className={styles.mockTableRow}>
                        <span>Sarah Chen</span>
                        <span>sarah@tech.co</span>
                        <span>--</span>
                        <span className={styles.statusMuted}>NOT FOUND</span>
                    </div>
                    <div className={styles.mockTableRow}>
                        <span>Michael Brown</span>
                        <span>michael@corp.net</span>
                        <span>+1212...</span>
                        <span className={styles.statusGood}>DONE</span>
                    </div>
                    <div className={styles.mockTableRow}>
                        <span>Emily Davis</span>
                        <span>emily@example.com</span>
                        <span>--</span>
                        <span className={styles.statusMuted}>NOT FOUND</span>
                    </div>
                </div>
            </div>

            <div className={styles.modalMock}>
                <div className={styles.modalMockTitle}>Enrich contacts</div>
                <div className={styles.modalBlock}>
                    <div className={styles.modalLabel}>How many?</div>
                    <div className={styles.radioList}>
                        <span>Just this one (1)</span>
                        <span>Top 10</span>
                        <span className={styles.radioActive}>All selected (47)</span>
                        <span>Entire list (312)</span>
                    </div>
                </div>
                <div className={styles.modalBlock}>
                    <div className={styles.modalLabel}>What to find?</div>
                    <div className={styles.checkList}>
                        <span><CheckIcon /> Work email · 1 credit each</span>
                        <span>Personal email · 3 credits each</span>
                        <span><CheckIcon /> Mobile phone · 10 credits each</span>
                    </div>
                </div>
                <div className={styles.modalEstimate}>Estimate: 47 contacts × 11 credits = 517</div>
                <div className={styles.modalEstimateMuted}>Balance: 1099 → 582 after run</div>
                <div className={styles.modalActions}>
                    <button className={styles.mockGhostButton}>Cancel</button>
                    <button className={styles.mockPrimaryButton}>Enrich now</button>
                </div>
            </div>
        </div>
    );
}

function CampaignsAndMailboxesScreen() {
    return (
        <div className={styles.screenSplit}>
            <div className={styles.screenShell}>
                <div className={styles.screenHeader}>
                    <div className={styles.screenNav}>sam@example.com</div>
                    <button className={styles.mockGhostButton}>Disconnect</button>
                </div>
                <div className={styles.mailboxStatusRow}>
                    <span>Status: Healthy</span>
                    <span>Last reply check: 24 sec ago</span>
                </div>
                <div className={styles.progressWrap}>
                    <div className={styles.progressLabel}>Today sent: 12 / 100</div>
                    <div className={styles.progressTrack}>
                        <div className={styles.progressFillSmall} />
                    </div>
                </div>
                <div className={styles.mailboxSettings}>
                    <span>Daily cap: 100</span>
                    <span>Send window: 9 AM - 5 PM · Mon - Fri</span>
                    <span>Time zone: America/Los_Angeles</span>
                </div>
            </div>

            <div className={styles.screenShell}>
                <div className={styles.screenHeader}>
                    <div className={styles.screenNav}>Campaign: Round 1 outreach</div>
                    <div className={styles.headerActions}>
                        <button className={styles.mockGhostButton}>Save</button>
                        <button className={styles.mockPrimaryButton}>Launch</button>
                    </div>
                </div>
                <div className={styles.campaignBlock}>
                    <div className={styles.mockSectionTitle}>Audience</div>
                    <div className={styles.detailLine}>List: Outreach round 1 · 50 candidates · 47 eligible</div>
                </div>
                <div className={styles.campaignBlock}>
                    <div className={styles.mockSectionTitle}>Send from</div>
                    <div className={styles.detailLine}>sam@example.com · Healthy · 12 / 100 sent today</div>
                </div>
                <div className={styles.campaignBlock}>
                    <div className={styles.mockSectionTitle}>Sequence</div>
                    <div className={styles.sequenceCard}>
                        <strong>Step 1 - Day 1 - Email</strong>
                        <span>Subject: Hey {'{{first_name}}'}, quick question about {'{{company}}'}</span>
                        <span>Body: Hi {'{{first_name}}'}, I am hiring...</span>
                    </div>
                    <div className={styles.sequenceMini}>Step 2 - Wait 3 days</div>
                    <div className={styles.sequenceMini}>Step 3 - Day 4 - Follow-up email</div>
                </div>
            </div>
        </div>
    );
}

function BillingAndAnalyticsScreen() {
    return (
        <div className={styles.screenSplit}>
            <div className={styles.screenShell}>
                <div className={styles.screenHeader}>
                    <div className={styles.screenNav}>Billing and credits</div>
                    <button className={styles.mockGhostButton}>Manage in Stripe</button>
                </div>
                <div className={styles.billingHero}>
                    <div>
                        <div className={styles.planLabel}>Current plan</div>
                        <div className={styles.planValue}>Growth · $49 / month</div>
                    </div>
                    <div>
                        <div className={styles.planLabel}>Credits available</div>
                        <div className={styles.planValue}>582</div>
                    </div>
                </div>
                <div className={styles.billingRows}>
                    <div className={styles.detailLine}>Plan credits used: 482 / 1500</div>
                    <div className={styles.detailLine}>Bonus / top-ups: 100</div>
                    <div className={styles.detailLine}>Enrichment - work email: 482 credits</div>
                    <div className={styles.detailLine}>Enrichment - phone: 340 credits</div>
                    <div className={styles.detailLine}>Email sends: 12 credits</div>
                </div>
                <div className={styles.ledgerCard}>
                    <div className={styles.mockSectionTitle}>Credit ledger</div>
                    {[
                        'May 05  enrichment_hold      -517   job_enr_123',
                        'May 05  enrichment_release   +517   job_enr_123',
                        'May 05  enrichment_charge    -423   job_enr_123',
                        'May 04  send_charge           -12   campaign_456',
                    ].map((entry) => (
                        <div key={entry} className={styles.ledgerRow}>{entry}</div>
                    ))}
                </div>
            </div>

            <div className={styles.screenShell}>
                <div className={styles.screenHeader}>
                    <div className={styles.screenNav}>Analytics · Last 30 days</div>
                </div>
                <div className={styles.analyticsGrid}>
                    {[
                        ['Searches', '142'],
                        ['Lists', '12'],
                        ['Enriched', '834'],
                        ['Sent', '340'],
                        ['Replied', '47'],
                        ['Reply rate', '13.8%'],
                    ].map(([label, value]) => (
                        <div key={label} className={styles.kpiCard}>
                            <span className={styles.kpiLabel}>{label}</span>
                            <strong className={styles.kpiValue}>{value}</strong>
                        </div>
                    ))}
                </div>
                <div className={styles.chartCard}>
                    <div className={styles.mockSectionTitle}>Outreach trend</div>
                    <div className={styles.chartBars}>
                        <span style={{ height: '78%' }} />
                        <span style={{ height: '55%' }} />
                        <span style={{ height: '71%' }} />
                        <span style={{ height: '46%' }} />
                        <span style={{ height: '82%' }} />
                        <span style={{ height: '61%' }} />
                        <span style={{ height: '38%' }} />
                    </div>
                    <div className={styles.chartLabels}>Mon Tue Wed Thu Fri Sat Sun</div>
                </div>
            </div>
        </div>
    );
}

function ProofVisual({ type }: { type: (typeof PROOF_TABS)[number]['visual'] }) {
    if (type === 'contact') {
        return (
            <div className={styles.proofCardMock}>
                <div className={styles.proofContactHead}>
                    <span className={styles.proofAvatar}>AO</span>
                    <div className={styles.proofContactName}>
                        <strong>Aisha Okonkwo</strong>
                        <span>Senior Backend · N26</span>
                    </div>
                </div>
                {[['Work email', 'aisha@n26.com'], ['Personal', 'aisha@gmail.com'], ['Mobile', '+49 30 901 2345']].map(([label, value]) => (
                    <div key={label} className={styles.proofContactRow}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                        <CheckIcon />
                    </div>
                ))}
                <div className={styles.proofCardFoot}>Cost shown before you enrich</div>
            </div>
        );
    }
    if (type === 'inbox') {
        return (
            <div className={styles.proofCardMock}>
                <div className={styles.proofMailHead}>To aisha@n26.com</div>
                <div className={styles.proofMailSubject}>Backend role, at your pace</div>
                <p className={styles.proofMailBody}>Hi Aisha, your work at N26 stood out. Open to a quick chat this week?</p>
                <div className={styles.proofCardFoot}>Sent from you@gmail.com</div>
            </div>
        );
    }
    if (type === 'start') {
        return (
            <div className={styles.proofCardMock}>
                <strong className={styles.proofStartTitle}>You are ready to search.</strong>
                <div className={styles.proofContactRow}><span>Search credits</span><strong>300 / 300</strong></div>
                <div className={styles.proofContactRow}><span>Enrich credits</span><strong>200 / 200</strong></div>
                <div className={styles.proofCardFoot}>No credit card required</div>
            </div>
        );
    }
    const rows: Array<[string, number]> = [['Marcus Chen', 96], ['Aisha Okonkwo', 94], ['Lukas Berger', 91]];
    return (
        <div className={styles.proofCardMock}>
            <div className={styles.proofSearchField}><SearchIcon /><span>backend engineers in Berlin</span></div>
            {rows.map(([name, score]) => (
                <div key={name} className={styles.proofResultRow}>
                    <span className={styles.proofResultName}>{name}</span>
                    <span className={styles.proofResultScore}>{score}</span>
                </div>
            ))}
            <div className={styles.proofCardFoot}>4 of 14,217 matches · 0.8s</div>
        </div>
    );
}

function ProofShowcase() {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const activeTab = PROOF_TABS[active];

    function goTo(index: number, focus = false) {
        const next = (index + PROOF_TABS.length) % PROOF_TABS.length;
        setActive(next);
        if (focus) tabRefs.current[next]?.focus();
    }

    return (
        <section className={styles.proofSection} aria-label="Why Tahoe">
            <div className={styles.container}>
                <p className={styles.proofEyebrow}>Built for in-house recruiters and lean talent teams</p>
                <div
                    className={styles.proofShowcase}
                    data-paused={paused ? 'true' : 'false'}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocusCapture={() => setPaused(true)}
                    onBlurCapture={() => setPaused(false)}
                >
                    <div
                        className={styles.proofTabs}
                        role="tablist"
                        aria-label="Tahoe highlights"
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowRight') { event.preventDefault(); goTo(active + 1, true); }
                            else if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(active - 1, true); }
                            else if (event.key === 'Home') { event.preventDefault(); goTo(0, true); }
                            else if (event.key === 'End') { event.preventDefault(); goTo(PROOF_TABS.length - 1, true); }
                        }}
                    >
                        {PROOF_TABS.map((tab, index) => {
                            const isActive = index === active;
                            return (
                                <button
                                    key={tab.label}
                                    ref={(el) => { tabRefs.current[index] = el; }}
                                    type="button"
                                    role="tab"
                                    id={`proof-tab-${index}`}
                                    aria-selected={isActive}
                                    aria-controls="proof-panel"
                                    tabIndex={isActive ? 0 : -1}
                                    className={isActive ? styles.proofTabActive : styles.proofTab}
                                    onClick={() => goTo(index)}
                                >
                                    <span className={styles.proofTabLabel}>{tab.label}</span>
                                    {isActive ? (
                                        <span className={styles.proofTabTrack}>
                                            <span className={styles.proofTabFill} onAnimationEnd={() => goTo(active + 1)} />
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>

                    <div className={styles.proofStage} id="proof-panel" role="tabpanel" aria-labelledby={`proof-tab-${active}`}>
                        <div key={active} className={styles.proofPanel}>
                            <div className={styles.proofCopy}>
                                <h3 className={styles.proofHeadline}>{activeTab.headline}</h3>
                                <p className={styles.proofBody}>{activeTab.body}</p>
                                <Link href={activeTab.cta.href} className={styles.proofCta}>
                                    {activeTab.cta.label} <ArrowIcon />
                                </Link>
                            </div>
                            <div className={styles.proofVisual} aria-hidden="true">
                                <ProofVisual type={activeTab.visual} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function LandingPage() {
    const [activeTab, setActiveTab] = useState<ScreenTab>('search');
    const [queryIndex, setQueryIndex] = useState(0);
    const [typedQuery, setTypedQuery] = useState('');
    const [showResults, setShowResults] = useState(false);

    const trackAuthCta = (cta: string, placement: string) => {
        trackLandingEvent('landing_auth_cta_click', { cta, placement });
    };

    const handleTabSelect = (tab: ScreenTab) => {
        trackLandingEvent('landing_screen_tab_selected', { tab });
        setActiveTab(tab);
    };

    useEffect(() => {
        const target = HERO_QUERIES[queryIndex];
        let i = 0;
        let typeTimer = 0;
        let revealTimer = 0;
        let rotateTimer = 0;

        const resetTimer = window.setTimeout(() => {
            setTypedQuery('');
            setShowResults(false);

            typeTimer = window.setInterval(() => {
                i += 1;
                setTypedQuery(target.slice(0, i));
                if (i >= target.length) {
                    window.clearInterval(typeTimer);
                    revealTimer = window.setTimeout(() => setShowResults(true), 260);
                    rotateTimer = window.setTimeout(() => {
                        setQueryIndex((current) => (current + 1) % HERO_QUERIES.length);
                    }, 4200);
                }
            }, 24);
        }, 0);

        return () => {
            window.clearTimeout(resetTimer);
            window.clearInterval(typeTimer);
            window.clearTimeout(revealTimer);
            window.clearTimeout(rotateTimer);
        };
    }, [queryIndex]);

    useEffect(() => {
        const thresholds = [25, 50, 75, 90];
        const seen = new Set<number>();

        const trackScrollDepth = () => {
            const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;

            if (maxScrollable <= 0) {
                return;
            }

            const percent = Math.min(100, Math.round((window.scrollY / maxScrollable) * 100));

            thresholds.forEach((threshold) => {
                if (percent >= threshold && !seen.has(threshold)) {
                    seen.add(threshold);
                    trackLandingEvent('landing_scroll_depth', { depth_percent: threshold });
                }
            });
        };

        window.addEventListener('scroll', trackScrollDepth, { passive: true });
        window.addEventListener('resize', trackScrollDepth);
        trackScrollDepth();

        return () => {
            window.removeEventListener('scroll', trackScrollDepth);
            window.removeEventListener('resize', trackScrollDepth);
        };
    }, []);

    const activeScreen = useMemo(() => {
        switch (activeTab) {
            case 'lists':
                return <ListsAndEnrichScreen />;
            case 'campaigns':
                return <CampaignsAndMailboxesScreen />;
            case 'billing':
                return <BillingAndAnalyticsScreen />;
            case 'search':
            default:
                return <SearchScreen />;
        }
    }, [activeTab]);

    return (
        <main className={`${inter.variable} ${montserrat.variable} ${styles.page}`}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd).replace(/</g, '\\u003c') }}
            />
            <PublicSiteHeader placement="home" />

            <section className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.heroGrid}>
                        <div className={styles.heroCopy}>
                            <h1 className={styles.heroTitle}>
                                Search <span>800M+ profiles</span> in your own words.
                            </h1>
                            <p className={styles.heroBody}>
                                Describe who you&apos;re looking for. Tahoe builds your shortlist, finds verified emails and
                                phone numbers, and sends outreach from your own inbox.
                            </p>
                            <div className={styles.heroActions}>
                                <Link href="/signup" className={styles.primaryAction} onClick={() => trackAuthCta('start_free_trial', 'hero')}>
                                    Start for free <ArrowIcon />
                                </Link>
                                <Link href="/contact" className={styles.ghostAction} onClick={() => trackAuthCta('book_demo', 'hero')}>
                                    Book a demo <ArrowUpRightIcon />
                                </Link>
                                <Image
                                    src="/loading_animations_transparent_all/fade_transparent.gif"
                                    alt=""
                                    width={56}
                                    height={56}
                                    unoptimized
                                    aria-hidden="true"
                                    className={styles.heroActionAnimation}
                                />
                            </div>
                            <p className={styles.heroMeta}>Continue with Google or email. No credit card.</p>

                            <div className={styles.statsRow}>
                                {[
                                    ['800M+', 'profiles indexed'],
                                    ['$49', 'growth plan / month'],
                                    ['0.8s', 'avg cached query time'],
                                ].map(([value, label]) => (
                                    <div key={label}>
                                        <strong>{value}</strong>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.heroCard}>
                            <div className={styles.heroCardTop}>
                                <span className={styles.liveSearchLabel}>Live search</span>
                                <div className={styles.windowDots}>
                                    <span />
                                    <span />
                                    <span className={styles.windowDotsActive} />
                                </div>
                            </div>

                            <div className={styles.heroSearchField}>
                                <SearchIcon />
                                <span className={styles.typedQuery}>
                                    {typedQuery}
                                    <span className={styles.cursor} />
                                </span>
                            </div>

                            <div className={styles.filterChips} data-visible={showResults ? 'true' : 'false'}>
                                {['Backend Engineer', 'Senior+', 'Berlin', 'Fintech'].map((chip) => (
                                    <span key={chip} className={styles.filterChip}>
                                        {chip}
                                        <CloseIcon />
                                    </span>
                                ))}
                            </div>

                            <div className={styles.resultList}>
                                {HERO_RESULTS.map((person, index) => (
                                    <div
                                        key={person.name}
                                        className={styles.resultRow}
                                        data-visible={showResults ? 'true' : 'false'}
                                        style={{ transitionDelay: `${index * 70}ms` }}
                                    >
                                        <div className={styles.avatar}>{person.name.split(' ').map((part) => part[0]).join('')}</div>
                                        <div className={styles.resultMain}>
                                            <strong>{person.name}</strong>
                                            <span>{person.role}</span>
                                        </div>
                                        <div className={styles.resultMatch}>
                                            <span>{person.location}</span>
                                            <div className={styles.progressTrack}>
                                                <div className={styles.progressFill} style={{ width: `${person.match}%` }} />
                                            </div>
                                            <strong>{person.match}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.heroCardFooter}>
                                <span>
                                    4 of <strong>14,217</strong> matches · 0.8s
                                </span>
                                <span className={styles.accentLink}>
                                    View all <ArrowIcon />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <ProofShowcase />

            <section id="product" className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Product</span>
                        <h2>Everything you need to source and reach candidates, all in one place.</h2>
                        <p>
                            Find people, build lists, enrich contacts, send outreach, and see what is working. No more
                            stitching five tools together.
                        </p>
                    </div>

                    <div className={styles.featureGrid}>
                        {FEATURES.map((feature) => (
                            <article key={feature.tag} className={styles.featureCard}>
                                <div className={styles.featureCardTop}>
                                    <span className={styles.featureTag}>{feature.tag}</span>
                                    <PlusIcon />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="screens" className={`${styles.section} ${styles.warmSection}`}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Features</span>
                        <h2>See exactly how Tahoe works.</h2>
                        <p>
                            Real previews of the search, list, enrichment, campaign, mailbox, billing, and analytics
                            workflows.
                        </p>
                    </div>

                    <div className={styles.tabRail} role="tablist" aria-label="Product screens">
                        {SCREEN_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                className={activeTab === tab.id ? styles.activeTab : styles.inactiveTab}
                                onClick={() => handleTabSelect(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.screenIntro}>
                        <div>
                            <strong>Preview the Tahoe experience.</strong>
                            <p>
                                A guided look at the product. Start free to run it with your own searches.
                            </p>
                        </div>
                        <div className={styles.screenIntroMeta}>
                            <span><SparkIcon /> Search, organize, enrich, launch, and measure</span>
                            <span><CheckIcon /> No setup required. Start free in minutes.</span>
                        </div>
                    </div>

                    {activeScreen}
                </div>
            </section>

            <section id="pricing" className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.pricingGrid}>
                        <div className={styles.pricingCopy}>
                            <span className={styles.sectionEyebrow}>The price story</span>
                            <h2>
                                Same search category. Same recruiter workflow. <span>A fraction of the cost.</span>
                            </h2>
                            <p>
                                Recruiter-grade sourcing and outreach without the enterprise contract. Credits and pricing
                                are visible up front, with no surprise invoice at the end of the month.
                            </p>
                            <Link href="/signup" className={styles.primaryAction} onClick={() => trackAuthCta('start_free_trial', 'pricing')}>
                                See full pricing <ArrowIcon />
                            </Link>
                        </div>

                        <div className={styles.pricingCard}>
                            <div className={styles.pricingFeaturedRow}>
                                <div className={styles.featuredBrand}>
                                    <Logo compact />
                                </div>
                                <div className={styles.barTrack}>
                                    <div className={styles.barFillAccent} style={{ width: '5%' }} />
                                </div>
                                <div className={styles.priceCell}>
                                    <strong>$49</strong>
                                    <span>/mo</span>
                                    <small>Cancel anytime</small>
                                </div>
                            </div>

                            {PRICE_COMPARE.map((vendor) => (
                                <div key={vendor.name} className={styles.pricingRow}>
                                    <span>{vendor.name}</span>
                                    <div className={styles.barTrack}>
                                        <div
                                            className={styles.barFillMuted}
                                            style={{ width: `${(vendor.price / 1000) * 100}%` }}
                                        />
                                    </div>
                                    <div className={styles.priceCell}>
                                        <strong>${vendor.price}</strong>
                                        <span>/mo</span>
                                        <small>{vendor.contract}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section id="customers" className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Why Tahoe</span>
                        <h2>Built for the way recruiters actually work.</h2>
                    </div>

                    <div className={styles.testimonialGrid}>
                        {TESTIMONIALS.map((item) => (
                            <article key={item.name} className={styles.testimonialCard}>
                                <div className={styles.testimonialStatRow}>
                                    <strong>{item.stat}</strong>
                                    <span>{item.label}</span>
                                </div>
                                <blockquote>{item.quote}</blockquote>
                                <footer>
                                    <strong>{item.name}</strong>
                                    <span>{item.role}</span>
                                </footer>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.finalCtaSection}>
                <div className={styles.container}>
                    <div className={styles.finalCtaCard}>
                        <div>
                            <h2>Run your first search in two minutes.</h2>
                            <p>
                                Continue with Google or email, run your first search, and see your shortlist before lunch.
                            </p>
                            <div className={styles.heroActions}>
                                <Link href="/signup" className={styles.accentAction} onClick={() => trackAuthCta('start_free_trial', 'final_cta')}>
                                    Start for free <ArrowIcon />
                                </Link>
                                <Link href="/contact" className={styles.inverseGhostAction} onClick={() => trackAuthCta('book_demo', 'final_cta')}>
                                    Book a demo <ArrowUpRightIcon />
                                </Link>
                            </div>
                        </div>

                        <div className={styles.ctaChecklist}>
                            {[
                                'Sign in with Google or email',
                                'No credit card required to get started',
                                'Send outreach from your own inbox',
                                'Credits and enrichment costs shown up front',
                            ].map((item) => (
                                <div key={item}>
                                    <CheckIcon />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <PublicSiteFooter placement="home" />
        </main>
    );
}
