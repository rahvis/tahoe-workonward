'use client';

import { Suspense, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Switch, TahoeSelect, TextField } from '@/components/ui/tahoe-ui';
import {
    autocompleteAddress,
    createBillingPortal,
    createSubscriptionCheckout,
    createDataRequest,
    fetchAddressDetails,
    fetchBillingCatalog,
    fetchBillingSummary,
    fetchPaymentSettings,
    fetchSettings,
    inviteReferral,
    requestAccountDeletion,
    updateAccountSettings,
    updateComplianceSettings,
    updateNotificationSettings,
    updateOutreachDefaults,
    updateWorkspaceSettings,
    type AddressMetadata,
    type AddressPrediction,
    type BillingCatalogResponse,
    type BillingSummary,
    type ComplianceSettings,
    type DataRequest,
    type DataRequestCreateType,
    type NotificationSettings,
    type OutreachDefaults,
    type PaymentSettingsResponse,
    type SettingsPayload,
    type WorkspaceSettings,
} from '@/lib/organization';
import styles from './settings.module.css';

type SettingsTab =
    | 'account'
    | 'workspace'
    | 'subscription'
    | 'payment'
    | 'outreach'
    | 'compliance'
    | 'referrals'
    | 'integrations'
    | 'notifications'
    | 'security';

const tabs: Array<{ key: SettingsTab; label: string }> = [
    { key: 'account', label: 'Account' },
    { key: 'workspace', label: 'Workspace' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'payment', label: 'Payment' },
    { key: 'outreach', label: 'Outreach Defaults' },
    { key: 'compliance', label: 'Compliance & Data' },
    { key: 'referrals', label: 'Referrals' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'security', label: 'Security' },
];

const timezones = [
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Kolkata',
    'Asia/Singapore',
];

export function redirectToExternal(url: string) {
    if (process.env.NODE_ENV === 'test') return;
    window.location.assign(url);
}

function formatDate(value?: string | null) {
    if (!value) return 'Not recorded';
    try {
        return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
    } catch {
        return value;
    }
}

function formatMoneyCents(value: number, currency = 'usd') {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format((value || 0) / 100);
}

function formatPlanPrice(value: number) {
    return `$${value.toLocaleString()}`;
}

function requestLabel(value: DataRequest['request_type']) {
    return value.replaceAll('_', ' ');
}

function paymentMethodLabel(method?: PaymentSettingsResponse['default_payment_method'] | null) {
    if (!method) return 'No payment method on file';
    const brand = method.brand ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : method.type;
    return method.last4 ? `${brand} ending in ${method.last4}` : brand;
}

function statusClass(status: string) {
    if (status === 'connected' || status === 'configured' || status === 'reward_issued' || status === 'completed') return styles.successPill;
    if (status === 'invited' || status === 'requested' || status === 'in_review') return styles.warningPill;
    if (status === 'not_connected' || status === 'not_configured') return styles.mutedPill;
    return styles.pill;
}

