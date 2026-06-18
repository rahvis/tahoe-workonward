'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Dialog, Flex, Text } from '@/components/ui/tahoe-ui';
import { ApiError } from '@/lib/api';
import {
    createEnrichmentRun,
    estimateEnrichmentRun,
    fetchBillingSummary,
    type EnrichmentRunSummary,
} from '@/lib/organization';
import UpgradePaywallModal from '../search/UpgradePaywallModal';

interface EnrichModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    listId: string;
    selectedCandidateIds?: string[];
    onSubmitted?: (run: EnrichmentRunSummary) => void | Promise<void>;
}

type EnrichmentField = 'work_email' | 'personal_email' | 'phone';
type ScopeMode = 'all_in_list' | 'selected_candidate_ids';

const FIELD_LABELS: Record<EnrichmentField, string> = {
    work_email: 'Work email',
    personal_email: 'Personal email',
    phone: 'Mobile phone',
};

const FIELD_COSTS: Record<EnrichmentField, number> = {
    work_email: 1,
    personal_email: 3,
    phone: 10,
};

function newIdempotencyKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `enrichment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** True when the API blocked enrichment because the workspace isn't subscribed. */
function isSubscriptionRequired(err: unknown): boolean {
    return err instanceof ApiError
        && err.status === 402
        && (err.detail as { code?: string } | null | undefined)?.code === 'subscription_required';
}

export default function EnrichModal({
    open,
    onOpenChange,
    listId,
    selectedCandidateIds = [],
    onSubmitted,
}: EnrichModalProps) {
    const hasSelection = selectedCandidateIds.length > 0;
    const [scope, setScope] = useState<ScopeMode>(hasSelection ? 'selected_candidate_ids' : 'all_in_list');
    const [fields, setFields] = useState<EnrichmentField[]>(['work_email']);
    const [balance, setBalance] = useState<number>(0);
    const [estimatedCredits, setEstimatedCredits] = useState(0);
    const [balanceAfter, setBalanceAfter] = useState(0);
    const [targetCount, setTargetCount] = useState(0);
    const [skippedInflight, setSkippedInflight] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [paywall, setPaywall] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }
        setScope(hasSelection ? 'selected_candidate_ids' : 'all_in_list');
        setFields(['work_email']);
        setError('');
        setPaywall(false);
    }, [hasSelection, open]);

    useEffect(() => {
        if (!open) {
            return;
        }
        let cancelled = false;
        async function loadBalance() {
            try {
                const response = await fetchBillingSummary();
                if (!cancelled) {
                    setBalance(response.available_credits);
                }
            } catch {
                if (!cancelled) {
                    setBalance(0);
                }
            }
        }
        void loadBalance();
        return () => {
            cancelled = true;
        };
    }, [open]);

    useEffect(() => {
        // Skip when paywalled — the estimate would just 402 again; the upgrade
        // modal is already shown.
        if (!open || fields.length === 0 || paywall) {
            setEstimatedCredits(0);
            setTargetCount(0);
            setSkippedInflight(0);
            return;
        }
        let cancelled = false;
        async function loadEstimate() {
            setLoading(true);
            setError('');
            try {
                const response = await estimateEnrichmentRun({
                    list_id: listId,
                    scope,
                    candidate_ids: scope === 'selected_candidate_ids' ? selectedCandidateIds : [],
                    fields,
                });
                if (cancelled) {
                    return;
                }
                setEstimatedCredits(response.estimated_credits);
                setTargetCount(response.target_candidate_count);
                setSkippedInflight(response.skipped_inflight);
                setBalance(response.balance);
                setBalanceAfter(response.balance_after);
            } catch (err) {
                if (cancelled) {
                    return;
                }
                if (isSubscriptionRequired(err)) {
                    setPaywall(true);  // unsubscribed → show the upgrade paywall instead
                } else {
                    setError(err instanceof Error ? err.message : 'Unable to estimate enrichment.');
                    setEstimatedCredits(0);
                    setTargetCount(0);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }
        void loadEstimate();
        return () => {
            cancelled = true;
        };
    }, [fields, listId, open, paywall, scope, selectedCandidateIds]);

    const displayedBalanceAfter = fields.length === 0 || error ? balance : balanceAfter;

    const isInsufficient = estimatedCredits > balance;
    const scopeLabel = useMemo(() => {
        if (!hasSelection) {
            return 'Entire list';
        }
        if (selectedCandidateIds.length === 1) {
            return 'Selected candidate';
        }
        return `Selected (${selectedCandidateIds.length})`;
    }, [hasSelection, selectedCandidateIds.length]);

    function toggleField(field: EnrichmentField) {
        setFields((current) =>
            current.includes(field) ? current.filter((item) => item !== field) : [...current, field]
        );
    }

    async function handleSubmit() {
        if (fields.length === 0) {
            setError('Choose at least one field.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const run = await createEnrichmentRun({
                list_id: listId,
                scope,
                candidate_ids: scope === 'selected_candidate_ids' ? selectedCandidateIds : [],
                fields,
                idempotency_key: newIdempotencyKey(),
            });
            await onSubmitted?.(run);
            onOpenChange(false);
        } catch (err) {
            if (isSubscriptionRequired(err)) {
                setPaywall(true);
            } else {
                setError(err instanceof Error ? err.message : 'Unable to start enrichment.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    // Unsubscribed workspaces can't enrich — replace the enrich dialog with the
    // same upgrade paywall the search screen uses. Closing it dismisses the flow.
    if (paywall) {
        return (
            <UpgradePaywallModal
                open
                reason="subscription_required"
                onClose={() => { setPaywall(false); onOpenChange(false); }}
            />
        );
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="620px" style={{ padding: 24 }}>
                <Dialog.Title>Enrich contacts</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                    Choose a scope and the fields Tahoe should request from FullEnrich before this list moves into outreach.
                </Dialog.Description>

                <Flex direction="column" gap="4">
                    <div>
                        <Text as="p" size="2" weight="medium" mb="2">Scope</Text>
                        <div style={{ display: 'grid', gap: 10 }}>
                            <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <input
                                    type="radio"
                                    name="enrichment-scope"
                                    checked={scope === 'all_in_list'}
                                    onChange={() => setScope('all_in_list')}
                                />
                                <span>Entire list</span>
                            </label>
                            {hasSelection ? (
                                <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <input
                                        type="radio"
                                        name="enrichment-scope"
                                        checked={scope === 'selected_candidate_ids'}
                                        onChange={() => setScope('selected_candidate_ids')}
                                    />
                                    <span>{scopeLabel}</span>
                                </label>
                            ) : null}
                        </div>
                    </div>

                    <div>
                        <Text as="p" size="2" weight="medium" mb="2">Fields</Text>
                        <div style={{ display: 'grid', gap: 10 }}>
                            {(['work_email', 'personal_email', 'phone'] as EnrichmentField[]).map((field) => (
                                <label key={field} style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={fields.includes(field)}
                                            onChange={() => toggleField(field)}
                                        />
                                        <span>{FIELD_LABELS[field]}</span>
                                    </span>
                                    <Text size="2" color="gray">{FIELD_COSTS[field]} credit{FIELD_COSTS[field] === 1 ? '' : 's'}</Text>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="tahoe-banner">
                        <div style={{ display: 'grid', gap: 6 }}>
                            <Text size="2">
                                Estimate: {loading
                                    ? 'Calculating…'
                                    : `${estimatedCredits} credit${estimatedCredits === 1 ? '' : 's'} for ${targetCount} candidate${targetCount === 1 ? '' : 's'}`}
                            </Text>
                            <Text size="2">Balance after run: {loading ? '—' : displayedBalanceAfter}</Text>
                            {skippedInflight > 0 ? (
                                <Text size="2" color="gray">
                                    {skippedInflight} candidate{skippedInflight === 1 ? '' : 's'} already have an in-flight enrichment for the same fields and will be skipped.
                                </Text>
                            ) : null}
                        </div>
                    </div>

                    {isInsufficient ? (
                        <div className="tahoe-banner tahoe-banner-error">
                            Balance is lower than the requested estimate. Top up the workspace before starting this run.
                        </div>
                    ) : null}

                    {error ? (
                        <Text size="2" color="red">{error}</Text>
                    ) : null}
                </Flex>

                <Flex gap="3" justify="end" mt="5">
                    <Dialog.Close>
                        <Button variant="soft" color="gray">Cancel</Button>
                    </Dialog.Close>
                    <Button
                        onClick={() => void handleSubmit()}
                        disabled={submitting || loading || fields.length === 0 || targetCount === 0 || isInsufficient}
                    >
                        {submitting ? 'Starting…' : 'Start enrichment'}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
