'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, TahoeSelect, TextField } from '@/components/ui/tahoe-ui';
import {
    type CheckSuggestion,
    type Job,
    type JobInput,
    checkPost,
    draftWithAI,
    formatComp,
} from '@/lib/jobs';
import styles from './job-form.module.css';

const linesToArray = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const csvToArray = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
const arrayToLines = (a?: string[] | null) => (a ?? []).join('\n');
const arrayToCsv = (a?: string[] | null) => (a ?? []).join(', ');

interface FormState {
    title: string; department: string; team: string;
    employment_type: string; location_type: string; experience_level: string;
    locations: string; summary: string;
    responsibilities: string; requirements: string; nice_to_have: string;
    skills_required: string; skills_preferred: string; benefits: string;
    salary_min: string; salary_max: string; salary_currency: string; salary_interval: string;
    equity: string; commission: boolean;
}

function fromJob(job?: Partial<Job> | null): FormState {
    return {
        title: job?.title ?? '',
        department: job?.department ?? '',
        team: job?.team ?? '',
        employment_type: job?.employment_type ?? '',
        location_type: job?.location_type ?? '',
        experience_level: job?.experience_level ?? '',
        locations: arrayToCsv(job?.locations),
        summary: job?.summary ?? '',
        responsibilities: arrayToLines(job?.responsibilities),
        requirements: arrayToLines(job?.requirements),
        nice_to_have: arrayToLines(job?.nice_to_have),
        skills_required: arrayToCsv(job?.skills_required),
        skills_preferred: arrayToCsv(job?.skills_preferred),
        benefits: arrayToCsv(job?.benefits),
        salary_min: job?.salary_min != null ? String(job.salary_min) : '',
        salary_max: job?.salary_max != null ? String(job.salary_max) : '',
        salary_currency: job?.salary_currency ?? 'USD',
        salary_interval: job?.salary_interval ?? 'annual',
        equity: job?.equity ?? '',
        commission: Boolean(job?.commission),
    };
}

function toInput(f: FormState): JobInput {
    const num = (s: string) => (s.trim() === '' ? null : Number(s));
    return {
        title: f.title.trim(),
        department: f.department.trim() || null,
        team: f.team.trim() || null,
        employment_type: (f.employment_type || null) as JobInput['employment_type'],
        location_type: (f.location_type || null) as JobInput['location_type'],
        experience_level: (f.experience_level || null) as JobInput['experience_level'],
        locations: csvToArray(f.locations),
        summary: f.summary.trim() || null,
        responsibilities: linesToArray(f.responsibilities),
        requirements: linesToArray(f.requirements),
        nice_to_have: linesToArray(f.nice_to_have),
        skills_required: csvToArray(f.skills_required),
        skills_preferred: csvToArray(f.skills_preferred),
        benefits: csvToArray(f.benefits),
        salary_min: num(f.salary_min),
        salary_max: num(f.salary_max),
        salary_currency: f.salary_currency || 'USD',
        salary_interval: (f.salary_interval || 'annual') as JobInput['salary_interval'],
        equity: f.equity.trim() || null,
        commission: f.commission,
    };
}

/** Overlay an AI draft onto the current form, only for fields the model returned. */
function mergeDraft(prev: FormState, d: JobInput): FormState {
    const next = { ...prev };
    if (d.title) next.title = d.title;
    if (d.department) next.department = d.department;
    if (d.employment_type) next.employment_type = d.employment_type;
    if (d.location_type) next.location_type = d.location_type;
    if (d.experience_level) next.experience_level = d.experience_level;
    if (d.locations?.length) next.locations = arrayToCsv(d.locations);
    if (d.summary) next.summary = d.summary;
    if (d.responsibilities?.length) next.responsibilities = arrayToLines(d.responsibilities);
    if (d.requirements?.length) next.requirements = arrayToLines(d.requirements);
    if (d.nice_to_have?.length) next.nice_to_have = arrayToLines(d.nice_to_have);
    if (d.skills_required?.length) next.skills_required = arrayToCsv(d.skills_required);
    if (d.skills_preferred?.length) next.skills_preferred = arrayToCsv(d.skills_preferred);
    if (d.benefits?.length) next.benefits = arrayToCsv(d.benefits);
    if (d.salary_min != null) next.salary_min = String(d.salary_min);
    if (d.salary_max != null) next.salary_max = String(d.salary_max);
    return next;
}

export interface JobFormProps {
    jobId?: string;
    initial?: Partial<Job> | null;
    submitLabel: string;
    saving: boolean;
    error?: string;
    onSubmit: (values: JobInput) => void;
    headerExtra?: React.ReactNode;
}

