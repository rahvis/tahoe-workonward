import Link from 'next/link';
import BrandMark from '@/components/branding/BrandMark';
import CookieSettingsButton from '@/components/consent/CookieSettingsButton';
import styles from '../legal.module.css';

const sections = [
    {
        title: '1. Agreement to the Terms',
        body: 'These Terms of Service ("Terms") govern your access to and use of the Tahoe service, websites, applications, APIs, and related features provided by WorkOnward ("Tahoe," "we," "us," or "our"). By using Tahoe, you agree to these Terms. If you use Tahoe on behalf of an employer or other organization, you represent that you have authority to bind that organization to these Terms. Tahoe’s public pages may also use optional analytics if you choose to enable them through the site’s cookie settings, as described in the Cookie Policy and Privacy Policy.',
    },
    {
        title: '2. Eligibility and business use',
        body: 'Tahoe is intended for business and professional use, especially recruiting and talent workflows. You must be legally able to enter into this agreement and comply with applicable law. Tahoe is not directed to children under 13, and child-directed products must not use Google Sign-In or other Google API services that access Google account data.',
    },
    {
        title: '3. Accounts, authentication, and security',
        body: 'You are responsible for maintaining the confidentiality of your account credentials, for all activity that occurs under your account, and for notifying Tahoe promptly of unauthorized use. Tahoe may offer email/password sign-in, Google Sign-In, or other authentication methods. You must provide accurate account information and keep it reasonably current.',
    },
    {
        title: '4. Google Sign-In, Gmail API, and connected mailboxes',
        body: 'If you sign in with Google or connect a Gmail or Google Workspace mailbox, you authorize Tahoe to access the Google data and scopes that you approve during OAuth consent. You remain responsible for the mailbox, the content you send, the audience you contact, and the settings you choose. Tahoe will use Google user data only as disclosed in the Privacy Policy and in compliance with the Google API Services User Data Policy, including the Limited Use requirements.',
    },
    {
        title: '5. Candidate data, searches, enrichments, and outreach',
        body: 'Tahoe may help you search for candidates, save results, enrich contact data, draft outreach, and send messages through your connected mailbox. You are solely responsible for determining whether your collection, import, enrichment, access, storage, or use of candidate information is lawful and appropriate for your use case.',
        list: [
            'You must have an appropriate legal basis or other lawful authority to process personal information through Tahoe.',
            'You must comply with applicable employment, privacy, anti-spam, consumer-protection, and communications laws and regulations, including laws governing recruiter outreach, email marketing, and telephone or SMS contact where applicable.',
            'You must not use Tahoe to harass, discriminate against, surveil unlawfully, or process data for prohibited or deceptive purposes.',
            'You must not misrepresent your identity, your employer, or the purpose of your outreach.',
        ],
    },
    {
        title: '6. Minimum-scope and permitted-use expectations',
        body: 'You agree not to configure, use, or request integrations in a way that exceeds the minimum permissions needed for Tahoe\u2019s user-facing features. Where Tahoe offers multiple integration or scope options, the least permissive option suitable for the feature should be used. Tahoe may restrict or remove features, scopes, or workflows that create unacceptable privacy, verification, or security risk.',
    },
    {
        title: '7. Acceptable use restrictions',
        list: [
            'Do not use Tahoe to violate law, third-party rights, or contractual obligations.',
            'Do not upload malware, harmful code, or content intended to disrupt the Service or other users.',
            'Do not scrape, reverse engineer, or probe the Service except to the extent non-waivable law allows it.',
            'Do not attempt to bypass rate limits, security controls, account restrictions, or integration restrictions.',
            'Do not use Tahoe or Google-connected data for advertising resale, data brokerage, surveillance, or determining credit-worthiness.',
        ],
        body: 'Tahoe may investigate suspected misuse and suspend or terminate access where necessary to protect the Service, our users, Google platform access, or third parties.',
    },
    {
        title: '8. Fees, credits, and future paid features',
        body: 'If Tahoe enables paid plans, credits, top-ups, or other paid features, you agree to the pricing, usage, and billing terms presented at the time of purchase. Unless otherwise stated, fees are non-refundable except where required by law. Tahoe may suspend certain functionality for failed payments, fraud risk, abuse, or account non-compliance.',
    },
    {
        title: '9. Intellectual property and feedback',
        body: 'Tahoe and its licensors own the Service, including its software, design, branding, and related intellectual property, except for your content and third-party content. Subject to these Terms, Tahoe grants you a limited, non-exclusive, revocable right to use the Service for your internal business purposes. If you provide feedback, suggestions, or product ideas, Tahoe may use them without restriction or compensation.',
    },
    {
        title: '10. Third-party services and data sources',
        body: 'Tahoe depends on third-party services, including Google, data providers, enrichment vendors, hosting providers, payment providers, and, on the public landing page where a user opts in, Google Analytics measurement services. Those services may change, impose restrictions, suspend access, or introduce downtime beyond Tahoe\u2019s control. Tahoe is not responsible for the acts or omissions of third parties, except as required by law.',
    },
    {
        title: '11. Suspension and termination',
        body: 'You may stop using Tahoe at any time. Tahoe may suspend or terminate access immediately if we believe you violated these Terms, created legal or security risk, threatened the integrity of the Service, endangered third-party rights, or put Tahoe\u2019s Google API access or other platform access at risk. We may also remove connected integrations or features if required by vendor policy, law, or security necessity.',
    },
    {
        title: '12. Disclaimers',
        body: 'Tahoe is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, Tahoe disclaims all warranties, whether express, implied, or statutory, including implied warranties of merchantability, fitness for a particular purpose, title, non-infringement, availability, accuracy, and uninterrupted service. Tahoe does not guarantee candidate accuracy, contact deliverability, provider uptime, mailbox deliverability, response rates, hiring outcomes, or legal compliance for your use case.',
    },
    {
        title: '13. Limitation of liability',
        body: 'To the maximum extent permitted by law, Tahoe and its affiliates, officers, directors, employees, and licensors will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for any loss of profits, revenues, goodwill, data, or business opportunities, arising from or relating to the Service or these Terms. To the maximum extent permitted by law, Tahoe\u2019s aggregate liability for claims arising out of or relating to the Service will not exceed the greater of (a) the amounts you paid Tahoe for the Service in the twelve months before the event giving rise to the claim, or (b) one hundred U.S. dollars (US $100).',
    },
    {
        title: '14. Indemnity',
        body: 'You will defend, indemnify, and hold harmless Tahoe and its affiliates, officers, directors, employees, and agents from and against claims, liabilities, damages, losses, and expenses, including reasonable attorneys\u2019 fees, arising out of or relating to your content, your use of the Service, your candidate data practices, your outreach activity, your violation of law, or your violation of these Terms.',
    },
    {
        title: '15. Governing law and disputes',
        body: 'Except to the extent applicable law provides otherwise, these Terms are governed by the laws applicable in the jurisdiction where WorkOnward maintains its principal place of business, excluding conflict-of-laws rules. Any dispute arising out of or relating to these Terms or the Service must be brought in a court of competent jurisdiction serving that location, unless a different forum is required by non-waivable law.',
    },
    {
        title: '16. Changes to the Terms',
        body: 'Tahoe may update these Terms from time to time. If we make material changes, we will post the updated Terms and revise the \u201cLast updated\u201d date. Your continued use of Tahoe after the effective date of revised Terms constitutes acceptance of the updated Terms.',
    },
    {
        title: '17. Contact',
        body: 'Questions, legal notices, or requests relating to these Terms may be sent to info@workonward.com or by mail to WorkOnward, 124 E 14th St, New York, NY 10003 until Tahoe publishes a separate legal notice address.',
    },
];

