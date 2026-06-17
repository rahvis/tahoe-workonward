'use client';

import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './modal.module.css';

/** Accessible overlay dialog rendered into <body> (so it's never clipped by a
 *  parent's overflow/transform). Closes on Esc, backdrop click, or the ✕ button. */
export default function Modal({
    open, onClose, title, subtitle, children,
}: {
    open: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: ReactNode;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';  // lock background scroll
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div className={styles.overlay} onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={title}>
            <div className={styles.panel} onMouseDown={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.heading}>
                        {title && <h2 className={styles.title}>{title}</h2>}
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>
                    <button className={styles.close} onClick={onClose} aria-label="Close" type="button">✕</button>
                </div>
                <div className={styles.body}>{children}</div>
            </div>
        </div>,
        document.body,
    );
}
