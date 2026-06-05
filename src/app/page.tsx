'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Inter, Montserrat } from 'next/font/google';
import { useEffect, useMemo, useState } from 'react';
import { HamburgerMenuIcon, Cross1Icon } from '@/components/ui/icons';
import CookieSettingsButton from '@/components/consent/CookieSettingsButton';
import { trackLandingEvent } from '@/lib/public-analytics';
import styles from './page.module.css';

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

const TRUSTED_BY = ['Ramp', 'Linear', 'Vercel', 'Notion', 'Figma', 'Stripe'];

const FEATURES = [
    {
        tag: '01',
        title: 'Plain-English search',
        body: 'Describe the hire, not the query syntax. Tahoe translates intent into structured recruiter-grade filters.',
    },
    {
        tag: '02',
        title: 'Preview-first sourcing',
        body: 'Searches stay fast and truthful, with interactive previews that show what recruiters can actually act on now.',
    },
    {
        tag: '03',
        title: 'Intelligent List Building',
        body: 'Save the right people into focused lists, then move from sourcing to outreach without losing context.',
    },
    {
        tag: '04',
        title: 'Contact enrichment',
        body: 'Work email, personal email, and mobile phone enrichment are priced clearly before the click.',
    },
    {
        tag: '05',
        title: 'Native outreach',
        body: "Recruiters send from their own inboxes, so Tahoe fits the workflow they already trust instead of replacing it.",
    },
    {
        tag: '06',
        title: 'Operational analytics',
        body: 'Track searches, lists, enrichments, sends, replies, and credit usage in one quiet operating surface.',
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
        stat: '$22k',
        label: 'saved per year',
        quote: 'We replaced two legacy recruiter seats with Tahoe and found three qualified engineers in the first week.',
        name: 'Sarah Chen',
        role: 'Head of Talent · Linear',
    },
    {
        stat: '4×',
        label: 'faster sourcing',
        quote: 'Plain-English search is the unlock. I paste the role brief in and get a shortlist I can actually work.',
        name: 'Marcus Williams',
        role: 'Recruiting Lead · Ramp',
    },
    {
        stat: '19%',
        label: 'reply rate',
        quote: 'The outreach and enrichment workflow feels operationally boring in the best way. It just works.',
        name: 'Priya Patel',
        role: 'Talent Partner · Notion',
    },
];

const PRICE_COMPARE = [
    { name: 'LinkedIn Recruiter', price: 999, contract: 'Annual contract' },
    { name: 'Recruiter Lite', price: 170, contract: 'Annual contract' },
    { name: 'SeekOut', price: 749, contract: 'Custom contract' },
    { name: 'hireEZ', price: 599, contract: 'Annual contract' },
];

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

