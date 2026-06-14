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
} from '@/components/ui/icons';
import BrandMark from '@/components/branding/BrandMark';
import ProviderCreditsPanel from '@/app/dashboard/_components/ProviderCreditsPanel';
import styles from './dashboard.module.css';

type PrimarySection = 'search' | 'projects' | 'mailboxes' | 'outreach' | 'billing' | 'analytics' | 'settings';

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

function inferActiveSection(pathname: string | null): PrimarySection {
    if (!pathname) return 'search';
    if (pathname.startsWith('/dashboard/projects')) return 'projects';
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
    const [expanded, setExpanded] = useState<Set<PrimarySection>>(() => new Set([activeSection]));

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push('/login');
        }
    }, [router]);

    // Active section is always treated as expanded; manual collapses still win
    // for non-active sections via the `expanded` set toggled in `toggleSection`.
    const expandedWithActive = expanded.has(activeSection)
        ? expanded
        : new Set<PrimarySection>([...expanded, activeSection]);

    const handleLogout = () => {
        disableGoogleAutoSelect();
        removeToken();
        sessionStorage.removeItem('search_page_state');
        sessionStorage.removeItem('langgraph_search_preview_state_v1');
        window.location.href = 'https://tahoe.workonward.com';
    };

    const toggleSection = (key: PrimarySection) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const primaryNav = (Object.entries(sectionConfig) as Array<[PrimarySection, typeof sectionConfig[PrimarySection]]>).map(
        ([key, item]) => ({ key, ...item }),
    );
    const primaryWidth = collapsed ? 88 : 248;

    return (
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
                            const isExpanded = expandedWithActive.has(item.key);
                            const isActive = item.key === activeSection;
                            const hasSubnav = item.subnav.length > 0;

                            if (collapsed) {
                                return (
                                    <Link key={item.key} href={item.href} className={styles.navItem} title={item.label}>
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
                                                const isSubActive =
                                                    pathname === sub.href ||
                                                    (sub.href !== sectionConfig[item.key].href &&
                                                        pathname?.startsWith(sub.href + '/'));
                                                const isSectionRoot = sub.href === sectionConfig[item.key].href;
                                                const isSectionRootActive =
                                                    isSectionRoot && (pathname === sub.href || pathname === sub.href + '/');
                                                const active = isSubActive || isSectionRootActive;
                                                return (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        className={`${styles.sidebarSubnavItem} ${active ? styles.sidebarSubnavItemActive : ''}`}
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
                        <ProviderCreditsPanel collapsed={collapsed} />
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
                        <Link key={item.key} href={item.href} className={styles.navItem}>
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
        </div>
    );
}
