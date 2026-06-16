'use client';

import { useMemo, useState } from 'react';
import PartnerApplyModal from '@/components/partner/PartnerApplyModal';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { trackLandingEvent } from '@/lib/public-analytics';
import styles from './partner.module.css';

const REV_SHARE = 0.30;
const REV_SHARE_PERCENT = Math.round(REV_SHARE * 100);
const REV_SHARE_MONTHS = 12;

const BENEFITS = [
    {
        title: '30% recurring revenue share',
        body: 'Earn 30% of every paid Tahoe subscription you refer for a full 12 months, paid out monthly.',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
    },
    {
        title: 'No earnings cap',
        body: 'Bring 5 customers or 5,000. Your share scales with the workspaces you send. No tiers, no resets.',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 17 9 11l4 4 8-8M14 7h7v7" />
            </svg>
        ),
    },
    {
        title: 'Co-marketing assets',
        body: 'Approved demos, screenshot kits, comparison decks, and copy you can drop into your own channel.',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="4" width="18" height="14" rx="2" />
                <path d="M3 9h18M8 21h8" />
            </svg>
        ),
    },
    {
        title: 'A real partner manager',
        body: 'A named human at WorkOnward who answers in hours, not weeks, and helps you ship the next campaign.',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
            </svg>
        ),
    },
];

const HOW_STEPS = [
    {
        title: 'Apply in two minutes',
        body: 'Tell us about your audience and how you talk about recruiting tools. We review every application within 2-3 business days.',
    },
    {
        title: 'Get your link + assets',
        body: 'On approval you get a tracked partner link, a private dashboard, and our co-marketing kit, ready to drop into a video, post, or newsletter.',
    },
    {
        title: 'Earn 30% for 12 months',
        body: 'Every paid Tahoe subscription you refer pays you 30% recurring for 12 months. Payouts run monthly via Stripe.',
    },
];

const REFERRAL_ROWS = [
    { name: 'Wave Studio', plan: 'Growth · annual', mrr: 990, status: 'Active', payout: 297 },
    { name: 'Northrise', plan: 'Growth · monthly', mrr: 99, status: 'Active', payout: 29.7 },
    { name: 'Halo Talent', plan: 'Scale · annual', mrr: 1990, status: 'Active', payout: 597 },
    { name: 'Forge & Co', plan: 'Growth · monthly', mrr: 99, status: 'Active', payout: 29.7 },
    { name: 'Loom Recruits', plan: 'Growth · annual', mrr: 990, status: 'Trial → paid', payout: 297 },
];

const HERO_PARTNER_ROWS = [
    { initials: 'WS', name: 'Wave Studio', meta: 'Growth · annual', amount: '+ $297' },
    { initials: 'HT', name: 'Halo Talent', meta: 'Scale · annual', amount: '+ $597' },
    { initials: 'NR', name: 'Northrise', meta: 'Growth · monthly', amount: '+ $29.70' },
];

const FAQS = [
    {
        question: `How does the ${REV_SHARE_PERCENT}% revenue share work?`,
        answer: `For every paid Tahoe subscription you refer, you earn ${REV_SHARE_PERCENT}% of what that customer pays Tahoe for ${REV_SHARE_MONTHS} months, paid out monthly via Stripe. Annual plans count toward all 12 months on day one.`,
    },
    {
        question: 'When and how do I get paid?',
        answer: 'Payouts run on the 1st of every month via Stripe Connect, covering qualified earnings from the previous calendar month, after a 10-day refund window. Minimum payout is $50.',
    },
    {
        question: 'How long does the cookie last?',
        answer: 'Your tracked partner link sets a 60-day attribution cookie. As long as the customer signs up within 60 days of the click, the workspace is attributed to you.',
    },
    {
        question: 'Can I run paid ads?',
        answer: 'Yes, on your own channels. We do ask that you avoid bidding on Tahoe-branded keywords or impersonating Tahoe in ads. Full guidelines are shared after approval.',
    },
    {
        question: 'What counts as a qualified referral?',
        answer: 'A referral is qualified once the workspace pays its first Tahoe invoice and stays past the 10-day refund window. Free trials and unpaid signups are tracked but only earn once they convert.',
    },
    {
        question: 'How do you protect my links from fraud?',
        answer: 'Every signup is run through device fingerprinting, IP heuristics, and refund-window checks before earnings post to your ledger. We will never claw back legitimate paid conversions.',
    },
    {
        question: 'How do I get support?',
        answer: 'Approved partners get a dedicated Slack channel and a named partner manager at WorkOnward. We respond inside one business day, usually faster.',
    },
];

