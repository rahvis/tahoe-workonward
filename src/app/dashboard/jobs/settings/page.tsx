'use client';

import { useEffect, useState } from 'react';
import { Button, TextField } from '@/components/ui/tahoe-ui';
import { ApiError } from '@/lib/api';
import { type JobsSettings, getJobsSettings, putJobsSettings } from '@/lib/jobs';
import JobsBreadcrumb from '../_components/JobsBreadcrumb';
import shared from '../_components/jobs-shared.module.css';
import styles from './settings.module.css';

const DEFAULT_WEIGHTS = { semantic: 0.5, structured: 0.3, llm: 0.2 };

export default function JobsSettingsPage() {
    const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
    const [reasons, setReasons] = useState('');
    const [limit, setLimit] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        getJobsSettings().then((s: JobsSettings) => {
            if (s.ranking_weights) setWeights(s.ranking_weights);
            setReasons((s.rejection_reasons ?? []).join('\n'));
            setLimit(s.application_limit_per_email != null ? String(s.application_limit_per_email) : '');
        }).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false));
    }, []);

    const sum = weights.semantic + weights.structured + weights.llm;

    const save = async () => {
        setSaving(true); setMsg(''); setError('');
        try {
            const payload: JobsSettings = {
                ranking_weights: weights,
                rejection_reasons: reasons.split('\n').map((r) => r.trim()).filter(Boolean),
                application_limit_per_email: limit ? Number(limit) : null,
            };
            const saved = await putJobsSettings(payload);
            if (saved.ranking_weights) setWeights(saved.ranking_weights);
            setMsg('Saved. New candidates use these weights; use a job\'s “Re-rank” to apply to existing applicants.');
        } catch (e) {
            setError(e instanceof ApiError && e.status === 422 ? 'Ranking weights must sum to a positive value.' : (e instanceof Error ? e.message : 'Save failed'));
        } finally { setSaving(false); }
    };

    const setW = (k: keyof typeof weights) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setWeights((prev) => ({ ...prev, [k]: Number(e.target.value) }));

    if (loading) return <div className={shared.page}><div className={shared.loading}>Loading…</div></div>;

    return (
        <div className={shared.page}>
            <JobsBreadcrumb items={[{ label: 'Settings' }]} />

            <div className={shared.card}>
                <p className={shared.sectionLabel}>Ranking weights</p>
                <p className={shared.subtle}>How match % blends the three signals. They are normalized, so only the ratio matters (sum must be &gt; 0).</p>
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

                <p className={shared.sectionLabel} style={{ marginTop: 8 }}>Rejection reasons</p>
                <p className={shared.subtle}>One per line — offered when rejecting a candidate.</p>
                <textarea className={styles.textarea} rows={4} value={reasons} onChange={(e) => setReasons(e.target.value)} placeholder={'Not enough experience\nLocation mismatch'} />

                <p className={shared.sectionLabel} style={{ marginTop: 8 }}>Application limit</p>
                <div className={styles.field}><span className={styles.fieldLabel}>Max applications per email address (blank = default)</span>
                    <TextField.Root rootClassName={styles.numField} type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(e.target.value)} />
                </div>

                <div className={styles.actions}>
                    <Button size="3" onClick={save} disabled={saving || sum <= 0}>{saving ? 'Saving…' : 'Save settings'}</Button>
                    {msg && <span className={shared.ok}>{msg}</span>}
                    {error && <span className={shared.error}>{error}</span>}
                </div>
            </div>
        </div>
    );
}
