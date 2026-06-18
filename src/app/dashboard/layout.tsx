'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { disableGoogleAutoSelect, isLoggedIn, removeToken } from '@/lib/api';
import {
    ChevronDownIcon,
    ChevronRightIcon,
    EnvelopeClosedIcon,
    ExitIcon,
    HamburgerMenuIcon,
    LayersIcon,
    MagnifyingGlassIcon,
    PaperPlaneIcon,
    CardStackIcon,
    BarChartIcon,
    GearIcon,
    BriefcaseIcon,
} from '@/components/ui/icons';
import BrandMark from '@/components/branding/BrandMark';
import ProviderCreditsPanel from '@/app/dashboard/_components/ProviderCreditsPanel';
import OnboardingProvider from '@/app/dashboard/_components/onboarding/OnboardingProvider';
import OnboardingRoot from '@/app/dashboard/_components/onboarding/OnboardingRoot';
import styles from './dashboard.module.css';

type PrimarySection = 'search' | 'projects' | 'jobs' | 'mailboxes' | 'outreach' | 'billing' | 'analytics' | 'settings';

const sectionConfig = {
    search: {
        label: 'Search',
        href: '/dashboard/search/new',
        icon: <MagnifyingGlassIcon width="18" height="18" />,
        subnav: [
            { href: '/dashboard/search/new', label: 'New Search' },
            { href: '/dashboard/search/saved-candidates', label: 'Saved Candidates' },
        ],
    },
    projects: {
        label: 'Projects',
        href: '/dashboard/projects',
        icon: <LayersIcon width="18" height="18" />,
        subnav: [
            { href: '/dashboard/projects', label: 'All Projects' },
            { href: '/dashboard/projects/lists', label: 'Lists' },
        ],
    },
    jobs: {
        label: 'Jobs',
        href: '/dashboard/jobs/postings',
        icon: <BriefcaseIcon width="18" height="18" />,
        subnav: [
            { href: '/dashboard/jobs/postings', label: 'Job Postings' },
            { href: '/dashboard/jobs/pipeline', label: 'Candidates' },
            { href: '/dashboard/jobs/search', label: 'Talent Search' },
            // Hidden from the sidebar (UI only). The /dashboard/jobs/messages route +
            // all backend messaging stay intact and are reached via the candidate
            // Email tab → "Open Messages". Re-enable by uncommenting:
            // { href: '/dashboard/jobs/messages', label: 'Messages' },
            { href: '/dashboard/jobs/career-page', label: 'Organization' },
            { href: '/dashboard/jobs/analytics', label: 'Analytics' },
        ],
    },
    outreach: {
        label: 'Outreach',
        href: '/dashboard/outreach/campaigns',
        icon: <PaperPlaneIcon width="18" height="18" />,
        subnav: [],
    },
    mailboxes: {
        label: 'Mailboxes',
        href: '/dashboard/mailboxes',
        icon: <EnvelopeClosedIcon width="18" height="18" />,
        subnav: [],
    },
    billing: {
        label: 'Billing',
        href: '/dashboard/billing/plan',
        icon: <CardStackIcon width="18" height="18" />,
        subnav: [],
    },
    analytics: {
        label: 'Analytics',
        href: '/dashboard/analytics/overview',
        icon: <BarChartIcon width="18" height="18" />,
        subnav: [],
    },
    settings: {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: <GearIcon width="18" height="18" />,
        subnav: [],
    },
} as const satisfies Record<PrimarySection, {
    label: string;
    href: string;
    icon: React.ReactNode;
    subnav: Array<{ href: string; label: string }>;
}>;

function pathMatches(pathname: string | null, href: string): boolean {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
}

// A subnav item is active when the path is inside its route. The section-root item
// (whose href equals the section href, e.g. "All Projects") stays active for any
// page under the section that a more specific sibling does not own — so project
// detail pages keep "All Projects" highlighted while "/projects/lists" hands off
// to "Lists".
function isSubnavItemActive(
    pathname: string | null,
    subHref: string,
    sectionHref: string,
    siblingHrefs: string[],
): boolean {
    if (subHref === sectionHref) {
        if (!pathMatches(pathname, sectionHref)) return false;
        return !siblingHrefs.some((href) => href !== sectionHref && pathMatches(pathname, href));
    }
    return pathMatches(pathname, subHref);
}