export default function JobForm({ jobId, initial, submitLabel, saving, error, onSubmit, headerExtra }: JobFormProps) {
    const [form, setForm] = useState<FormState>(() => fromJob(initial));
    const initialRef = useRef<string>(JSON.stringify(fromJob(initial)));
    const [prompt, setPrompt] = useState('');
    const [drafting, setDrafting] = useState(false);
    const [aiError, setAiError] = useState('');
    const [checking, setChecking] = useState(false);
    const [suggestions, setSuggestions] = useState<CheckSuggestion[] | null>(null);
    const draftAbort = useRef<AbortController | null>(null);

    useEffect(() => {
        if (initial) {
            const seeded = fromJob(initial);
            setForm(seeded);
            initialRef.current = JSON.stringify(seeded);
        }
    }, [initial]);

    const dirty = JSON.stringify(form) !== initialRef.current;

    useEffect(() => {
        if (!dirty) return;
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const runDraft = useCallback(async () => {
        if (!prompt.trim()) return;
        setAiError('');
        setDrafting(true);
        draftAbort.current?.abort();
        const ctrl = new AbortController();
        draftAbort.current = ctrl;
        try {
            const draft = await draftWithAI(prompt.trim(), ctrl.signal);
            setForm((prev) => mergeDraft(prev, draft));
        } catch (e) {
            if (!ctrl.signal.aborted) setAiError(e instanceof Error ? e.message : 'AI drafting failed');
        } finally {
            if (draftAbort.current === ctrl) draftAbort.current = null;
            setDrafting(false);
        }
    }, [prompt]);

    const runCheck = useCallback(async () => {
        if (!jobId) return;
        setChecking(true);
        setSuggestions(null);
        try {
            setSuggestions(await checkPost(jobId));
        } catch (e) {
            setAiError(e instanceof Error ? e.message : 'Check failed');
        } finally {
            setChecking(false);
        }
    }, [jobId]);

    const previewComp = useMemo(
        () => formatComp({
            salary_min: form.salary_min ? Number(form.salary_min) : null,
            salary_max: form.salary_max ? Number(form.salary_max) : null,
            salary_currency: form.salary_currency, salary_interval: form.salary_interval as Job['salary_interval'],
        }),
        [form.salary_min, form.salary_max, form.salary_currency, form.salary_interval],
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        initialRef.current = JSON.stringify(form);
        onSubmit(toInput(form));
    };

    return (
        <form className={styles.layout} onSubmit={handleSubmit}>
            <div className={styles.formCol}>
                {/* Static top: edit-mode header + Draft-with-AI never scroll. */}
                <div className={styles.formStatic}>
                    {headerExtra}

                    <section className={styles.aiBox} aria-label="Draft with AI">
                        <label className={styles.aiLabel} htmlFor="ai-prompt">Draft with AI ✨</label>
                        <textarea
                            id="ai-prompt"
                            className={styles.textarea}
                            rows={2}
                            placeholder="e.g. Senior backend engineer, Go + Kafka, remote US/CA, $160–200k"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <div className={styles.aiRow}>
                            <Button type="button" variant="soft" onClick={runDraft} disabled={drafting || !prompt.trim()}>
                                {drafting ? 'Drafting…' : 'Draft with AI'}
                            </Button>
                            {drafting && (
                                <Button type="button" variant="ghost" onClick={() => draftAbort.current?.abort()}>Cancel</Button>
                            )}
                            {jobId && (
                                <Button type="button" variant="ghost" onClick={runCheck} disabled={checking}>
                                    {checking ? 'Checking…' : 'Check post 🔎'}
                                </Button>
                            )}
                        </div>
                        {aiError && <p className={styles.errorText}>{aiError}</p>}
                        {suggestions && (
                            <ul className={styles.suggestions}>
                                {suggestions.length === 0 && <li className={styles.suggestionOk}>No issues found 🎉</li>}
                                {suggestions.map((s, i) => (
                                    <li key={i} className={s.severity === 'warning' ? styles.suggestionWarn : styles.suggestionInfo}>
                                        <strong>{s.field ? `${s.field}: ` : ''}</strong>{s.issue}
                                        {s.suggestion ? <em> — {s.suggestion}</em> : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                {/* Scrollable region: only the fields (Title → Save) scroll. */}
                <div className={styles.scrollFields}>
                <Field label="Title" required>
                    <TextField.Root value={form.title} onChange={(e) => set('title', e.target.value)} required />
                </Field>
                <div className={styles.grid2}>
                    <Field label="Department">
                        <TextField.Root value={form.department} onChange={(e) => set('department', e.target.value)} />
                    </Field>
                    <Field label="Team">
                        <TextField.Root value={form.team} onChange={(e) => set('team', e.target.value)} />
                    </Field>
                </div>
                <div className={styles.grid3}>
                    <Field label="Employment type">
                        <TahoeSelect value={form.employment_type} onChange={(e) => set('employment_type', e.target.value)}>
                            <option value="">—</option>
                            {['full_time', 'part_time', 'contract', 'intern', 'temp'].map((v) => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
                        </TahoeSelect>
                    </Field>
                    <Field label="Location type">
                        <TahoeSelect value={form.location_type} onChange={(e) => set('location_type', e.target.value)}>
                            <option value="">—</option>
                            {['remote', 'hybrid', 'onsite'].map((v) => <option key={v} value={v}>{v}</option>)}
                        </TahoeSelect>
                    </Field>
                    <Field label="Experience level">
                        <TahoeSelect value={form.experience_level} onChange={(e) => set('experience_level', e.target.value)}>
                            <option value="">—</option>
                            {['intern', 'junior', 'mid', 'senior', 'lead', 'principal'].map((v) => <option key={v} value={v}>{v}</option>)}
                        </TahoeSelect>
                    </Field>
                </div>
                <Field label="Locations (comma-separated)">
                    <TextField.Root placeholder="Remote - US, Remote - Canada" value={form.locations} onChange={(e) => set('locations', e.target.value)} />
                </Field>
                <div className={styles.grid4}>
                    <Field label="Salary min">
                        <TextField.Root type="number" value={form.salary_min} onChange={(e) => set('salary_min', e.target.value)} />
                    </Field>
                    <Field label="Salary max">
                        <TextField.Root type="number" value={form.salary_max} onChange={(e) => set('salary_max', e.target.value)} />
                    </Field>
                    <Field label="Currency">
                        <TextField.Root value={form.salary_currency} onChange={(e) => set('salary_currency', e.target.value)} />
                    </Field>
                    <Field label="Interval">
                        <TahoeSelect value={form.salary_interval} onChange={(e) => set('salary_interval', e.target.value)}>
                            {['annual', 'monthly', 'hourly'].map((v) => <option key={v} value={v}>{v}</option>)}
                        </TahoeSelect>
                    </Field>
                </div>
                <Field label="Summary">
                    <textarea className={styles.textarea} rows={3} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
                </Field>
                <Field label="Responsibilities (one per line)">
                    <textarea className={styles.textarea} rows={4} value={form.responsibilities} onChange={(e) => set('responsibilities', e.target.value)} />
                </Field>
                <Field label="Requirements (one per line)">
                    <textarea className={styles.textarea} rows={4} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} />
                </Field>
                <Field label="Nice to have (one per line)">
                    <textarea className={styles.textarea} rows={3} value={form.nice_to_have} onChange={(e) => set('nice_to_have', e.target.value)} />
                </Field>
                <div className={styles.grid2}>
                    <Field label="Required skills (comma-separated)">
                        <TextField.Root value={form.skills_required} onChange={(e) => set('skills_required', e.target.value)} />
                    </Field>
                    <Field label="Preferred skills (comma-separated)">
                        <TextField.Root value={form.skills_preferred} onChange={(e) => set('skills_preferred', e.target.value)} />
                    </Field>
                </div>
                <Field label="Benefits (comma-separated)">
                    <TextField.Root value={form.benefits} onChange={(e) => set('benefits', e.target.value)} />
                </Field>
                <div className={styles.grid2}>
                    <Field label="Equity">
                        <TextField.Root value={form.equity} onChange={(e) => set('equity', e.target.value)} />
                    </Field>
                    <label className={styles.checkRow}>
                        <input type="checkbox" checked={form.commission} onChange={(e) => set('commission', e.target.checked)} />
                        Offers commission
                    </label>
                </div>

                {error && <p className={styles.errorText} role="alert">{error}</p>}
                <div className={styles.actions}>
                    <Button type="submit" size="3" disabled={saving || !form.title.trim()}>{saving ? 'Saving…' : submitLabel}</Button>
                    {dirty && <span className={styles.dirtyHint}>Unsaved changes</span>}
                </div>
                </div>
            </div>

            <aside className={styles.previewCol} aria-label="Live preview">
                <div className={styles.previewCard}>
                    <h2 className={styles.previewTitle}>{form.title || 'Untitled role'}</h2>
                    <p className={styles.previewMeta}>
                        {[form.location_type, form.employment_type?.replace('_', ' '), form.department].filter(Boolean).join(' · ') || '—'}
                    </p>
                    {(previewComp || form.equity) && (
                        <p className={styles.previewComp}>{[previewComp, form.equity, form.commission ? 'Commission' : ''].filter(Boolean).join(' · ')}</p>
                    )}
                    {form.summary && <><h3 className={styles.previewH3}>Summary</h3><p className={styles.previewBody}>{form.summary}</p></>}
                    <PreviewList title="Responsibilities" text={form.responsibilities} />
                    <PreviewList title="Requirements" text={form.requirements} />
                    <PreviewList title="Nice to have" text={form.nice_to_have} />
                </div>
            </aside>
        </form>
    );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className={styles.field}>
            <span className={styles.label}>{label}{required && <span className={styles.req}> *</span>}</span>
            {children}
        </div>
    );
}

function PreviewList({ title, text }: { title: string; text: string }) {
    const items = linesToArray(text);
    if (items.length === 0) return null;
    return (
        <>
            <h3 className={styles.previewH3}>{title}</h3>
            <ul className={styles.previewUl}>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
        </>
    );
}
