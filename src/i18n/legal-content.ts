// Bilingual content for the legal pages (privacy, terms, cookie). Server-only:
// imported directly by the server page components, so it is never shipped to the
// client bundle. The English text is the source of record; Korean is a faithful
// translation for Korean-speaking users.

export type LegalLink = { label: string; href: string; internal?: boolean };
export type LegalSection = { title: string; body?: string; list?: string[] };
export type LegalLinkBlock = { title: string; body: string; links?: LegalLink[] };

export type LegalDoc = {
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    title: string;
    lede: string;
    lastUpdated: string;
    notice?: string;
    sections: LegalSection[];
    linkBlocks: LegalLinkBlock[];
};

type LegalLocale = {
    lastUpdatedLabel: string;
    privacy: LegalDoc;
    terms: LegalDoc;
    cookie: LegalDoc;
};

const en: LegalLocale = {
    lastUpdatedLabel: 'Last updated:',
    privacy: {
        metaTitle: 'Privacy Policy',
        metaDescription:
            'How Tahoe (WorkOnward) collects, uses, stores, and protects personal information across candidate data, Google Sign-In, and Gmail-native outreach, plus U.S. privacy rights.',
        eyebrow: 'Privacy policy',
        title: 'Privacy Policy',
        lede: 'Tahoe is built for recruiter workflows that touch candidate data, Google sign-in, and Gmail-native outreach. This page explains what we collect, why we use it, how Google API data is handled, and what U.S. privacy rights users may have.',
        lastUpdated: 'May 9, 2026',
        sections: [
            {
                title: '1. Scope and role',
                body: 'This Privacy Policy explains how WorkOnward ("Tahoe," "we," "us," or "our") collects, uses, stores, discloses, and protects personal information when you use tahoe.workonward.com, create an account, sign in with Google, connect a Gmail or Google Workspace mailbox, search for candidates, or otherwise interact with the Service. This Policy is written for U.S. business use and should be read together with the consent screens and in-product disclosures shown when you authorize Google access.',
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
                body: 'When you use Google Sign-In or connect a Gmail or Google Workspace mailbox, Tahoe requests only the scopes needed for the features you choose to use. Tahoe’s use of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.',
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
                    'If you are an authorized agent submitting a request on someone else’s behalf, we may ask for proof of authorization and identity verification as permitted by law.',
                ],
            },
            {
                title: '10. Cookies, local storage, and similar technologies',
                body: 'Tahoe uses browser storage, session storage, local storage, and similar technologies to maintain sessions, preserve workflow state, secure the Service, and improve reliability. On Tahoe’s public pages, our consent manager stores consent state in the `tahoe_cookie_consent` cookie and allows users to turn optional analytics on or off. If a user opts in, Tahoe may use Google Analytics on the landing page to measure visits, engagement, and sign-up intent. Tahoe may also store authentication tokens, temporary workflow state, and feature-related settings in your browser. We do not currently use these technologies to build advertising profiles for cross-context behavioral advertising, and users can reopen Tahoe’s public-page preferences through the site’s “Cookie settings” control.',
            },
            {
                title: '11. Children’s privacy',
                body: 'Tahoe is intended for recruiters, employers, and other business users and is not directed to children under 13. If we learn that we collected personal information from a child in violation of applicable law, we will take reasonable steps to delete it.',
            },
            {
                title: '12. Changes to this Policy',
                body: 'We may update this Privacy Policy from time to time. When we do, we will update the “Last updated” date on this page and, where required, provide additional notice or obtain consent before material new uses of personal information begin.',
            },
            {
                title: '13. Contact',
                body: 'Questions, privacy requests, Google-data questions, and legal notices relating to this Privacy Policy may be sent to info@workonward.com or by mail to WorkOnward, 124 E 14th St, New York, NY 10003. If Tahoe later designates a dedicated privacy or legal contact address, that address will control for future requests once posted here.',
            },
        ],
        linkBlocks: [
            {
                title: 'Relevant standards and policies',
                body: 'Tahoe’s disclosures are informed by Google’s OAuth and Gmail API requirements, FTC security guidance, and California privacy transparency requirements. You can review those materials here:',
                links: [
                    { label: 'Google API Services User Data Policy', href: 'https://developers.google.com/terms/api-services-user-data-policy' },
                    { label: 'Gmail API scope categories and restrictions', href: 'https://developers.google.com/workspace/gmail/api/auth/scopes' },
                    { label: 'Google guidance on requesting minimum Gmail scopes', href: 'https://support.google.com/cloud/answer/13807380?hl=en' },
                    { label: 'FTC Start with Security guidance', href: 'https://www.ftc.gov/business-guidance/resources/start-security-guide-business' },
                    { label: 'California DOJ privacy-policy guidance', href: 'https://oag.ca.gov/privacy/facts/online-privacy/privacy-policy' },
                    { label: 'California CCPA / CPRA consumer-rights guidance', href: 'https://oag.ca.gov/privacy/ccpa' },
                ],
            },
        ],
    },
    terms: {
        metaTitle: 'Terms of Service',
        metaDescription:
            'The Terms governing use of Tahoe’s recruiter workflow platform: Google sign-in, Gmail mailbox connections, candidate search, enrichment, outreach, fees, and acceptable use.',
        eyebrow: 'Terms of service',
        title: 'Terms of Service',
        lede: 'These Terms cover Tahoe’s recruiter workflow platform, including Google sign-in, Gmail mailbox connections, candidate search, enrichment, recruiter outreach features, and the public website experience that links to those flows.',
        lastUpdated: 'May 9, 2026',
        sections: [
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
                body: 'You agree not to configure, use, or request integrations in a way that exceeds the minimum permissions needed for Tahoe’s user-facing features. Where Tahoe offers multiple integration or scope options, the least permissive option suitable for the feature should be used. Tahoe may restrict or remove features, scopes, or workflows that create unacceptable privacy, verification, or security risk.',
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
                body: 'Tahoe depends on third-party services, including Google, data providers, enrichment vendors, hosting providers, payment providers, and, on the public landing page where a user opts in, Google Analytics measurement services. Those services may change, impose restrictions, suspend access, or introduce downtime beyond Tahoe’s control. Tahoe is not responsible for the acts or omissions of third parties, except as required by law.',
            },
            {
                title: '11. Suspension and termination',
                body: 'You may stop using Tahoe at any time. Tahoe may suspend or terminate access immediately if we believe you violated these Terms, created legal or security risk, threatened the integrity of the Service, endangered third-party rights, or put Tahoe’s Google API access or other platform access at risk. We may also remove connected integrations or features if required by vendor policy, law, or security necessity.',
            },
            {
                title: '12. Disclaimers',
                body: 'Tahoe is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, Tahoe disclaims all warranties, whether express, implied, or statutory, including implied warranties of merchantability, fitness for a particular purpose, title, non-infringement, availability, accuracy, and uninterrupted service. Tahoe does not guarantee candidate accuracy, contact deliverability, provider uptime, mailbox deliverability, response rates, hiring outcomes, or legal compliance for your use case.',
            },
            {
                title: '13. Limitation of liability',
                body: 'To the maximum extent permitted by law, Tahoe and its affiliates, officers, directors, employees, and licensors will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for any loss of profits, revenues, goodwill, data, or business opportunities, arising from or relating to the Service or these Terms. To the maximum extent permitted by law, Tahoe’s aggregate liability for claims arising out of or relating to the Service will not exceed the greater of (a) the amounts you paid Tahoe for the Service in the twelve months before the event giving rise to the claim, or (b) one hundred U.S. dollars (US $100).',
            },
            {
                title: '14. Indemnity',
                body: 'You will defend, indemnify, and hold harmless Tahoe and its affiliates, officers, directors, employees, and agents from and against claims, liabilities, damages, losses, and expenses, including reasonable attorneys’ fees, arising out of or relating to your content, your use of the Service, your candidate data practices, your outreach activity, your violation of law, or your violation of these Terms.',
            },
            {
                title: '15. Governing law and disputes',
                body: 'Except to the extent applicable law provides otherwise, these Terms are governed by the laws applicable in the jurisdiction where WorkOnward maintains its principal place of business, excluding conflict-of-laws rules. Any dispute arising out of or relating to these Terms or the Service must be brought in a court of competent jurisdiction serving that location, unless a different forum is required by non-waivable law.',
            },
            {
                title: '16. Changes to the Terms',
                body: 'Tahoe may update these Terms from time to time. If we make material changes, we will post the updated Terms and revise the “Last updated” date. Your continued use of Tahoe after the effective date of revised Terms constitutes acceptance of the updated Terms.',
            },
            {
                title: '17. Contact',
                body: 'Questions, legal notices, or requests relating to these Terms may be sent to info@workonward.com or by mail to WorkOnward, 124 E 14th St, New York, NY 10003 until Tahoe publishes a separate legal notice address.',
            },
        ],
        linkBlocks: [
            {
                title: 'Related policies',
                body: 'These Terms work together with Tahoe’s Privacy Policy and Cookie Policy. If you connect Google services, Google’s own policies and scope-verification requirements also apply. Tahoe’s public-site analytics choices, if enabled, are governed by those same policy pages and the site’s Cookie settings control.',
                links: [
                    { label: 'Privacy Policy', href: '/privacy', internal: true },
                    { label: 'Cookie Policy', href: '/cookie', internal: true },
                ],
            },
        ],
    },
    cookie: {
        metaTitle: 'Cookie Policy',
        metaDescription:
            'How Tahoe uses cookies and browser storage: operational sessions, recruiter workflow state, secure authentication, Google sign-in, a public consent cookie, and optional landing-page analytics.',
        eyebrow: 'Cookie policy',
        title: 'Cookie Policy',
        lede: 'Tahoe uses browser storage and related technologies to keep recruiter workflows functional, preserve search state, secure authentication, and support Google sign-in. This page explains what Tahoe currently uses, how Tahoe’s public-page consent flow works, how optional analytics behave on the landing page, and how users can control those choices.',
        lastUpdated: 'May 9, 2026',
        notice: 'Tahoe’s current browser-technology profile is operational, not advertising-driven. Based on the current implementation, Tahoe primarily uses local storage, session storage, Google sign-in related identity infrastructure, security tooling, a public consent cookie, and, when a user opts in, Google Analytics measurement on the landing page rather than a broad marketing or ad-tech stack.',
        sections: [
            {
                title: '1. Scope and summary',
                body: 'This Cookie Policy explains how WorkOnward ("Tahoe," "we," "us," or "our") uses cookies and similar browser technologies on tahoe.workonward.com and in the Tahoe product experience. Tahoe is a recruiter workflow platform, so our browser-storage profile is primarily operational rather than advertising-driven: we use browser-side technologies to keep users signed in, preserve recruiter workflow state, secure authentication, and support Google sign-in and related account actions. On Tahoe’s public pages, our consent manager stores public-page consent status in the `tahoe_cookie_consent` cookie and can optionally enable Google Analytics on the landing page if a user turns analytics on.',
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
        ],
        linkBlocks: [
            {
                title: 'Relevant guidance',
                body: 'Tahoe’s cookie disclosures are informed by public U.S. privacy guidance and Tahoe’s actual implementation choices. Relevant materials include:',
                links: [
                    { label: 'FTC guidance on Internet cookies', href: 'https://www.ftc.gov/policy-notices/privacy-policy/internet-cookies' },
                    { label: 'California DOJ guidance on privacy-policy transparency', href: 'https://oag.ca.gov/node/36676' },
                    { label: 'California Privacy Protection Agency FAQs on CCPA / CPRA rights and business obligations', href: 'https://cppa.ca.gov/faq' },
                    { label: 'Google Sign-In for Web overview', href: 'https://developers.google.com/identity/gsi/web/guides/overview' },
                ],
            },
            {
                title: 'Related policies',
                body: 'See Tahoe’s Privacy Policy for broader disclosures about personal information, and Tahoe’s Terms of Service for the rules that govern use of the platform.',
                links: [
                    { label: 'Privacy Policy', href: '/privacy', internal: true },
                    { label: 'Terms of Service', href: '/terms', internal: true },
                ],
            },
        ],
    },
};