function TextInput({
    label,
    value,
    onChange,
    type = 'text',
    disabled = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    disabled?: boolean;
}) {
    return (
        <div className={styles.field}>
            <span className={styles.label}>{label}</span>
            <TextField.Root
                size="3"
                type={type}
                value={value}
                disabled={disabled}
                aria-label={label}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function newPlacesSessionToken() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `places-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function AddressAutocompleteInput({
    value,
    meta,
    onChange,
}: {
    value: string;
    meta?: AddressMetadata | null;
    onChange: (value: string, meta: AddressMetadata | null) => void;
}) {
    const sessionTokenRef = useRef(newPlacesSessionToken());
    const detailsControllerRef = useRef<AbortController | null>(null);
    const detailsSequenceRef = useRef(0);
    const latestValueRef = useRef(value);
    const [focused, setFocused] = useState(false);
    const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [selecting, setSelecting] = useState(false);
    const selectedGoogleAddress = meta?.source === 'google_places' && meta.formatted_address === value;
    const showPredictions = focused && predictions.length > 0 && !selectedGoogleAddress;

    useEffect(() => {
        latestValueRef.current = value;
    }, [value]);

    useEffect(() => () => {
        detailsControllerRef.current?.abort();
    }, []);

    useEffect(() => {
        const query = value.trim();
        if (!focused || query.length < 3 || selectedGoogleAddress) {
            setPredictions([]);
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setLoading(true);
            autocompleteAddress(query, sessionTokenRef.current, { signal: controller.signal })
                .then((response) => {
                    setPredictions(response.predictions);
                    setActiveIndex(0);
                    setLocalError(null);
                })
                .catch((err) => {
                    if (err instanceof DOMException && err.name === 'AbortError') return;
                    setPredictions([]);
                    setLocalError(err instanceof Error ? err.message : 'Address lookup is unavailable.');
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        }, 300);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [focused, selectedGoogleAddress, value]);

    async function selectPrediction(prediction: AddressPrediction) {
        const sequence = detailsSequenceRef.current + 1;
        detailsSequenceRef.current = sequence;
        detailsControllerRef.current?.abort();
        const controller = new AbortController();
        detailsControllerRef.current = controller;
        const valueAtSelection = latestValueRef.current;
        setSelecting(true);
        setLocalError(null);
        try {
            const details = await fetchAddressDetails(prediction.place_id, sessionTokenRef.current, { signal: controller.signal });
            if (
                controller.signal.aborted ||
                detailsSequenceRef.current !== sequence ||
                latestValueRef.current !== valueAtSelection
            ) {
                return;
            }
            onChange(details.formatted_address, details);
            setPredictions([]);
            sessionTokenRef.current = newPlacesSessionToken();
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setLocalError(err instanceof Error ? err.message : 'Unable to use this address.');
        } finally {
            if (!controller.signal.aborted && detailsSequenceRef.current === sequence) {
                setSelecting(false);
            }
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (!showPredictions) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, predictions.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            void selectPrediction(predictions[activeIndex]);
        } else if (event.key === 'Escape') {
            setPredictions([]);
        }
    }

    return (
        <div className={`${styles.wideField} ${styles.addressField}`}>
            <span className={styles.label}>Company postal address</span>
            <div className={styles.addressInputWrap}>
                <TextField.Root
                    size="3"
                    value={value}
                    placeholder="Start typing a street address"
                    autoComplete="off"
                    aria-label="Company postal address"
                    role="combobox"
                    aria-expanded={showPredictions}
                    aria-controls="settings-address-suggestions"
                    aria-autocomplete="list"
                    onFocus={() => setFocused(true)}
                    onBlur={() => window.setTimeout(() => setFocused(false), 150)}
                    onKeyDown={handleKeyDown}
                    onChange={(event) => {
                        detailsSequenceRef.current += 1;
                        detailsControllerRef.current?.abort();
                        setSelecting(false);
                        onChange(event.target.value, { source: 'manual' });
                        setLocalError(null);
                    }}
                />
                {showPredictions ? (
                    <div id="settings-address-suggestions" className={styles.addressSuggestions} role="listbox">
                        {predictions.map((prediction, index) => (
                            <button
                                key={prediction.place_id}
                                type="button"
                                className={`${styles.addressSuggestion} ${index === activeIndex ? styles.addressSuggestionActive : ''}`}
                                role="option"
                                aria-selected={index === activeIndex}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => void selectPrediction(prediction)}
                            >
                                <span className={styles.addressSuggestionMain}>{prediction.main_text || prediction.text}</span>
                                {prediction.secondary_text ? (
                                    <span className={styles.addressSuggestionSecondary}>{prediction.secondary_text}</span>
                                ) : null}
                            </button>
                        ))}
                        <span className={styles.googleAttribution}>Powered by Google</span>
                    </div>
                ) : null}
            </div>
            <span className={styles.addressHelper}>
                {selecting ? 'Confirming selected address...' : loading ? 'Searching addresses...' : localError || 'Select a Google suggestion or type the address manually.'}
            </span>
            {value.trim() ? (
                <span className={styles.addressSourceHint}>
                    {selectedGoogleAddress ? 'Source: Google Places selected address' : 'Source: Manual address entry'}
                </span>
            ) : null}
        </div>
    );
}

function SaveActions({
    dirty,
    saving,
    onSave,
    onReset,
}: {
    dirty: boolean;
    saving: boolean;
    onSave: () => void;
    onReset: () => void;
}) {
    return (
        <div className={styles.actions}>
            {dirty ? <span className={styles.warningPill}>Unsaved changes</span> : null}
            <Button variant="soft" disabled={!dirty || saving} onClick={onReset}>Cancel</Button>
            <Button disabled={!dirty || saving} onClick={onSave}>{saving ? 'Saving...' : 'Save changes'}</Button>
        </div>
    );
}

function SettingsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawTab = searchParams.get('tab') as SettingsTab | null;
    const activeTab = tabs.some((tab) => tab.key === rawTab) ? rawTab! : 'account';

    const [settingsPayload, setSettingsPayload] = useState<SettingsPayload | null>(null);
    const [draft, setDraft] = useState<SettingsPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
    const [billingCatalog, setBillingCatalog] = useState<BillingCatalogResponse | null>(null);
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsResponse | null>(null);
    const [billingLoading, setBillingLoading] = useState(false);
    const [billingError, setBillingError] = useState<string | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [billingActionKey, setBillingActionKey] = useState<string | null>(null);
    const [dirtySections, setDirtySections] = useState<Set<SettingsTab>>(new Set());
    const [referralEmail, setReferralEmail] = useState('');
    const [accountDeletion, setAccountDeletion] = useState({ confirmation: '', reason: '' });
    const [dataRequest, setDataRequest] = useState({
        request_type: 'workspace_export' as DataRequestCreateType,
        subject_email: '',
        candidate_id: '',
        notes: '',
        confirmation: '',
    });

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        fetchSettings({ signal: controller.signal })
            .then((payload) => {
                setSettingsPayload(payload);
                setDraft(payload);
            })
            .catch((err) => {
                if (err instanceof DOMException && err.name === 'AbortError') return;
                setError(err instanceof Error ? err.message : 'Unable to load settings.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!['account', 'subscription', 'payment'].includes(activeTab)) return;
        const controller = new AbortController();
        setBillingLoading(true);
        setBillingError(null);
        setPaymentError(null);

        const billingLoads: Promise<unknown>[] = [
            fetchBillingSummary(),
        ];
        if (activeTab === 'subscription') billingLoads.push(fetchBillingCatalog());
        if (activeTab === 'payment') {
            billingLoads.push(fetchPaymentSettings({ signal: controller.signal }));
        }

        Promise.allSettled(billingLoads)
            .then((results) => {
                if (controller.signal.aborted) return;
                const [summaryResult, catalogResult, paymentResult] = results;
                if (summaryResult.status === 'fulfilled') setBillingSummary(summaryResult.value as BillingSummary);
                if (summaryResult.status === 'rejected' && activeTab !== 'account') {
                    setBillingError(summaryResult.reason instanceof Error ? summaryResult.reason.message : 'Unable to load billing summary.');
                }
                if (activeTab === 'subscription') {
                    if (catalogResult?.status === 'fulfilled') setBillingCatalog(catalogResult.value as BillingCatalogResponse);
                    if (catalogResult?.status === 'rejected') {
                        setBillingError(catalogResult.reason instanceof Error ? catalogResult.reason.message : 'Unable to load subscription catalog.');
                    }
                }
                if (activeTab === 'payment') {
                    if (catalogResult?.status === 'fulfilled') setPaymentSettings(catalogResult.value as PaymentSettingsResponse);
                    if (catalogResult?.status === 'rejected') {
                        setPaymentError(catalogResult.reason instanceof Error ? catalogResult.reason.message : 'Unable to load payment settings.');
                    }
                    if (paymentResult?.status === 'fulfilled') setPaymentSettings(paymentResult.value as PaymentSettingsResponse);
                    if (paymentResult?.status === 'rejected') {
                        setPaymentError(paymentResult.reason instanceof Error ? paymentResult.reason.message : 'Unable to load payment settings.');
                    }
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setBillingLoading(false);
            });

        return () => controller.abort();
    }, [activeTab]);

    function switchTab(tab: SettingsTab) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`/dashboard/settings?${params.toString()}`);
    }

    function markDirty(section: SettingsTab) {
        setDirtySections((prev) => new Set(prev).add(section));
        setNotice(null);
        setError(null);
    }

    function updateDraft<K extends keyof SettingsPayload>(key: K, value: SettingsPayload[K], section: SettingsTab) {
        setDraft((prev) => prev ? { ...prev, [key]: value } : prev);
        markDirty(section);
    }

    function resetSection(section: SettingsTab) {
        if (!settingsPayload) return;
        setDraft((prev) => {
            if (!prev) return prev;
            if (section === 'account') return { ...prev, account: settingsPayload.account };
            if (section === 'workspace') return { ...prev, workspace: settingsPayload.workspace };
            if (section === 'outreach') return { ...prev, outreach_defaults: settingsPayload.outreach_defaults };
            if (section === 'compliance') return { ...prev, compliance: settingsPayload.compliance };
            if (section === 'notifications') return { ...prev, notifications: settingsPayload.notifications };
            return prev;
        });
        setDirtySections((prev) => {
            const next = new Set(prev);
            next.delete(section);
            return next;
        });
    }

    async function saveSection(section: SettingsTab) {
        if (!draft) return;
        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            let next: SettingsPayload;
            if (section === 'account') next = await updateAccountSettings(draft.account);
            else if (section === 'workspace') next = await updateWorkspaceSettings(draft.workspace as Partial<WorkspaceSettings>);
            else if (section === 'outreach') next = await updateOutreachDefaults(draft.outreach_defaults as Partial<OutreachDefaults>);
            else if (section === 'compliance') next = await updateComplianceSettings(draft.compliance as Partial<ComplianceSettings>);
            else if (section === 'notifications') next = await updateNotificationSettings(draft.notifications as Partial<NotificationSettings>);
            else return;
            setSettingsPayload(next);
            setDraft(next);
            setDirtySections((prev) => {
                const nextDirty = new Set(prev);
                nextDirty.delete(section);
                return nextDirty;
            });
            setNotice('Settings saved.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save settings.');
        } finally {
            setSaving(false);
        }
    }

    async function handleReferralInvite() {
        if (!referralEmail.trim()) {
            setError('Enter an email address to invite.');
            return;
        }
        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            const response = await inviteReferral(referralEmail.trim());
            setReferralEmail('');
            setSettingsPayload((prev) => prev ? { ...prev, referral: response.referral } : prev);
            setDraft((prev) => prev ? { ...prev, referral: response.referral } : prev);
            setNotice(`Referral invite sent to ${response.invite.email_masked}.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to send referral invite.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDataRequest() {
        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            const created = await createDataRequest({
                request_type: dataRequest.request_type,
                subject_email: dataRequest.subject_email || null,
                candidate_id: dataRequest.candidate_id || null,
                notes: dataRequest.notes || null,
                confirmation: dataRequest.confirmation || null,
            });
            setSettingsPayload((prev) => prev ? { ...prev, data_requests: [created, ...prev.data_requests] } : prev);
            setDraft((prev) => prev ? { ...prev, data_requests: [created, ...prev.data_requests] } : prev);
            setDataRequest({ request_type: 'workspace_export', subject_email: '', candidate_id: '', notes: '', confirmation: '' });
            setNotice('Data request recorded for review.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create data request.');
        } finally {
            setSaving(false);
        }
    }

    async function handleAccountDeletionRequest() {
        const expected = draft?.account.account_deletion_confirmation_text || 'DELETE ACCOUNT';
        if (accountDeletion.confirmation.trim() !== expected) {
            setError(`Type ${expected} to request account deletion.`);
            return;
        }
        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            const created = await requestAccountDeletion({
                confirmation: accountDeletion.confirmation,
                reason: accountDeletion.reason || null,
            });
            const refreshed = await fetchSettings().catch(() => null);
            if (refreshed) {
                setSettingsPayload(refreshed);
                setDraft(refreshed);
            } else {
                setSettingsPayload((prev) => prev ? { ...prev, data_requests: [created, ...prev.data_requests] } : prev);
                setDraft((prev) => prev ? { ...prev, data_requests: [created, ...prev.data_requests] } : prev);
            }
            setAccountDeletion({ confirmation: '', reason: '' });
            setNotice('Account deletion request recorded.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to request account deletion.');
        } finally {
            setSaving(false);
        }
    }

    async function openPortal(flowType?: 'subscription_update' | 'subscription_cancel' | 'payment_method_update', tab: SettingsTab = activeTab) {
        const key = flowType || 'portal';
        setBillingActionKey(key);
        setError(null);
        setNotice(null);
        try {
            const response = await createBillingPortal(`/dashboard/settings?tab=${tab}`, flowType);
            redirectToExternal(response.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to open Stripe billing portal.');
        } finally {
            setBillingActionKey(null);
        }
    }

    async function startSubscriptionCheckout(planKey: 'starter' | 'growth' | 'pro' | 'enterprise', interval: 'month' | 'year') {
        const key = `${planKey}:${interval}`;
        setBillingActionKey(key);
        setError(null);
        setNotice(null);
        try {
            const response = await createSubscriptionCheckout({
                plan_key: planKey,
                interval,
                success_path: '/dashboard/settings?tab=subscription',
                cancel_path: '/dashboard/settings?tab=subscription',
            });
            redirectToExternal(response.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to start Stripe checkout.');
        } finally {
            setBillingActionKey(null);
        }
    }

    async function copyText(value: string) {
        try {
            await navigator.clipboard.writeText(value);
            setNotice('Copied.');
        } catch {
            setError('Unable to copy from this browser.');
        }
    }

    if (loading) {
        return (
            <main className={styles.page}>
                <p className={styles.eyebrow}>Settings</p>
                <h1 className={styles.title}>Loading settings...</h1>
            </main>
        );
    }

    if (!draft) {
        return (
            <main className={styles.page}>
                <div className={styles.errorBanner}>{error || 'Settings unavailable.'}</div>
            </main>
        );
    }

    const account = draft.account;
    const workspace = draft.workspace;
    const outreach = draft.outreach_defaults;
    const compliance = draft.compliance;
    const notifications = draft.notifications;
    const activePlan = billingCatalog && billingSummary?.billing.plan_key
        ? billingCatalog.plans.find((plan) => plan.key === billingSummary.billing.plan_key) ?? null
        : null;
    const hasActiveSubscription = Boolean(
        billingSummary?.billing.subscription_status
        && ['active', 'trialing', 'past_due'].includes(billingSummary.billing.subscription_status),
    );
    const accountDeletionStatus = account.account_deletion;
    const accountDeletionConfirmationText = account.account_deletion_confirmation_text || 'DELETE ACCOUNT';

    return (
        <main className={styles.page}>
            <nav className={styles.tabs} aria-label="Settings sections">
                {tabs.map((tab) => (
                    <button key={tab.key} type="button" className={activeTab === tab.key ? styles.activeTab : styles.tab} onClick={() => switchTab(tab.key)}>
                        {tab.label}
                    </button>
                ))}
            </nav>

            {notice ? <div className={styles.successBanner}>{notice}</div> : null}
            {error ? <div className={styles.errorBanner}>{error}</div> : null}
            {dirtySections.size > 0 ? <div className={styles.banner}>You have unsaved edits. Save the active tab before leaving this screen.</div> : null}

            <div className={styles.layout}>
                <section className={styles.sectionStack}>
                    {activeTab === 'account' ? (
                        <>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h2 className={styles.cardTitle}>Account</h2>
                                        <p className={styles.cardText}>Your user profile and personal timezone. Email changes stay out of v1 to avoid account takeover risk.</p>
                                    </div>
                                    <span className={account.is_verified ? styles.successPill : styles.warningPill}>{account.is_verified ? 'Verified' : 'Unverified'}</span>
                                </div>
                                <div className={styles.formGrid}>
                                    <TextInput label="First name" value={account.first_name} onChange={(value) => updateDraft('account', { ...account, first_name: value }, 'account')} />
                                    <TextInput label="Last name" value={account.last_name} onChange={(value) => updateDraft('account', { ...account, last_name: value }, 'account')} />
                                    <TextInput label="Email" value={account.email} onChange={() => undefined} disabled />
                                    <label className={styles.field}>
                                        <span className={styles.label}>Timezone</span>
                                        <TahoeSelect size="3" value={account.timezone} onChange={(event) => updateDraft('account', { ...account, timezone: event.target.value }, 'account')}>
                                            {timezones.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
                                        </TahoeSelect>
                                    </label>
                                </div>
                                <SaveActions dirty={dirtySections.has('account')} saving={saving} onSave={() => saveSection('account')} onReset={() => resetSection('account')} />
                            </div>
                            <div className={`${styles.card} ${styles.dangerCard}`}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h2 className={styles.cardTitle}>Delete account request</h2>
                                        <p className={styles.cardText}>
                                            Request deletion of your Tahoe user account. Tahoe keeps records required for legal, billing, security, and abuse-prevention review.
                                        </p>
                                    </div>
                                    {accountDeletionStatus ? <span className={statusClass(accountDeletionStatus.status)}>{accountDeletionStatus.status}</span> : null}
                                </div>
                                {hasActiveSubscription ? (
                                    <div className={styles.banner}>An active subscription is attached to this workspace. Cancel it from the Subscription tab before final account deletion can be completed.</div>
                                ) : null}
                                {billingError ? (
                                    <div className={styles.banner}>Subscription status could not be refreshed: {billingError}</div>
                                ) : null}
                                {accountDeletionStatus ? (
                                    <div className={styles.statusItem}>
                                        <span>
                                            <strong>Latest request</strong><br />
                                            <span className={styles.muted}>{formatDate(accountDeletionStatus.requested_at)} · {accountDeletionStatus.message || 'Recorded for operator review.'}</span>
                                        </span>
                                        <span className={styles.mutedPill}>{accountDeletionStatus.request_id}</span>
                                    </div>
                                ) : null}
                                <div className={styles.formGrid} style={{ marginTop: 16 }}>
                                    <TextInput label={`Type ${accountDeletionConfirmationText}`} value={accountDeletion.confirmation} onChange={(value) => setAccountDeletion((prev) => ({ ...prev, confirmation: value }))} />
                                    <label className={styles.field}>
                                        <span className={styles.label}>Reason or notes</span>
                                        <textarea className={styles.textarea} value={accountDeletion.reason} onChange={(event) => setAccountDeletion((prev) => ({ ...prev, reason: event.target.value }))} />
                                    </label>
                                </div>
                                <div className={styles.actions}>
                                    <Button variant="soft" disabled={saving || accountDeletion.confirmation.trim() !== accountDeletionConfirmationText} onClick={handleAccountDeletionRequest}>
                                        {saving ? 'Submitting...' : 'Request account deletion'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : null}

                    {activeTab === 'workspace' ? (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h2 className={styles.cardTitle}>Workspace</h2>
                                    <p className={styles.cardText}>Company identity, billing contact, timezone, and physical address used across compliance defaults.</p>
                                </div>
                            </div>
                            <div className={styles.formGrid}>
                                <TextInput label="Workspace name" value={workspace.name} onChange={(value) => updateDraft('workspace', { ...workspace, name: value }, 'workspace')} />
                                <TextInput label="Billing contact email" value={workspace.billing_contact_email || ''} onChange={(value) => updateDraft('workspace', { ...workspace, billing_contact_email: value }, 'workspace')} />
                                <label className={styles.field}>
                                    <span className={styles.label}>Default timezone</span>
                                    <TahoeSelect size="3" value={workspace.timezone} onChange={(event) => updateDraft('workspace', { ...workspace, timezone: event.target.value }, 'workspace')}>
                                        {timezones.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
                                    </TahoeSelect>
                                </label>
                                <TextInput label="Company website" value={workspace.company_website || ''} onChange={(value) => updateDraft('workspace', { ...workspace, company_website: value }, 'workspace')} />
                                <AddressAutocompleteInput
                                    value={workspace.company_address || ''}
                                    meta={workspace.company_address_meta}
                                    onChange={(value, addressMeta) => updateDraft(
                                        'workspace',
                                        { ...workspace, company_address: value, company_address_meta: addressMeta },
                                        'workspace',
                                    )}
                                />
                            </div>
                            <SaveActions dirty={dirtySections.has('workspace')} saving={saving} onSave={() => saveSection('workspace')} onReset={() => resetSection('workspace')} />
                        </div>
                    ) : null}

                    {activeTab === 'subscription' ? (
                        <>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h2 className={styles.cardTitle}>Subscription</h2>
                                        <p className={styles.cardText}>Manage your Tahoe subscription tier, renewal, cancellation, and included monthly credits through Stripe-hosted flows.</p>
                                    </div>
                                    <span className={hasActiveSubscription ? styles.successPill : styles.mutedPill}>
                                        {billingSummary?.billing.subscription_status || 'no subscription'}
                                    </span>
                                </div>
                                {billingLoading ? <div className={styles.empty}>Loading subscription...</div> : (
                                    <>
                                        {billingError ? <div className={styles.banner}>{billingError}</div> : null}
                                        <div className={styles.metricGrid}>
                                            <div className={styles.metricBox}>
                                                <span className={styles.label}>Current plan</span>
                                                <strong>{hasActiveSubscription ? activePlan?.name || billingSummary?.billing.plan_key || 'Active plan' : 'No active subscription'}</strong>
                                                <span className={styles.muted}>{billingSummary?.billing.interval === 'year' ? 'Yearly billing' : billingSummary?.billing.interval === 'month' ? 'Monthly billing' : 'Checkout required'}</span>
                                            </div>
                                            <div className={styles.metricBox}>
                                                <span className={styles.label}>Renews on</span>
                                                <strong>{formatDate(billingSummary?.billing.current_period_end)}</strong>
                                                <span className={styles.muted}>{billingSummary?.billing.cancel_at_period_end ? 'Cancellation scheduled' : 'Subscription credits renew monthly'}</span>
                                            </div>
                                            <div className={styles.metricBox}>
                                                <span className={styles.label}>Included monthly credits</span>
                                                <strong>{(billingSummary?.monthly_included_credits || 0).toLocaleString()}</strong>
                                                <span className={styles.muted}>For search, enrichment, and outreach</span>
                                            </div>
                                            <div className={styles.metricBox}>
                                                <span className={styles.label}>Available credits</span>
                                                <strong>{(billingSummary?.available_credits || 0).toLocaleString()}</strong>
                                                <span className={styles.muted}>{(billingSummary?.reserved_credits || 0).toLocaleString()} reserved</span>
                                            </div>
                                        </div>
                                        {hasActiveSubscription ? (
                                            <div className={styles.actions}>
                                                <Button disabled={billingActionKey === 'subscription_update'} onClick={() => void openPortal('subscription_update', 'subscription')}>
                                                    {billingActionKey === 'subscription_update' ? 'Opening...' : 'Change plan in Stripe'}
                                                </Button>
                                                <Button variant="soft" disabled={billingActionKey === 'subscription_cancel'} onClick={() => void openPortal('subscription_cancel', 'subscription')}>
                                                    {billingActionKey === 'subscription_cancel' ? 'Opening...' : 'Cancel subscription'}
                                                </Button>
                                            </div>
                                        ) : null}
                                    </>
                                )}
                            </div>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h2 className={styles.cardTitle}>Plan options</h2>
                                        <p className={styles.cardText}>Yearly plans are billed annually at a discount but still grant credits monthly on your billing anchor date.</p>
                                    </div>
                                </div>
                                <div className={styles.planCards}>
                                    {(billingCatalog?.plans || []).map((plan) => (
                                        <div key={plan.key} className={styles.planCard}>
                                            <div>
                                                <span className={styles.eyebrow}>{plan.name}</span>
                                                <div className={styles.planPrice}>{formatPlanPrice(plan.monthly_price_usd)}</div>
                                                <p className={styles.muted}>or {formatPlanPrice(plan.yearly_price_usd)} / year</p>
                                            </div>
                                            <ul className={styles.statusList}>
                                                <li className={styles.statusItem}><span>Credits / month</span><strong>{plan.monthly_credits.toLocaleString()}</strong></li>
                                                <li className={styles.statusItem}><span>Mailboxes</span><strong>{plan.limits.mailboxes}</strong></li>
                                                <li className={styles.statusItem}><span>Active campaigns</span><strong>{plan.limits.active_campaigns}</strong></li>
                                            </ul>
                                            {!hasActiveSubscription ? (
                                                <div className={styles.actions}>
                                                    <Button variant="soft" disabled={billingActionKey === `${plan.key}:month`} onClick={() => void startSubscriptionCheckout(plan.key, 'month')}>
                                                        {billingActionKey === `${plan.key}:month` ? 'Opening...' : 'Monthly'}
                                                    </Button>
                                                    <Button disabled={billingActionKey === `${plan.key}:year`} onClick={() => void startSubscriptionCheckout(plan.key, 'year')}>
                                                        {billingActionKey === `${plan.key}:year` ? 'Opening...' : 'Yearly'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <p className={styles.muted}>Use Change plan in Stripe to upgrade, downgrade, or change billing interval safely.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : null}

                    {activeTab === 'payment' ? (
                        <>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h2 className={styles.cardTitle}>Payment</h2>
                                        <p className={styles.cardText}>Payment methods, billing details, tax details, and invoices are handled in Stripe. Tahoe only displays safe summaries.</p>
                                    </div>
                                    <span className={paymentSettings?.stripe_customer_id ? styles.successPill : styles.mutedPill}>
                                        {paymentSettings?.stripe_customer_id ? 'Stripe customer' : 'No Stripe customer'}
                                    </span>
                                </div>
                                {billingLoading ? <div className={styles.empty}>Loading payment settings...</div> : (
                                    <>
                                        {paymentError ? <div className={styles.banner}>{paymentError}</div> : null}
                                        {paymentSettings?.message ? <div className={styles.banner}>{paymentSettings.message}</div> : null}
                                        <div className={styles.metricGrid}>
                                            <div className={styles.metricBox}>
                                                <span className={styles.label}>Default payment method</span>
                                                <strong>{paymentMethodLabel(paymentSettings?.default_payment_method)}</strong>
                                                <span className={styles.muted}>
                                                    {paymentSettings?.default_payment_method?.exp_month && paymentSettings.default_payment_method.exp_year
                                                        ? `Expires ${paymentSettings.default_payment_method.exp_month}/${paymentSettings.default_payment_method.exp_year}`
                                                        : 'Managed in Stripe'}
                                                </span>
                                            </div>
                                            <div className={styles.metricBox}>
                                                <span className={styles.label}>Billing email</span>
                                                <strong>{paymentSettings?.billing_email || workspace.billing_contact_email || account.email}</strong>
                                                <span className={styles.muted}>Receipts and invoice emails are sent by Stripe.</span>
                                            </div>
                                            <div className={styles.metricBox}>
                                                <span className={styles.label}>Payment method removal</span>
                                                <strong>Stripe controlled</strong>
                                                <span className={styles.muted}>Replacement is supported; removal may be blocked for active subscriptions.</span>
                                            </div>
                                        </div>
                                        <div className={styles.actions}>
                                            <Button disabled={!paymentSettings?.can_update_payment_method || billingActionKey === 'payment_method_update'} onClick={() => void openPortal('payment_method_update', 'payment')}>
                                                {billingActionKey === 'payment_method_update' ? 'Opening...' : 'Update payment method'}
                                            </Button>
                                            <Button variant="soft" disabled={!paymentSettings?.stripe_configured || billingActionKey === 'portal'} onClick={() => void openPortal(undefined, 'payment')}>
                                                {billingActionKey === 'portal' ? 'Opening...' : 'Billing details and invoices'}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Recent invoices</h2>
                                {paymentSettings?.recent_invoices.length ? (
                                    <div className={styles.tableShell}>
                                        <table className={styles.table}>
                                            <thead><tr><th>Invoice</th><th>Status</th><th>Amount paid</th><th>Date</th><th>Link</th></tr></thead>
                                            <tbody>
                                                {paymentSettings.recent_invoices.map((invoice) => (
                                                    <tr key={invoice.id}>
                                                        <td>{invoice.number || invoice.id}</td>
                                                        <td><span className={statusClass(invoice.status || '')}>{invoice.status || 'unknown'}</span></td>
                                                        <td>{formatMoneyCents(invoice.amount_paid, invoice.currency)}</td>
                                                        <td>{formatDate(invoice.created_at)}</td>
                                                        <td>{invoice.hosted_invoice_url ? <a href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer">Open</a> : '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <div className={styles.empty}>No Stripe invoices are available yet.</div>}
                            </div>
                        </>
                    ) : null}

                    {activeTab === 'outreach' ? (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h2 className={styles.cardTitle}>Outreach defaults</h2>
                                    <p className={styles.cardText}>New campaigns use these defaults, while campaign-specific edits still override them.</p>
                                </div>
                            </div>
                            <div className={styles.formGrid}>
                                <TextInput label="Sender name" value={outreach.signature?.sender_name || ''} onChange={(value) => updateDraft('outreach_defaults', { ...outreach, signature: { sender_name: value, sender_email: outreach.signature?.sender_email || account.email, sender_phone: outreach.signature?.sender_phone || '', sender_address: outreach.signature?.sender_address || workspace.company_address || '', sender_website: outreach.signature?.sender_website || workspace.company_website || '' } }, 'outreach')} />
                                <TextInput label="Sender email" value={outreach.signature?.sender_email || ''} onChange={(value) => updateDraft('outreach_defaults', { ...outreach, signature: { sender_name: outreach.signature?.sender_name || account.first_name, sender_email: value, sender_phone: outreach.signature?.sender_phone || '', sender_address: outreach.signature?.sender_address || workspace.company_address || '', sender_website: outreach.signature?.sender_website || workspace.company_website || '' } }, 'outreach')} />
                                <TextInput label="Sender phone" value={outreach.signature?.sender_phone || ''} onChange={(value) => updateDraft('outreach_defaults', { ...outreach, signature: { sender_name: outreach.signature?.sender_name || account.first_name, sender_email: outreach.signature?.sender_email || account.email, sender_phone: value, sender_address: outreach.signature?.sender_address || workspace.company_address || '', sender_website: outreach.signature?.sender_website || workspace.company_website || '' } }, 'outreach')} />
                                <TextInput label="Sender website" value={outreach.signature?.sender_website || ''} onChange={(value) => updateDraft('outreach_defaults', { ...outreach, signature: { sender_name: outreach.signature?.sender_name || account.first_name, sender_email: outreach.signature?.sender_email || account.email, sender_phone: outreach.signature?.sender_phone || '', sender_address: outreach.signature?.sender_address || workspace.company_address || '', sender_website: value } }, 'outreach')} />
                                <label className={styles.wideField}>
                                    <span className={styles.label}>Sender physical address</span>
                                    <textarea className={styles.textarea} value={outreach.signature?.sender_address || ''} onChange={(event) => updateDraft('outreach_defaults', { ...outreach, signature: { sender_name: outreach.signature?.sender_name || account.first_name, sender_email: outreach.signature?.sender_email || account.email, sender_phone: outreach.signature?.sender_phone || '', sender_address: event.target.value, sender_website: outreach.signature?.sender_website || workspace.company_website || '' } }, 'outreach')} />
                                </label>
                                <TextInput label="Reply-to email" value={outreach.reply_to_email || ''} onChange={(value) => updateDraft('outreach_defaults', { ...outreach, reply_to_email: value }, 'outreach')} />
                                <label className={styles.field}>
                                    <span className={styles.label}>Send timezone</span>
                                    <TahoeSelect size="3" value={outreach.send_window_timezone} onChange={(event) => updateDraft('outreach_defaults', { ...outreach, send_window_timezone: event.target.value }, 'outreach')}>
                                        {timezones.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
                                    </TahoeSelect>
                                </label>
                                <TextInput label="Send window start" value={outreach.send_window_start} onChange={(value) => updateDraft('outreach_defaults', { ...outreach, send_window_start: value }, 'outreach')} />
                                <TextInput label="Send window end" value={outreach.send_window_end} onChange={(value) => updateDraft('outreach_defaults', { ...outreach, send_window_end: value }, 'outreach')} />
                                <label className={styles.wideField}>
                                    <span className={styles.label}>Unsubscribe footer</span>
                                    <textarea className={styles.textarea} value={outreach.unsubscribe_footer} onChange={(event) => updateDraft('outreach_defaults', { ...outreach, unsubscribe_footer: event.target.value }, 'outreach')} />
                                </label>
                            </div>
                            <SaveActions dirty={dirtySections.has('outreach')} saving={saving} onSave={() => saveSection('outreach')} onReset={() => resetSection('outreach')} />
                        </div>
                    ) : null}

                    {activeTab === 'compliance' ? (
                        <>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h2 className={styles.cardTitle}>Compliance & data</h2>
                                        <p className={styles.cardText}>Controls for retention, privacy contact, and data request intake. Tahoe provides workflow controls, not legal advice.</p>
                                    </div>
                                </div>
                                <div className={styles.formGrid}>
                                    <TextInput label="Retention days" type="number" value={String(compliance.retention_days)} onChange={(value) => updateDraft('compliance', { ...compliance, retention_days: Number(value) || 365 }, 'compliance')} />
                                    <TextInput label="Privacy contact email" value={compliance.privacy_contact_email || ''} onChange={(value) => updateDraft('compliance', { ...compliance, privacy_contact_email: value }, 'compliance')} />
                                    <TextInput label="Privacy policy URL" value={compliance.privacy_policy_url || ''} onChange={(value) => updateDraft('compliance', { ...compliance, privacy_policy_url: value }, 'compliance')} />
                                    <TextInput label="Terms URL" value={compliance.terms_url || ''} onChange={(value) => updateDraft('compliance', { ...compliance, terms_url: value }, 'compliance')} />
                                    <label className={styles.wideField}>
                                        <span className={styles.label}>Legal basis note</span>
                                        <textarea className={styles.textarea} value={compliance.legal_basis_note} onChange={(event) => updateDraft('compliance', { ...compliance, legal_basis_note: event.target.value }, 'compliance')} />
                                    </label>
                                </div>
                                <SaveActions dirty={dirtySections.has('compliance')} saving={saving} onSave={() => saveSection('compliance')} onReset={() => resetSection('compliance')} />
                            </div>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h2 className={styles.cardTitle}>Data request intake</h2>
                                        <p className={styles.cardText}>Record export, delete, anonymize, and workspace deletion requests for operator review.</p>
                                    </div>
                                </div>
                                <div className={styles.formGrid}>
                                    <label className={styles.field}>
                                        <span className={styles.label}>Request type</span>
                                        <TahoeSelect size="3" value={dataRequest.request_type} onChange={(event) => setDataRequest((prev) => ({ ...prev, request_type: event.target.value as DataRequestCreateType }))}>
                                            <option value="workspace_export">Workspace export</option>
                                            <option value="workspace_delete">Workspace delete</option>
                                            <option value="candidate_export">Candidate export</option>
                                            <option value="candidate_delete">Candidate delete</option>
                                            <option value="candidate_anonymize">Candidate anonymize</option>
                                        </TahoeSelect>
                                    </label>
                                    <TextInput label="Subject email" value={dataRequest.subject_email} onChange={(value) => setDataRequest((prev) => ({ ...prev, subject_email: value }))} />
                                    <TextInput label="Candidate id" value={dataRequest.candidate_id} onChange={(value) => setDataRequest((prev) => ({ ...prev, candidate_id: value }))} />
                                    <TextInput label="Confirmation" value={dataRequest.confirmation} onChange={(value) => setDataRequest((prev) => ({ ...prev, confirmation: value }))} />
                                    <label className={styles.wideField}>
                                        <span className={styles.label}>Notes</span>
                                        <textarea className={styles.textarea} value={dataRequest.notes} onChange={(event) => setDataRequest((prev) => ({ ...prev, notes: event.target.value }))} />
                                    </label>
                                </div>
                                <div className={styles.actions}>
                                    <Button disabled={saving} onClick={handleDataRequest}>{saving ? 'Submitting...' : 'Create data request'}</Button>
                                </div>
                            </div>
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Recent data requests</h2>
                                {draft.data_requests.length === 0 ? <div className={styles.empty}>No data requests yet.</div> : (
                                    <div className={styles.tableShell}>
                                        <table className={styles.table}>
                                            <thead><tr><th>Type</th><th>Status</th><th>Subject</th><th>Created</th></tr></thead>
                                            <tbody>
                                                {draft.data_requests.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>{requestLabel(item.request_type)}</td>
                                                        <td><span className={statusClass(item.status)}>{item.status}</span></td>
                                                        <td>{item.subject_email_masked || item.candidate_id || 'Workspace'}</td>
                                                        <td>{formatDate(item.created_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}

                    {activeTab === 'referrals' ? (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h2 className={styles.cardTitle}>Referrals</h2>
                                    <p className={styles.cardText}>Invite another recruiter. They use your code in Stripe Checkout; your reward is issued after their first paid subscription invoice.</p>
                                </div>
                            </div>
                            <div className={styles.copyCode}>
                                <span className={styles.code}>{draft.referral.referral_code}</span>
                                <Button variant="soft" onClick={() => copyText(draft.referral.referral_code)}>Copy code</Button>
                                <Button variant="soft" onClick={() => copyText(draft.referral.share_url)}>Copy link</Button>
                            </div>
                            <ul className={styles.termsList}>
                                <li className={styles.statusItem}><span>Referred workspace discount</span><span className={styles.pill}>{draft.referral.referee_discount_percent}% off first invoice</span></li>
                                <li className={styles.statusItem}><span>Referrer reward</span><span className={styles.pill}>{draft.referral.referrer_reward_percent}% off next invoice</span></li>
                                <li className={styles.statusItem}><span>Applies to</span><span className={styles.mutedPill}>Subscriptions only</span></li>
                            </ul>
                            <div className={styles.formGrid} style={{ marginTop: 18 }}>
                                <TextInput label="Invite email" value={referralEmail} onChange={setReferralEmail} />
                            </div>
                            <div className={styles.actions}>
                                <Button disabled={saving} onClick={handleReferralInvite}>{saving ? 'Sending...' : 'Send referral invite'}</Button>
                            </div>
                            <h3 className={styles.cardTitle} style={{ marginTop: 28 }}>Referral activity</h3>
                            {draft.referral.invites.length === 0 ? <div className={styles.empty}>No referral invites yet.</div> : (
                                <div className={styles.tableShell}>
                                    <table className={styles.table}>
                                        <thead><tr><th>Email</th><th>Status</th><th>Sent</th><th>Converted</th><th>Reward</th></tr></thead>
                                        <tbody>
                                            {draft.referral.invites.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.email_masked}</td>
                                                    <td><span className={statusClass(item.status)}>{item.status.replaceAll('_', ' ')}</span></td>
                                                    <td>{formatDate(item.sent_at)}</td>
                                                    <td>{formatDate(item.converted_at)}</td>
                                                    <td>{formatDate(item.reward_issued_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {activeTab === 'integrations' ? (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h2 className={styles.cardTitle}>Integrations</h2>
                                    <p className={styles.cardText}>Provider and platform connection state. Actions still live in their dedicated Tahoe sections.</p>
                                </div>
                            </div>
                            <ul className={styles.statusList}>
                                {draft.integrations.map((item) => (
                                    <li className={styles.statusItem} key={item.key}>
                                        <span><strong>{item.label}</strong><br /><span className={styles.muted}>{item.detail}</span></span>
                                        <span className={statusClass(item.status)}>{item.status.replaceAll('_', ' ')}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {activeTab === 'notifications' ? (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h2 className={styles.cardTitle}>Notifications</h2>
                                    <p className={styles.cardText}>Choose which Tahoe app-specific emails to send. Stripe receipts and billing reminders stay in Stripe.</p>
                                </div>
                            </div>
                            {Object.entries(notifications).map(([key, value]) => (
                                <div className={styles.toggleRow} key={key}>
                                    <div>
                                        <strong>{key.replaceAll('_', ' ')}</strong>
                                        <p className={styles.muted}>App-specific Tahoe notification</p>
                                    </div>
                                    <Switch checked={Boolean(value)} onCheckedChange={(checked) => updateDraft('notifications', { ...notifications, [key]: checked }, 'notifications')} />
                                </div>
                            ))}
                            <SaveActions dirty={dirtySections.has('notifications')} saving={saving} onSave={() => saveSection('notifications')} onReset={() => resetSection('notifications')} />
                        </div>
                    ) : null}

                    {activeTab === 'security' ? (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h2 className={styles.cardTitle}>Security</h2>
                                    <p className={styles.cardText}>Authentication posture and sensitive-settings history. Session management, 2FA, and SSO are prepared as future controls.</p>
                                </div>
                                <span className={draft.security.email_verified ? styles.successPill : styles.warningPill}>{draft.security.email_verified ? 'Email verified' : 'Verify email'}</span>
                            </div>
                            <ul className={styles.statusList}>
                                <li className={styles.statusItem}><span>Auth methods</span><span className={styles.pill}>{draft.security.auth_methods.join(', ') || 'password'}</span></li>
                                <li className={styles.statusItem}><span>Active session management</span><span className={styles.mutedPill}>Planned</span></li>
                                <li className={styles.statusItem}><span>Two-factor authentication</span><span className={styles.mutedPill}>Planned</span></li>
                                <li className={styles.statusItem}><span>SSO</span><span className={styles.mutedPill}>Enterprise</span></li>
                            </ul>
                            <h3 className={styles.cardTitle} style={{ marginTop: 28 }}>Recent sensitive changes</h3>
                            {draft.security.recent_sensitive_events.length === 0 ? <div className={styles.empty}>No sensitive settings changes yet.</div> : (
                                <div className={styles.tableShell}>
                                    <table className={styles.table}>
                                        <thead><tr><th>Event</th><th>Target</th><th>Time</th></tr></thead>
                                        <tbody>
                                            {draft.security.recent_sensitive_events.map((event) => (
                                                <tr key={event.id}>
                                                    <td>{event.event_type}</td>
                                                    <td>{event.target}</td>
                                                    <td>{formatDate(event.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : null}
                </section>
            </div>
        </main>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <main className={styles.page}>
                <p className={styles.eyebrow}>Settings</p>
                <h1 className={styles.title}>Loading settings...</h1>
            </main>
        }>
            <SettingsPageContent />
        </Suspense>
    );
}
