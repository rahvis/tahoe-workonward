import Link from 'next/link';
import BrandMark from '@/components/branding/BrandMark';
import styles from '../legal.module.css';

const sections = [
    {
        title: '1. Scope and role',
        body: 'This Privacy Policy explains how WorkOnward ("Tahoe," "we," "us," or "our") collects, uses, stores, discloses, and protects personal information when you use tahoe.ai, create an account, sign in with Google, connect a Gmail or Google Workspace mailbox, search for candidates, or otherwise interact with the Service. This Policy is written for U.S. business use and should be read together with the consent screens and in-product disclosures shown when you authorize Google access.',
    },
    {
        title: '2. Information we collect',
        list: [
            'Account and profile information, such as your name, work email address, password hash, organization details, and account preferences.',
            'Authentication information from Google Sign-In, such as your Google account identifier, basic profile details, and email address, to the extent you authorize them.',
            'Mailbox connection and Gmail API data if you connect a mailbox, including OAuth refresh tokens, mailbox address, send settings, message metadata, thread metadata, message content you instruct Tahoe to process, and reply status information needed to send or monitor outreach from your own inbox.',
            'Recruiting workflow data, such as search prompts, filters, saved candidates, lists, notes, enrichment requests, campaign drafts, sequence content, mailbox health data, and usage history.',
            'Technical and device data, such as IP address, browser type, device information, approximate location inferred from IP, logs, timestamps, session identifiers, and security telemetry.',
            'Support and communications data, such as messages you send to support or legal contacts and related troubleshooting materials.',
            'Billing or payment-related data if paid features are enabled, typically through our payment providers rather than directly in Tahoe.',
        ],
    },
    {
        title: '3. How we collect information',
        list: [
            'Directly from you when you register, sign in, complete forms, configure campaigns, save candidates, request enrichment, contact support, or otherwise use the Service.',
            'From Google when you sign in with Google or connect a Gmail or Google Workspace mailbox using OAuth.',
            'From third-party data providers and integrations that supply candidate, enrichment, or operational data that you request through the Service.',
            'Automatically through logs, browser storage, security monitoring, and similar technical means used to operate and secure the Service.',
        ],
    },
    {
        title: '4. How we use information',
        list: [
            'Provide, maintain, secure, and improve the user-facing features of Tahoe.',
            'Authenticate you, manage accounts and sessions, and prevent abuse, fraud, or unauthorized access.',
            'Process recruiter workflows, including candidate search, list management, enrichment, Gmail-native outreach, reply detection, and related operational analytics.',
            'Provide support, troubleshoot problems, communicate service updates, and respond to legal or security issues.',
            'Enforce our Terms, protect our rights, protect users and third parties, and comply with applicable law.',
            'Operate billing, credits, payment processing, and service administration if paid features are enabled.',
        ],
    },
    {
        title: '5. Google Sign-In, Gmail API data, and Google limited-use commitments',
        body: 'When you use Google Sign-In or connect a Gmail or Google Workspace mailbox, Tahoe requests only the scopes needed for the features you choose to use. Tahoe\u2019s use of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.',
        list: [
            'We use Google account data to authenticate you and manage your Tahoe account.',
            'We use Gmail API data only to provide user-facing recruiting features that are prominent in Tahoe, such as sending outreach from your mailbox, monitoring replies, and displaying mailbox status or thread context.',
            'We do not sell Google user data, use it for advertising, use it to determine credit-worthiness, or transfer it to data brokers or information resellers.',
            'We do not use Google Workspace API data to develop, improve, or train generalized artificial intelligence or machine learning models.',
            'We limit human access to Google data except where necessary for support you request, security investigation, legal compliance, or other circumstances allowed by Google policy and applicable law.',
            'If Tahoe changes how it uses Google data in a materially different way, we will update this Policy and, where required, obtain updated consent before that new use begins.',
        ],
    },
    {
        title: '6. How we disclose information',
        list: [
            'Service providers and subprocessors that help us host, secure, support, or operate the Service, subject to contractual confidentiality and security obligations.',
            'Third-party integrations or providers you direct us to use, such as Google, enrichment vendors, analytics providers, or payment processors.',
            'Professional advisors, corporate affiliates, or transaction counterparties in connection with financing, merger, acquisition, reorganization, or sale of assets, subject to appropriate safeguards.',
            'Law enforcement, regulators, courts, or other parties where disclosure is required to comply with law, enforce our rights, investigate abuse, or protect users, third parties, or the public.',
        ],
        body: 'Tahoe does not sell personal information and does not share personal information for cross-context behavioral advertising.',
    },
    {
        title: '7. Data retention',
        body: 'We retain personal information for as long as reasonably necessary to provide the Service, maintain account functionality, satisfy security and fraud-prevention needs, resolve disputes, comply with legal obligations, and enforce our agreements. Retention periods vary by data type and business need. Where feasible, we delete, anonymize, or de-identify data when it is no longer needed.',
    },
    {
        title: '8. Security',
        body: 'We use administrative, technical, and physical safeguards designed to protect personal information in transit and at rest. Those safeguards may include encryption, access controls, authentication controls, environment segregation, logging, vendor oversight, and incident response procedures. No system is perfectly secure, and we cannot guarantee absolute security.',
    },
    {
        title: '9. Your choices and U.S. privacy rights',
        body: 'Depending on where you live and the nature of our processing, you may have rights to request access, correction, deletion, portability, or information about how we use your personal information. You may also have the right to appeal certain decisions or opt out of certain processing where applicable law provides that right. To exercise privacy rights, contact us at info@workonward.com with the subject line "Privacy Request." If we are required to verify your identity, we will use the information you provide only for verification and request-handling purposes.',
        list: [
            'For California residents, this Policy is intended to support disclosures commonly associated with CalOPPA and the CCPA/CPRA, including categories of personal information collected, sources, purposes, sharing practices, and how to submit requests.',
            'If Tahoe is subject to a law requiring a response timeline, we will respond within the timeline required by law, which for certain U.S. state requests is commonly 45 days with extensions where permitted.',
            'If you are an authorized agent submitting a request on someone else\u2019s behalf, we may ask for proof of authorization and identity verification as permitted by law.',
        ],
    },
    {
        title: '10. Cookies, local storage, and similar technologies',
        body: 'Tahoe may use browser storage, session storage, local storage, and similar technologies to maintain sessions, preserve workflow state, secure the Service, and improve reliability. For example, Tahoe may store authentication tokens, temporary session state, and feature-related settings in your browser. We do not currently use these technologies to build advertising profiles for cross-context behavioral advertising.',
    },
    {
        title: '11. Children\u2019s privacy',
        body: 'Tahoe is intended for recruiters, employers, and other business users and is not directed to children under 13. If we learn that we collected personal information from a child in violation of applicable law, we will take reasonable steps to delete it.',
    },
    {
        title: '12. Changes to this Policy',
        body: 'We may update this Privacy Policy from time to time. When we do, we will update the \u201cLast updated\u201d date on this page and, where required, provide additional notice or obtain consent before material new uses of personal information begin.',
    },
    {
        title: '13. Contact',
        body: 'Questions, privacy requests, Google-data questions, and legal notices relating to this Privacy Policy may be sent to info@workonward.com or by mail to WorkOnward, 124 E 14th St, New York, NY 10003. If Tahoe later designates a dedicated privacy or legal contact address, that address will control for future requests once posted here.',
    },
];