const HERO_CHART_PATH = 'M0 60 L40 50 L80 56 L120 38 L160 44 L200 28 L240 32 L280 14 L320 18 L360 6';
const PARTNER_CHART_PATH = 'M0 130 L40 110 L80 116 L120 88 L160 96 L200 64 L240 70 L280 38 L320 46 L360 24';
const PARTNER_CHART_FILL = 'M0 160 L0 130 L40 110 L80 116 L120 88 L160 96 L200 64 L240 70 L280 38 L320 46 L360 24 L360 160 Z';

function ArrowIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.inlineIcon}>
            <path d="M4 10h12m0 0-4-4m4 4-4 4" />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.faqChevron}>
            <path d="m6 8 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.ctaCheckIcon}>
            <path d="m5 13 4 4L19 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function HeroEarningsCard() {
    return (
        <div className={styles.heroEarningsCard}>
            <div className={styles.heroEarningsTop}>
                <span className={styles.heroEarningsLabel}>Total partner earnings · last 30 days</span>
                <span className={styles.heroEarningsBadge}>+34%</span>
            </div>
            <div>
                <div className={styles.heroEarningsBig}>$8,940</div>
                <div className={styles.heroEarningsBigSub}>27 active referrals · paid via Stripe on the 1st</div>
            </div>
            <div className={styles.heroChart}>
                <svg viewBox="0 0 360 64" preserveAspectRatio="none">
                    <path d={HERO_CHART_PATH} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={`${HERO_CHART_PATH} L360 64 L0 64 Z`} fill="rgba(255, 104, 44, 0.14)" />
                </svg>
            </div>
            <div className={styles.heroEarningsRows}>
                {HERO_PARTNER_ROWS.map((row) => (
                    <div key={row.name} className={styles.heroEarningsRow}>
                        <div className={styles.heroEarningsAvatar}>{row.initials}</div>
                        <div>
                            <div className={styles.heroEarningsName}>{row.name}</div>
                            <div className={styles.heroEarningsMeta}>{row.meta}</div>
                        </div>
                        <div className={styles.heroEarningsAmount}>{row.amount}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PartnerDashboardMock() {
    return (
        <div className={styles.partnerDashCard}>
            <div className={styles.partnerDashHeader}>
                <div>
                    <div className={styles.partnerDashTitle}>Partner dashboard</div>
                    <div className={styles.partnerDashSub}>Live view of referrals, MRR, and the next payout.</div>
                </div>
                <div className={styles.heroEarningsBadge}>Stripe connected</div>
            </div>
            <div className={styles.partnerDashGrid}>
                <div className={styles.partnerDashLeft}>
                    <div className={styles.partnerStatRow}>
                        <div className={styles.partnerStat}>
                            <span className={styles.partnerStatLabel}>Active referrals</span>
                            <span className={styles.partnerStatValue}>27</span>
                            <span className={styles.partnerStatChange}>+6 this month</span>
                        </div>
                        <div className={styles.partnerStat}>
                            <span className={styles.partnerStatLabel}>Tracked MRR</span>
                            <span className={styles.partnerStatValue}>$29,790</span>
                            <span className={styles.partnerStatChange}>+18% MoM</span>
                        </div>
                        <div className={styles.partnerStat}>
                            <span className={styles.partnerStatLabel}>Conversion</span>
                            <span className={styles.partnerStatValue}>21%</span>
                            <span className={styles.partnerStatChange}>+3 pts</span>
                        </div>
                    </div>

                    <div className={styles.partnerChart}>
                        <svg viewBox="0 0 360 160" preserveAspectRatio="none">
                            <path d={PARTNER_CHART_FILL} fill="rgba(255, 104, 44, 0.14)" />
                            <path d={PARTNER_CHART_PATH} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <table className={styles.partnerTable}>
                        <thead>
                            <tr>
                                <th>Workspace</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>Monthly payout</th>
                            </tr>
                        </thead>
                        <tbody>
                            {REFERRAL_ROWS.map((row) => (
                                <tr key={row.name}>
                                    <td>{row.name}</td>
                                    <td>{row.plan}</td>
                                    <td>{row.status}</td>
                                    <td>${row.payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={styles.partnerDashRight}>
                    <div className={styles.partnerPayoutCard}>
                        <span className={styles.partnerPayoutLabel}>Next payout · Mar 1</span>
                        <span className={styles.partnerPayoutValue}>$8,940.00</span>
                        <span className={styles.partnerPayoutMeta}>27 active referrals · paid via Stripe Connect</span>
                    </div>
                    <div className={styles.partnerPayoutCard}>
                        <span className={styles.partnerPayoutLabel}>Lifetime earnings</span>
                        <span className={styles.partnerPayoutValue}>$71,420</span>
                        <span className={styles.partnerPayoutMeta}>Across 84 referred workspaces</span>
                    </div>
                    <div className={styles.partnerPayoutCard}>
                        <span className={styles.partnerPayoutLabel}>Your partner link</span>
                        <div className={styles.partnerLinkBox}>tahoe.workonward.com/?via=your-handle</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatUsd(value: number): string {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function PartnerPage() {
    const [applyOpen, setApplyOpen] = useState(false);
    const [referrals, setReferrals] = useState(25);
    const [planPrice, setPlanPrice] = useState(99);

    const monthlyEarnings = useMemo(() => referrals * planPrice * REV_SHARE, [referrals, planPrice]);
    const annualEarnings = useMemo(() => monthlyEarnings * 12, [monthlyEarnings]);
    const programEarnings = useMemo(() => monthlyEarnings * REV_SHARE_MONTHS, [monthlyEarnings]);

    function openApply(source: string) {
        trackLandingEvent('partner_apply_clicked', { source });
        setApplyOpen(true);
    }

    return (
        <main className={styles.page}>
            <PublicSiteHeader placement="partner" />

            <section className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.heroGrid}>
                        <div className={styles.heroCopy}>
                            <span className={styles.heroEyebrow}>
                                <span className={styles.heroEyebrowDot} />
                                Tahoe Partner Program
                            </span>
                            <h1 className={styles.heroTitle}>
                                Earn <span>{REV_SHARE_PERCENT}% recurring</span> revenue share for {REV_SHARE_MONTHS} months.
                            </h1>
                            <p className={styles.heroBody}>
                                Tahoe pays creators, operators, and recruiting communities a real share of every paying
                                customer they send. No earnings cap. Monthly Stripe payouts. A named human at WorkOnward
                                helping you ship the next campaign.
                            </p>
                            <div className={styles.heroActions}>
                                <button
                                    type="button"
                                    className={styles.primaryAction}
                                    onClick={() => openApply('hero_primary')}
                                >
                                    Apply to be a partner <ArrowIcon />
                                </button>
                                <a href="#faq" className={styles.ghostAction}>
                                    Read the FAQ
                                </a>
                            </div>
                            <p className={styles.heroMeta}>Approval in 2-3 business days · Free to join</p>

                            <div className={styles.heroStats}>
                                <div>
                                    <strong>30%</strong>
                                    <span>recurring rev-share</span>
                                </div>
                                <div>
                                    <strong>12 months</strong>
                                    <span>per paid customer</span>
                                </div>
                                <div>
                                    <strong>60-day</strong>
                                    <span>attribution window</span>
                                </div>
                            </div>
                        </div>

                        <HeroEarningsCard />
                    </div>
                </div>
            </section>

            <section className={`${styles.section} ${styles.warmSection}`} id="benefits">
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Why partner with Tahoe</span>
                        <h2>Built for partners who actually ship, not just collect codes.</h2>
                        <p>
                            Tahoe is a AI recruiting platform that customers stay on for years. That makes recurring
                            economics genuinely good for the people who introduce us, not a one-time bounty.
                        </p>
                    </div>

                    <div className={styles.benefitsGrid}>
                        {BENEFITS.map((benefit) => (
                            <article key={benefit.title} className={styles.benefitCard}>
                                <div className={styles.benefitIcon}>{benefit.icon}</div>
                                <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                                <p className={styles.benefitBody}>{benefit.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.section} id="how-it-works">
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>How it works</span>
                        <h2>Three steps from application to first payout.</h2>
                        <p>No spreadsheets, no manual claim links, no surprise reductions. Just send qualified workspaces, get paid.</p>
                    </div>

                    <div className={styles.howRail}>
                        {HOW_STEPS.map((step, index) => (
                            <article key={step.title} className={styles.howStep}>
                                <span className={styles.howStepGhost}>{index + 1}</span>
                                <div className={styles.howStepNumber}>{index + 1}</div>
                                <h3 className={styles.howStepTitle}>{step.title}</h3>
                                <p className={styles.howStepBody}>{step.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className={`${styles.section} ${styles.warmSection}`} id="dashboard">
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Partner dashboard</span>
                        <h2>Live earnings, attribution, and payout state in one calm surface.</h2>
                        <p>
                            Approved partners get a private dashboard built on the same platform Tahoe ships to
                            recruiters. Track every referral, see your next Stripe payout, and grab assets in one place.
                        </p>
                    </div>

                    <PartnerDashboardMock />
                </div>
            </section>

            <section className={styles.section} id="calculator">
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Earnings calculator</span>
                        <h2>See what {REV_SHARE_PERCENT}% recurring actually pays.</h2>
                        <p>
                            Drag the inputs to model what you would earn each month, each year, and across the full
                            12-month payout window for every customer.
                        </p>
                    </div>

                    <div className={styles.calcGrid}>
                        <div className={styles.calcCard}>
                            <div className={styles.calcRow}>
                                <label htmlFor="calc-referrals" className={styles.calcLabel}>
                                    Active paying referrals
                                </label>
                                <div className={styles.calcInputShell}>
                                    <input
                                        id="calc-referrals"
                                        type="number"
                                        min={1}
                                        max={1000}
                                        value={referrals}
                                        onChange={(event) => setReferrals(Math.max(1, Math.min(1000, Number(event.target.value) || 0)))}
                                        className={styles.calcInput}
                                    />
                                </div>
                                <input
                                    aria-label="Referrals slider"
                                    type="range"
                                    min={1}
                                    max={250}
                                    value={Math.min(referrals, 250)}
                                    onChange={(event) => setReferrals(Number(event.target.value))}
                                    className={styles.calcSlider}
                                />
                            </div>

                            <div className={styles.calcRow}>
                                <label htmlFor="calc-plan" className={styles.calcLabel}>
                                    Average customer plan ($/month)
                                </label>
                                <div className={styles.calcInputShell}>
                                    <span className={styles.calcInputPrefix}>$</span>
                                    <input
                                        id="calc-plan"
                                        type="number"
                                        min={20}
                                        max={5000}
                                        step={10}
                                        value={planPrice}
                                        onChange={(event) => setPlanPrice(Math.max(20, Math.min(5000, Number(event.target.value) || 0)))}
                                        className={styles.calcInput}
                                    />
                                </div>
                                <input
                                    aria-label="Plan slider"
                                    type="range"
                                    min={49}
                                    max={1990}
                                    step={10}
                                    value={Math.min(planPrice, 1990)}
                                    onChange={(event) => setPlanPrice(Number(event.target.value))}
                                    className={styles.calcSlider}
                                />
                            </div>

                            <p className={styles.modalHint}>
                                Math: referrals × plan × {REV_SHARE_PERCENT}% rev-share, paid monthly for {REV_SHARE_MONTHS} months
                                per customer.
                            </p>
                        </div>

                        <div className={styles.calcResultCard}>
                            <span className={styles.calcResultLabel}>Estimated monthly earnings</span>
                            <div className={styles.calcResultBig}>{formatUsd(monthlyEarnings)}</div>
                            <div className={styles.calcResultSplit}>
                                <div>
                                    <span className={styles.calcResultLabel}>Yearly</span>
                                    <div className={styles.calcResultSubBig}>{formatUsd(annualEarnings)}</div>
                                </div>
                                <div>
                                    <span className={styles.calcResultLabel}>Per customer · 12 months</span>
                                    <div className={styles.calcResultSubBig}>{formatUsd(planPrice * REV_SHARE * REV_SHARE_MONTHS)}</div>
                                </div>
                            </div>
                            <span className={styles.calcMeta}>
                                Lifetime program total at this run-rate: <strong>{formatUsd(programEarnings)}</strong>
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className={`${styles.section} ${styles.warmSection}`} id="faq">
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>FAQ</span>
                        <h2>Everything you might want to know before applying.</h2>
                    </div>

                    <div className={styles.faqList}>
                        {FAQS.map((entry) => (
                            <details key={entry.question} className={styles.faqItem}>
                                <summary className={styles.faqQuestion}>
                                    <span>{entry.question}</span>
                                    <ChevronDownIcon />
                                </summary>
                                <p className={styles.faqAnswer}>{entry.answer}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.finalCta}>
                <div className={styles.container}>
                    <div className={styles.finalCtaCard}>
                        <div>
                            <h2>Ready to earn alongside Tahoe?</h2>
                            <p>
                                Tahoe is built for recruiters who care about how they work. If your audience cares
                                about that too, we want you in the program.
                            </p>
                            <div className={styles.heroActions}>
                                <button
                                    type="button"
                                    className={styles.accentAction}
                                    onClick={() => openApply('final_cta')}
                                >
                                    Apply to be a partner <ArrowIcon />
                                </button>
                                <a href="#faq" className={styles.inverseGhostAction}>
                                    Read the FAQ
                                </a>
                            </div>
                        </div>
                        <div className={styles.ctaChecklist}>
                            {[
                                '30% recurring rev-share for 12 months',
                                'Monthly payouts via Stripe Connect',
                                '60-day attribution window',
                                'A real human partner manager',
                                'Co-marketing assets on day one',
                            ].map((item) => (
                                <div key={item} className={styles.ctaChecklistItem}>
                                    <CheckIcon />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <PublicSiteFooter placement="partner" />

            <PartnerApplyModal open={applyOpen} onOpenChange={setApplyOpen} />
        </main>
    );
}
