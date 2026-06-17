'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/tahoe-ui';
import { type Branding, getBranding, putBranding } from '@/lib/jobs';
import styles from '../settings/settings.module.css';

export default function CareerPagePage() {
    const [b, setB] = useState<Branding>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        getBranding().then(setB).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setSaving(true); setMsg(''); setError('');
        try {
            setB(await putBranding(b));
            setMsg('Saved — your public job pages are updated.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed');
        } finally { setSaving(false); }
    };

    const set = (k: keyof Branding) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setB((prev) => ({ ...prev, [k]: e.target.value }));

    if (loading) return <div className={styles.page}><div className={styles.loading}>Loading…</div></div>;

    return (
        <div className={styles.page}>
            <header className={styles.head}>
                <p className={styles.breadcrumb}>Jobs › Career Page</p>
                <h1 className={styles.title}>Career page & branding</h1>
                <p className={styles.subtle}>Shown on your public job postings at /jobs.</p>
            </header>

            <div className={styles.card}>
                <label className={styles.field}><span>Company name</span>
                    <input className={styles.input} value={b.company_name ?? ''} onChange={set('company_name')} maxLength={120} />
                </label>
                <label className={styles.field}><span>Tagline</span>
                    <input className={styles.input} value={b.tagline ?? ''} onChange={set('tagline')} maxLength={240} />
                </label>
                <label className={styles.field}><span>Logo URL</span>
                    <input className={styles.input} value={b.logo_url ?? ''} onChange={set('logo_url')} placeholder="https://…" maxLength={2048} />
                </label>
                <label className={styles.field}><span>Accent color</span>
                    <span className={styles.colorRow}>
                        <input type="color" value={b.accent_color || '#5b5bd6'} onChange={set('accent_color')} aria-label="Accent color" />
                        <input className={styles.input} value={b.accent_color ?? ''} onChange={set('accent_color')} placeholder="#5b5bd6" maxLength={9} />
                    </span>
                </label>
                <label className={styles.field}><span>About</span>
                    <textarea className={styles.textarea} rows={6} value={b.about_html ?? ''} onChange={set('about_html')} maxLength={20000}
                        placeholder="A short description of your company shown on job pages." />
                </label>
                <div className={styles.actions}>
                    <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save branding'}</Button>
                    {msg && <span className={styles.ok}>{msg}</span>}
                    {error && <span className={styles.error}>{error}</span>}
                </div>
            </div>
        </div>
    );
}
