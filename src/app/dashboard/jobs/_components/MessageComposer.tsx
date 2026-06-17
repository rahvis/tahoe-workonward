'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Callout, TextField } from '@/components/ui/tahoe-ui';
import { ApiError } from '@/lib/api';
import { type SentEmail, draftMessage, listMessages, sendMessage } from '@/lib/jobs';
import shared from './jobs-shared.module.css';
import styles from '../messages/messages.module.css';

const STATUS_COLOR: Record<string, string> = {
    sent: 'green', queued: 'amber', failed: 'red', skipped_unsubscribed: 'red',
};

/**
 * Compose + sent-history for a single candidate. Reusable so it works both as the
 * standalone Messages page and inside the candidate "Open Messages" modal.
 */
export default function MessageComposer({
    candidateId, applicationId, jobId, onSent,
}: {
    candidateId: string;
    applicationId?: string;
    jobId?: string;
    onSent?: () => void;
}) {
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
            setNotice('✓ Email sent — replies will go to your mailbox.');
            setSubject(''); setBody(''); setIntent('');
            idemKey.current = crypto.randomUUID();  // fresh key for the next message
            reloadLog();
            onSent?.();
        } catch (e) {
            if (e instanceof ApiError && e.status === 409) setError('This candidate has unsubscribed.');
            else setError(e instanceof Error ? e.message : 'Send failed');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Callout.Root>
                <Callout.Text>
                    ✉️ <strong>Send-only.</strong> Tahoe sends from a platform address with <em>Reply-To</em> set to your real email — replies land in your own mailbox. There is no inbox here.
                </Callout.Text>
            </Callout.Root>

            <div className={styles.grid}>
                <section className={shared.card}>
                    <p className={shared.sectionLabel}>Compose</p>
                    <div className={styles.draftRow}>
                        <TextField.Root rootClassName={shared.grow} placeholder="What's this email about? (AI draft)" value={intent} onChange={(e) => setIntent(e.target.value)} />
                        <Button variant="soft" onClick={draft} disabled={drafting || intent.trim().length < 2}>{drafting ? 'Drafting…' : 'Draft with AI'}</Button>
                    </div>
                    <TextField.Root placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    <textarea className={styles.textarea} rows={10} placeholder="Write your message…" value={body} onChange={(e) => setBody(e.target.value)} />
                    <div className={styles.actions}>
                        <Button size="3" onClick={send} disabled={sending || !subject.trim() || !body.trim()}>{sending ? 'Sending…' : 'Send'}</Button>
                        {notice && <span className={shared.ok}>{notice}</span>}
                        {error && <span className={shared.error}>{error}</span>}
                    </div>
                </section>

                <section className={shared.card}>
                    <p className={shared.sectionLabel}>Sent history</p>
                    {log.length === 0 ? (
                        <p className={shared.subtle}>No messages sent yet.</p>
                    ) : (
                        <ul className={styles.log}>
                            {log.map((m) => (
                                <li key={m.id} className={styles.logItem}>
                                    <div className={styles.logTop}>
                                        <span className={styles.logSubject}>{m.subject}</span>
                                        <Badge variant="soft" color={STATUS_COLOR[m.status ?? 'sent'] ?? 'gray'}>{m.status}</Badge>
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
        </>
    );
}
