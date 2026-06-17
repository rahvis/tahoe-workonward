'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TahoeSelect } from '@/components/ui/tahoe-ui';
import styles from './public.module.css';

const LOCATION_TYPES = ['remote', 'hybrid', 'onsite'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern', 'temp'];

export default function FilterRail({ departments }: { departments: string[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const [q, setQ] = useState(params.get('q') ?? '');

    const setParam = (key: string, value: string) => {
        const next = new URLSearchParams(params.toString());
        if (value) next.set(key, value); else next.delete(key);
        next.delete('cursor');
        router.push(`${pathname}?${next.toString()}`);
    };

    // debounce search → URL
    useEffect(() => {
        const handle = setTimeout(() => {
            if (q !== (params.get('q') ?? '')) setParam('q', q);
        }, 300);
        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    return (
        <aside className={styles.filters} aria-label="Filter jobs">
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel} htmlFor="job-search">Search</label>
                <input
                    id="job-search"
                    className={styles.filterInput}
                    type="search"
                    placeholder="Search roles…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>
            {departments.length > 0 && (
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel} htmlFor="f-dept">Department</label>
                    <TahoeSelect id="f-dept" value={params.get('department') ?? ''} onChange={(e) => setParam('department', e.target.value)}>
                        <option value="">All</option>
                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </TahoeSelect>
                </div>
            )}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel} htmlFor="f-loc">Location</label>
                <TahoeSelect id="f-loc" value={params.get('location_type') ?? ''} onChange={(e) => setParam('location_type', e.target.value)}>
                    <option value="">All</option>
                    {LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </TahoeSelect>
            </div>
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel} htmlFor="f-emp">Employment</label>
                <TahoeSelect id="f-emp" value={params.get('employment_type') ?? ''} onChange={(e) => setParam('employment_type', e.target.value)}>
                    <option value="">All</option>
                    {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </TahoeSelect>
            </div>
        </aside>
    );
}
