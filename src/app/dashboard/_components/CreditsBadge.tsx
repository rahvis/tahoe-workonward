'use client';

import { useEffect, useState } from 'react';
import { fetchBillingSummary } from '@/lib/organization';

interface CreditsBadgeProps {
    refreshKey?: number | string;
}

export default function CreditsBadge({ refreshKey }: CreditsBadgeProps) {
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function loadBalance() {
            try {
                const response = await fetchBillingSummary();
                if (!cancelled) {
                    setBalance(response.available_credits);
                }
            } catch {
                if (!cancelled) {
                    setBalance(null);
                }
            }
        }
        void loadBalance();
        window.addEventListener('tahoe:credits-updated', loadBalance);
        return () => {
            cancelled = true;
            window.removeEventListener('tahoe:credits-updated', loadBalance);
        };
    }, [refreshKey]);

    return (
        <span className="tahoe-chip">
            Credits: {balance == null ? '—' : balance.toLocaleString()}
        </span>
    );
}
