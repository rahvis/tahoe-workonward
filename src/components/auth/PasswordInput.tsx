'use client';
import { useState } from 'react';
import { LockClosedIcon, EyeOpenIcon, EyeClosedIcon } from '@/components/ui/icons';
import styles from '@/app/(auth)/auth.module.css';

interface PasswordInputProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoComplete?: string;
}

export default function PasswordInput({
    id,
    value,
    onChange,
    placeholder,
    autoComplete = 'current-password',
}: PasswordInputProps) {
    const [visible, setVisible] = useState(false);

    return (
        <div className={styles.inputShell}>
            <span className={styles.inputIcon}><LockClosedIcon /></span>
            <input
                id={id}
                className={styles.input}
                placeholder={placeholder}
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete={autoComplete}
            />
            <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setVisible((prev) => !prev)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
            >
                {visible ? <EyeClosedIcon /> : <EyeOpenIcon />}
            </button>
        </div>
    );
}
