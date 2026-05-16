import Link from 'next/link';
import BrandMark from '@/components/branding/BrandMark';
import CookieSettingsButton from '@/components/consent/CookieSettingsButton';
import styles from '../legal.module.css';

const sections = [
    {
        title: '1. Scope and summary',
        body: 'This Cookie Policy explains how WorkOnward ("Tahoe," "we," "us," or "our") uses cookies and similar browser technologies on tahoe.ai and in the Tahoe product experience. Tahoe is a recruiter workflow platform, so our browser-storage profile is primarily operational rather than advertising-driven: we use browser-side technologies to keep users signed in, preserve recruiter workflow state, secure authentication, and support Google sign-in and related account actions. On Tahoe’s public pages, our consent manager stores public-page consent status in the `tahoe_cookie_consent` cookie and can optionally enable Google Analytics on the landing page if a user turns analytics on.',
    },
    {
        title: '2. What counts as a cookie or similar technology',
        list: [
            'Cookies are small text files stored by a browser that can recognize a browser or device over time.',
            'Local storage and session storage are browser storage technologies that can store application state on your device and often serve a cookie-like function even when they are not technically cookies.',
            'Pixels, tags, scripts, SDKs, and anti-abuse technologies can also collect technical information, verify requests, or support sign-in and security workflows.',
        ],
        body: 'In this Cookie Policy, we use the term "cookies" broadly to include these related browser-side technologies unless the context requires a narrower meaning.',
    },
    {
        title: '3. How Tahoe uses these technologies',
        list: [
            'Authenticate users and keep signed-in sessions working across page loads.',
            'Restore recruiter workflow state, such as recent search state and saved-search rerun context, when a user navigates within the product.',
            'Support Google Sign-In and other account-access flows that depend on Google or related identity infrastructure.',
            'Prevent abuse, spam, and automated attacks during account registration, login, password reset, and similar security-sensitive actions.',
            'Remember operational UI state or short-lived workflow context needed to make the product function reliably.',
            'If a user opts in, measure how Tahoe’s public landing page is used so we can understand visits, engagement, and sign-up intent.',
        ],
    },
    {
        title: '4. Tahoe’s current categories of cookie-like technologies',
        list: [
            'Strictly necessary and security technologies. These help Tahoe authenticate users, secure account flows, prevent abuse, and keep core product functionality available.',
            'Functional and workflow-state technologies. These help Tahoe preserve search state, product context, and other in-app operational state so recruiters do not lose work while navigating.',
            'Third-party identity technologies. If you choose Google Sign-In, Google may use its own cookies or similar technologies on Google-controlled domains to provide identity, fraud prevention, and session management.',
            'Optional public-page analytics technologies. If you enable analytics through Tahoe’s `Cookie settings` control, Tahoe may use Google Analytics on the landing page to measure visits, scroll depth, section navigation, social-link clicks, and sign-up or sign-in intent.',
            'Public-page consent-state technologies. Tahoe stores the choices you make in the public consent experience in the `tahoe_cookie_consent` cookie.',
            'No advertising profile cookies. Based on Tahoe’s current implementation, Tahoe does not currently use advertising cookies for cross-context behavioral advertising.',
            'No cross-context behavioral advertising or marketing profile stack. Tahoe’s current public analytics implementation is limited to measurement and does not use advertising cookies for cross-context behavioral advertising.',
        ],
    },
    {
        title: '5. Browser storage Tahoe currently uses',
        body: 'Tahoe’s current implementation relies primarily on browser storage rather than a large first-party cookie footprint. The following examples reflect Tahoe’s current codebase and may evolve as features change.',
        list: [
            '`tahoe_cookie_consent` stores Tahoe’s current public-page consent state for the consent manager shown on landing, auth, and legal pages.',
            '`localStorage.tahoe_token` stores the Tahoe authentication token so a signed-in user can continue to access the product after page reloads.',
            '`sessionStorage.search_page_state` stores legacy search-page state so users can return to search results after navigating within the app.',
            '`sessionStorage.langgraph_search_preview_state_v1` stores LangGraph recruiter-search state so search previews and review state can be restored during a session.',
            '`sessionStorage.tahoe_search_page_bootstrap_v1` stores one-time saved-search rerun data so Tahoe can reopen a search flow cleanly without exposing unnecessary session details in the URL.',
            'If you opt in to analytics, Google Analytics may store measurement identifiers or related cookies on Tahoe’s public landing page.',
            'Authentication and anti-abuse flows may also rely on temporary browser-side state connected to Google Sign-In, ALTCHA, or similar security tooling.',
        ],
    },
    {
        title: '6. Third-party services and externally controlled technologies',
        body: 'Some technologies involved in Tahoe workflows are controlled by third parties rather than Tahoe directly. For example, when you use Google Sign-In or related Google account services, Google may set or access cookies and similar technologies under Google’s own policies. Tahoe may also load anti-abuse or identity-related scripts needed to protect account flows. We do not control third-party cookies or browser storage set by those providers on their own domains, and their use is governed by their own terms and privacy disclosures.',
    },
    {
        title: '7. How to control cookies and browser storage',
        list: [
            'You can reopen Tahoe’s public-page preferences at any time through the site’s `Cookie settings` control.',
            'You can usually remove or block cookies in your browser settings.',
            'You can clear local storage and session storage through your browser’s site-data controls.',
            'You can sign out of Tahoe, revoke Google access, or disconnect a Google-linked account where Tahoe makes those options available.',
            'You can use browser privacy settings or extensions that limit third-party cookies or related tracking technologies.',
        ],
        body: 'Please note that blocking or deleting strictly necessary cookies or Tahoe’s browser storage may break sign-in, search restoration, account security features, or other core product functions.',
    },
    {
        title: '8. Do Not Track and similar signals',
        body: 'Tahoe’s systems are not currently configured to respond differently to browser "Do Not Track" signals. If Tahoe adopts a different approach later, we will describe it here.',
    },
    {
        title: '9. Relationship to our Privacy Policy and U.S. privacy disclosures',
        body: 'This Cookie Policy should be read together with Tahoe’s Privacy Policy. For California and other U.S. state privacy frameworks, online identifiers, browser storage, and Internet or network activity data may be treated as personal information or personal data in some contexts. Tahoe’s Privacy Policy provides broader disclosures about the categories of information we collect, the purposes for which we use it, and how users may contact us about privacy requests.',
    },
    {
        title: '10. Changes to this Cookie Policy',
        body: 'We may update this Cookie Policy from time to time to reflect product changes, legal requirements, or changes in Tahoe’s use of browser technologies. When we do, we will update the "Last updated" date on this page and, where required, provide additional notice before a materially different non-essential use begins.',
    },
    {
        title: '11. Contact',
        body: 'Questions, privacy requests, and legal notices relating to this Cookie Policy may be sent to info@workonward.com or by mail to WorkOnward, 124 E 14th St, New York, NY 10003 until Tahoe publishes a more specific privacy or legal contact address.',
    },
];

