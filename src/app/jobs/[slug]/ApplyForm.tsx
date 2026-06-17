'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { FormFieldDef } from '@/lib/jobs';
import styles from '../public.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Values = Record<string, string | string[] | boolean>;

export default function ApplyForm({ slug, fields }: { slug: string; fields: FormFieldDef[] }) {
    const router = useRouter();
    const [values, setValues] = useState<Values>({});
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fileFieldId = useMemo(() => fields.find((f) => f.type === 'file')?.id ?? 'resume', [fields]);

    const set = (id: string, v: Values[string]) => setValues((prev) => ({ ...prev, [id]: v }));

    const validateRequired = (): string | null => {
        for (const f of fields) {
            if (!f.required || f.type === 'section_header') continue;
            if (f.type === 'file') { if (!file) return `${f.label} is required`; continue; }
            const v = values[f.id];
            const empty = v === undefined || v === '' || v === false || (Array.isArray(v) && v.length === 0);
            if (empty) return `${f.label} is required`;
        }
        return null;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const missing = validateRequired();
        if (missing) { setError(missing); return; }
        if (!file) { setError('Please attach your resume.'); return; }

        setSubmitting(true);
        try {
            const email = String(values['email'] ?? '').trim();
            const answers: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(values)) if (k !== 'email') answers[k] = v;

            const fd = new FormData();
            fd.append('resume', file);
            fd.append('email', email);
            fd.append('answers', JSON.stringify(answers));

            const res = await fetch(`${API}/api/public/jobs/${encodeURIComponent(slug)}/apply`, { method: 'POST', body: fd });
            if (!res.ok) {
                let detail = `Submission failed (${res.status})`;
                try { const j = await res.json(); if (j.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail); } catch { /* keep default */ }
                throw new Error(detail);
            }
            const data = await res.json();
            router.push(`/jobs/applied/${data.status_token}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <form className={styles.applyForm} onSubmit={onSubmit} noValidate>
            {fields.map((f) => (
                <FieldInput key={f.id} field={f} values={values} set={set} fileFieldId={fileFieldId} setFile={setFile} />
            ))}
            {error && <p className={styles.formError} role="alert">{error}</p>}
            <button className={styles.submitBtn} type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
        </form>
    );
}

function FieldInput({
    field, values, set, fileFieldId, setFile,
}: {
    field: FormFieldDef;
    values: Values;
    set: (id: string, v: Values[string]) => void;
    fileFieldId: string;
    setFile: (f: File | null) => void;
}) {
    const f = field;
    if (f.type === 'section_header') return <h3 className={styles.sectionHeader}>{f.label}</h3>;

    const label = (
        <span className={styles.fieldLabel}>{f.label}{f.required && <span className={styles.req}> *</span>}</span>
    );
    const help = f.help_text ? <span className={styles.help}>{f.help_text}</span> : null;
    const val = values[f.id];

    let control: React.ReactNode;
    switch (f.type) {
        case 'file':
            control = (
                <div className={styles.fileDrop}>
                    <input type="file" accept=".pdf,.doc,.docx,.rtf,.txt" onChange={(e) => { setFile(e.target.files?.[0] ?? null); if (f.id !== fileFieldId) return; }} required={f.required} aria-label={f.label} />
                </div>
            );
            break;
        case 'textarea':
            control = <textarea className={styles.textarea} value={String(val ?? '')} onChange={(e) => set(f.id, e.target.value)} required={f.required} />;
            break;
        case 'select':
            control = (
                <select className={styles.select} value={String(val ?? '')} onChange={(e) => set(f.id, e.target.value)} required={f.required}>
                    <option value="">Select…</option>
                    {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
            );
            break;
        case 'radio':
            control = (
                <div className={styles.radioGroup} role="radiogroup" aria-label={f.label}>
                    {(f.options ?? []).map((o) => (
                        <label key={o} className={styles.radioRow}>
                            <input type="radio" name={f.id} checked={val === o} onChange={() => set(f.id, o)} /> {o}
                        </label>
                    ))}
                </div>
            );
            break;
        case 'yes_no':
            control = (
                <div className={styles.radioGroup} role="radiogroup" aria-label={f.label}>
                    {['Yes', 'No'].map((o) => (
                        <label key={o} className={styles.radioRow}>
                            <input type="radio" name={f.id} checked={val === o} onChange={() => set(f.id, o)} /> {o}
                        </label>
                    ))}
                </div>
            );
            break;
        case 'multiselect':
            control = (
                <div className={styles.radioGroup}>
                    {(f.options ?? []).map((o) => {
                        const arr = Array.isArray(val) ? val : [];
                        return (
                            <label key={o} className={styles.radioRow}>
                                <input
                                    type="checkbox"
                                    checked={arr.includes(o)}
                                    onChange={(e) => set(f.id, e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))}
                                /> {o}
                            </label>
                        );
                    })}
                </div>
            );
            break;
        case 'consent':
            control = (
                <label className={styles.radioRow}>
                    <input type="checkbox" checked={val === true} onChange={(e) => set(f.id, e.target.checked)} required={f.required} /> {f.help_text || 'I agree'}
                </label>
            );
            break;
        default:
            control = (
                <input
                    className={styles.input}
                    type={f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : f.type === 'phone' ? 'tel' : 'text'}
                    value={String(val ?? '')}
                    onChange={(e) => set(f.id, e.target.value)}
                    placeholder={f.placeholder ?? ''}
                    required={f.required}
                />
            );
    }

    return (
        <div className={styles.field}>
            {f.type !== 'consent' && label}
            {f.type !== 'consent' && help}
            {control}
        </div>
    );
}
