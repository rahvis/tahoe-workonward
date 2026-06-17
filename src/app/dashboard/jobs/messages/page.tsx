'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/tahoe-ui';
import { ApiError } from '@/lib/api';
import { type SentEmail, draftMessage, listMessages, sendMessage } from '@/lib/jobs';
import styles from './messages.module.css';

function MessagesInner() {
    const params = useSearchParams();
    const candidateId = params.get('candidate_id') ?? '';
    const applicationId = params.get('application_id') ?? undefined;
    const jobId = params.get('job_id') ?? undefined;
    const email = params.get('email') ?? '';
    const name = params.get('name') ?? '';

    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [intent, setIntent] = useState('');
    const [log, setLog] = useState<SentEmail[]>([]);
    const [sending, setSending] = useState(false);
    const [drafting, setDrafting] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const idemKey = useRef<string>(crypto.randomUUID());

    const reloadLog = useCallback(() => {
        if (!candidateId) return;
        listMessages(candidateId).then((p) => setLog(p.items)).catch(() => undefined);
    }, [candidateId]);

    useEffect(() => { reloadLog(); }, [reloadLog]);

    const draft = async () => {
        if (intent.trim().length < 2) return;
        setDrafting(true);
        setError('');
        try {
            const d = await draftMessage(intent.trim(), candidateId || undefined, jobId);
            if (d.subject) setSubject(d.subject);
            if (d.body) setBody(d.body);
            if (!d.subject && !d.body) setNotice('AI draft unavailable (no model configured) — write your message.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Draft failed');
        } finally {
            setDrafting(false);
        }
    };

    const send = async () => {
        if (!candidateId || !subject.trim() || !body.trim()) return;
        setSending(true);
        setError('');
        setNotice('');
        try {
            await sendMessage({ candidate_id: candidateId, application_id: applicationId, subject: subject.trim(), body_text: body.trim(), idempotency_key: idemKey.current });
            setNotice('Sent. Replies will go to your mailbox.');
            setSubject(''); setBody(''); setIntent('');
            idemKey.current = crypto.randomUUID();  // fresh key for the next message
            reloadLog();
        } catch (e) {
            if (e instanceof ApiError && e.status === 409) setError('This candidate has unsubscribed.');
            else setError(e instanceof Error ? e.message : 'Send failed');
        } finally {
            setSending(false);
        }
    };

    if (!candidateId) {
        return (
            <div className={styles.page}>
                <h1 className={styles.title}>Messages</h1>
                <div className={styles.empty}>Open a candidate from the pipeline and use the <strong>Email</strong> tab to message them.</div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.head}>
                <p className={styles.breadcrumb}>Jobs › Messages</p>
                <h1 className={styles.title}>{name || email || 'Candidate'}</h1>
                <p className={styles.subtle}>{email}</p>
            </header>

            <div className={styles.notice}>
                ✉️ <strong>Send-only.</strong> Tahoe sends from a platform address with <em>Reply-To</em> set to your real email — replies land in your own mailbox. There is no inbox here.
            </div>

            <div className={styles.grid}>
                <section className={styles.compose}>
                    <h2 className={styles.sectionH}>Compose</h2>
                    <div className={styles.draftRow}>
                        <input className={styles.input} placeholder="What's this email about? (AI draft)" value={intent} onChange={(e) => setIntent(e.target.value)} />
                        <Button variant="soft" onClick={draft} disabled={drafting || intent.trim().length < 2}>{drafting ? 'Drafting…' : 'Draft with AI'}</Button>
                    </div>
                    <input className={styles.input} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    <textarea className={styles.textarea} rows={10} placeholder="Write your message…" value={body} onChange={(e) => setBody(e.target.value)} />
                    <div className={styles.actions}>
                        <Button onClick={send} disabled={sending || !subject.trim() || !body.trim()}>{sending ? 'Sending…' : 'Send'}</Button>
                        {notice && <span className={styles.ok}>{notice}</span>}
                        {error && <span className={styles.error}>{error}</span>}
                    </div>
                </section>

                <section className={styles.history}>
                    <h2 className={styles.sectionH}>Sent history</h2>
                    {log.length === 0 ? (
                        <p className={styles.subtle}>No messages sent yet.</p>
                    ) : (
                        <ul className={styles.log}>
                            {log.map((m) => (
                                <li key={m.id} className={styles.logItem}>
                                    <div className={styles.logTop}>
                                        <span className={styles.logSubject}>{m.subject}</span>
                                        <span className={`${styles.status} ${styles[`s_${m.status ?? 'sent'}`] ?? ''}`}>{m.status}</span>
                                    </div>
                                    <div className={styles.logMeta}>
                                        {m.scheduled_at && m.status === 'queued'
                                            ? `scheduled ${new Date(m.scheduled_at).toLocaleString()}`
                                            : m.sent_at ? new Date(m.sent_at).toLocaleString() : new Date(m.created_at).toLocaleString()}
                                        {m.sequence_id ? ' · sequence' : ''}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className={styles.page}><div className={styles.empty}>Loading…</div></div>}>
            <MessagesInner />
        </Suspense>
    );
}
