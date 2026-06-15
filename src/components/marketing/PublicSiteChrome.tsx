'use client';

import Link from 'next/link';
import { useState } from 'react';
import CookieSettingsButton from '@/components/consent/CookieSettingsButton';
import { HamburgerMenuIcon, Cross1Icon } from '@/components/ui/icons';
import { trackLandingEvent } from '@/lib/public-analytics';
import styles from '@/app/page.module.css';

function ArrowUpRightIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.inlineIcon}>
            <path d="M6 14 14 6m0 0H7m7 0v7" />
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

function trackSectionNav(section: string, placement: string) {
    trackLandingEvent('landing_section_nav_click', { section, placement });
}

function trackAuthCta(cta: string, placement: string) {
    trackLandingEvent('landing_auth_cta_click', { cta, placement });
}

function trackBlogNav(placement: string) {
    trackLandingEvent('landing_blog_nav_click', { placement });
}

function trackSocialClick(platform: string) {
    trackLandingEvent('landing_social_click', { platform });
}

export function PublicSiteHeader({ placement = 'blog' }: { placement?: string } = {}) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.headerInner}>
                    <Link
                        href="/"
                        className={styles.logoLink}
                        aria-label="Tahoe home"
                        onClick={(event) => {
                            // On the landing page itself, smooth-scroll to top instead
                            // of a no-op navigation. Harmless elsewhere (not on "/").
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
                        <Link href="/product" onClick={() => trackSectionNav('product', `${placement}_header_desktop`)}>Product</Link>
                        <Link href="/features" onClick={() => trackSectionNav('features', `${placement}_header_desktop`)}>Features</Link>
                        <Link href="/pricing" onClick={() => trackSectionNav('pricing', `${placement}_header_desktop`)}>Pricing</Link>
                        <Link href="/customers" onClick={() => trackSectionNav('customers', `${placement}_header_desktop`)}>Customers</Link>
                        <Link href="/blogs" onClick={() => trackBlogNav(`${placement}_header_desktop`)}>Blog</Link>
                    </nav>

                    <div className={styles.headerActions}>
                        <Link href="/login" className={styles.textAction} onClick={() => trackAuthCta('sign_in', `${placement}_header_desktop`)}>
                            Sign in
                        </Link>
                        <Link href="/signup" className={styles.secondaryAction} onClick={() => trackAuthCta('start_free_trial', `${placement}_header_desktop`)}>
                            Start for free <ArrowUpRightIcon />
                        </Link>
                        <button
                            type="button"
                            className={styles.mobileToggle}
                            aria-expanded={mobileNavOpen}
                            aria-label="Toggle navigation"
                            onClick={() => {
                                trackLandingEvent('landing_mobile_nav_toggle', { state: mobileNavOpen ? 'closed' : 'open', placement });
                                setMobileNavOpen((open) => !open);
                            }}
                        >
                            {mobileNavOpen ? <Cross1Icon /> : <HamburgerMenuIcon />}
                        </button>
                    </div>
                </div>

                {mobileNavOpen && (
                    <div className={styles.mobileNav} aria-label="Mobile navigation">
                        <Link href="/product" onClick={() => { trackSectionNav('product', `${placement}_header_mobile`); setMobileNavOpen(false); }}>Product</Link>
                        <Link href="/features" onClick={() => { trackSectionNav('features', `${placement}_header_mobile`); setMobileNavOpen(false); }}>Features</Link>
                        <Link href="/pricing" onClick={() => { trackSectionNav('pricing', `${placement}_header_mobile`); setMobileNavOpen(false); }}>Pricing</Link>
                        <Link href="/customers" onClick={() => { trackSectionNav('customers', `${placement}_header_mobile`); setMobileNavOpen(false); }}>Customers</Link>
                        <Link href="/blogs" onClick={() => { trackBlogNav(`${placement}_header_mobile`); setMobileNavOpen(false); }}>Blog</Link>
                        <div className={styles.mobileAuthActions}>
                            <Link href="/login" className={styles.textAction} onClick={() => trackAuthCta('sign_in', `${placement}_header_mobile`)}>Sign in</Link>
                            <Link href="/signup" className={styles.secondaryAction} onClick={() => trackAuthCta('start_free_trial', `${placement}_header_mobile`)}>Start for free</Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

export function PublicSiteFooter({ placement = 'blog' }: { placement?: string } = {}) {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.footerGrid}>
                    <div className={styles.footerBrand}>
                        <Logo />
                        <p>
                            Tahoe is the AI recruiting platform that sources, enriches, and sends outreach in one place.
                            You just describe who you are looking for.
                        </p>
                    </div>

                    <div>
                        <h3>Product</h3>
                        <Link href="/features" onClick={() => trackSectionNav('features', `${placement}_footer_column`)}>Features</Link>
                        <Link href="/pricing" onClick={() => trackSectionNav('pricing', `${placement}_footer_column`)}>Pricing</Link>
                    </div>

                    <div>
                        <h3>Company</h3>
                        <Link href="/blogs" onClick={() => trackBlogNav(`${placement}_footer_column`)}>Blog</Link>
                        <a
                            href="/resources"
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => trackLandingEvent('footer_resources_clicked')}
                        >
                            Resources
                        </a>
                        <Link href="/customers" onClick={() => trackSectionNav('customers', `${placement}_footer_column`)}>Customers</Link>
                        <Link href="/product" onClick={() => trackSectionNav('product', `${placement}_footer_column`)}>Product vision</Link>
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
                        <Link href="/product" onClick={() => trackSectionNav('product', `${placement}_footer_bottom`)}>Product</Link>
                        <Link href="/pricing" onClick={() => trackSectionNav('pricing', `${placement}_footer_bottom`)}>Pricing</Link>
                        <Link href="/blogs" onClick={() => trackBlogNav(`${placement}_footer_bottom`)}>Blog</Link>
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/cookie">Cookie</Link>
                        <CookieSettingsButton className={styles.footerBottomButton}>Cookie settings</CookieSettingsButton>
                        <Link href="/terms">Terms</Link>
                        <Link href="/login" onClick={() => trackAuthCta('sign_in', `${placement}_footer_bottom`)}>Sign in</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