export default function TermsPage() {
    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.brandLink} aria-label="Tahoe home">
                        <BrandMark subtitle />
                    </Link>
                    <div className={styles.headerActions}>
                        <Link href="/privacy" className={styles.headerLink}>Privacy</Link>
                        <Link href="/cookie" className={styles.headerLink}>Cookie</Link>
                        <Link href="/login" className={styles.headerLink}>Sign in</Link>
                    </div>
                </header>

                <section className={styles.hero}>
                    <span className={styles.eyebrow}>Terms of service</span>
                    <h1 className={styles.title}>Terms of Service</h1>
                    <p className={styles.lede}>
                        These Terms cover Tahoe&apos;s recruiter workflow platform, including Google sign-in, Gmail mailbox
                        connections, candidate search, enrichment, recruiter outreach features, and the public website
                        experience that links to those flows.
                    </p>
                    <div className={styles.meta}>
                        <span><strong>Last updated:</strong> May 9, 2026</span>
                    </div>
                </section>

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
                        <h2 className={styles.flatSectionTitle}>Related policies</h2>
                        <p className={styles.paragraph}>
                            These Terms work together with Tahoe&apos;s <Link href="/privacy" className={styles.inlineLink}>Privacy Policy</Link> and
                            <Link href="/cookie" className={styles.inlineLink}> Cookie Policy</Link>. If you connect Google services, Google&apos;s own
                            policies and scope-verification requirements also apply. Tahoe&apos;s public-site analytics choices, if enabled,
                            are governed by those same policy pages and the site&apos;s Cookie settings control.
                        </p>
                    </div>
                </div>

                <footer className={styles.footer}>
                    <span>© 2026 WorkOnward</span>
                    <div className={styles.footerLinks}>
                        <Link href="/">Home</Link>
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/cookie">Cookie</Link>
                        <CookieSettingsButton className={styles.footerButton}>Cookie settings</CookieSettingsButton>
                        <Link href="/signup">Create account</Link>
                    </div>
                </footer>
            </div>
        </main>
    );
}
