'use client';

import { useState } from 'react';
import Link from 'next/link';
import page from '../../page.module.css';
import styles from '../pricing.module.css';

// Structural prop types (not the literal `as const` dictionary types) so the same
// component accepts either locale's strings, which differ as literals.
type Plan = {
    key: string;
    name: string;
    monthly: number;
    yearly: number;
    popular: boolean;
    features: readonly string[];
};

type Pricing = {
    plansEyebrow: string;
    plansHeading: string;
    toggle: { monthly: string; annual: string; save: string };
    perMonth: string;
    billedAnnually: string;
    billedMonthly: string;
    mostPopular: string;
    planCta: string;
    plans: readonly Plan[];
    creditStrip: { title: string; note: string; items: readonly (readonly [string, string])[] };
    compare: {
        eyebrow: string;
        heading: string;
        colTahoe: string;
        cols: readonly string[];
        priceLabel: string;
        priceTahoeAnnual: string;
        priceTahoeMonthly: string;
        priceCompetitors: readonly string[];
        rows: readonly { label: string; cells: readonly string[] }[];
        disclaimer: string;
    };
    topups: {
        eyebrow: string;
        heading: string;
        note: string;
        bestValue: string;
        perCreditLabel: string;
        cta: string;
        packs: readonly { credits: string; price: string; perCredit: string; best: boolean; bullets: readonly string[] }[];
    };
};

function CheckIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className={styles.check}>
            <path
                d="M13.5 4.5 6.5 11.5 3 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/**
 * Interactive middle of the pricing page: a Monthly/Annual toggle that drives both
 * the three plan cards and the Tahoe column of the comparison table, plus the
 * (static) credit strip and top-up packs. Rendered as a single client island so the
 * toggle state is shared; SEO copy, FAQ, and JSON-LD stay server-rendered on the page.
 */
