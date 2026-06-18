import type { Metadata } from 'next';
import Link from 'next/link';
import { OG_IMAGES } from '@/lib/og';
import { type Locale, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { buildAlternates, buildOgLocale } from '@/i18n/metadata';
import { faqLd } from '@/lib/structured-data';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import JsonLd from '@/components/seo/JsonLd';
import styles from '../page.module.css';
import hiring from './hiring.module.css';
import HiringHero from './_components/HiringHero';
import MatchRadar from './_components/MatchRadar';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';
const DEMO_URL =
    'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2TB11Wn_yYLPd8ClWeKR2YyHYCYYjdRm1cJguma5qRyE6IuKaJlVjdugP4zOs96cFr3-mvhO0P';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).hiring;
    return {
        title: t.metaTitle,
        description: t.metaDescription,
        alternates: buildAlternates(locale, '/hiring'),
        openGraph: {
            title: `${t.metaTitle} | Tahoe AI`,
            description: t.ogDescription,
            url: `/${locale}/hiring`,
            siteName: 'Tahoe AI',
            images: OG_IMAGES,
            type: 'website',
            ...buildOgLocale(locale),
        },
    };
}

export default async function HiringPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).hiring;
    const L = (path: string) => `/${locale}${path}`;
    const radarAria = `${t.matchCandidate}: ${t.matchScoreLabel} 92 — ${t.matchAxes.map((a) => `${a.label} ${a.value}`).join(', ')}`;

    const softwareLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Tahoe Jobs',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'AI-native ATS, recruiting CRM, and job board',
        operatingSystem: 'Web',
        url: `${SITE_URL}/${locale}/hiring`,
        description: t.metaDescription,
        featureList: t.loop.map((s) => s.title),
        offers: {
            '@type': 'Offer',
            price: '49',
            priceCurrency: 'USD',
            description: 'Free to start, no credit card. Paid plans from $49/month.',
        },
        publisher: { '@id': `${SITE_URL}/#organization` },
    };
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: t.breadcrumbHome, item: `${SITE_URL}/${locale}` },
            { '@type': 'ListItem', position: 2, name: t.breadcrumb, item: `${SITE_URL}/${locale}/hiring` },
        ],
    };

    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <JsonLd data={[softwareLd, breadcrumbLd, faqLd(t.faq.map(([q, a]) => ({ q, a })))]} />

            {/* ── Hero (animated agentic loop) ── */}
            <HiringHero
                h1={t.h1}
                lede={t.lede}
                ctaStart={t.ctaStart}
                ctaStartNote={t.ctaStartNote}
                demoCta={t.demoCta}
                framesLabel={t.framesLabel}
                frames={t.frames}
                matchAxes={t.matchAxes}
                matchRequired={t.matchRequired}
                radarAria={radarAria}
                signupHref={L('/signup')}
                demoUrl={DEMO_URL}
            />

            {/* ── Problem ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <h2>{t.problemHeading}</h2>
                    </div>
                    <div className={hiring.statBand}>
                        {t.problemStats.map((s) => (
                            <div key={s.stat + s.label} className={hiring.statCard}>
                                <div className={hiring.statNumber}>{s.stat}</div>
                                <div className={hiring.statLabel}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <p className={hiring.leadNote}>{t.problemNote}</p>
                </div>
            </section>

            {/* ── The shift ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <h2>{t.shiftHeading}</h2>
                    </div>
                    <div className={hiring.panelGrid2}>
                        {t.shiftPoints.map((p) => (
                            <div key={p.title} className={hiring.panelCard}>
                                <h3 className={hiring.panelTitle}>{p.title}</h3>
                                <p className={hiring.panelBody}>{p.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Single source of truth ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <h2>{t.truthHeading}</h2>
                        <p>{t.truthLede}</p>
                    </div>
                    <div className={hiring.truthGrid}>
                        <div className={`${hiring.truthCol} ${hiring.truthOld}`}>
                            <div className={hiring.truthColTitle}>{t.truthOldTitle}</div>
                            <ul className={hiring.truthList}>
                                {t.truthOld.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className={`${hiring.truthCol} ${hiring.truthNew}`}>
                            <div className={hiring.truthColTitle}>{t.truthNewTitle}</div>
                            <ul className={hiring.truthList}>
                                {t.truthNew.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className={hiring.panelGrid3}>
                        {t.truthPoints.map((p) => (
                            <div key={p.title} className={hiring.panelCard}>
                                <h3 className={hiring.panelTitle}>{p.title}</h3>
                                <p className={hiring.panelBody}>{p.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── The agentic loop ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <h2>{t.loopHeading}</h2>
                        <p>{t.loopLede}</p>
                    </div>
                    <div className={hiring.loopGrid}>
                        {t.loop.map((s, i) => (
                            <div key={s.title} className={hiring.loopCard}>
                                <span className={hiring.loopNum}>{i + 1}</span>
                                <div className={hiring.loopTitle}>{s.title}</div>
                                <p className={hiring.loopBody}>{s.body}</p>
                            </div>
                        ))}
                    </div>
                    <div className={hiring.loopControl}>{t.loopControl}</div>
                </div>
            </section>

            {/* ── Explainable match (spider-web) ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <h2>{t.matchHeading}</h2>
                        <p>{t.matchLede}</p>
                    </div>
                    <div className={hiring.matchGrid}>
                        <div className={hiring.matchCard}>
                            <div className={hiring.matchHead}>
                                <div>
                                    <div className={hiring.matchName}>{t.matchCandidate}</div>
                                    <div className={hiring.matchRole}>{t.matchRole}</div>
                                </div>
                                <div>
                                    <div className={hiring.matchScore}>92%</div>
                                    <span className={hiring.matchScoreLabel}>{t.matchScoreLabel}</span>
                                </div>
                            </div>
                            <MatchRadar axes={t.matchAxes} required={t.matchRequired} ariaLabel={radarAria} />
                            <div className={hiring.matchLegend}>
                                <span><span className={`${hiring.legendSwatch} ${hiring.swatchCandidate}`} />{t.matchLegendCandidate}</span>
                                <span><span className={`${hiring.legendSwatch} ${hiring.swatchRequired}`} />{t.matchLegendRequired}</span>
                            </div>
                        </div>
                        <div className={hiring.matchLists}>
                            <div>
                                <h3 className={hiring.matchListTitle}>{t.matchEvidenceHeading}</h3>
                                <ul className={hiring.factList}>
                                    {t.matchEvidence.map((item) => (
                                        <li key={item}><span className={hiring.ok}>✓</span>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className={hiring.matchListTitle}>{t.matchGapsHeading}</h3>
                                <ul className={hiring.factList}>
                                    {t.matchGaps.map((item) => (
                                        <li key={item}><span className={hiring.warn}>⚠</span>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <p className={hiring.matchBlend}>{t.matchBlend}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Fair by design ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <h2>{t.fairHeading}</h2>
                        <p>{t.fairLede}</p>
                    </div>
                    <div className={hiring.fairGrid}>
                        <div className={hiring.panelCard}>
                            <h3 className={hiring.matchListTitle}>{t.fairCheckTitle}</h3>
                            <ul className={hiring.factList}>
                                {t.fairCheck.map((item) => (
                                    <li key={item}><span className={hiring.warn}>⚠</span>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className={hiring.panelCard}>
                            <h3 className={hiring.matchListTitle}>{t.fairRankTitle}</h3>
                            <ul className={hiring.factList}>
                                {t.fairRank.map((item) => (
                                    <li key={item}><span className={hiring.ok}>✓</span>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Two journeys ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <h2>{t.journeysHeading}</h2>
                    </div>
                    <div className={hiring.journeyGrid}>
                        <div className={hiring.journeyCol}>
                            <div className={hiring.journeyTitle}>{t.recruiterTitle}</div>
                            <ol className={hiring.journeySteps}>
                                {t.recruiterSteps.map((s) => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ol>
                        </div>
                        <div className={hiring.journeyCol}>
                            <div className={hiring.journeyTitle}>{t.seekerTitle}</div>
                            <ol className={hiring.journeySteps}>
                                {t.seekerSteps.map((s) => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Transparent for everyone (applicant tracker) ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <h2>{t.transparentHeading}</h2>
                    </div>
                    <div className={hiring.transparentGrid}>
                        <div className={hiring.tracker}>
                            <div className={hiring.trackerTitle}>{t.trackerTitle}</div>
                            <ul className={hiring.trackerSteps}>
                                {t.trackerSteps.map((step) => (
                                    <li key={step.label} className={hiring.trackerStep}>
                                        <span
                                            className={`${hiring.trackerDot} ${step.state === 'done' ? hiring.dotDone : step.state === 'current' ? hiring.dotCurrent : ''}`}
                                        />
                                        <span className={hiring.trackerMain}>
                                            <span className={step.state === 'current' ? `${hiring.trackerLabel} ${hiring.trackerLabelCurrent}` : hiring.trackerLabel}>
                                                {step.label}
                                            </span>
                                            <span className={hiring.trackerTime}>{step.time}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <p className={hiring.trackerNote}>{t.trackerNote}</p>
                        </div>
                        <p className={hiring.leadNote}>{t.transparentLede}</p>
                    </div>
                </div>
            </section>

            {/* ── Comparison ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <h2>{t.compareHeading}</h2>
                    </div>
                    <div className={hiring.compareWrap}>
                        <table className={hiring.compareTable}>
                            <thead>
                                <tr>
                                    <th scope="col" />
                                    <th scope="col" className={hiring.colTahoe}>{t.compareColTahoe}</th>
                                    {t.compareCols.map((c) => (
                                        <th key={c} scope="col">{c}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {t.compareRows.map((row) => (
                                    <tr key={row.label}>
                                        <th scope="row" className={hiring.rowLabel}>{row.label}</th>
                                        {row.cells.map((cell, i) => (
                                            <td key={`${row.label}-${i}`} className={i === 0 ? hiring.colTahoe : hiring.cell}>
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className={hiring.compareNote}>{t.compareNote}</p>
                </div>
            </section>

            {/* ── What's next ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={hiring.whatsNext}>
                        <div className={hiring.whatsNextTitle}>{t.whatsNextHeading}</div>
                        <p className={hiring.whatsNextBody}>{t.whatsNextBody}</p>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <h2>{t.faqHeading}</h2>
                    </div>
                    <div className={styles.featureGrid}>
                        {t.faq.map(([question, answer]) => (
                            <article key={question} className={styles.featureCard}>
                                <h3>{question}</h3>
                                <p>{answer}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className={styles.finalCtaSection}>
                <div className={styles.container}>
                    <div className={hiring.finalCta}>
                        <h2 className={hiring.finalCtaHeading}>{t.finalCtaHeading}</h2>
                        <div className={hiring.finalCtaActions}>
                            <Link href={L('/signup')} className={hiring.finalCtaPrimary}>{t.finalCtaStart}</Link>
                            <a href={DEMO_URL} target="_blank" rel="noreferrer" className={hiring.finalCtaSecondary}>{t.finalCtaDemo}</a>
                        </div>
                    </div>
                </div>
            </section>

            <PublicSiteFooter />
        </main>
    );
}