export default function CookiePage() {
    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.brandLink} aria-label="Tahoe home">
                        <BrandMark subtitle />
                    </Link>
                    <div className={styles.headerActions}>
                        <Link href="/privacy" className={styles.headerLink}>Privacy</Link>
                        <Link href="/terms" className={styles.headerLink}>Terms</Link>
                        <Link href="/login" className={styles.headerLink}>Sign in</Link>
                    </div>
                </header>

                <section className={styles.hero}>
                    <span className={styles.eyebrow}>Cookie policy</span>
                    <h1 className={styles.title}>Cookie Policy</h1>
                    <p className={styles.lede}>
                        Tahoe uses browser storage and related technologies to keep recruiter workflows functional,
                        preserve search state, secure authentication, and support Google sign-in. This page explains
                        what Tahoe currently uses, how Tahoe’s public-page consent flow works, how optional analytics
                        behave on the landing page, and how users can control those choices.
                    </p>
                    <div className={styles.meta}>
                        <span><strong>Last updated:</strong> May 9, 2026</span>
                    </div>
                </section>

                <p className={styles.notice}>
                    Tahoe&apos;s current browser-technology profile is operational, not advertising-driven. Based on the
                    current implementation, Tahoe primarily uses local storage, session storage, Google sign-in related
                    identity infrastructure, security tooling, a public consent cookie, and, when a user opts in,
                    Google Analytics measurement on the landing page rather than a broad marketing or ad-tech stack.
                </p>

                <div className={styles.contentFlat}>
                    {sections.map((section) => (
                        <div key={section.title} className={styles.flatSection}>
                            <h2 className={styles.flatSectionTitle}>{section.title}</h2>
                            {section.body && <p className={styles.paragraph}>{section.body}</p>}
                            {section.list && (
                                <ul className={styles.list}>
                                    {section.list.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}

                    <div className={styles.flatSection}>
                        <h2 className={styles.flatSectionTitle}>Relevant guidance</h2>
                        <p className={styles.paragraph}>
                            Tahoe&apos;s cookie disclosures are informed by public U.S. privacy guidance and Tahoe&apos;s
                            actual implementation choices. Relevant materials include:
                        </p>
                        <ul className={styles.list}>
                            <li><a className={styles.inlineLink} href="https://www.ftc.gov/policy-notices/privacy-policy/internet-cookies" target="_blank" rel="noreferrer">FTC guidance on Internet cookies</a></li>
                            <li><a className={styles.inlineLink} href="https://oag.ca.gov/node/36676" target="_blank" rel="noreferrer">California DOJ guidance on privacy-policy transparency</a></li>
                            <li><a className={styles.inlineLink} href="https://cppa.ca.gov/faq" target="_blank" rel="noreferrer">California Privacy Protection Agency FAQs on CCPA / CPRA rights and business obligations</a></li>
                            <li><a className={styles.inlineLink} href="https://developers.google.com/identity/gsi/web/guides/overview" target="_blank" rel="noreferrer">Google Sign-In for Web overview</a></li>
                        </ul>
                    </div>

                    <div className={styles.flatSection}>
                        <h2 className={styles.flatSectionTitle}>Related policies</h2>
                        <p className={styles.paragraph}>
                            See Tahoe&apos;s <Link href="/privacy" className={styles.inlineLink}>Privacy Policy</Link> for
                            broader disclosures about personal information, and Tahoe&apos;s <Link href="/terms" className={styles.inlineLink}>Terms of Service</Link> for the rules that govern use of the platform.
                        </p>
                    </div>
                </div>

                <footer className={styles.footer}>
                    <span>© 2026 WorkOnward</span>
                    <div className={styles.footerLinks}>
                        <Link href="/">Home</Link>
                        <Link href="/privacy">Privacy</Link>
                        <CookieSettingsButton className={styles.footerButton}>Cookie settings</CookieSettingsButton>
                        <Link href="/terms">Terms</Link>
                        <Link href="/login">Sign in</Link>
                    </div>
                </footer>
            </div>
        </main>
    );
}