export default function PricingTables({ t, signupHref }: { t: Pricing; signupHref: string }) {
    const [annual, setAnnual] = useState(true);

    const formatPrice = (value: number) => `$${value.toLocaleString()}`;
    const tahoeEntryPrice = annual ? t.compare.priceTahoeAnnual : t.compare.priceTahoeMonthly;

    return (
        <>
            {/* ── Plans ── */}
            <section className={page.section}>
                <div className={page.container}>
                    <div className={page.sectionHead}>
                        <span className={page.sectionEyebrow}>{t.plansEyebrow}</span>
                        <h2>{t.plansHeading}</h2>
                    </div>

                    <div className={styles.toggleRow}>
                        <div className={styles.toggle} role="tablist" aria-label={t.toggle.annual}>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={!annual}
                                className={!annual ? `${styles.toggleOption} ${styles.toggleOptionActive}` : styles.toggleOption}
                                onClick={() => setAnnual(false)}
                            >
                                {t.toggle.monthly}
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={annual}
                                className={annual ? `${styles.toggleOption} ${styles.toggleOptionActive}` : styles.toggleOption}
                                onClick={() => setAnnual(true)}
                            >
                                {t.toggle.annual}
                                <span className={styles.savePill}>{t.toggle.save}</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.planGrid}>
                        {t.plans.map((plan) => {
                            const popular = plan.popular;
                            const perMonth = annual ? Math.round(plan.yearly / 12) : plan.monthly;
                            const billed = annual
                                ? t.billedAnnually.replace('{price}', formatPrice(plan.yearly))
                                : t.billedMonthly;
                            return (
                                <div
                                    key={plan.key}
                                    className={popular ? `${styles.planCard} ${styles.planCardPopular}` : styles.planCard}
                                >
                                    {popular ? <span className={styles.popularBadge}>{t.mostPopular}</span> : null}
                                    <span className={styles.planName}>{plan.name}</span>
                                    <div className={styles.planPriceRow}>
                                        <span className={styles.planPrice}>{formatPrice(perMonth)}</span>
                                        <span className={styles.planPer}>{t.perMonth}</span>
                                    </div>
                                    <span className={styles.planBilled}>{billed}</span>
                                    <ul className={styles.featureList}>
                                        {plan.features.map((feature) => (
                                            <li key={feature} className={styles.featureItem}>
                                                <CheckIcon />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href={signupHref}
                                        className={popular ? `${styles.planCta} ${styles.planCtaPopular}` : styles.planCta}
                                    >
                                        {t.planCta}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.creditStrip}>
                        <h3 className={styles.creditStripTitle}>{t.creditStrip.title}</h3>
                        <div className={styles.creditItems}>
                            {t.creditStrip.items.map(([label, cost]) => (
                                <span key={label} className={styles.creditItem}>
                                    <span className={styles.creditItemLabel}>{label}</span>
                                    <span className={styles.creditItemCost}>{cost}</span>
                                </span>
                            ))}
                        </div>
                        <p className={styles.creditNote}>{t.creditStrip.note}</p>
                    </div>
                </div>
            </section>

            {/* ── Comparison (toggle drives the Tahoe price) ── */}
            <section className={page.section}>
                <div className={page.container}>
                    <div className={page.sectionHead}>
                        <span className={page.sectionEyebrow}>{t.compare.eyebrow}</span>
                        <h2>{t.compare.heading}</h2>
                    </div>

                    <div className={styles.compareWrap}>
                        <table className={styles.compareTable}>
                            <thead>
                                <tr>
                                    <th scope="col" />
                                    <th scope="col" className={styles.compareColTahoe}>
                                        {t.compare.colTahoe}
                                    </th>
                                    {t.compare.cols.map((col) => (
                                        <th key={col} scope="col">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th scope="row" className={styles.compareRowLabel}>
                                        {t.compare.priceLabel}
                                    </th>
                                    <td className={styles.compareColTahoe}>
                                        <span className={styles.comparePrice}>{tahoeEntryPrice}</span>
                                    </td>
                                    {t.compare.priceCompetitors.map((price, i) => (
                                        <td key={t.compare.cols[i]} className={styles.compareCell}>
                                            <span className={styles.comparePrice}>{price}</span>
                                        </td>
                                    ))}
                                </tr>
                                {t.compare.rows.map((row) => (
                                    <tr key={row.label}>
                                        <th scope="row" className={styles.compareRowLabel}>
                                            {row.label}
                                        </th>
                                        {row.cells.map((cell, i) => (
                                            <td
                                                key={`${row.label}-${i}`}
                                                className={i === 0 ? styles.compareColTahoe : styles.compareCell}
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className={styles.compareDisclaimer}>{t.compare.disclaimer}</p>
                </div>
            </section>

            {/* ── Top-ups ── */}
            <section className={page.section}>
                <div className={page.container}>
                    <div className={page.sectionHead}>
                        <span className={page.sectionEyebrow}>{t.topups.eyebrow}</span>
                        <h2>{t.topups.heading}</h2>
                    </div>

                    <div className={styles.topupGrid}>
                        {t.topups.packs.map((pack) => (
                            <div
                                key={pack.credits}
                                className={pack.best ? `${styles.topupCard} ${styles.topupCardBest}` : styles.topupCard}
                            >
                                {pack.best ? <span className={styles.topupBestBadge}>{t.topups.bestValue}</span> : null}
                                <span className={styles.topupCredits}>{pack.credits}</span>
                                <div className={styles.topupPriceRow}>
                                    <span className={styles.topupPrice}>{pack.price}</span>
                                    <span className={styles.topupPerCredit}>
                                        {pack.perCredit} {t.topups.perCreditLabel}
                                    </span>
                                </div>
                                <ul className={styles.topupBullets}>
                                    {pack.bullets.map((bullet) => (
                                        <li key={bullet}>
                                            <CheckIcon />
                                            {bullet}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={signupHref}
                                    className={pack.best ? `${styles.planCta} ${styles.planCtaPopular}` : styles.planCta}
                                >
                                    {t.topups.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                    <p className={styles.topupNote}>{t.topups.note}</p>
                </div>
            </section>
        </>
    );
}
