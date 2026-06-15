'use client';
import { CheckCircledIcon } from '@/components/ui/icons';
import styles from '@/app/(auth)/auth.module.css';

interface PasswordChecklistProps {
    password: string;
    confirmPassword?: string;
    showMatch?: boolean;
    minLength?: number;
}

export default function PasswordChecklist({
    password,
    confirmPassword,
    showMatch = false,
    minLength = 12,
}: PasswordChecklistProps) {
    if (!password) {
        return null;
    }

    const rules: { label: string; met: boolean }[] = [
        { label: `At least ${minLength} characters`, met: password.length >= minLength },
    ];
    if (showMatch) {
        rules.push({
            label: 'Passwords match',
            met: !!confirmPassword && password === confirmPassword,
        });
    }

    return (
        <div className={styles.field}>
            <ul className={styles.checklist} aria-live="polite">
                {rules.map((rule) => (
                    <li
                        key={rule.label}
                        className={rule.met ? styles.checklistItemMet : styles.checklistItem}
                    >
                        <span className={styles.checklistMark} aria-hidden="true">
                            {rule.met ? (
                                <CheckCircledIcon width={14} height={14} />
                            ) : (
                                <span className={styles.checklistDot} />
                            )}
                        </span>
                        <span>{rule.label}</span>
                    </li>
                ))}
            </ul>
            <p className={styles.checklistNote}>
                Avoid common or breached passwords, these are rejected at sign-up.
            </p>
        </div>
    );
}
