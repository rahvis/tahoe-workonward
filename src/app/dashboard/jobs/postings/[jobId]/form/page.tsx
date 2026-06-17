'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button, TahoeSelect, TextField } from '@/components/ui/tahoe-ui';
import { ApiError } from '@/lib/api';
import {
    type FormFieldDef,
    type Job,
    getJob,
    getJobForm,
    putJobForm,
    updateJob,
} from '@/lib/jobs';
import {
    FIELD_TYPES,
    TYPES_WITH_OPTIONS,
    blankField,
    hasDiversity,
    moveField,
    normalizeFields,
    screeningQuestion,
    withDiversity,
    withoutDiversity,
} from './formFields';
import JobsBreadcrumb from '../../../_components/JobsBreadcrumb';
import shared from '../../../_components/jobs-shared.module.css';
import styles from './form.module.css';

interface Limits { enabled: boolean; maxPer60d: string; noReapplyDays: string; }

function limitsFromJob(job: Job | null): Limits {
    const al = (job?.application_limits ?? null) as { max_per_60d?: number; no_reapply_days?: number } | null;
    return {
        enabled: Boolean(al),
        maxPer60d: al?.max_per_60d != null ? String(al.max_per_60d) : '3',
        noReapplyDays: al?.no_reapply_days != null ? String(al.no_reapply_days) : '90',
    };
}