function inferActiveSection(pathname: string | null): PrimarySection {
    if (!pathname) return 'search';
    if (pathname.startsWith('/dashboard/projects')) return 'projects';
    if (pathname.startsWith('/dashboard/jobs')) return 'jobs';
    if (pathname.startsWith('/dashboard/mailboxes')) return 'mailboxes';
    if (pathname.startsWith('/dashboard/outreach')) return 'outreach';
    if (pathname.startsWith('/dashboard/billing')) return 'billing';
    if (pathname.startsWith('/dashboard/analytics')) return 'analytics';
    if (pathname.startsWith('/dashboard/settings')) return 'settings';
    return 'search';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const activeSection = inferActiveSection(pathname);
    // Explicit open/closed overrides keyed by section. When a section has no
    // override it defaults to "open if it's the active section". This lets the
    // user collapse the active section and re-expand it (the old logic force-
    // expanded the active section, so clicking it never collapsed).
    const [openOverride, setOpenOverride] = useState<Partial<Record<PrimarySection, boolean>>>({});
    const isSectionOpen = (key: PrimarySection) => openOverride[key] ?? key === activeSection;

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push('/login');
        }
    }, [router]);

    const handleLogout = () => {
        disableGoogleAutoSelect();
        removeToken();
        sessionStorage.removeItem('search_page_state');
        sessionStorage.removeItem('langgraph_search_preview_state_v1');
        window.location.href = 'https://tahoe.workonward.com';
    };

    const toggleSection = (key: PrimarySection) => {
        setOpenOverride((prev) => ({ ...prev, [key]: !(prev[key] ?? key === activeSection) }));
    };

    const primaryNav = (Object.entries(sectionConfig) as Array<[PrimarySection, typeof sectionConfig[PrimarySection]]>).map(
        ([key, item]) => ({ key, ...item }),
    );
    const primaryWidth = collapsed ? 88 : 248;

    return (
        <OnboardingProvider>
        <div className={styles.dashboardLayout} data-tahoe-dashboard>
            <aside
                className={`${styles.primarySidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}
                style={{ width: primaryWidth }}
            >
                <div className={styles.sidebarInner}>
                    <div className={`${styles.sidebarHeader} ${collapsed ? styles.sidebarHeaderCollapsed : ''}`}>
                        {!collapsed ? (
                            <Link href="/dashboard/search/new" className={styles.brandLink}>
                                <BrandMark compact />
                            </Link>
                        ) : null}
                        <button
                            className={styles.iconButton}
                            type="button"
                            onClick={() => setCollapsed((value) => !value)}
                            aria-label="Toggle navigation"
                        >
                            <HamburgerMenuIcon />
                        </button>
                    </div>

                    <nav className={styles.sidebarNav} aria-label="Primary dashboard navigation">
                        {primaryNav.map((item) => {
                            const isExpanded = isSectionOpen(item.key);
                            const isActive = item.key === activeSection;
                            const hasSubnav = item.subnav.length > 0;

                            if (collapsed) {
                                return (
                                    <Link
                                        key={item.key}
                                        href={item.href}
                                        className={styles.navItem}
                                        title={item.label}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        <span className={`${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}>
                                            <span className={styles.navIcon}>{item.icon}</span>
                                        </span>
                                    </Link>
                                );
                            }

                            if (!hasSubnav) {
                                return (
                                    <Link
                                        key={item.key}
                                        href={item.href}
                                        className={`${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}
                                        aria-current={isActive ? 'page' : undefined}
                                        data-onboarding={item.key === 'mailboxes' ? 'mailboxes' : undefined}
                                    >
                                        <span className={styles.navIcon}>{item.icon}</span>
                                        <span className={styles.navLabel}>{item.label}</span>
                                    </Link>
                                );
                            }

                            return (
                                <div key={item.key} className={styles.sidebarSection}>
                                    <button
                                        type="button"
                                        className={`${styles.navButton} ${styles.sidebarSectionToggle} ${isActive ? styles.navButtonActive : ''}`}
                                        onClick={() => toggleSection(item.key)}
                                        aria-expanded={isExpanded}
                                        aria-controls={`subnav-${item.key}`}
                                    >
                                        <span className={styles.navIcon}>{item.icon}</span>
                                        <span className={styles.navLabel}>{item.label}</span>
                                        <span className={styles.chevron}>
                                            {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                        </span>
                                    </button>
                                    {isExpanded ? (
                                        <div id={`subnav-${item.key}`} className={styles.sidebarSubnav}>
                                            {item.subnav.map((sub) => {
                                                const active = isSubnavItemActive(
                                                    pathname,
                                                    sub.href,
                                                    sectionConfig[item.key].href,
                                                    item.subnav.map((entry) => entry.href),
                                                );
                                                return (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        className={`${styles.sidebarSubnavItem} ${active ? styles.sidebarSubnavItemActive : ''}`}
                                                        aria-current={active ? 'page' : undefined}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </nav>

                    <div className={styles.sidebarFooter}>
                        <div data-onboarding="credits">
                            <ProviderCreditsPanel collapsed={collapsed} />
                        </div>
                        <button
                            className={styles.navButton}
                            type="button"
                            onClick={() => window.dispatchEvent(new Event('tahoe:onboarding-relaunch'))}
                            aria-label="Getting started"
                        >
                            <span className={styles.navIcon} aria-hidden="true">?</span>
                            {!collapsed ? <span className={styles.navLabel}>Getting started</span> : null}
                        </button>
                        <button className={`${styles.navButton} ${styles.logoutButton}`} type="button" onClick={handleLogout}>
                            <span className={styles.navIcon}><ExitIcon width="18" height="18" /></span>
                            {!collapsed ? <span className={styles.navLabel}>Log out</span> : null}
                        </button>
                    </div>
                </div>
            </aside>

            <main className={styles.mainContent} style={{ marginLeft: primaryWidth }}>
                <div className={styles.workspaceFrame}>
                    <div className={styles.workspaceSurface}>
                        <div className={styles.contentInner}>
                            {children}
                        </div>
                    </div>
                </div>
            </main>

            <nav className={styles.bottomNav} aria-label="Mobile dashboard navigation">
                {primaryNav.map((item) => {
                    const isActive = item.key === activeSection;
                    return (
                        <Link key={item.key} href={item.href} className={styles.navItem} aria-current={isActive ? 'page' : undefined}>
                            <span className={isActive ? styles.bottomNavActive : styles.bottomNavItem}>
                                {item.icon}
                                <span>{item.label}</span>
                            </span>
                        </Link>
                    );
                })}
                <button className={styles.bottomNavItem} type="button" onClick={handleLogout}>
                    <ExitIcon width="18" height="18" />
                    <span>Logout</span>
                </button>
            </nav>

            <OnboardingRoot />
        </div>
        </OnboardingProvider>
    );
}
