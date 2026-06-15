'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Checkbox, Dialog, TextField } from '@/components/ui/tahoe-ui';
import {
    deleteMailbox,
    disconnectMailbox,
    fetchMailboxConnectUrl,
    fetchMailboxes,
    sendMailboxTest,
    updateMailbox,
    type MailboxSendWindow,
    type MailboxSummary,
} from '@/lib/organization';
import styles from './mailboxes.module.css';

const PAGE_SIZE = 5;

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

function statusLabel(statusValue: MailboxSummary['status']) {
    if (statusValue === 'healthy') return 'Healthy';
    if (statusValue === 'error') return 'Error';
    return 'Disconnected';
}

function statusClassName(statusValue: MailboxSummary['status']) {
    if (statusValue === 'healthy') return styles.statusHealthy;
    if (statusValue === 'error') return styles.statusError;
    return styles.statusDisconnected;
}

function weekdayLabel(weekdays: number[]) {
    const selected = WEEKDAY_OPTIONS.filter((option) => weekdays.includes(option.value)).map((option) => option.label);
    return selected.length ? selected.join(', ') : 'None';
}

function lastActivity(mailbox: MailboxSummary) {
    return mailbox.last_send_at ?? mailbox.last_test_send_at ?? mailbox.updated_at ?? mailbox.created_at ?? null;
}

function usagePercent(mailbox: MailboxSummary) {
    if (mailbox.daily_cap <= 0) return 0;
    return Math.min(100, Math.round((mailbox.sent_today / mailbox.daily_cap) * 100));
}

