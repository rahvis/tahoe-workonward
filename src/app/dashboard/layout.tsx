'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, disableGoogleAutoSelect, isLoggedIn, removeToken } from '@/lib/api';
import {
    MagnifyingGlassIcon,
    PersonIcon,
    ExitIcon,
    HamburgerMenuIcon,
    Cross1Icon,
} from '@radix-ui/react-icons';
import BrandMark from '@/components/branding/BrandMark';
import styles from './dashboard.module.css';

interface UserInfo {
    first_name: string;
    last_name: string;
    email: string;
}

const navItems = [
    { href: '/dashboard/search', label: 'Search', icon: <MagnifyingGlassIcon width="18" height="18" /> },
    { href: '/dashboard/candidates', label: 'Candidates', icon: <PersonIcon width="18" height="18" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push('/login');
            return;
        }
        apiRequest<UserInfo>('/auth/me')
            .then(setUser)
            .catch(() => {
                removeToken();
                sessionStorage.removeItem('search_page_state');
                router.push('/login');
            });
    }, [router]);

    const handleLogout = () => {
        disableGoogleAutoSelect();
        removeToken();
        sessionStorage.removeItem('search_page_state');
        router.push('/');
    };

    return (
        <div className={styles.dashboardLayout}>
            <aside
                className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}
                style={{ width: collapsed ? 68 : 260 }}
            >
                <div className={styles.sidebarInner}>
                    <div className={styles.sidebarHeader}>
                        {!collapsed && (
                            <Link href="/dashboard/search" className={styles.brandLink}>
                                <BrandMark compact />
                            </Link>
                        )}
                        <button className={styles.iconButton} type="button" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle navigation">
                            {collapsed ? <HamburgerMenuIcon /> : <Cross1Icon />}
                        </button>
                    </div>

                    <nav className={styles.sidebarNav} aria-label="Dashboard">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                            const linkContent = (
                                <Link key={item.href} href={item.href} className={styles.navItem}>
                                    <span
                                        className={`${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}
                                    >
                                        <span className={styles.navIcon}>{item.icon}</span>
                                        {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                                    </span>
                                </Link>
                            );

                            if (collapsed) {
                                return linkContent;
                            }
                            return linkContent;
                        })}
                    </nav>

                    <div className={styles.sidebarFooter}>
                        {user && !collapsed && (
                            <div className={styles.userBlock}>
                                <div className={styles.userName}>{user.first_name} {user.last_name}</div>
                                <div className={styles.userEmail}>{user.email}</div>
                            </div>
                        )}
                        <button className={`${styles.navButton} ${styles.logoutButton}`} type="button" onClick={handleLogout}>
                            <span className={styles.navIcon}><ExitIcon width="18" height="18" /></span>
                            {!collapsed && <span className={styles.navLabel}>Log out</span>}
                        </button>
                    </div>
                </div>
            </aside>

            <main className={styles.mainContent} style={{ marginLeft: collapsed ? 68 : 260 }}>
                <div className={styles.contentInner}>
                    {children}
                </div>
            </main>

            <nav className={styles.bottomNav} aria-label="Mobile dashboard navigation">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link key={item.href} href={item.href} className={styles.navItem}>
                            <span
                                className={isActive ? styles.bottomNavActive : styles.bottomNavItem}
                            >
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