export default function FormBuilderPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const [job, setJob] = useState<Job | null>(null);
    const [fields, setFields] = useState<FormFieldDef[]>([]);
    const [limits, setLimits] = useState<Limits>({ enabled: false, maxPer60d: '3', noReapplyDays: '90' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [savedAt, setSavedAt] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [jobData, formData] = await Promise.all([getJob(jobId), getJobForm(jobId)]);
            setJob(jobData);
            setFields(normalizeFields(formData.fields));
            setLimits(limitsFromJob(jobData));
            setError('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load form');
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => { load(); }, [load]);

    const update = (index: number, patch: Partial<FormFieldDef>) =>
        setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));

    const save = async () => {
        setSaving(true);
        setError('');
        try {
            const normalized = normalizeFields(fields);
            await putJobForm(jobId, normalized);
            if (job) {
                const nextLimits = limits.enabled
                    ? { max_per_60d: Number(limits.maxPer60d) || 3, no_reapply_days: Number(limits.noReapplyDays) || 90 }
                    : null;
                const updated = await updateJob(jobId, job.updated_at, { application_limits: nextLimits });
                setJob(updated);
            }
            setFields(normalized);
            setSavedAt(new Date().toLocaleTimeString());
        } catch (e) {
            if (e instanceof ApiError && e.status === 409) {
                setError('The job changed elsewhere — reloaded. Re-apply and save again.');
                await load();
            } else {
                setError(e instanceof Error ? e.message : 'Failed to save form');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={shared.page}><div className={shared.loading}>Loading…</div></div>;

    return (
        <div className={shared.page}>
            <JobsBreadcrumb items={[
                { label: 'Job Postings', href: '/dashboard/jobs/postings' },
                { label: job?.title ?? 'Job', href: `/dashboard/jobs/postings/${jobId}/edit` },
                { label: 'Application form' },
            ]} />

            <div className={shared.toolbar}>
                <span className={shared.spacer} />
                {savedAt && <span className={shared.ok}>Saved {savedAt}</span>}
                <Button size="3" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save form'}</Button>
            </div>

            {error && <p className={shared.error} role="alert">{error}</p>}

            <div className={styles.layout}>
                <div className={styles.builder}>
                    <ul className={styles.fieldList}>
                        {fields.map((f, i) => (
                            <li key={f.id} className={styles.fieldRow}>
                                <div className={styles.reorder}>
                                    <button type="button" aria-label={`Move ${f.label} up`} disabled={i === 0} onClick={() => setFields(moveField(fields, i, -1))}>▲</button>
                                    <button type="button" aria-label={`Move ${f.label} down`} disabled={i === fields.length - 1} onClick={() => setFields(moveField(fields, i, 1))}>▼</button>
                                </div>
                                <div className={styles.fieldBody}>
                                    <div className={styles.fieldTop}>
                                        <TextField.Root rootClassName={styles.grow} aria-label="Field label" value={f.label} onChange={(e) => update(i, { label: e.target.value })} />
                                        <TahoeSelect aria-label="Field type" value={f.type} onChange={(e) => update(i, { type: e.target.value as FormFieldDef['type'] })}>
                                            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                        </TahoeSelect>
                                        <label className={styles.reqToggle}>
                                            <input type="checkbox" checked={f.required} onChange={(e) => update(i, { required: e.target.checked })} /> required
                                        </label>
                                        <Button type="button" variant="ghost" size="1" color="red" aria-label={`Remove ${f.label}`} onClick={() => setFields(normalizeFields(fields.filter((_, j) => j !== i)))}>✕</Button>
                                    </div>
                                    {TYPES_WITH_OPTIONS.includes(f.type) && (
                                        <TextField.Root
                                            aria-label="Options (comma-separated)"
                                            placeholder="Options, comma-separated"
                                            value={(f.options ?? []).join(', ')}
                                            onChange={(e) => update(i, { options: e.target.value.split(',').map((o) => o.trim()) })}
                                        />
                                    )}
                                    <TextField.Root aria-label="Help text" placeholder="Help text (optional)" value={f.help_text ?? ''} onChange={(e) => update(i, { help_text: e.target.value || null })} />
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className={styles.addRow}>
                        <Button variant="soft" onClick={() => setFields(normalizeFields([...fields, blankField()]))}>+ Add field</Button>
                        <Button variant="soft" onClick={() => setFields(normalizeFields([...fields, screeningQuestion()]))}>+ Screening question</Button>
                        <Button variant="ghost" onClick={() => setFields(hasDiversity(fields) ? withoutDiversity(fields) : withDiversity(fields))}>
                            {hasDiversity(fields) ? 'Remove diversity survey' : '+ Diversity survey'}
                        </Button>
                    </div>

                    <fieldset className={styles.limits}>
                        <legend>Application limits</legend>
                        <label className={styles.limitToggle}>
                            <input type="checkbox" checked={limits.enabled} onChange={(e) => setLimits({ ...limits, enabled: e.target.checked })} />
                            Show an application-limits notice on the public form
                        </label>
                        {limits.enabled && (
                            <div className={styles.limitGrid}>
                                <label className={styles.limitField}>Max applications / 60 days
                                    <TextField.Root type="number" value={limits.maxPer60d} onChange={(e) => setLimits({ ...limits, maxPer60d: e.target.value })} />
                                </label>
                                <label className={styles.limitField}>No re-apply within (days)
                                    <TextField.Root type="number" value={limits.noReapplyDays} onChange={(e) => setLimits({ ...limits, noReapplyDays: e.target.value })} />
                                </label>
                            </div>
                        )}
                    </fieldset>
                </div>

                <aside className={styles.preview} aria-label="Form preview">
                    <div className={styles.previewCard}>
                        <h2 className={styles.previewTitle}>Preview</h2>
                        {limits.enabled && (
                            <p className={styles.limitNotice}>ⓘ This job has application limits (≤{limits.maxPer60d}/60d; no re-apply {limits.noReapplyDays}d).</p>
                        )}
                        {fields.map((f) => <FieldPreview key={f.id} field={f} />)}
                    </div>
                </aside>
            </div>
        </div>
    );
}

function FieldPreview({ field }: { field: FormFieldDef }) {
    if (field.type === 'section_header') return <h3 className={styles.previewSection}>{field.label}</h3>;
    const label = <span className={styles.previewLabel}>{field.label}{field.required && <span className={styles.req}> *</span>}</span>;
    let control: React.ReactNode;
    switch (field.type) {
        case 'textarea': control = <textarea className={styles.previewInput} rows={2} disabled />; break;
        case 'file': control = <div className={styles.previewFile}>Upload file</div>; break;
        case 'yes_no': control = <div className={styles.previewRadios}><label><input type="radio" disabled /> Yes</label><label><input type="radio" disabled /> No</label></div>; break;
        case 'radio': control = <div className={styles.previewRadios}>{(field.options ?? []).map((o) => <label key={o}><input type="radio" disabled /> {o}</label>)}</div>; break;
        case 'multiselect': control = <div className={styles.previewRadios}>{(field.options ?? []).map((o) => <label key={o}><input type="checkbox" disabled /> {o}</label>)}</div>; break;
        case 'select': control = <select className={styles.previewInput} disabled>{(field.options ?? []).map((o) => <option key={o}>{o}</option>)}</select>; break;
        case 'consent': control = <label className={styles.previewConsent}><input type="checkbox" disabled /> {field.help_text || 'I agree'}</label>; break;
        default: control = <input className={styles.previewInput} disabled placeholder={field.placeholder ?? ''} />;
    }
    return (
        <div className={styles.previewField}>
            {label}
            {field.help_text && field.type !== 'consent' && <span className={styles.previewHelp}>{field.help_text}</span>}
            {control}
        </div>
    );
}
