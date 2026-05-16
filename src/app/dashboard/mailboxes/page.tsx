'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Card, Checkbox, Flex, TextField } from '@/components/ui/tahoe-ui';
import {
    disconnectMailbox,
    fetchMailboxConnectUrl,
    fetchMailboxes,
    sendMailboxTest,
    updateMailbox,
    type MailboxSendWindow,
    type MailboxSummary,
} from '@/lib/organization';
import styles from './mailboxes.module.css';

const WEEKDAY_OPTIONS = [
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
    { label: 'Sun', value: 7 },
];

function formatTimestamp(value?: string | null) {
    if (!value) return 'Not yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function statusClassName(status: MailboxSummary['status']) {
    if (status === 'healthy') return styles.statusHealthy;
    if (status === 'error') return styles.statusError;
    return styles.statusDisconnected;
}

function MailboxCard({
    mailbox,
    onRefresh,
}: {
    mailbox: MailboxSummary;
    onRefresh: () => Promise<void>;
}) {
    const [dailyCap, setDailyCap] = useState(String(mailbox.daily_cap));
    const [sendWindow, setSendWindow] = useState<MailboxSendWindow>(mailbox.send_window);
    const [saving, setSaving] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        setDailyCap(String(mailbox.daily_cap));
        setSendWindow(mailbox.send_window);
    }, [mailbox]);

    async function handleSave() {
        const parsedCap = Number(dailyCap);
        if (!Number.isFinite(parsedCap) || parsedCap < 1) {
            setLocalError('Daily cap must be a positive number.');
            return;
        }
        setSaving(true);
        setLocalError('');
        try {
            await updateMailbox(mailbox.id, {
                daily_cap: parsedCap,
                send_window: sendWindow,
            });
            await onRefresh();
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Unable to save mailbox settings.');
        } finally {
            setSaving(false);
        }
    }

    async function handleSendTest() {
        setSendingTest(true);
        setLocalError('');
        try {
            await sendMailboxTest(mailbox.id);
            await onRefresh();
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Unable to send a mailbox test email.');
        } finally {
            setSendingTest(false);
        }
    }

    async function handleDisconnect() {
        setDisconnecting(true);
        setLocalError('');
        try {
            await disconnectMailbox(mailbox.id);
            await onRefresh();
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Unable to disconnect this mailbox.');
        } finally {
            setDisconnecting(false);
        }
    }

    const usagePercentage = mailbox.daily_cap > 0
        ? Math.min(100, Math.round((mailbox.sent_today / mailbox.daily_cap) * 100))
        : 0;
    const canSendTest = mailbox.status !== 'disconnected';

    return (
        <Card className={styles.card}>
            <Flex direction="column" gap="4">
                <div className={styles.cardHeader}>
                    <div>
                        <h2 className={styles.email}>{mailbox.email}</h2>
                        <div className={styles.meta}>
                            <span className={statusClassName(mailbox.status)}>
                                {mailbox.status === 'healthy' ? 'Healthy' : mailbox.status === 'error' ? 'Error' : 'Disconnected'}
                            </span>
                            <span className={styles.pill}>Send only</span>
                            <span className={styles.pill}>Replies remain in Gmail</span>
                        </div>
                    </div>
                    <div className={styles.actions}>
                        <Button size="3" variant="soft" onClick={() => void handleSendTest()} disabled={sendingTest || !canSendTest}>
                            {sendingTest ? 'Sending…' : 'Send test email'}
                        </Button>
                        <Button size="3" color="red" variant="soft" onClick={() => void handleDisconnect()} disabled={disconnecting}>
                            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                        </Button>
                    </div>
                </div>

                <p className={styles.scopeNote}>
                    Tahoe does not request mailbox read access in this phase. Connection scope is limited to sending through Gmail.
                </p>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <p className={styles.statLabel}>Today sent</p>
                        <p className={styles.statValue}>{mailbox.sent_today} / {mailbox.daily_cap}</p>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${usagePercentage}%` }} />
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <p className={styles.statLabel}>Send window</p>
                        <p className={styles.statValue}>{mailbox.send_window.start_local} - {mailbox.send_window.end_local}</p>
                    </div>
                    <div className={styles.statCard}>
                        <p className={styles.statLabel}>Timezone</p>
                        <p className={styles.statValue}>{mailbox.send_window.timezone}</p>
                    </div>
                    <div className={styles.statCard}>
                        <p className={styles.statLabel}>Last test send</p>
                        <p className={styles.statValue}>{formatTimestamp(mailbox.last_test_send_at)}</p>
                    </div>
                </div>

                <div className={styles.settingsGrid}>
                    <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Daily cap</span>
                        <TextField.Root
                            size="3"
                            type="number"
                            value={dailyCap}
                            onChange={(event) => setDailyCap(event.target.value)}
                        />
                    </label>
                    <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Send window start</span>
                        <TextField.Root
                            size="3"
                            value={sendWindow.start_local}
                            onChange={(event) => setSendWindow((current) => ({ ...current, start_local: event.target.value }))}
                        />
                    </label>
                    <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Send window end</span>
                        <TextField.Root
                            size="3"
                            value={sendWindow.end_local}
                            onChange={(event) => setSendWindow((current) => ({ ...current, end_local: event.target.value }))}
                        />
                    </label>
                    <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Timezone</span>
                        <TextField.Root
                            size="3"
                            value={sendWindow.timezone}
                            onChange={(event) => setSendWindow((current) => ({ ...current, timezone: event.target.value }))}
                        />
                    </label>
                </div>

                <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Weekdays</span>
                    <div className={styles.weekdayGrid}>
                        {WEEKDAY_OPTIONS.map((option) => (
                            <label key={option.value} className={styles.weekdayChip}>
                                <Checkbox
                                    checked={sendWindow.weekdays.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                        setSendWindow((current) => ({
                                            ...current,
                                            weekdays: checked
                                                ? [...current.weekdays, option.value].sort((a, b) => a - b)
                                                : current.weekdays.filter((day) => day !== option.value),
                                        }));
                                    }}
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {mailbox.last_error ? <p className={styles.errorText}>Last provider error: {mailbox.last_error}</p> : null}
                {localError ? <p className={styles.errorText}>{localError}</p> : null}

                <div className={styles.actions}>
                    <Button size="3" onClick={() => void handleSave()} disabled={saving}>
                        {saving ? 'Saving…' : 'Save settings'}
                    </Button>
                </div>
            </Flex>
        </Card>
    );
}

function MailboxesPageContent() {
    const searchParams = useSearchParams();
    const [mailboxes, setMailboxes] = useState<MailboxSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [connecting, setConnecting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const items = await fetchMailboxes();
            setMailboxes(items);
            setPageError('');
        } catch (error) {
            setMailboxes([]);
            setPageError(error instanceof Error ? error.message : 'Unable to load mailboxes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    async function handleConnect() {
        setConnecting(true);
        setPageError('');
        try {
            const response = await fetchMailboxConnectUrl('/dashboard/mailboxes');
            window.location.assign(response.url);
        } catch (error) {
            setPageError(error instanceof Error ? error.message : 'Unable to start Gmail connection.');
            setConnecting(false);
        }
    }

    const callbackStatus = searchParams.get('status');
    const callbackMailbox = searchParams.get('mailbox');
    const callbackError = searchParams.get('error');

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className="tahoe-eyebrow">Gmail send-only baseline</span>
                    <h1 className={styles.title}>Connected Mailboxes</h1>
                    <p className={styles.subtitle}>
                        Connect your Gmail or Google Workspace inbox with minimum permissions. Tahoe sends through your mailbox, while replies remain in Gmail.
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <Button size="3" onClick={() => void handleConnect()} disabled={connecting}>
                        {connecting ? 'Connecting…' : 'Connect Gmail'}
                    </Button>
                </div>
            </header>

            {callbackStatus === 'connected' ? (
                <div className={styles.banner}>
                    Gmail mailbox connected{callbackMailbox ? `: ${callbackMailbox}` : ''}.
                </div>
            ) : null}
            {callbackError ? (
                <div className={`${styles.banner} ${styles.bannerError}`}>
                    {callbackError}
                </div>
            ) : null}
            {pageError ? (
                <div className={`${styles.banner} ${styles.bannerError}`}>
                    {pageError}
                </div>
            ) : null}

            {loading ? (
                <div className={styles.emptyState}>
                    <span className="tahoe-spinner" />
                    <p>Loading mailboxes…</p>
                </div>
            ) : null}

            {!loading && mailboxes.length === 0 ? (
                <div className={styles.emptyState}>
                    <h2>No mailbox connected yet</h2>
                    <p>
                        Send outreach from your Gmail or Google Workspace inbox. Tahoe requests send-only mailbox permission in this phase and does not read your mailbox.
                    </p>
                    <Button size="3" onClick={() => void handleConnect()} disabled={connecting}>
                        {connecting ? 'Connecting…' : 'Connect Gmail'}
                    </Button>
                </div>
            ) : null}

            {!loading && mailboxes.length > 0 ? (
                <div className={styles.grid}>
                    {mailboxes.map((mailbox) => (
                        <MailboxCard key={mailbox.id} mailbox={mailbox} onRefresh={load} />
                    ))}
                </div>
            ) : null}
        </section>
    );
}

export default function MailboxesPage() {
    return (
        <Suspense
            fallback={(
                <section className={styles.page}>
                    <div className={styles.emptyState}>
                        <span className="tahoe-spinner" />
                        <p>Loading mailboxes…</p>
                    </div>
                </section>
            )}
        >
            <MailboxesPageContent />
        </Suspense>
    );
}
