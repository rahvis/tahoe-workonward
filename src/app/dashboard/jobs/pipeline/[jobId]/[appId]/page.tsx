'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/tahoe-ui';
import { ApiError } from '@/lib/api';
import {
    type Activity,
    type ApplicationDetail,
    type ApplicationStatus,
    type Note,
    type PipelineStage,
    type Scorecard,
    addNote,
    addScorecard,
    getApplicationDetail,
    getResumeUrl,
    listActivity,
    listNotes,
    listScorecards,
    listStages,
    patchApplication,
    patchProfile,
} from '@/lib/jobs';
import styles from '../../pipeline.module.css';

type Tab = 'profile' | 'resume' | 'match' | 'notes' | 'scorecard' | 'activity' | 'email';
const TABS: Tab[] = ['profile', 'resume', 'match', 'notes', 'scorecard', 'activity', 'email'];
const STATUSES: ApplicationStatus[] = ['new', 'in_review', 'advanced', 'rejected', 'hired', 'withdrawn'];

export default function CandidateDetailPage() {
    const { jobId, appId } = useParams<{ jobId: string; appId: string }>();
    const [detail, setDetail] = useState<ApplicationDetail | null>(null);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [tab, setTab] = useState<Tab>('profile');
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const [d, st] = await Promise.all([getApplicationDetail(appId), listStages(jobId)]);
            setDetail(d);
            setStages(st);
            setError('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load candidate');
        }
    }, [appId, jobId]);

    // Load on mount; setState happens after the await (not synchronously in the effect).
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const [d, st] = await Promise.all([getApplicationDetail(appId), listStages(jobId)]);
                if (active) { setDetail(d); setStages(st); setError(''); }
            } catch (e) {
                if (active) setError(e instanceof Error ? e.message : 'Failed to load candidate');
            }
        })();
        return () => { active = false; };
    }, [appId, jobId]);

    const patchApp = async (changes: { stage_id?: string; status?: ApplicationStatus }) => {
        if (!detail) return;
        try {
            const updated = await patchApplication(appId, detail.application.updated_at, changes);
            setDetail({ ...detail, application: { ...detail.application, ...updated } });
        } catch (e) {
            if (e instanceof ApiError && e.status === 409) { setError('Changed elsewhere — reloading.'); load(); }
            else setError(e instanceof Error ? e.message : 'Update failed');
        }
    };

    if (error && !detail) return <div className={styles.page}><p className={styles.error}>{error}</p></div>;
    if (!detail) return <div className={styles.page}><div className={styles.loading}>Loading…</div></div>;

    const { application, candidate, score } = detail;

    return (
        <div className={styles.page}>
            <p className={styles.breadcrumb}>
                <Link href="/dashboard/jobs/pipeline">Candidates</Link> ›{' '}
                <Link href={`/dashboard/jobs/pipeline/${jobId}`}>Pipeline</Link> › {candidate?.full_name || candidate?.email}
            </p>

            <header className={styles.detailHeader}>
                <div>
                    <h1 className={styles.title}>{candidate?.full_name || candidate?.email}</h1>
                    <p className={styles.subtle}>{candidate?.email}{candidate?.location ? ` · ${candidate.location}` : ''}</p>
                </div>
                <div className={styles.detailControls}>
                    <span className={styles.matchBig}>{score?.match_pct != null ? `${Math.round(score.match_pct)}%` : '—'}</span>
                    <label>Stage{' '}
                        <select className={styles.select} value={application.stage_id ?? ''} onChange={(e) => patchApp({ stage_id: e.target.value })}>
                            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </label>
                    <label>Status{' '}
                        <select className={styles.select} value={application.status} onChange={(e) => patchApp({ status: e.target.value as ApplicationStatus })}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                    </label>
                </div>
            </header>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <nav className={styles.tabs} aria-label="Candidate sections">
                {TABS.map((t) => (
                    <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
                        {t[0].toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </nav>

            <div className={styles.panel}>
                {tab === 'profile' && <ProfileTab detail={detail} appId={appId} onSaved={load} />}
                {tab === 'resume' && <ResumeTab appId={appId} filename={application.resume_filename} parseStatus={application.parse_status} />}
                {tab === 'match' && <MatchTab score={score} />}
                {tab === 'notes' && <NotesTab appId={appId} />}
                {tab === 'scorecard' && <ScorecardTab appId={appId} />}
                {tab === 'activity' && <ActivityTab appId={appId} />}
                {tab === 'email' && (
                    <p className={styles.subtle}>
                        Send-only candidate email. <Link
                            href={`/dashboard/jobs/messages?candidate_id=${candidate?.id ?? ''}&application_id=${application.id}&job_id=${jobId}&email=${encodeURIComponent(candidate?.email ?? '')}&name=${encodeURIComponent(candidate?.full_name ?? '')}`}
                        >Open Messages →</Link> Replies go to your real mailbox.
                    </p>
                )}
            </div>
        </div>
    );
}

function ProfileTab({ detail, appId, onSaved }: { detail: ApplicationDetail; appId: string; onSaved: () => void }) {
    const profile = (detail.profile ?? {}) as Record<string, unknown>;
    const [summary, setSummary] = useState(String(profile.summary ?? ''));
    const [skills, setSkills] = useState((Array.isArray(profile.skills) ? profile.skills as string[] : []).join(', '));
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const experience = Array.isArray(profile.experience) ? profile.experience as Array<Record<string, unknown>> : [];
    const education = Array.isArray(profile.education) ? profile.education as Array<Record<string, unknown>> : [];

    const save = async () => {
        setSaving(true); setMsg('');
        try {
            const next = { ...profile, summary, skills: skills.split(',').map((s) => s.trim()).filter(Boolean) };
            await patchProfile(appId, detail.profile_updated_at ?? '', next);
            setMsg('Saved'); onSaved();
        } catch (e) {
            setMsg(e instanceof ApiError && e.status === 409 ? 'Changed elsewhere — reload and retry' : (e instanceof Error ? e.message : 'Save failed'));
        } finally { setSaving(false); }
    };

    return (
        <div className={styles.tabBody}>
            <label className={styles.fieldLabel}>Summary</label>
            <textarea className={styles.textarea} rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
            <label className={styles.fieldLabel}>Skills (comma-separated)</label>
            <input className={styles.select} style={{ width: '100%' }} value={skills} onChange={(e) => setSkills(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
                {msg && <span className={styles.subtle}>{msg}</span>}
            </div>

            {experience.length > 0 && <><h3 className={styles.sectionH}>Experience</h3><ul className={styles.list}>
                {experience.map((e, i) => <li key={i}><strong>{String(e.title ?? '')}</strong>{e.company ? ` @ ${String(e.company)}` : ''}</li>)}
            </ul></>}
            {education.length > 0 && <><h3 className={styles.sectionH}>Education</h3><ul className={styles.list}>
                {education.map((e, i) => <li key={i}>{String(e.degree ?? '')} — {String(e.institution ?? '')}</li>)}
            </ul></>}
        </div>
    );
}

function ResumeTab({ appId, filename, parseStatus }: { appId: string; filename: string | null; parseStatus: string }) {
    const [error, setError] = useState('');
    const open = async () => {
        setError('');
        try { const { url } = await getResumeUrl(appId); window.open(url, '_blank', 'noopener'); }
        catch (e) { setError(e instanceof Error ? e.message : 'Could not open resume'); }
    };
    return (
        <div className={styles.tabBody}>
            <p className={styles.subtle}>{filename || 'resume'} · parse status: {parseStatus}</p>
            <Button variant="soft" onClick={open}>Open original resume ↗</Button>
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
}

function MatchTab({ score }: { score: ApplicationDetail['score'] }) {
    if (!score) return <p className={styles.subtle}>Not scored yet.</p>;
    return (
        <div className={styles.tabBody}>
            <p className={styles.matchLine}>
                Match <strong>{score.match_pct != null ? `${Math.round(score.match_pct)}%` : '—'}</strong>
                {' · '}semantic {fmt(score.semantic_score)} · structured {fmt(score.structured_score)} · llm {fmt(score.llm_score)}
            </p>
            {(score.rationale ?? []).map((r, i) => (
                <div key={i} className={styles.rationale}>
                    <span className={styles.rcrit}>{r.criterion}</span> — {r.evidence} <span className={styles.muted}>[{r.confidence}]</span>
                </div>
            ))}
            {score.gaps.length > 0 && <p className={styles.subtle}>Gaps: {score.gaps.join(', ')}</p>}
        </div>
    );
}

function NotesTab({ appId }: { appId: string }) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const reload = useCallback(() => listNotes(appId).then(setNotes).catch(() => undefined), [appId]);
    useEffect(() => { reload(); }, [reload]);
    const add = async () => {
        if (!body.trim()) return;
        setBusy(true);
        try { await addNote(appId, body.trim()); setBody(''); await reload(); } finally { setBusy(false); }
    };
    return (
        <div className={styles.tabBody}>
            <textarea className={styles.textarea} rows={2} placeholder="Add a private note…" value={body} onChange={(e) => setBody(e.target.value)} />
            <Button onClick={add} disabled={busy || !body.trim()}>Add note</Button>
            <ul className={styles.list}>
                {notes.map((n) => <li key={n.id}><span className={styles.muted}>{new Date(n.created_at).toLocaleString()}</span> — {n.body}</li>)}
            </ul>
        </div>
    );
}

function ScorecardTab({ appId }: { appId: string }) {
    const [cards, setCards] = useState<Scorecard[]>([]);
    const [overall, setOverall] = useState('yes');
    const [comment, setComment] = useState('');
    const reload = useCallback(() => listScorecards(appId).then(setCards).catch(() => undefined), [appId]);
    useEffect(() => { reload(); }, [reload]);
    const add = async () => { await addScorecard(appId, { overall, comment }); setComment(''); await reload(); };
    return (
        <div className={styles.tabBody}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className={styles.select} value={overall} onChange={(e) => setOverall(e.target.value)}>
                    {['strong_yes', 'yes', 'no', 'strong_no'].map((o) => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                </select>
                <input className={styles.select} style={{ flex: 1 }} placeholder="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
                <Button onClick={add}>Add</Button>
            </div>
            <ul className={styles.list}>
                {cards.map((c) => <li key={c.id}><strong>{c.overall}</strong> {c.comment ? `— ${c.comment}` : ''} <span className={styles.muted}>{new Date(c.created_at).toLocaleDateString()}</span></li>)}
            </ul>
        </div>
    );
}

function ActivityTab({ appId }: { appId: string }) {
    const [acts, setActs] = useState<Activity[]>([]);
    useEffect(() => { listActivity(appId).then(setActs).catch(() => undefined); }, [appId]);
    return (
        <ul className={styles.list}>
            {acts.length === 0 && <li className={styles.subtle}>No activity yet.</li>}
            {acts.map((a) => <li key={a.id}><span className={styles.muted}>{new Date(a.created_at).toLocaleString()}</span> — {a.kind}</li>)}
        </ul>
    );
}

function fmt(v: number | null): string { return v == null ? '—' : v.toFixed(2); }
