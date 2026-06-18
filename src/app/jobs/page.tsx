import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchBoard, formatComp, locationLabel } from '@/lib/public-jobs';
import FilterRail from './FilterRail';
import styles from './public.module.css';

export const metadata: Metadata = {
    title: 'Open Roles — Careers',
    description: 'Browse open roles and apply.',
    alternates: { canonical: '/jobs' },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(v: string | string[] | undefined): string | undefined {
    return Array.isArray(v) ? v[0] : v;
}

export default async function JobBoardPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams;
    const board = await fetchBoard({
        q: pick(sp.q),
        department: pick(sp.department),
        location_type: pick(sp.location_type),
        employment_type: pick(sp.employment_type),
    }).catch(() => ({ items: [], next_cursor: null }));

    const departments = Array.from(
        new Set(board.items.map((j) => j.department).filter((d): d is string => Boolean(d))),
    ).sort();

    return (
        <div>
            <div className={styles.boardHead}>
                <h1 className={styles.boardTitle}>Open Roles</h1>
                <p className={styles.boardCount}>{board.items.length} open role{board.items.length === 1 ? '' : 's'}</p>
            </div>
            <div className={styles.boardLayout}>
                <FilterRail departments={departments} />
                <div className={styles.cards}>
                    {board.items.length === 0 ? (
                        <div className={styles.empty}>No open roles match your filters right now.</div>
                    ) : (
                        board.items.map((job) => {
                            const comp = formatComp(job);
                            return (
                                <Link key={job.slug} href={`/jobs/${job.slug}`} className={styles.card}>
                                    <div className={styles.cardTop}>
                                        <h2 className={styles.cardTitle}>{job.title}</h2>
                                        {(job.logo_url || job.company_name) && (
                                            <span className={styles.cardEmployer}>
                                                {job.logo_url && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={job.logo_url} alt={job.company_name ?? 'Company logo'} className={styles.cardEmployerLogo} />
                                                )}
                                                {job.company_name && <span className={styles.cardEmployerName}>{job.company_name}</span>}
                                            </span>
                                        )}
                                    </div>
                                    <p className={styles.cardMeta}>{locationLabel(job)}{job.employment_type ? ` · ${job.employment_type.replace('_', ' ')}` : ''}</p>
                                    {(comp || job.equity) && (
                                        <p className={styles.cardComp}>{[comp, job.equity, job.commission ? 'Commission' : ''].filter(Boolean).join(' · ')}</p>
                                    )}
                                    {job.summary && <p className={styles.cardSummary}>{job.summary}</p>}
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
