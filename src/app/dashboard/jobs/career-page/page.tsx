'use client';

import { useEffect, useState } from 'react';
import { Button, TextField } from '@/components/ui/tahoe-ui';
import { ApiError } from '@/lib/api';
import {
    type Branding,
    type JobsSettings,
    getBranding,
    getJobsSettings,
    putBranding,
    putJobsSettings,
} from '@/lib/jobs';
import JobsBreadcrumb from '../_components/JobsBreadcrumb';
import shared from '../_components/jobs-shared.module.css';
import styles from '../settings/settings.module.css';

const DEFAULT_WEIGHTS = { semantic: 0.5, structured: 0.3, llm: 0.2 };

export default function OrganizationPage() {
    // Career-page branding
    const [b, setB] = useState<Branding>({});
    const [savingB, setSavingB] = useState(false);
    const [msgB, setMsgB] = useState('');
    const [errB, setErrB] = useState('');
    // Candidate-handling settings
    const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
    const [reasons, setReasons] = useState('');
    const [limit, setLimit] = useState('');
    const [savingS, setSavingS] = useState(false);
    const [msgS, setMsgS] = useState('');
    const [errS, setErrS] = useState('');

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([getBranding(), getJobsSettings()]).then(([rb, rs]) => {
            if (rb.status === 'fulfilled') setB(rb.value);
            if (rs.status === 'fulfilled') {
                const s = rs.value;
                if (s.ranking_weights) setWeights(s.ranking_weights);
                setReasons((s.rejection_reasons ?? []).join('\n'));
                setLimit(s.application_limit_per_email != null ? String(s.application_limit_per_email) : '');
            }
        }).finally(() => setLoading(false));
    }, []);

    const sum = weights.semantic + weights.structured + weights.llm;
    const setField = (k: keyof Branding) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setB((prev) => ({ ...prev, [k]: e.target.value }));
    const setW = (k: keyof typeof weights) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setWeights((prev) => ({ ...prev, [k]: Number(e.target.value) }));

    const saveBranding = async () => {
        setSavingB(true); setMsgB(''); setErrB('');
        try {
            setB(await putBranding(b));
            setMsgB('Saved — your public job pages are updated.');
        } catch (e) {
            setErrB(e instanceof Error ? e.message : 'Save failed');
        } finally { setSavingB(false); }
    };

    const saveSettings = async () => {
        setSavingS(true); setMsgS(''); setErrS('');
        try {
            const payload: JobsSettings = {
                ranking_weights: weights,
                rejection_reasons: reasons.split('\n').map((r) => r.trim()).filter(Boolean),
                application_limit_per_email: limit ? Number(limit) : null,
            };
            const saved = await putJobsSettings(payload);
            if (saved.ranking_weights) setWeights(saved.ranking_weights);
            setMsgS('Saved. New candidates use these weights; use a job\'s “Re-rank” to apply to existing applicants.');
        } catch (e) {
            setErrS(e instanceof ApiError && e.status === 422 ? 'Ranking weights must sum to a positive value.' : (e instanceof Error ? e.message : 'Save failed'));
        } finally { setSavingS(false); }
    };

    if (loading) return <div className={shared.page}><div className={shared.loading}>Loading…</div></div>;

    return (
        <div className={shared.page}>
            <JobsBreadcrumb items={[{ label: 'Organization' }]} />
            <p className={shared.subtle}>Your public career-page branding and candidate-handling settings.</p>

            <div className={styles.grid}>
                {/* ── Career page (branding) ── */}
                <div className={shared.card}>
                    <p className={shared.sectionLabel}>Career page</p>
                    <p className={styles.cardHint}>Shown on your public job postings at /jobs.</p>
                    <div className={styles.field}><span className={styles.fieldLabel}>Company name</span>
                        <TextField.Root value={b.company_name ?? ''} onChange={setField('company_name')} maxLength={120} />
                    </div>
                    <div className={styles.field}><span className={styles.fieldLabel}>Tagline</span>
                        <TextField.Root value={b.tagline ?? ''} onChange={setField('tagline')} maxLength={240} />
                    </div>
                    <div className={styles.field}><span className={styles.fieldLabel}>Logo URL</span>
                        <TextField.Root value={b.logo_url ?? ''} onChange={setField('logo_url')} placeholder="https://…" maxLength={2048} />
                    </div>
                    <div className={styles.field}><span className={styles.fieldLabel}>Accent color</span>
                        <span className={styles.colorRow}>
                            <input type="color" value={b.accent_color || '#ff682c'} onChange={setField('accent_color')} aria-label="Accent color" />
                            <TextField.Root rootClassName={shared.grow} value={b.accent_color ?? ''} onChange={setField('accent_color')} placeholder="#ff682c" maxLength={9} />
                        </span>
                    </div>
                    <div className={styles.field}><span className={styles.fieldLabel}>About</span>
                        <textarea className={styles.textarea} rows={5} value={b.about_html ?? ''} onChange={setField('about_html')} maxLength={20000}
                            placeholder="A short description of your company shown on job pages." />
                    </div>
                    <div className={styles.actions}>
                        <Button size="3" onClick={saveBranding} disabled={savingB}>{savingB ? 'Saving…' : 'Save branding'}</Button>
                        {msgB && <span className={shared.ok}>{msgB}</span>}
                        {errB && <span className={shared.error}>{errB}</span>}
                    </div>
                </div>

                {/* ── Candidate settings (ranking + rejection + limits) ── */}
                <div className={shared.card}>
                    <p className={shared.sectionLabel}>Candidate ranking</p>
                    <p className={styles.cardHint}>How match % blends the three signals. They are normalized, so only the ratio matters.</p>
                    <div className={styles.weights}>
                        {(['semantic', 'structured', 'llm'] as const).map((k) => (
                            <label key={k} className={styles.weightField}>
                                <span className={styles.weightName}>{k} <span className={styles.weightPct}>{sum > 0 ? `${Math.round((weights[k] / sum) * 100)}%` : '—'}</span></span>
                                <input type="range" min={0} max={1} step={0.05} value={weights[k]} onChange={setW(k)} aria-label={`${k} weight`} />
                                <input className={styles.numInput} type="number" min={0} max={1} step={0.05} value={weights[k]} onChange={setW(k)} />
                            </label>
                        ))}
                    </div>
                    {sum <= 0 && <p className={shared.error}>Weights must sum to a positive value.</p>}

                    <p className={shared.sectionLabel} style={{ marginTop: 10 }}>Rejection reasons</p>
                    <p className={styles.cardHint}>One per line — offered when rejecting a candidate.</p>
                    <textarea className={styles.textarea} rows={3} value={reasons} onChange={(e) => setReasons(e.target.value)} placeholder={'Not enough experience\nLocation mismatch'} />

                    <p className={shared.sectionLabel} style={{ marginTop: 10 }}>Application limit</p>
                    <div className={styles.field}><span className={styles.fieldLabel}>Max applications per email address (blank = default)</span>
                        <TextField.Root rootClassName={styles.numField} type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(e.target.value)} />
                    </div>

                    <div className={styles.actions}>
                        <Button size="3" onClick={saveSettings} disabled={savingS || sum <= 0}>{savingS ? 'Saving…' : 'Save settings'}</Button>
                        {msgS && <span className={shared.ok}>{msgS}</span>}
                        {errS && <span className={shared.error}>{errS}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
