'use client';

import Link from 'next/link';
import { useState } from 'react';
import CookieSettingsButton from '@/components/consent/CookieSettingsButton';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { HamburgerMenuIcon, Cross1Icon } from '@/components/ui/icons';
import { trackLandingEvent } from '@/lib/public-analytics';
import { ui } from '@/i18n/ui-dictionary';
import { useLocale } from '@/i18n/useLocale';
import styles from '@/app/[lang]/page.module.css';

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
    const lang = useLocale();
    const t = ui[lang];
    const home = `/${lang}`;
    const L = (path: string) => `/${lang}${path}`;

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.headerInner}>
                    <Link
                        href={home}
                        className={styles.logoLink}
                        aria-label="Tahoe home"
                        onClick={(event) => {
                            if (typeof window !== 'undefined' && window.location.pathname === home) {
                                event.preventDefault();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setMobileNavOpen(false);
                            }
                        }}
                    >
                        <Logo />
                    </Link>

                    <nav className={styles.desktopNav} aria-label="Primary">
                        <Link href={L('/product')} onClick={() => trackSectionNav('product', `${placement}_header_desktop`)}>{t.nav.product}</Link>
                        <Link href={L('/features')} onClick={() => trackSectionNav('features', `${placement}_header_desktop`)}>{t.nav.features}</Link>
                        <Link href={L('/hiring')} onClick={() => trackSectionNav('hiring', `${placement}_header_desktop`)}>{t.nav.hiring}</Link>
                        <Link href={L('/pricing')} onClick={() => trackSectionNav('pricing', `${placement}_header_desktop`)}>{t.nav.pricing}</Link>
                        <Link href={L('/our-story')} onClick={() => trackSectionNav('our_story', `${placement}_header_desktop`)}>{t.nav.ourStory}</Link>
                        <Link href={L('/blogs')} onClick={() => trackBlogNav(`${placement}_header_desktop`)}>{t.nav.blog}</Link>
                    </nav>

                    <div className={styles.headerActions}>
                        {/* The careers board lives at un-localized /jobs/*, so the locale
                            switcher (which would point at /{locale}/jobs) is hidden there. */}
                        {placement !== 'jobs' && <LanguageSwitcher />}
                        <Link href={L('/login')} className={styles.textAction} onClick={() => trackAuthCta('sign_in', `${placement}_header_desktop`)}>
                            {t.nav.signIn}
                        </Link>
                        <Link href={L('/signup')} className={styles.secondaryAction} onClick={() => trackAuthCta('start_free_trial', `${placement}_header_desktop`)}>
                            {t.nav.startFree} <ArrowUpRightIcon />
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
                        <Link href={L('/product')} onClick={() => { trackSectionNav('product', `${placement}_header_mobile`); setMobileNavOpen(false); }}>{t.nav.product}</Link>
                        <Link href={L('/features')} onClick={() => { trackSectionNav('features', `${placement}_header_mobile`); setMobileNavOpen(false); }}>{t.nav.features}</Link>
                        <Link href={L('/hiring')} onClick={() => { trackSectionNav('hiring', `${placement}_header_mobile`); setMobileNavOpen(false); }}>{t.nav.hiring}</Link>
                        <Link href={L('/pricing')} onClick={() => { trackSectionNav('pricing', `${placement}_header_mobile`); setMobileNavOpen(false); }}>{t.nav.pricing}</Link>
                        <Link href={L('/our-story')} onClick={() => { trackSectionNav('our_story', `${placement}_header_mobile`); setMobileNavOpen(false); }}>{t.nav.ourStory}</Link>
                        <Link href={L('/blogs')} onClick={() => { trackBlogNav(`${placement}_header_mobile`); setMobileNavOpen(false); }}>{t.nav.blog}</Link>
                        <div className={styles.mobileAuthActions}>
                            {placement !== 'jobs' && <LanguageSwitcher />}
                            <Link href={L('/login')} className={styles.textAction} onClick={() => trackAuthCta('sign_in', `${placement}_header_mobile`)}>{t.nav.signIn}</Link>
                            <Link href={L('/signup')} className={styles.secondaryAction} onClick={() => trackAuthCta('start_free_trial', `${placement}_header_mobile`)}>{t.nav.startFree}</Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

