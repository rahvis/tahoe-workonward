'use client';

import { useEffect, useState } from 'react';
import { Button, TextField } from '@/components/ui/tahoe-ui';
import { type Branding, getBranding, putBranding } from '@/lib/jobs';
import JobsBreadcrumb from '../_components/JobsBreadcrumb';
import shared from '../_components/jobs-shared.module.css';
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

    if (loading) return <div className={shared.page}><div className={shared.loading}>Loading…</div></div>;

    return (
        <div className={shared.page}>
            <JobsBreadcrumb items={[{ label: 'Career Page' }]} />
            <p className={shared.subtle}>Shown on your public job postings at /jobs.</p>

            <div className={shared.card}>
                <div className={styles.field}><span className={styles.fieldLabel}>Company name</span>
                    <TextField.Root value={b.company_name ?? ''} onChange={set('company_name')} maxLength={120} />
                </div>
                <div className={styles.field}><span className={styles.fieldLabel}>Tagline</span>
                    <TextField.Root value={b.tagline ?? ''} onChange={set('tagline')} maxLength={240} />
                </div>
                <div className={styles.field}><span className={styles.fieldLabel}>Logo URL</span>
                    <TextField.Root value={b.logo_url ?? ''} onChange={set('logo_url')} placeholder="https://…" maxLength={2048} />
                </div>
                <div className={styles.field}><span className={styles.fieldLabel}>Accent color</span>
                    <span className={styles.colorRow}>
                        <input type="color" value={b.accent_color || '#ff682c'} onChange={set('accent_color')} aria-label="Accent color" />
                        <TextField.Root rootClassName={shared.grow} value={b.accent_color ?? ''} onChange={set('accent_color')} placeholder="#ff682c" maxLength={9} />
                    </span>
                </div>
                <div className={styles.field}><span className={styles.fieldLabel}>About</span>
                    <textarea className={styles.textarea} rows={6} value={b.about_html ?? ''} onChange={set('about_html')} maxLength={20000}
                        placeholder="A short description of your company shown on job pages." />
                </div>
                <div className={styles.actions}>
                    <Button size="3" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save branding'}</Button>
                    {msg && <span className={shared.ok}>{msg}</span>}
                    {error && <span className={shared.error}>{error}</span>}
                </div>
            </div>
        </div>
    );
}
