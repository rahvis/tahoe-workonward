'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Flex } from '@/components/ui/tahoe-ui';
import { fetchMailboxes, type MailboxSummary } from '@/lib/organization';
import styles from '../mailboxes.module.css';

function formatTimestamp(value?: string | null) {
    if (!value) return 'Not yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

export default function SendHealthPage() {
    const [mailboxes, setMailboxes] = useState<MailboxSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const items = await fetchMailboxes();
            setMailboxes(items);
            setError('');
        } catch (nextError) {
            setMailboxes([]);
            setError(nextError instanceof Error ? nextError.message : 'Unable to load mailbox health.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const summary = useMemo(() => ({
        total: mailboxes.filter((mailbox) => mailbox.status !== 'disconnected').length,
        healthy: mailboxes.filter((mailbox) => mailbox.status === 'healthy').length,
        errored: mailboxes.filter((mailbox) => mailbox.status === 'error').length,
        disconnected: mailboxes.filter((mailbox) => mailbox.status === 'disconnected').length,
    }), [mailboxes]);

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className="tahoe-eyebrow">Operational visibility</span>
                    <h1 className={styles.title}>Send Health</h1>
                    <p className={styles.subtitle}>
                        Track mailbox connection state, conservative Tahoe daily caps, and the latest send or test-send activity without requesting mailbox read access.
                    </p>
                </div>
            </header>

            {error ? <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div> : null}

            <div className={styles.summaryStrip}>
                <div className={styles.summaryCard}>
                    <p className={styles.statLabel}>Connected</p>
                    <p className={styles.summaryNumber}>{summary.total}</p>
                </div>
                <div className={styles.summaryCard}>
                    <p className={styles.statLabel}>Healthy</p>
                    <p className={styles.summaryNumber}>{summary.healthy}</p>
                </div>
                <div className={styles.summaryCard}>
                    <p className={styles.statLabel}>Errored</p>
                    <p className={styles.summaryNumber}>{summary.errored}</p>
                </div>
                <div className={styles.summaryCard}>
                    <p className={styles.statLabel}>Disconnected</p>
                    <p className={styles.summaryNumber}>{summary.disconnected}</p>
                </div>
            </div>

            {loading ? (
                <div className={styles.emptyState}>
                    <span className="tahoe-spinner" />
                    <p>Loading send health…</p>
                </div>
            ) : null}

            {!loading && mailboxes.length === 0 ? (
                <div className={styles.emptyState}>
                    <h2>No mailbox health yet</h2>
                    <p>Connect a mailbox first to track send status, daily cap usage, and provider errors.</p>
                </div>
            ) : null}

            {!loading && mailboxes.length > 0 ? (
                <div className={styles.grid}>
                    {mailboxes.map((mailbox) => (
                        <Card key={mailbox.id} className={styles.card}>
                            <Flex direction="column" gap="4">
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h2 className={styles.email}>{mailbox.email}</h2>
                                        <div className={styles.meta}>
                                            <span className={mailbox.status === 'healthy' ? styles.statusHealthy : mailbox.status === 'error' ? styles.statusError : styles.statusDisconnected}>
                                                {mailbox.status === 'healthy' ? 'Healthy' : mailbox.status === 'error' ? 'Error' : 'Disconnected'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.statsGrid}>
                                    <div className={styles.statCard}>
                                        <p className={styles.statLabel}>Today sent</p>
                                        <p className={styles.statValue}>{mailbox.sent_today} / {mailbox.daily_cap}</p>
                                    </div>
                                    <div className={styles.statCard}>
                                        <p className={styles.statLabel}>Last send</p>
                                        <p className={styles.statValue}>{formatTimestamp(mailbox.last_send_at)}</p>
                                    </div>
                                    <div className={styles.statCard}>
                                        <p className={styles.statLabel}>Last test send</p>
                                        <p className={styles.statValue}>{formatTimestamp(mailbox.last_test_send_at)}</p>
                                    </div>
                                    <div className={styles.statCard}>
                                        <p className={styles.statLabel}>Send window</p>
                                        <p className={styles.statValue}>{mailbox.send_window.start_local} - {mailbox.send_window.end_local}</p>
                                    </div>
                                </div>

                                {mailbox.last_error ? <p className={styles.errorText}>Last provider error: {mailbox.last_error}</p> : null}
                            </Flex>
                        </Card>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
