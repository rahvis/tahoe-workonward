'use client';
import { LockClosedIcon } from '@radix-ui/react-icons';
import styles from './api.module.css';

const endpoints = [
    { method: 'POST', path: '/auth/register', desc: 'Register a new user account', auth: false },
    { method: 'POST', path: '/auth/login', desc: 'Authenticate and receive a JWT token', auth: false },
    { method: 'POST', path: '/auth/google', desc: 'Exchange a Google ID token for a Tahoe JWT', auth: false },
    { method: 'GET', path: '/auth/altcha/challenge', desc: 'Generate an ALTCHA challenge for auth forms', auth: false },
    { method: 'POST', path: '/auth/verify-email', desc: 'Verify a pending email address with a token', auth: false },
    { method: 'GET', path: '/auth/me', desc: 'Get current authenticated user info', auth: true },
    { method: 'POST', path: '/auth/forgot-password', desc: 'Send password reset email', auth: false },
    { method: 'POST', path: '/auth/reset-password', desc: 'Reset password with token', auth: false },
    { method: 'POST', path: '/search/process-query', desc: 'Process natural language query into search filters', auth: true },
    { method: 'POST', path: '/search/execute', desc: 'Execute search with filters against talent database', auth: true },
    { method: 'GET', path: '/candidates', desc: 'List saved candidates with pagination', auth: true },
    { method: 'POST', path: '/candidates', desc: 'Save selected candidates to your list', auth: true },
];

export default function ApiPage() {
    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <span className="tahoe-eyebrow">Current backend surface</span>
                <h1 className={styles.title}>API Reference</h1>
                <p className={styles.subtitle}>Available REST API endpoints for the Tahoe platform.</p>
            </header>

            <div className={styles.list}>
                {endpoints.map((ep, i) => (
                    <article key={i} className={styles.row}>
                        <div className={styles.rowLeft}>
                            <span className={`${styles.method} ${styles[`method${ep.method}`]}`}>{ep.method}</span>
                            <code className={styles.path}>{ep.path}</code>
                            {ep.auth && (
                                <span className={styles.authTag}>
                                    <LockClosedIcon /> Auth
                                </span>
                            )}
                        </div>
                        <p className={styles.desc}>{ep.desc}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
