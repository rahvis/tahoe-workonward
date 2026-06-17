import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchDetail, formatComp, locationLabel } from '@/lib/public-jobs';
import styles from '../public.module.css';
import ApplyForm from './ApplyForm';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://tahoe.workonward.com';

type Params = Promise<{ slug: string }>;
type Search = Promise<{ tab?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params;
    const data = await fetchDetail(slug).catch(() => null);
    if (!data) return { title: 'Role not found', robots: { index: false } };
    const job = data.job;
    const title = job.seo?.meta_title || `${job.title} — Careers`;
    const description = job.seo?.meta_description || job.summary || `Apply for ${job.title}.`;
    return {
        title,
        description,
        alternates: { canonical: `/jobs/${slug}` },
        openGraph: { title, description, url: `${SITE}/jobs/${slug}`, type: 'website', ...(job.seo?.og_image ? { images: [job.seo.og_image] } : {}) },
    };
}

function fmtDeadline(value: string | null): string | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default async function JobDetailPage({ params, searchParams }: { params: Params; searchParams: Search }) {
    const { slug } = await params;
    const { tab } = await searchParams;
    const data = await fetchDetail(slug).catch(() => null);
    if (!data) notFound();

    const job = data.job;
    const branding = data.branding;
    const isApply = tab === 'application';
    const comp = formatComp(job);
    const deadline = fmtDeadline(job.close_at);
    const limits = job.application_limits;

    const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description_md || job.summary || '',
        datePosted: job.published_at ?? undefined,
        validThrough: job.close_at ?? undefined,
        employmentType: job.employment_type ?? undefined,
        hiringOrganization: { '@type': 'Organization', name: 'Onward' },
        ...(job.location_type === 'remote'
            ? { applicantLocationRequirements: { '@type': 'Country', name: (job.locations[0] ?? 'Remote') } }
            : { jobLocation: { '@type': 'Place', address: job.locations[0] ?? '' } }),
        ...(job.salary_min || job.salary_max
            ? { baseSalary: { '@type': 'MonetaryValue', currency: job.salary_currency, value: { '@type': 'QuantitativeValue', minValue: job.salary_min ?? undefined, maxValue: job.salary_max ?? undefined, unitText: (job.salary_interval || 'annual').toUpperCase() } } }
            : {}),
    };

    return (
        <div>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <Link href="/jobs" className={styles.backLink}>← All Jobs</Link>
            {branding?.company_name && (
                <div className={styles.brandBanner} style={branding.accent_color ? { borderColor: branding.accent_color } : undefined}>
                    {branding.logo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={branding.logo_url} alt={branding.company_name} className={styles.brandLogo} />
                    )}
                    <div>
                        <p className={styles.brandName}>{branding.company_name}</p>
                        {branding.tagline && <p className={styles.brandTagline}>{branding.tagline}</p>}
                    </div>
                </div>
            )}
            <h1 className={styles.detailTitle}>{job.title}</h1>

            <nav className={styles.tabs} aria-label="Job sections">
                <Link href={`/jobs/${slug}`} className={`${styles.tab} ${!isApply ? styles.tabActive : ''}`}>Overview</Link>
                <Link href={`/jobs/${slug}?tab=application`} className={`${styles.tab} ${isApply ? styles.tabActive : ''}`}>Application</Link>
            </nav>

            <div className={styles.detailLayout}>
                <aside className={styles.metaCol}>
                    <Meta k="Location" v={locationLabel(job)} />
                    {job.employment_type && <Meta k="Employment Type" v={job.employment_type.replace('_', ' ')} />}
                    {job.department && <Meta k="Department" v={job.department} />}
                    {deadline && <Meta k="Deadline to Apply" v={deadline} />}
                    {(comp || job.equity) && <Meta k="Compensation" v={[comp, job.equity, job.commission ? 'Commission' : ''].filter(Boolean).join(' · ')} />}
                </aside>

                <div>
                    {isApply ? (
                        <>
                            {limits && (
                                <p className={styles.limitNotice}>
                                    ⓘ This job has application limits{limits.max_per_60d ? ` (≤${limits.max_per_60d} applications / 60 days` : ''}{limits.no_reapply_days ? `; no re-apply within ${limits.no_reapply_days} days)` : limits.max_per_60d ? ')' : ''}.
                                </p>
                            )}
                            <ApplyForm slug={slug} fields={data.form.fields} />
                        </>
                    ) : (
                        <article>
                            {job.summary && <section className={styles.section}><p>{job.summary}</p></section>}
                            <ListSection title="Responsibilities" items={job.responsibilities} />
                            <ListSection title="Requirements" items={job.requirements} />
                            <ListSection title="Nice to have" items={job.nice_to_have} />
                            <ListSection title="Benefits" items={job.benefits} />
                            {branding?.about_html && (
                                <section className={styles.section}>
                                    <h2>About {branding.company_name ?? 'the company'}</h2>
                                    {/* rendered as escaped text (no raw HTML) to avoid stored XSS to visitors */}
                                    <p style={{ whiteSpace: 'pre-line' }}>{branding.about_html}</p>
                                </section>
                            )}
                            <div style={{ marginTop: 24 }}>
                                <Link href={`/jobs/${slug}?tab=application`} className={styles.submitBtn} style={{ display: 'inline-block', textDecoration: 'none' }}>Apply for this role</Link>
                            </div>
                        </article>
                    )}
                </div>
            </div>
        </div>
    );
}

function Meta({ k, v }: { k: string; v: string }) {
    return (
        <div className={styles.metaItem}>
            <span className={styles.metaKey}>{k}</span>
            <span className={styles.metaVal}>{v}</span>
        </div>
    );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
    if (!items || items.length === 0) return null;
    return (
        <section className={styles.section}>
            <h2>{title}</h2>
            <ul>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
        </section>
    );
}
