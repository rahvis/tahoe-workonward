'use client';

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/tahoe-ui';
import { CREDIT_PREF_EVENT, isCreditConfirmSuppressed, setCreditConfirmSuppressed } from '@/lib/credits';

/**
 * Self-contained toggle (per device, localStorage-backed) that controls whether the
 * "this action costs N credits" confirmation is shown before spending. Lets a recruiter
 * who ticked "Don't show again" turn the confirmations back on.
 */
export default function CreditConfirmToggle() {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const sync = () => setShow(!isCreditConfirmSuppressed());
        sync();
        window.addEventListener(CREDIT_PREF_EVENT, sync);
        return () => window.removeEventListener(CREDIT_PREF_EVENT, sync);
    }, []);

    return (
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <span>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 500 }}>Confirm before spending credits</span>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--tahoe-color-text-tertiary)' }}>
                    Show a quick confirmation with the credit cost before each search or reveal.
                </span>
            </span>
            <Switch
                checked={show}
                onCheckedChange={(next) => { setCreditConfirmSuppressed(!next); setShow(next); }}
                aria-label="Confirm before spending credits"
            />
        </label>
    );
}