export function PublicSiteFooter({ placement = 'blog' }: { placement?: string } = {}) {
    const lang = useLocale();
    const t = ui[lang];
    const L = (path: string) => `/${lang}${path}`;

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.footerGrid}>
                    <div className={styles.footerBrand}>
                        <Logo />
                        <p>{t.footer.brand}</p>
                    </div>

                    <div>
                        <h3>{t.footer.productHeading}</h3>
                        <Link href={L('/features')} onClick={() => trackSectionNav('features', `${placement}_footer_column`)}>{t.footer.features}</Link>
                        <Link href={L('/hiring')} onClick={() => trackSectionNav('hiring', `${placement}_footer_column`)}>{t.footer.hiring}</Link>
                        <Link href={L('/pricing')} onClick={() => trackSectionNav('pricing', `${placement}_footer_column`)}>{t.footer.pricing}</Link>
                    </div>

                    <div>
                        <h3>{t.footer.companyHeading}</h3>
                        <Link href={L('/our-story')} onClick={() => trackSectionNav('our_story', `${placement}_footer_column`)}>{t.footer.ourStory}</Link>
                        <Link href={L('/blogs')} onClick={() => trackBlogNav(`${placement}_footer_column`)}>{t.footer.blog}</Link>
                        <Link href={L('/resources')} onClick={() => trackLandingEvent('footer_resources_clicked')}>{t.footer.resources}</Link>
                        <Link href={L('/customers')} onClick={() => trackSectionNav('customers', `${placement}_footer_column`)}>{t.footer.customers}</Link>
                        <Link href={L('/product')} onClick={() => trackSectionNav('product', `${placement}_footer_column`)}>{t.footer.productVision}</Link>
                        <Link href={L('/partner')} onClick={() => trackLandingEvent('footer_partner_clicked')}>{t.footer.partnerProgram}</Link>
                    </div>

                    <div>
                        <h3>{t.footer.legalHeading}</h3>
                        <Link href={L('/privacy')}>{t.footer.privacy}</Link>
                        <Link href={L('/cookie')}>{t.footer.cookie}</Link>
                        <CookieSettingsButton className={styles.footerColumnButton}>{t.footer.cookieSettings}</CookieSettingsButton>
                        <Link href={L('/terms')}>{t.footer.terms}</Link>
                    </div>

                    <div>
                        <h3>{t.footer.contactHeading}</h3>
                        <span>info@workonward.com</span>
                        <span className={styles.addressText}>{t.footer.address}</span>
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
                    <span>{t.footer.rights}</span>
                    <div className={styles.footerBottomLinks}>
                        <Link href={L('/product')} onClick={() => trackSectionNav('product', `${placement}_footer_bottom`)}>{t.nav.product}</Link>
                        <Link href={L('/pricing')} onClick={() => trackSectionNav('pricing', `${placement}_footer_bottom`)}>{t.nav.pricing}</Link>
                        <Link href={L('/blogs')} onClick={() => trackBlogNav(`${placement}_footer_bottom`)}>{t.footer.blog}</Link>
                        <Link href={L('/privacy')}>{t.footer.privacy}</Link>
                        <Link href={L('/cookie')}>{t.footer.cookie}</Link>
                        <CookieSettingsButton className={styles.footerBottomButton}>{t.footer.cookieSettings}</CookieSettingsButton>
                        <Link href={L('/terms')}>{t.footer.terms}</Link>
                        <Link href={L('/login')} onClick={() => trackAuthCta('sign_in', `${placement}_footer_bottom`)}>{t.nav.signIn}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