const ko: LegalLocale = {
    lastUpdatedLabel: '최종 업데이트:',
    privacy: {
        metaTitle: '개인정보 처리방침',
        metaDescription:
            'Tahoe(WorkOnward)가 후보자 데이터, Google 로그인, Gmail 기반 아웃리치 전반에서 개인정보를 수집·이용·저장·보호하는 방식과 미국 프라이버시 권리를 설명합니다.',
        eyebrow: '개인정보 처리방침',
        title: '개인정보 처리방침',
        lede: 'Tahoe는 후보자 데이터, Google 로그인, Gmail 기반 아웃리치를 다루는 리크루터 워크플로를 위해 만들어졌습니다. 이 페이지는 우리가 무엇을 수집하고, 왜 사용하며, Google API 데이터를 어떻게 처리하고, 사용자가 미국에서 어떤 프라이버시 권리를 가질 수 있는지 설명합니다.',
        lastUpdated: '2026년 5월 9일',
        sections: [
            {
                title: '1. 적용 범위와 역할',
                body: '이 개인정보 처리방침은 WorkOnward(이하 "Tahoe", "당사")가 사용자가 tahoe.workonward.com을 이용하거나, 계정을 생성하거나, Google로 로그인하거나, Gmail 또는 Google Workspace 메일함을 연결하거나, 후보자를 검색하거나, 기타 방식으로 서비스를 이용할 때 개인정보를 수집·이용·저장·공개·보호하는 방법을 설명합니다. 본 방침은 미국 비즈니스 이용을 기준으로 작성되었으며, Google 액세스를 승인할 때 표시되는 동의 화면 및 제품 내 고지와 함께 읽어야 합니다.',
            },
            {
                title: '2. 수집하는 정보',
                list: [
                    '이름, 업무 이메일 주소, 비밀번호 해시, 조직 정보, 계정 환경설정 등 계정 및 프로필 정보.',
                    'Google 로그인에서 제공되는 인증 정보로, 사용자가 승인한 범위 내에서의 Google 계정 식별자, 기본 프로필 정보, 이메일 주소 등.',
                    '메일함을 연결하는 경우 메일함 연결 및 Gmail API 데이터로, OAuth 갱신 토큰, 메일함 주소, 발송 설정, 메시지 메타데이터, 스레드 메타데이터, Tahoe에 처리하도록 지시한 메시지 내용, 그리고 본인 메일함에서 아웃리치를 보내거나 모니터링하는 데 필요한 회신 상태 정보 등.',
                    '검색 프롬프트, 필터, 저장한 후보자, 리스트, 메모, 보강 요청, 캠페인 초안, 시퀀스 내용, 메일함 상태 데이터, 이용 기록 등 리크루팅 워크플로 데이터.',
                    'IP 주소, 브라우저 유형, 기기 정보, IP로 추정한 대략적 위치, 로그, 타임스탬프, 세션 식별자, 보안 텔레메트리 등 기술 및 기기 데이터.',
                    '지원 또는 법무 담당자에게 보내는 메시지와 관련 문제 해결 자료 등 지원 및 커뮤니케이션 데이터.',
                    '유료 기능이 활성화된 경우, 일반적으로 Tahoe 내에서가 아니라 결제 제공업체를 통한 청구 또는 결제 관련 데이터.',
                ],
            },
            {
                title: '3. 정보를 수집하는 방법',
                list: [
                    '등록, 로그인, 양식 작성, 캠페인 구성, 후보자 저장, 보강 요청, 지원 문의 또는 기타 서비스 이용 시 사용자로부터 직접 수집합니다.',
                    'Google로 로그인하거나 OAuth로 Gmail 또는 Google Workspace 메일함을 연결할 때 Google로부터 수집합니다.',
                    '사용자가 서비스를 통해 요청한 후보자, 보강, 운영 데이터를 제공하는 제3자 데이터 제공업체 및 통합으로부터 수집합니다.',
                    '서비스를 운영하고 보호하기 위해 사용하는 로그, 브라우저 저장소, 보안 모니터링 및 유사한 기술적 수단을 통해 자동으로 수집합니다.',
                ],
            },
            {
                title: '4. 정보를 이용하는 방법',
                list: [
                    'Tahoe의 사용자 대상 기능을 제공·유지·보호·개선합니다.',
                    '사용자를 인증하고, 계정과 세션을 관리하며, 남용·사기·무단 접근을 방지합니다.',
                    '후보자 검색, 리스트 관리, 보강, Gmail 기반 아웃리치, 회신 감지 및 관련 운영 분석을 포함한 리크루터 워크플로를 처리합니다.',
                    '지원을 제공하고, 문제를 해결하며, 서비스 업데이트를 안내하고, 법적 또는 보안 문제에 대응합니다.',
                    '약관을 집행하고, 당사의 권리를 보호하며, 사용자와 제3자를 보호하고, 관련 법률을 준수합니다.',
                    '유료 기능이 활성화된 경우 청구, 크레딧, 결제 처리 및 서비스 관리를 운영합니다.',
                ],
            },
            {
                title: '5. Google 로그인, Gmail API 데이터, Google 제한적 사용 약속',
                body: 'Google 로그인을 사용하거나 Gmail 또는 Google Workspace 메일함을 연결할 때, Tahoe는 사용자가 선택한 기능에 필요한 범위(scope)만 요청합니다. Tahoe의 Google API로부터 받은 정보 이용은 제한적 사용(Limited Use) 요건을 포함한 Google API Services User Data Policy를 준수합니다.',
                list: [
                    '당사는 Google 계정 데이터를 사용자 인증과 Tahoe 계정 관리에 사용합니다.',
                    '당사는 Gmail API 데이터를, 메일함에서 아웃리치 발송, 회신 모니터링, 메일함 상태 또는 스레드 맥락 표시처럼 Tahoe에서 두드러지는 사용자 대상 리크루팅 기능을 제공하기 위해서만 사용합니다.',
                    '당사는 Google 사용자 데이터를 판매하거나, 광고에 사용하거나, 신용도 판단에 사용하거나, 데이터 브로커 또는 정보 재판매업체에 양도하지 않습니다.',
                    '당사는 Google Workspace API 데이터를 일반화된 인공지능 또는 머신러닝 모델을 개발·개선·학습하는 데 사용하지 않습니다.',
                    '당사는 사용자가 요청한 지원, 보안 조사, 법적 준수, 또는 Google 정책과 관련 법률이 허용하는 기타 상황에서 필요한 경우를 제외하고 Google 데이터에 대한 사람의 접근을 제한합니다.',
                    'Tahoe가 Google 데이터 이용 방식을 실질적으로 다르게 변경하는 경우, 본 방침을 업데이트하고 필요한 경우 그 새로운 이용이 시작되기 전에 갱신된 동의를 받습니다.',
                ],
            },
            {
                title: '6. 정보를 공개하는 방법',
                list: [
                    '계약상 기밀 유지 및 보안 의무를 조건으로, 서비스를 호스팅·보호·지원·운영하도록 돕는 서비스 제공업체 및 하위 처리자.',
                    'Google, 보강 벤더, 분석 제공업체, 결제 처리업체 등 사용자가 사용하도록 지시한 제3자 통합 또는 제공업체.',
                    '적절한 안전장치를 조건으로, 자금 조달, 합병, 인수, 조직 개편 또는 자산 매각과 관련된 전문 자문가, 계열사, 또는 거래 상대방.',
                    '법률 준수, 권리 집행, 남용 조사, 또는 사용자·제3자·공중 보호를 위해 공개가 요구되는 경우 법 집행기관, 규제기관, 법원 또는 기타 당사자.',
                ],
                body: 'Tahoe는 개인정보를 판매하지 않으며, 교차 맥락 행동 광고를 위해 개인정보를 공유하지 않습니다.',
            },
            {
                title: '7. 데이터 보관',
                body: '당사는 서비스를 제공하고, 계정 기능을 유지하며, 보안 및 사기 방지 필요를 충족하고, 분쟁을 해결하며, 법적 의무를 준수하고, 계약을 집행하기 위해 합리적으로 필요한 기간 동안 개인정보를 보관합니다. 보관 기간은 데이터 유형과 업무상 필요에 따라 다릅니다. 가능한 경우, 더 이상 필요하지 않은 데이터는 삭제·익명화·비식별화합니다.',
            },
            {
                title: '8. 보안',
                body: '당사는 전송 중 및 저장 중인 개인정보를 보호하기 위해 설계된 관리적·기술적·물리적 보호 조치를 사용합니다. 이러한 조치에는 암호화, 접근 통제, 인증 통제, 환경 분리, 로깅, 벤더 관리, 사고 대응 절차가 포함될 수 있습니다. 완벽하게 안전한 시스템은 없으며, 당사는 절대적 보안을 보장할 수 없습니다.',
            },
            {
                title: '9. 사용자의 선택과 미국 프라이버시 권리',
                body: '거주지와 처리의 성격에 따라, 사용자는 개인정보에 대한 접근, 정정, 삭제, 이동, 또는 이용 방식에 관한 정보를 요청할 권리를 가질 수 있습니다. 또한 관련 법률이 그 권리를 제공하는 경우 특정 결정에 대한 이의를 제기하거나 특정 처리를 거부할 권리를 가질 수 있습니다. 프라이버시 권리를 행사하려면 제목을 "Privacy Request"로 하여 info@workonward.com으로 문의하세요. 신원 확인이 요구되는 경우, 당사는 제공된 정보를 확인 및 요청 처리 목적으로만 사용합니다.',
                list: [
                    '캘리포니아 거주자의 경우, 본 방침은 수집한 개인정보의 범주, 출처, 목적, 공유 관행, 요청 제출 방법 등 CalOPPA 및 CCPA/CPRA와 흔히 관련되는 고지를 지원하기 위한 것입니다.',
                    'Tahoe가 응답 기한을 요구하는 법률의 적용을 받는 경우, 당사는 법률이 요구하는 기한 내에 응답하며, 일부 미국 주 요청의 경우 통상 45일이고 허용되는 경우 연장될 수 있습니다.',
                    '귀하가 타인을 대신하여 요청을 제출하는 권한 있는 대리인인 경우, 당사는 법률이 허용하는 범위에서 권한 증빙과 신원 확인을 요청할 수 있습니다.',
                ],
            },
            {
                title: '10. 쿠키, 로컬 저장소 및 유사 기술',
                body: 'Tahoe는 세션 유지, 워크플로 상태 보존, 서비스 보안, 신뢰성 향상을 위해 브라우저 저장소, 세션 저장소, 로컬 저장소 및 유사 기술을 사용합니다. Tahoe의 공개 페이지에서 당사의 동의 관리자는 동의 상태를 `tahoe_cookie_consent` 쿠키에 저장하며 사용자가 선택적 분석을 켜거나 끌 수 있도록 합니다. 사용자가 동의하면 Tahoe는 방문, 참여, 가입 의도를 측정하기 위해 랜딩 페이지에서 Google Analytics를 사용할 수 있습니다. Tahoe는 또한 인증 토큰, 임시 워크플로 상태, 기능 관련 설정을 브라우저에 저장할 수 있습니다. 당사는 현재 이러한 기술을 교차 맥락 행동 광고용 광고 프로필 구축에 사용하지 않으며, 사용자는 사이트의 "쿠키 설정" 컨트롤을 통해 Tahoe 공개 페이지 환경설정을 다시 열 수 있습니다.',
            },
            {
                title: '11. 아동의 프라이버시',
                body: 'Tahoe는 리크루터, 고용주 및 기타 비즈니스 사용자를 위한 것이며 만 13세 미만 아동을 대상으로 하지 않습니다. 관련 법률을 위반하여 아동의 개인정보를 수집한 사실을 알게 되면, 당사는 이를 삭제하기 위한 합리적인 조치를 취합니다.',
            },
            {
                title: '12. 본 방침의 변경',
                body: '당사는 본 개인정보 처리방침을 수시로 업데이트할 수 있습니다. 그럴 경우, 이 페이지의 "최종 업데이트" 날짜를 갱신하며, 개인정보의 중요한 새로운 이용이 시작되기 전에 필요한 경우 추가 고지를 제공하거나 동의를 받습니다.',
            },
            {
                title: '13. 문의',
                body: '본 개인정보 처리방침과 관련된 질문, 프라이버시 요청, Google 데이터 관련 질문 및 법적 통지는 info@workonward.com 또는 우편(WorkOnward, 124 E 14th St, New York, NY 10003)으로 보낼 수 있습니다. Tahoe가 추후 전담 프라이버시 또는 법무 연락처 주소를 지정하는 경우, 게시된 이후의 요청에 대해서는 해당 주소가 우선합니다.',
            },
        ],
        linkBlocks: [
            {
                title: '관련 표준 및 정책',
                body: 'Tahoe의 고지는 Google의 OAuth 및 Gmail API 요건, FTC 보안 지침, 캘리포니아 프라이버시 투명성 요건을 참고했습니다. 관련 자료는 여기에서 확인할 수 있습니다:',
                links: [
                    { label: 'Google API Services User Data Policy', href: 'https://developers.google.com/terms/api-services-user-data-policy' },
                    { label: 'Gmail API 범위(scope) 범주 및 제한', href: 'https://developers.google.com/workspace/gmail/api/auth/scopes' },
                    { label: '최소 Gmail 범위 요청에 관한 Google 지침', href: 'https://support.google.com/cloud/answer/13807380?hl=en' },
                    { label: 'FTC Start with Security 지침', href: 'https://www.ftc.gov/business-guidance/resources/start-security-guide-business' },
                    { label: '캘리포니아 법무부 개인정보 처리방침 지침', href: 'https://oag.ca.gov/privacy/facts/online-privacy/privacy-policy' },
                    { label: '캘리포니아 CCPA / CPRA 소비자 권리 지침', href: 'https://oag.ca.gov/privacy/ccpa' },
                ],
            },
        ],
    },
    terms: {
        metaTitle: '이용약관',
        metaDescription:
            'Tahoe 리크루터 워크플로 플랫폼 이용을 규율하는 약관: Google 로그인, Gmail 메일함 연결, 후보자 검색, 보강, 아웃리치, 요금 및 허용되는 사용.',
        eyebrow: '이용약관',
        title: '이용약관',
        lede: '본 약관은 Google 로그인, Gmail 메일함 연결, 후보자 검색, 보강, 리크루터 아웃리치 기능, 그리고 이러한 흐름으로 연결되는 공개 웹사이트 경험을 포함한 Tahoe의 리크루터 워크플로 플랫폼을 다룹니다.',
        lastUpdated: '2026년 5월 9일',
        sections: [
            {
                title: '1. 약관에 대한 동의',
                body: '본 이용약관(이하 "약관")은 WorkOnward(이하 "Tahoe", "당사")가 제공하는 Tahoe 서비스, 웹사이트, 애플리케이션, API 및 관련 기능에 대한 귀하의 접근과 이용을 규율합니다. Tahoe를 이용함으로써 귀하는 본 약관에 동의합니다. 귀하가 고용주 또는 기타 조직을 대신하여 Tahoe를 이용하는 경우, 귀하는 해당 조직을 본 약관에 구속시킬 권한이 있음을 진술합니다. Tahoe의 공개 페이지는 쿠키 정책 및 개인정보 처리방침에 설명된 대로, 사이트의 쿠키 설정을 통해 활성화하기로 선택한 경우 선택적 분석을 사용할 수도 있습니다.',
            },
            {
                title: '2. 자격 및 비즈니스 이용',
                body: 'Tahoe는 비즈니스 및 전문적 이용, 특히 리크루팅과 인재 워크플로를 위한 것입니다. 귀하는 본 계약을 체결할 법적 능력이 있어야 하며 관련 법률을 준수해야 합니다. Tahoe는 만 13세 미만 아동을 대상으로 하지 않으며, 아동 대상 제품은 Google 계정 데이터에 접근하는 Google 로그인 또는 기타 Google API 서비스를 사용해서는 안 됩니다.',
            },
            {
                title: '3. 계정, 인증 및 보안',
                body: '귀하는 계정 자격 증명의 기밀을 유지하고, 귀하의 계정에서 발생하는 모든 활동에 대해 책임지며, 무단 사용을 Tahoe에 신속히 통지할 책임이 있습니다. Tahoe는 이메일/비밀번호 로그인, Google 로그인 또는 기타 인증 방법을 제공할 수 있습니다. 귀하는 정확한 계정 정보를 제공하고 이를 합리적으로 최신 상태로 유지해야 합니다.',
            },
            {
                title: '4. Google 로그인, Gmail API, 연결된 메일함',
                body: '귀하가 Google로 로그인하거나 Gmail 또는 Google Workspace 메일함을 연결하면, OAuth 동의 시 승인한 Google 데이터와 범위에 Tahoe가 접근하도록 권한을 부여하는 것입니다. 귀하는 메일함, 귀하가 보내는 내용, 연락하는 대상, 선택한 설정에 대해 계속 책임을 집니다. Tahoe는 개인정보 처리방침에 공개된 대로, 그리고 제한적 사용 요건을 포함한 Google API Services User Data Policy를 준수하여 Google 사용자 데이터를 사용합니다.',
            },
            {
                title: '5. 후보자 데이터, 검색, 보강, 아웃리치',
                body: 'Tahoe는 후보자 검색, 결과 저장, 연락처 데이터 보강, 아웃리치 작성, 연결된 메일함을 통한 메시지 발송을 도울 수 있습니다. 귀하의 후보자 정보 수집, 가져오기, 보강, 접근, 저장 또는 이용이 귀하의 사용 사례에 대해 적법하고 적절한지 판단할 책임은 전적으로 귀하에게 있습니다.',
                list: [
                    '귀하는 Tahoe를 통해 개인정보를 처리할 적절한 법적 근거 또는 기타 적법한 권한을 가지고 있어야 합니다.',
                    '귀하는 리크루터 아웃리치, 이메일 마케팅, 해당되는 경우 전화 또는 SMS 연락을 규율하는 법률을 포함하여, 적용되는 고용, 프라이버시, 스팸 방지, 소비자 보호 및 통신 관련 법령을 준수해야 합니다.',
                    '귀하는 Tahoe를 괴롭힘, 차별, 불법 감시, 또는 금지되거나 기만적인 목적의 데이터 처리에 사용해서는 안 됩니다.',
                    '귀하는 본인의 신원, 고용주, 또는 아웃리치 목적을 허위로 표시해서는 안 됩니다.',
                ],
            },
            {
                title: '6. 최소 범위 및 허용된 사용에 대한 기대',
                body: '귀하는 Tahoe의 사용자 대상 기능에 필요한 최소 권한을 초과하는 방식으로 통합을 구성·사용·요청하지 않기로 동의합니다. Tahoe가 여러 통합 또는 범위 옵션을 제공하는 경우, 해당 기능에 적합한 가장 덜 허용적인 옵션을 사용해야 합니다. Tahoe는 허용할 수 없는 프라이버시, 검증 또는 보안 위험을 초래하는 기능, 범위 또는 워크플로를 제한하거나 제거할 수 있습니다.',
            },
            {
                title: '7. 허용되는 사용에 대한 제한',
                list: [
                    'Tahoe를 법률, 제3자의 권리 또는 계약상 의무를 위반하는 데 사용하지 마세요.',
                    '서비스나 다른 사용자를 방해하려는 멀웨어, 유해 코드 또는 콘텐츠를 업로드하지 마세요.',
                    '포기할 수 없는 법률이 허용하는 범위를 제외하고, 서비스를 스크래핑, 리버스 엔지니어링 또는 탐침하지 마세요.',
                    '속도 제한, 보안 통제, 계정 제한 또는 통합 제한을 우회하려 시도하지 마세요.',
                    'Tahoe 또는 Google 연결 데이터를 광고 재판매, 데이터 브로커리지, 감시, 또는 신용도 판단에 사용하지 마세요.',
                ],
                body: 'Tahoe는 의심되는 오용을 조사할 수 있으며, 서비스, 사용자, Google 플랫폼 접근 또는 제3자를 보호하기 위해 필요한 경우 접근을 중지하거나 종료할 수 있습니다.',
            },
            {
                title: '8. 요금, 크레딧 및 향후 유료 기능',
                body: 'Tahoe가 유료 플랜, 크레딧, 충전 또는 기타 유료 기능을 활성화하는 경우, 귀하는 구매 시점에 제시된 가격, 사용 및 청구 조건에 동의합니다. 달리 명시되지 않는 한, 요금은 법률이 요구하는 경우를 제외하고 환불되지 않습니다. Tahoe는 결제 실패, 사기 위험, 남용 또는 계정 미준수에 대해 특정 기능을 중지할 수 있습니다.',
            },
            {
                title: '9. 지식재산권 및 피드백',
                body: 'Tahoe와 그 라이선서는 귀하의 콘텐츠 및 제3자 콘텐츠를 제외하고, 소프트웨어, 디자인, 브랜딩 및 관련 지식재산을 포함한 서비스를 소유합니다. 본 약관에 따라, Tahoe는 귀하의 내부 비즈니스 목적을 위해 서비스를 이용할 제한적, 비독점적, 철회 가능한 권리를 귀하에게 부여합니다. 귀하가 피드백, 제안 또는 제품 아이디어를 제공하는 경우, Tahoe는 제한이나 보상 없이 이를 사용할 수 있습니다.',
            },
            {
                title: '10. 제3자 서비스 및 데이터 출처',
                body: 'Tahoe는 Google, 데이터 제공업체, 보강 벤더, 호스팅 제공업체, 결제 제공업체, 그리고 사용자가 동의한 공개 랜딩 페이지의 Google Analytics 측정 서비스를 포함한 제3자 서비스에 의존합니다. 이러한 서비스는 변경되거나, 제한을 부과하거나, 접근을 중지하거나, Tahoe의 통제를 벗어난 다운타임을 초래할 수 있습니다. Tahoe는 법률이 요구하는 경우를 제외하고 제3자의 작위 또는 부작위에 대해 책임지지 않습니다.',
            },
            {
                title: '11. 중지 및 종료',
                body: '귀하는 언제든지 Tahoe 이용을 중단할 수 있습니다. Tahoe는 귀하가 본 약관을 위반했거나, 법적·보안 위험을 초래했거나, 서비스의 무결성을 위협했거나, 제3자의 권리를 위태롭게 했거나, Tahoe의 Google API 접근 또는 기타 플랫폼 접근을 위험에 빠뜨렸다고 판단하는 경우 즉시 접근을 중지하거나 종료할 수 있습니다. 또한 벤더 정책, 법률 또는 보안상 필요에 의해 요구되는 경우 연결된 통합 또는 기능을 제거할 수 있습니다.',
            },
            {
                title: '12. 면책 고지',
                body: 'Tahoe는 "있는 그대로(as is)" 및 "이용 가능한 대로(as available)" 제공됩니다. 법률이 허용하는 최대 범위에서, Tahoe는 상품성, 특정 목적 적합성, 권원, 비침해, 가용성, 정확성 및 중단 없는 서비스에 대한 묵시적 보증을 포함하여 명시적·묵시적·법정 보증을 일체 부인합니다. Tahoe는 후보자 정확성, 연락처 도달성, 제공업체 가동 시간, 메일함 도달성, 응답률, 채용 결과, 또는 귀하의 사용 사례에 대한 법적 준수를 보장하지 않습니다.',
            },
            {
                title: '13. 책임의 제한',
                body: '법률이 허용하는 최대 범위에서, Tahoe와 그 계열사, 임원, 이사, 직원 및 라이선서는 서비스 또는 본 약관과 관련하여 발생하는 간접적, 부수적, 특별, 결과적, 징벌적 손해, 또는 이익·수익·영업권·데이터·사업 기회의 손실에 대해 책임지지 않습니다. 법률이 허용하는 최대 범위에서, 서비스와 관련하여 발생하는 청구에 대한 Tahoe의 총 책임은 (a) 청구의 원인이 된 사건 이전 12개월 동안 귀하가 서비스에 대해 Tahoe에 지불한 금액, 또는 (b) 미화 100달러(US $100) 중 더 큰 금액을 초과하지 않습니다.',
            },
            {
                title: '14. 면책',
                body: '귀하는 귀하의 콘텐츠, 서비스 이용, 후보자 데이터 관행, 아웃리치 활동, 법률 위반 또는 본 약관 위반과 관련하여 발생하는 청구, 책임, 손해, 손실 및 합리적인 변호사 비용을 포함한 비용으로부터 Tahoe와 그 계열사, 임원, 이사, 직원 및 대리인을 방어하고 면책하며 손해를 입지 않도록 합니다.',
            },
            {
                title: '15. 준거법 및 분쟁',
                body: '관련 법률이 달리 규정하는 범위를 제외하고, 본 약관은 법률 충돌 규칙을 제외하고 WorkOnward가 주된 사업장을 두고 있는 관할의 적용 법률에 따라 규율됩니다. 본 약관 또는 서비스와 관련하여 발생하는 모든 분쟁은, 포기할 수 없는 법률이 다른 법정을 요구하지 않는 한, 해당 지역을 관할하는 정당한 관할 법원에 제기되어야 합니다.',
            },
            {
                title: '16. 약관의 변경',
                body: 'Tahoe는 본 약관을 수시로 업데이트할 수 있습니다. 중요한 변경을 하는 경우, 업데이트된 약관을 게시하고 "최종 업데이트" 날짜를 수정합니다. 개정된 약관의 효력 발생일 이후 귀하가 Tahoe를 계속 이용하는 것은 업데이트된 약관에 대한 동의로 간주됩니다.',
            },
            {
                title: '17. 문의',
                body: '본 약관과 관련된 질문, 법적 통지 또는 요청은 Tahoe가 별도의 법적 통지 주소를 게시하기 전까지 info@workonward.com 또는 우편(WorkOnward, 124 E 14th St, New York, NY 10003)으로 보낼 수 있습니다.',
            },
        ],
        linkBlocks: [
            {
                title: '관련 정책',
                body: '본 약관은 Tahoe의 개인정보 처리방침 및 쿠키 정책과 함께 적용됩니다. Google 서비스를 연결하는 경우 Google 자체 정책과 범위 검증 요건도 적용됩니다. 활성화된 경우 Tahoe의 공개 사이트 분석 선택은 동일한 정책 페이지와 사이트의 쿠키 설정 컨트롤의 적용을 받습니다.',
                links: [
                    { label: '개인정보 처리방침', href: '/privacy', internal: true },
                    { label: '쿠키 정책', href: '/cookie', internal: true },
                ],
            },
        ],
    },
    cookie: {
        metaTitle: '쿠키 정책',
        metaDescription:
            'Tahoe가 쿠키와 브라우저 저장소를 사용하는 방식: 운영용 세션, 리크루터 워크플로 상태, 보안 인증, Google 로그인, 공개 동의 쿠키, 그리고 선택적 랜딩 페이지 분석.',
        eyebrow: '쿠키 정책',
        title: '쿠키 정책',
        lede: 'Tahoe는 리크루터 워크플로를 작동시키고, 검색 상태를 보존하며, 인증을 보호하고, Google 로그인을 지원하기 위해 브라우저 저장소와 관련 기술을 사용합니다. 이 페이지는 Tahoe가 현재 무엇을 사용하는지, Tahoe의 공개 페이지 동의 흐름이 어떻게 작동하는지, 선택적 분석이 랜딩 페이지에서 어떻게 동작하는지, 그리고 사용자가 그 선택을 어떻게 제어할 수 있는지 설명합니다.',
        lastUpdated: '2026년 5월 9일',
        notice: 'Tahoe의 현재 브라우저 기술 프로필은 광고 중심이 아니라 운영 중심입니다. 현재 구현을 기준으로, Tahoe는 폭넓은 마케팅 또는 애드테크 스택이 아니라 주로 로컬 저장소, 세션 저장소, Google 로그인 관련 신원 인프라, 보안 도구, 공개 동의 쿠키, 그리고 사용자가 동의한 경우 랜딩 페이지의 Google Analytics 측정을 사용합니다.',
        sections: [
            {
                title: '1. 적용 범위와 요약',
                body: '이 쿠키 정책은 WorkOnward(이하 "Tahoe", "당사")가 tahoe.workonward.com과 Tahoe 제품 경험에서 쿠키 및 유사 브라우저 기술을 사용하는 방법을 설명합니다. Tahoe는 리크루터 워크플로 플랫폼이므로, 당사의 브라우저 저장소 프로필은 광고 중심이 아니라 주로 운영 중심입니다. 당사는 사용자를 로그인 상태로 유지하고, 리크루터 워크플로 상태를 보존하며, 인증을 보호하고, Google 로그인 및 관련 계정 작업을 지원하기 위해 브라우저 측 기술을 사용합니다. Tahoe의 공개 페이지에서 당사의 동의 관리자는 공개 페이지 동의 상태를 `tahoe_cookie_consent` 쿠키에 저장하며, 사용자가 분석을 켜면 랜딩 페이지에서 선택적으로 Google Analytics를 활성화할 수 있습니다.',
            },
            {
                title: '2. 쿠키 또는 유사 기술에 해당하는 것',
                list: [
                    '쿠키는 브라우저가 저장하는 작은 텍스트 파일로, 시간이 지나도 브라우저나 기기를 인식할 수 있습니다.',
                    '로컬 저장소와 세션 저장소는 기기에 애플리케이션 상태를 저장할 수 있는 브라우저 저장 기술로, 기술적으로 쿠키가 아니더라도 흔히 쿠키와 유사한 기능을 합니다.',
                    '픽셀, 태그, 스크립트, SDK 및 남용 방지 기술도 기술 정보를 수집하거나, 요청을 검증하거나, 로그인 및 보안 워크플로를 지원할 수 있습니다.',
                ],
                body: '이 쿠키 정책에서 당사는 맥락상 더 좁은 의미가 필요한 경우를 제외하고, 이러한 관련 브라우저 측 기술을 포함하는 넓은 의미로 "쿠키"라는 용어를 사용합니다.',
            },
            {
                title: '3. Tahoe가 이러한 기술을 사용하는 방법',
                list: [
                    '사용자를 인증하고 페이지 로드 전반에서 로그인 세션이 작동하도록 유지합니다.',
                    '사용자가 제품 내에서 이동할 때 최근 검색 상태와 저장된 검색 재실행 맥락 등 리크루터 워크플로 상태를 복원합니다.',
                    'Google 또는 관련 신원 인프라에 의존하는 Google 로그인 및 기타 계정 접근 흐름을 지원합니다.',
                    '계정 등록, 로그인, 비밀번호 재설정 및 유사한 보안 민감 작업 중 남용, 스팸 및 자동화 공격을 방지합니다.',
                    '제품이 안정적으로 작동하는 데 필요한 운영용 UI 상태 또는 단기 워크플로 맥락을 기억합니다.',
                    '사용자가 동의한 경우, 방문, 참여, 가입 의도를 이해할 수 있도록 Tahoe의 공개 랜딩 페이지 이용 방식을 측정합니다.',
                ],
            },
            {
                title: '4. Tahoe의 현재 쿠키 유사 기술 범주',
                list: [
                    '필수 및 보안 기술. 이는 Tahoe가 사용자를 인증하고, 계정 흐름을 보호하며, 남용을 방지하고, 핵심 제품 기능을 사용 가능하게 유지하도록 돕습니다.',
                    '기능 및 워크플로 상태 기술. 이는 Tahoe가 검색 상태, 제품 맥락 및 기타 앱 내 운영 상태를 보존하여 리크루터가 이동 중 작업을 잃지 않도록 돕습니다.',
                    '제3자 신원 기술. Google 로그인을 선택하면 Google이 신원, 사기 방지, 세션 관리를 제공하기 위해 Google이 통제하는 도메인에서 자체 쿠키나 유사 기술을 사용할 수 있습니다.',
                    '선택적 공개 페이지 분석 기술. Tahoe의 `쿠키 설정` 컨트롤을 통해 분석을 활성화하면, Tahoe는 랜딩 페이지에서 방문, 스크롤 깊이, 섹션 이동, 소셜 링크 클릭, 가입 또는 로그인 의도를 측정하기 위해 Google Analytics를 사용할 수 있습니다.',
                    '공개 페이지 동의 상태 기술. Tahoe는 공개 동의 경험에서 사용자가 선택한 내용을 `tahoe_cookie_consent` 쿠키에 저장합니다.',
                    '광고 프로필 쿠키 없음. Tahoe의 현재 구현을 기준으로, Tahoe는 현재 교차 맥락 행동 광고를 위한 광고 쿠키를 사용하지 않습니다.',
                    '교차 맥락 행동 광고 또는 마케팅 프로필 스택 없음. Tahoe의 현재 공개 분석 구현은 측정에 한정되며 교차 맥락 행동 광고를 위한 광고 쿠키를 사용하지 않습니다.',
                ],
            },
            {
                title: '5. Tahoe가 현재 사용하는 브라우저 저장소',
                body: 'Tahoe의 현재 구현은 대규모 1차 쿠키 풋프린트보다 주로 브라우저 저장소에 의존합니다. 다음 예시는 Tahoe의 현재 코드베이스를 반영하며 기능이 변경됨에 따라 달라질 수 있습니다.',
                list: [
                    '`tahoe_cookie_consent`는 랜딩, 인증, 법적 페이지에 표시되는 동의 관리자를 위한 Tahoe의 현재 공개 페이지 동의 상태를 저장합니다.',
                    '`localStorage.tahoe_token`은 로그인한 사용자가 페이지 새로고침 후에도 제품에 계속 접근할 수 있도록 Tahoe 인증 토큰을 저장합니다.',
                    '`sessionStorage.search_page_state`는 사용자가 앱 내에서 이동한 후 검색 결과로 돌아올 수 있도록 레거시 검색 페이지 상태를 저장합니다.',
                    '`sessionStorage.langgraph_search_preview_state_v1`은 세션 중 검색 미리보기와 검토 상태를 복원할 수 있도록 LangGraph 리크루터 검색 상태를 저장합니다.',
                    '`sessionStorage.tahoe_search_page_bootstrap_v1`은 불필요한 세션 세부 정보를 URL에 노출하지 않고 검색 흐름을 깔끔하게 다시 열 수 있도록 일회성 저장 검색 재실행 데이터를 저장합니다.',
                    '분석에 동의하면 Google Analytics가 Tahoe의 공개 랜딩 페이지에 측정 식별자 또는 관련 쿠키를 저장할 수 있습니다.',
                    '인증 및 남용 방지 흐름은 Google 로그인, ALTCHA 또는 유사한 보안 도구와 연결된 임시 브라우저 측 상태에 의존할 수도 있습니다.',
                ],
            },
            {
                title: '6. 제3자 서비스 및 외부에서 통제되는 기술',
                body: 'Tahoe 워크플로에 관여하는 일부 기술은 Tahoe가 직접이 아니라 제3자가 통제합니다. 예를 들어 Google 로그인 또는 관련 Google 계정 서비스를 사용하면 Google이 Google 자체 정책에 따라 쿠키 및 유사 기술을 설정하거나 접근할 수 있습니다. Tahoe는 또한 계정 흐름을 보호하는 데 필요한 남용 방지 또는 신원 관련 스크립트를 로드할 수 있습니다. 당사는 그러한 제공업체가 자체 도메인에 설정한 제3자 쿠키 또는 브라우저 저장소를 통제하지 않으며, 그 사용은 해당 업체의 자체 약관과 프라이버시 고지의 적용을 받습니다.',
            },
            {
                title: '7. 쿠키와 브라우저 저장소를 제어하는 방법',
                list: [
                    '사이트의 `쿠키 설정` 컨트롤을 통해 언제든지 Tahoe 공개 페이지 환경설정을 다시 열 수 있습니다.',
                    '일반적으로 브라우저 설정에서 쿠키를 제거하거나 차단할 수 있습니다.',
                    '브라우저의 사이트 데이터 컨트롤을 통해 로컬 저장소와 세션 저장소를 지울 수 있습니다.',
                    'Tahoe가 해당 옵션을 제공하는 경우 Tahoe에서 로그아웃하거나, Google 접근을 취소하거나, Google 연결 계정을 연결 해제할 수 있습니다.',
                    '제3자 쿠키 또는 관련 추적 기술을 제한하는 브라우저 프라이버시 설정 또는 확장 프로그램을 사용할 수 있습니다.',
                ],
                body: '필수 쿠키 또는 Tahoe의 브라우저 저장소를 차단하거나 삭제하면 로그인, 검색 복원, 계정 보안 기능 또는 기타 핵심 제품 기능이 작동하지 않을 수 있다는 점에 유의하세요.',
            },
            {
                title: '8. Do Not Track 및 유사 신호',
                body: 'Tahoe의 시스템은 현재 브라우저의 "Do Not Track" 신호에 다르게 응답하도록 구성되어 있지 않습니다. Tahoe가 추후 다른 접근 방식을 채택하는 경우, 여기에 설명하겠습니다.',
            },
            {
                title: '9. 개인정보 처리방침 및 미국 프라이버시 고지와의 관계',
                body: '이 쿠키 정책은 Tahoe의 개인정보 처리방침과 함께 읽어야 합니다. 캘리포니아 및 기타 미국 주 프라이버시 체계의 경우, 온라인 식별자, 브라우저 저장소, 인터넷 또는 네트워크 활동 데이터가 일부 맥락에서 개인정보 또는 개인 데이터로 취급될 수 있습니다. Tahoe의 개인정보 처리방침은 당사가 수집하는 정보의 범주, 이용 목적, 그리고 사용자가 프라이버시 요청에 관해 연락할 수 있는 방법에 대해 더 폭넓은 고지를 제공합니다.',
            },
            {
                title: '10. 본 쿠키 정책의 변경',
                body: '당사는 제품 변경, 법적 요건 또는 Tahoe의 브라우저 기술 이용 변화를 반영하기 위해 본 쿠키 정책을 수시로 업데이트할 수 있습니다. 그럴 경우, 이 페이지의 "최종 업데이트" 날짜를 갱신하며, 실질적으로 다른 비필수 이용이 시작되기 전에 필요한 경우 추가 고지를 제공합니다.',
            },
            {
                title: '11. 문의',
                body: '본 쿠키 정책과 관련된 질문, 프라이버시 요청 및 법적 통지는 Tahoe가 더 구체적인 프라이버시 또는 법무 연락처 주소를 게시하기 전까지 info@workonward.com 또는 우편(WorkOnward, 124 E 14th St, New York, NY 10003)으로 보낼 수 있습니다.',
            },
        ],
        linkBlocks: [
            {
                title: '관련 지침',
                body: 'Tahoe의 쿠키 고지는 공개된 미국 프라이버시 지침과 Tahoe의 실제 구현 선택을 참고했습니다. 관련 자료는 다음과 같습니다:',
                links: [
                    { label: '인터넷 쿠키에 관한 FTC 지침', href: 'https://www.ftc.gov/policy-notices/privacy-policy/internet-cookies' },
                    { label: '개인정보 처리방침 투명성에 관한 캘리포니아 법무부 지침', href: 'https://oag.ca.gov/node/36676' },
                    { label: 'CCPA / CPRA 권리 및 사업자 의무에 관한 캘리포니아 프라이버시 보호국 FAQ', href: 'https://cppa.ca.gov/faq' },
                    { label: 'Google Sign-In for Web 개요', href: 'https://developers.google.com/identity/gsi/web/guides/overview' },
                ],
            },
            {
                title: '관련 정책',
                body: '개인정보에 관한 더 폭넓은 고지는 Tahoe의 개인정보 처리방침을, 플랫폼 이용을 규율하는 규칙은 Tahoe의 이용약관을 참고하세요.',
                links: [
                    { label: '개인정보 처리방침', href: '/privacy', internal: true },
                    { label: '이용약관', href: '/terms', internal: true },
                ],
            },
        ],
    },
};

export const legalContent = { en, ko } as const;