export default function LandingPage() {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ScreenTab>('search');
    const [queryIndex, setQueryIndex] = useState(0);
    const [typedQuery, setTypedQuery] = useState('');
    const [showResults, setShowResults] = useState(false);

    const trackSectionNav = (section: string, placement: string) => {
        trackLandingEvent('landing_section_nav_click', { section, placement });
    };

    const trackAuthCta = (cta: string, placement: string) => {
        trackLandingEvent('landing_auth_cta_click', { cta, placement });
    };

    const trackBlogNav = (placement: string) => {
        trackLandingEvent('landing_blog_nav_click', { placement });
    };

    const trackSocialClick = (platform: string) => {
        trackLandingEvent('landing_social_click', { platform });
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
            <header className={styles.header}>
                <div className={styles.container}>
                    <div className={styles.headerInner}>
                        <Link
                            href="/"
                            className={styles.logoLink}
                            aria-label="Tahoe home"
                            onClick={(event) => {
                                if (typeof window !== 'undefined' && window.location.pathname === '/') {
                                    event.preventDefault();
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    setMobileNavOpen(false);
                                }
                            }}
                        >
                            <Logo />
                        </Link>

                        <nav className={styles.desktopNav} aria-label="Primary">
                            <a href="#product" onClick={() => trackSectionNav('product', 'header_desktop')}>Product</a>
                            <a href="#screens" onClick={() => trackSectionNav('screens', 'header_desktop')}>Features</a>
                            <a href="#pricing" onClick={() => trackSectionNav('pricing', 'header_desktop')}>Pricing</a>
                            <a href="#customers" onClick={() => trackSectionNav('customers', 'header_desktop')}>Customers</a>
                            <Link href="/blogs" onClick={() => trackBlogNav('header_desktop')}>Blog</Link>
                        </nav>

                        <div className={styles.headerActions}>
                            <Link href="/login" className={styles.textAction} onClick={() => trackAuthCta('sign_in', 'header_desktop')}>
                                Sign in
                            </Link>
                            <Link href="/signup" className={styles.secondaryAction} onClick={() => trackAuthCta('start_free_trial', 'header_desktop')}>
                                Start free trial <ArrowUpRightIcon />
                            </Link>
                            <button
                                type="button"
                                className={styles.mobileToggle}
                                aria-expanded={mobileNavOpen}
                                aria-label="Toggle navigation"
                                onClick={() => {
                                    trackLandingEvent('landing_mobile_nav_toggle', { state: mobileNavOpen ? 'closed' : 'open' });
                                    setMobileNavOpen((open) => !open);
                                }}
                            >
                                {mobileNavOpen ? <Cross1Icon /> : <HamburgerMenuIcon />}
                            </button>
                        </div>
                    </div>

                    {mobileNavOpen && (
                        <div className={styles.mobileNav} aria-label="Mobile navigation">
                            <a href="#product" onClick={() => { trackSectionNav('product', 'header_mobile'); setMobileNavOpen(false); }}>Product</a>
                            <a href="#screens" onClick={() => { trackSectionNav('screens', 'header_mobile'); setMobileNavOpen(false); }}>Features</a>
                            <a href="#pricing" onClick={() => { trackSectionNav('pricing', 'header_mobile'); setMobileNavOpen(false); }}>Pricing</a>
                            <a href="#customers" onClick={() => { trackSectionNav('customers', 'header_mobile'); setMobileNavOpen(false); }}>Customers</a>
                            <Link href="/blogs" onClick={() => { trackBlogNav('header_mobile'); setMobileNavOpen(false); }}>Blog</Link>
                            <div className={styles.mobileAuthActions}>
                                <Link href="/login" className={styles.textAction} onClick={() => trackAuthCta('sign_in', 'header_mobile')}>Sign in</Link>
                                <Link href="/signup" className={styles.secondaryAction} onClick={() => trackAuthCta('start_free_trial', 'header_mobile')}>Start free trial</Link>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <section className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.heroGrid}>
                        <div className={styles.heroCopy}>
                            <div className={styles.eyebrow}>
                                <span className={styles.eyebrowDot} />
                                <span>Recruiter operating system · vNext</span>
                            </div>
                            <h1 className={styles.heroTitle}>
                                Search <span>800M profiles</span> in plain English, then move straight into outreach.
                            </h1>
                            <p className={styles.heroBody}>
                                Tahoe gives recruiting teams one place to find candidates, organize lists, enrich contact
                                data, launch native sequences, and watch replies without buying a noisy legacy stack.
                            </p>
                            <div className={styles.heroActions}>
                                <Link href="/signup" className={styles.primaryAction} onClick={() => trackAuthCta('start_free_trial', 'hero')}>
                                    Start free trial <ArrowIcon />
                                </Link>
                                <Link href="/login" className={styles.ghostAction} onClick={() => trackAuthCta('sign_in', 'hero')}>
                                    Sign in <ArrowUpRightIcon />
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

            <section className={styles.trustStrip}>
                <div className={styles.container}>
                    <div className={styles.trustIntro}>Trusted by recruiting teams at</div>
                    <div className={styles.trustLogos}>
                        {TRUSTED_BY.map((brand) => (
                            <span key={brand}>{brand}</span>
                        ))}
                    </div>
                </div>
            </section>

            <section id="product" className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Product</span>
                        <h2>Everything a recruiter needs, without the seven-figure stack.</h2>
                        <p>
                            Tahoe keeps the interface calm while the workflow gets deeper: find people, organize work,
                            enrich contacts, send outreach, and track outcomes from one system.
                        </p>
                    </div>

                    <div className={styles.featureGrid}>
                        {FEATURES.map((feature) => (
                            <article key={feature.tag} className={styles.featureCard}>
                                <div className={styles.featureCardTop}>
                                    <span className={styles.featureTag}>— {feature.tag}</span>
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
                        <h2>The recruiter operating system, shown the way the product actually works.</h2>
                        <p>
                            These are Tahoe-styled previews of the search, list, enrichment, campaign, mailbox, billing,
                            and analytics workflows defined in the PRD.
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
                                Get a glimpse into the operationally calm workflow. These panels preview the UI without touching
                                live dashboard state, APIs, auth, or recruiter data.
                            </p>
                        </div>
                        <div className={styles.screenIntroMeta}>
                            <span><SparkIcon /> Search, organize, enrich, launch, and measure</span>
                            <span><CheckIcon /> Presentational only — no backend behavior changes</span>
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
                                Tahoe is built for teams that want recruiter-grade capability without enterprise-contract
                                drag. Credits are visible, pricing is legible, and the system does not hide spend until the invoice arrives.
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
                        <span className={styles.sectionEyebrow}>Customers</span>
                        <h2>Loved by recruiters who care more about hires than software theater.</h2>
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
                            <h2>Stop paying for a 2009 product.</h2>
                            <p>
                                Continue with Google or email, run your first search, and see what Tahoe surfaces before lunch.
                            </p>
                            <div className={styles.heroActions}>
                                <Link href="/signup" className={styles.accentAction} onClick={() => trackAuthCta('start_free_trial', 'final_cta')}>
                                    Start free trial <ArrowIcon />
                                </Link>
                                <Link href="/login" className={styles.inverseGhostAction} onClick={() => trackAuthCta('sign_in', 'final_cta')}>
                                    Sign in <ArrowUpRightIcon />
                                </Link>
                            </div>
                        </div>

                        <div className={styles.ctaChecklist}>
                            {[
                                'Google sign-in and email auth stay intact',
                                'No credit card required to get started',
                                'Native outreach from your own inbox',
                                'Credits, enrichment, and reply flow shown up front',
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

            <footer className={styles.footer}>
                <div className={styles.container}>
                    <div className={styles.footerGrid}>
                        <div className={styles.footerBrand}>
                            <Logo />
                            <p>
                                Tahoe is the honest recruiter operating system: search in plain English, enrich cleanly,
                                send from your inbox, and keep the workflow operationally calm.
                            </p>
                        </div>

                        <div>
                            <h3>Product</h3>
                            <a href="#product" onClick={() => trackSectionNav('product', 'footer_column')}>Features</a>
                            <a href="#pricing" onClick={() => trackSectionNav('pricing', 'footer_column')}>Pricing</a>
                        </div>

                        <div>
                            <h3>Company</h3>
                            <Link href="/blogs" onClick={() => trackBlogNav('footer_column')}>Blog</Link>
                            <a href="#customers" onClick={() => trackSectionNav('customers', 'footer_column')}>Customers</a>
                            <a href="#screens" onClick={() => trackSectionNav('screens', 'footer_column')}>Product vision</a>
                            <a
                                href="/partner"
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackLandingEvent('footer_partner_clicked')}
                            >
                                Partner program
                            </a>
                        </div>

                        <div>
                            <h3>Legal</h3>
                            <Link href="/privacy">Privacy</Link>
                            <Link href="/cookie">Cookie</Link>
                            <CookieSettingsButton className={styles.footerColumnButton}>Cookie settings</CookieSettingsButton>
                            <Link href="/terms">Terms</Link>
                        </div>

                        <div>
                            <h3>Contact</h3>
                            <span>info@workonward.com</span>
                            <span className={styles.addressText}>124 E 14th St, New York, NY 10003</span>
                        </div>
                    </div>

                    <div className={styles.socialLinksRow}>
                        <a href="https://www.linkedin.com/company/workonward" target="_blank" rel="noreferrer" onClick={() => trackSocialClick('linkedin')}>LinkedIn</a>
                        <a href="https://www.facebook.com/workonward" target="_blank" rel="noreferrer" onClick={() => trackSocialClick('facebook')}>Facebook</a>
                        <a href="https://x.com/workonward" target="_blank" rel="noreferrer" onClick={() => trackSocialClick('x')}>X</a>
                        <a href="https://www.instagram.com/workonward" target="_blank" rel="noreferrer" onClick={() => trackSocialClick('instagram')}>Instagram</a>
                        <a href="https://www.youtube.com/@workonward" target="_blank" rel="noreferrer" onClick={() => trackSocialClick('youtube')}>YouTube</a>
                    </div>

                    <div className={styles.footerBottom}>
                        <span>© 2026 WorkOnward. Made for recruiters who would rather hire than negotiate contracts.</span>
                        <div className={styles.footerBottomLinks}>
                            <a href="#product" onClick={() => trackSectionNav('product', 'footer_bottom')}>Product</a>
                            <a href="#pricing" onClick={() => trackSectionNav('pricing', 'footer_bottom')}>Pricing</a>
                            <Link href="/blogs" onClick={() => trackBlogNav('footer_bottom')}>Blog</Link>
                            <Link href="/privacy">Privacy</Link>
                            <Link href="/cookie">Cookie</Link>
                            <CookieSettingsButton className={styles.footerBottomButton}>Cookie settings</CookieSettingsButton>
                            <Link href="/terms">Terms</Link>
                            <Link href="/login" onClick={() => trackAuthCta('sign_in', 'footer_bottom')}>Sign in</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
