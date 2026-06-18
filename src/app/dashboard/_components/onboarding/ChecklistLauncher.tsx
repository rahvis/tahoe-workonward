'use client';

import { useRouter } from 'next/navigation';
import { type CSSProperties, useState } from 'react';
import type { ChecklistKey } from '@/lib/onboarding';
import { useOnboarding } from './OnboardingProvider';
import styles from './checklist.module.css';

const TASKS: { key: ChecklistKey; label: string; route: string }[] = [
    { key: 'first_search', label: 'Run your first search', route: '/dashboard/search/new' },
    { key: 'save_candidate', label: 'Save a candidate to a project', route: '/dashboard/search/new' },
    { key: 'enrich_contact', label: 'Enrich a contact (email / phone)', route: '/dashboard/projects' },
    { key: 'connect_mailbox', label: 'Connect your mailbox', route: '/dashboard/mailboxes' },
    { key: 'first_outreach', label: 'Send your first outreach', route: '/dashboard/mailboxes' },
    { key: 'choose_plan', label: 'Choose a plan', route: '/dashboard/billing/plan' },
];

export default function ChecklistLauncher() {
    const { showChecklist, state, dismissChecklist } = useOnboarding();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    if (!showChecklist) return null;

    const done = TASKS.filter((t) => state.checklist[t.key]).length;
    const total = TASKS.length;
    const pct = Math.round((done / total) * 100);

    if (!open) {
        return (
            <button
                className={styles.launcher}
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`Getting started — ${done} of ${total} done. Open checklist.`}
            >
                <span className={styles.ring} style={{ '--pct': pct } as CSSProperties}>{pct}%</span>
                <span className={styles.launcherText}>
                    <strong>Getting started</strong>
                    <span>{done} of {total} · keep going →</span>
                </span>
            </button>
        );
    }

    const go = (route: string) => { setOpen(false); router.push(route); };

    return (
        <div className={styles.panel} role="dialog" aria-label="Getting started checklist">
            <div className={styles.header}>
                <strong className={styles.title}>Getting started</strong>
                <div className={styles.headerActions}>
                    <button className={styles.iconBtn} type="button" onClick={() => setOpen(false)} aria-label="Minimize">—</button>
                    <button className={styles.iconBtn} type="button" onClick={dismissChecklist} aria-label="Dismiss checklist">✕</button>
                </div>
            </div>
            <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${pct}%` }} /></div>
            <div className={styles.progressLabel}>{done} / {total}</div>
            <ul className={styles.list}>
                {TASKS.map((t) => {
                    const checked = state.checklist[t.key];
                    return (
                        <li key={t.key} className={styles.item}>
                            <span className={checked ? styles.checkDone : styles.checkEmpty} aria-hidden="true">{checked ? '✓' : ''}</span>
                            <span className={checked ? styles.labelDone : styles.label}>{t.label}</span>
                            {!checked && <button className={styles.doBtn} type="button" onClick={() => go(t.route)}>Do →</button>}
                        </li>
                    );
                })}
            </ul>
            <button className={styles.dismissLink} type="button" onClick={dismissChecklist}>Dismiss · reopen from Help (?)</button>
        </div>
    );
}