function MailboxManageDialog({
    mailbox,
    open,
    onOpenChange,
    onRefresh,
}: {
    mailbox: MailboxSummary | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRefresh: () => Promise<void>;
}) {
    const [dailyCap, setDailyCap] = useState('');
    const [sendWindow, setSendWindow] = useState<MailboxSendWindow>({
        start_local: '09:00',
        end_local: '17:00',
        weekdays: [1, 2, 3, 4, 5],
        timezone: 'America/Los_Angeles',
    });
    const [saving, setSaving] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (!mailbox) return;
        setDailyCap(String(mailbox.daily_cap));
        setSendWindow(mailbox.send_window);
        setLocalError('');
        setConfirmingDelete(false);
    }, [mailbox]);

    if (!mailbox) {
        return null;
    }
    const activeMailbox = mailbox;

    async function handleSave() {
        const parsedCap = Number(dailyCap);
        if (!Number.isFinite(parsedCap) || parsedCap < 1) {
            setLocalError('Daily cap must be a positive number.');
            return;
        }
        setSaving(true);
        setLocalError('');
        try {
            await updateMailbox(activeMailbox.id, {
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
            await sendMailboxTest(activeMailbox.id);
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
            await disconnectMailbox(activeMailbox.id);
            onOpenChange(false);
            await onRefresh();
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Unable to disconnect this mailbox.');
        } finally {
            setDisconnecting(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        setLocalError('');
        try {
            await deleteMailbox(activeMailbox.id);
            setConfirmingDelete(false);
            onOpenChange(false);
            await onRefresh();
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Unable to delete this mailbox.');
        } finally {
            setDeleting(false);
        }
    }

    const canSendTest = activeMailbox.status !== 'disconnected';
    const canDisconnect = activeMailbox.status !== 'disconnected';

    return (
        <>
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Content className={styles.modalPanel} aria-label="Manage mailbox" maxWidth="760px">
                    <div className={styles.modalHeader}>
                        <div>
                            <Dialog.Title className={styles.modalTitle}>{activeMailbox.email}</Dialog.Title>
                            <div className={styles.modalMeta}>
                                <span className={statusClassName(activeMailbox.status)}>{statusLabel(activeMailbox.status)}</span>
                                <span>Send-only Gmail</span>
                            </div>
                        </div>
                        <Button size="2" variant="ghost" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>

                    <div className={styles.detailGrid}>
                        <div>
                            <span>Today sent</span>
                            <strong>{activeMailbox.sent_today} / {activeMailbox.daily_cap}</strong>
                        </div>
                        <div>
                            <span>Last activity</span>
                            <strong>{formatTimestamp(lastActivity(activeMailbox))}</strong>
                        </div>
                        <div>
                            <span>Weekdays</span>
                            <strong>{weekdayLabel(activeMailbox.send_window.weekdays)}</strong>
                        </div>
                    </div>

                    <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${usagePercent(activeMailbox)}%` }} />
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
                            <span className={styles.fieldLabel}>Window start</span>
                            <TextField.Root
                                size="3"
                                value={sendWindow.start_local}
                                onChange={(event) => setSendWindow((current) => ({ ...current, start_local: event.target.value }))}
                            />
                        </label>
                        <label className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Window end</span>
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
                        <span className={styles.fieldLabel}>Send days</span>
                        <div className={styles.weekdayGrid}>
                            {WEEKDAY_OPTIONS.map((option) => (
                                <label key={option.value} className={styles.weekdayChip}>
                                    <Checkbox
                                        checked={sendWindow.weekdays.includes(option.value)}
                                        onCheckedChange={(checked) => {
                                            setSendWindow((current) => {
                                                if (checked) {
                                                    return {
                                                        ...current,
                                                        weekdays: [...current.weekdays, option.value].sort((a, b) => a - b),
                                                    };
                                                }
                                                if (current.weekdays.length === 1) return current;
                                                return {
                                                    ...current,
                                                    weekdays: current.weekdays.filter((day) => day !== option.value),
                                                };
                                            });
                                        }}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {activeMailbox.last_error ? <p className={styles.errorText}>Last provider error: {activeMailbox.last_error}</p> : null}
                    {localError && !confirmingDelete ? <p className={styles.errorText}>{localError}</p> : null}

                    <div className={styles.modalFooter}>
                        <div className={styles.actionGroup}>
                            <Button size="3" onClick={() => void handleSave()} disabled={saving}>
                                {saving ? 'Saving...' : 'Save settings'}
                            </Button>
                            <Button size="3" variant="soft" onClick={() => void handleSendTest()} disabled={sendingTest || !canSendTest}>
                                {sendingTest ? 'Sending...' : 'Send test'}
                            </Button>
                        </div>
                        <div className={styles.actionGroup}>
                            <Button size="3" color="red" variant="soft" onClick={() => void handleDisconnect()} disabled={disconnecting || !canDisconnect}>
                                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                            </Button>
                            <Button size="3" color="red" onClick={() => setConfirmingDelete(true)}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root open={confirmingDelete} onOpenChange={setConfirmingDelete}>
                <Dialog.Content className={styles.confirmPanel} aria-label="Delete mailbox" maxWidth="460px">
                    <Dialog.Title className={styles.modalTitle}>Delete mailbox?</Dialog.Title>
                    <Dialog.Description>
                        This permanently removes {activeMailbox.email} from Tahoe. Active campaigns or queued sends will block deletion.
                    </Dialog.Description>
                    {localError ? <p className={styles.errorText}>{localError}</p> : null}
                    <div className={styles.confirmActions}>
                        <Button size="3" variant="soft" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button size="3" color="red" onClick={() => void handleDelete()} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete mailbox'}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Root>
        </>
    );
}

function MailboxesPageContent() {
    const searchParams = useSearchParams();
    const [mailboxes, setMailboxes] = useState<MailboxSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [page, setPage] = useState(1);
    const [selectedMailboxId, setSelectedMailboxId] = useState<string | null>(null);

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

    const totalPages = Math.max(1, Math.ceil(mailboxes.length / PAGE_SIZE));
    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);

    const visibleMailboxes = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return mailboxes.slice(start, start + PAGE_SIZE);
    }, [mailboxes, page]);

    const selectedMailbox = useMemo(
        () => mailboxes.find((mailbox) => mailbox.id === selectedMailboxId) ?? null,
        [mailboxes, selectedMailboxId],
    );

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

    const callbackError = searchParams.get('error');
    const rowStart = mailboxes.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const rowEnd = Math.min(mailboxes.length, page * PAGE_SIZE);

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerActions}>
                    <Button size="3" onClick={() => void handleConnect()} disabled={connecting}>
                        {connecting ? 'Connecting...' : 'Connect Gmail'}
                    </Button>
                </div>
            </header>

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
                    <p>Loading mailboxes...</p>
                </div>
            ) : null}

            {!loading && mailboxes.length === 0 ? (
                <div className={styles.emptyState}>
                    <h2>No mailbox connected yet</h2>
                    <p>Connect Gmail with send-only permission to start outreach.</p>
                    <Button size="3" onClick={() => void handleConnect()} disabled={connecting}>
                        {connecting ? 'Connecting...' : 'Connect Gmail'}
                    </Button>
                </div>
            ) : null}

            {!loading && mailboxes.length > 0 ? (
                <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                        <p>Send-only access. Tahoe does not read inbox contents.</p>
                    </div>
                    <div className={styles.tableViewport}>
                        <table className={styles.mailboxTable}>
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Today sent</th>
                                    <th>Send window</th>
                                    <th>Last activity</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleMailboxes.map((mailbox) => (
                                    <tr key={mailbox.id}>
                                        <td>
                                            <div className={styles.emailCell}>
                                                <strong>{mailbox.email}</strong>
                                                <span>{weekdayLabel(mailbox.send_window.weekdays)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={statusClassName(mailbox.status)}>{statusLabel(mailbox.status)}</span>
                                        </td>
                                        <td>
                                            {mailbox.sent_today} / {mailbox.daily_cap}
                                        </td>
                                        <td>
                                            <div className={styles.stackCell}>
                                                <strong>{mailbox.send_window.start_local} - {mailbox.send_window.end_local}</strong>
                                                <span>{mailbox.send_window.timezone}</span>
                                            </div>
                                        </td>
                                        <td>{formatTimestamp(lastActivity(mailbox))}</td>
                                        <td>
                                            <Button size="2" variant="soft" onClick={() => setSelectedMailboxId(mailbox.id)}>
                                                Manage
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.pagination}>
                        <span>
                            Showing {rowStart}-{rowEnd} of {mailboxes.length}
                        </span>
                        <div className={styles.paginationButtons}>
                            <Button size="2" variant="soft" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                                Previous
                            </Button>
                            <Button size="2" variant="soft" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}

            <MailboxManageDialog
                mailbox={selectedMailbox}
                open={Boolean(selectedMailboxId)}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) setSelectedMailboxId(null);
                }}
                onRefresh={load}
            />
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
                        <p>Loading mailboxes...</p>
                    </div>
                </section>
            )}
        >
            <MailboxesPageContent />
        </Suspense>
    );
}