export default function PrivacyPage() {
    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.brandLink} aria-label="Tahoe home">
                        <BrandMark subtitle />
                    </Link>
                    <div className={styles.headerActions}>
                        <Link href="/terms" className={styles.headerLink}>Terms</Link>
                        <Link href="/signup" className={styles.headerLink}>Create account</Link>
                    </div>
                </header>

                <section className={styles.hero}>
                    <span className={styles.eyebrow}>Privacy policy</span>
                    <h1 className={styles.title}>Privacy Policy</h1>
                    <p className={styles.lede}>
                        Tahoe is built for recruiter workflows that touch candidate data, Google sign-in, and Gmail-native
                        outreach. This page explains what we collect, why we use it, how Google API data is handled, and
                        what U.S. privacy rights users may have.
                    </p>
                    <div className={styles.meta}>
                        <span><strong>Last updated:</strong> May 8, 2026</span>
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
                        <h2 className={styles.flatSectionTitle}>Relevant standards and policies</h2>
                        <p className={styles.paragraph}>
                            Tahoe&apos;s disclosures are informed by Google&apos;s OAuth and Gmail API requirements, FTC security guidance,
                            and California privacy transparency requirements. You can review those materials here:
                        </p>
                        <ul className={styles.list}>
                            <li><a className={styles.inlineLink} href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Google API Services User Data Policy</a></li>
                            <li><a className={styles.inlineLink} href="https://developers.google.com/workspace/gmail/api/auth/scopes" target="_blank" rel="noreferrer">Gmail API scope categories and restrictions</a></li>
                            <li><a className={styles.inlineLink} href="https://support.google.com/cloud/answer/13807380?hl=en" target="_blank" rel="noreferrer">Google guidance on requesting minimum Gmail scopes</a></li>
                            <li><a className={styles.inlineLink} href="https://www.ftc.gov/business-guidance/resources/start-security-guide-business" target="_blank" rel="noreferrer">FTC Start with Security guidance</a></li>
                            <li><a className={styles.inlineLink} href="https://oag.ca.gov/privacy/facts/online-privacy/privacy-policy" target="_blank" rel="noreferrer">California DOJ privacy-policy guidance</a></li>
                            <li><a className={styles.inlineLink} href="https://oag.ca.gov/privacy/ccpa" target="_blank" rel="noreferrer">California CCPA / CPRA consumer-rights guidance</a></li>
                        </ul>
                    </div>
                </div>

                <footer className={styles.footer}>
                    <span>© 2026 WorkOnward</span>
                    <div className={styles.footerLinks}>
                        <Link href="/">Home</Link>
                        <Link href="/terms">Terms</Link>
                        <Link href="/login">Sign in</Link>
                    </div>
                </footer>
            </div>
        </main>
    );
}
