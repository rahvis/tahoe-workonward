'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, TahoeSelect, TextField } from '@/components/ui/tahoe-ui';
import {
    composeCampaignMessage,
    createCampaign,
    fetchList,
    fetchListCandidates,
    fetchLists,
    fetchMailboxes,
    fetchProjects,
    fetchSettings,
    launchCampaign,
    type CampaignSchedule,
    type ListCandidateRow,
    type ListSummary,
    type MailboxSummary,
    type OutreachSignature,
    type OutreachStep,
    type ProjectSummary,
} from '@/lib/organization';
import styles from '../../outreach.module.css';

type BuilderStep = 'audience' | 'ai-message' | 'sequence' | 'signature' | 'schedule' | 'review';

const BUILDER_STEPS: Array<{ key: BuilderStep; label: string }> = [
    { key: 'audience', label: 'Audience' },
    { key: 'ai-message', label: 'AI Message' },
    { key: 'sequence', label: 'Sequence' },
    { key: 'signature', label: 'Signature' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'review', label: 'Review' },
];

const WEEKDAYS = [
    { value: 1, label: 'M' },
    { value: 2, label: 'T' },
    { value: 3, label: 'W' },
    { value: 4, label: 'T' },
    { value: 5, label: 'F' },
    { value: 6, label: 'S' },
    { value: 7, label: 'S' },
];

const DEFAULT_STEP: BuilderStep = 'audience';

const SIGNATURE_FIELDS: Array<{ key: keyof OutreachSignature; label: string; required: boolean }> = [
    { key: 'sender_name', label: 'Name', required: true },
    { key: 'sender_email', label: 'Email', required: true },
    { key: 'sender_phone', label: 'Phone', required: true },
    { key: 'sender_address', label: 'Address', required: true },
    { key: 'sender_website', label: 'Website', required: false },
];

function isBuilderStep(value: string | null): value is BuilderStep {
    return BUILDER_STEPS.some((step) => step.key === value);
}

function stepFromParam(value: string | null): BuilderStep {
    return isBuilderStep(value) ? value : DEFAULT_STEP;
}

function firstEmail(candidate: ListCandidateRow) {
    return candidate.contact?.work_email?.value || candidate.contact?.personal_email?.value || '';
}

function defaultStep(): OutreachStep {
    return {
        step_order: 1,
        subject: 'Quick note for {{first_name}}',
        body_text: 'Hi {{first_name}},\n\nI came across your background at {{company_name}} and thought it could be relevant to a role I am working on.\n\nWould you be open to a brief conversation this week?',
        body_html: null,
        delay_days: 0,
        mailbox_id: null,
        send_after_local: '09:00',
        daily_cap: null,
    };
}

function defaultSchedule(): CampaignSchedule {
    return {
        timezone: 'America/Los_Angeles',
        launch_mode: 'now',
        start_at: null,
        weekdays: [1, 2, 3, 4, 5],
        window_start_local: '09:00',
        window_end_local: '17:00',
        daily_campaign_cap: 100,
        min_spacing_minutes: 3,
        max_spacing_minutes: 7,
    };
}

function formatDate(value?: string | null) {
    if (!value) return 'Recent';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recent';
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function scheduleLabel(step: OutreachStep, index: number) {
    if (index === 0 || step.delay_days <= 0) return `Immediate at ${step.send_after_local || 'window start'}`;
    return `+${step.delay_days} business day${step.delay_days === 1 ? '' : 's'} at ${step.send_after_local || 'window start'}`;
}

function localStartAt(schedule: CampaignSchedule) {
    if (schedule.launch_mode !== 'scheduled' || !schedule.start_at) return '';
    const date = new Date(schedule.start_at);
    if (Number.isNaN(date.getTime())) return '';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
}

function fromLocalStartAt(value: string) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function positiveNumber(value: unknown, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function NewCampaignContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initialListId = searchParams.get('list_id') || '';
    const [activeStep, setActiveStep] = useState<BuilderStep>(() => stepFromParam(searchParams.get('step')));
    const [selectedListId, setSelectedListId] = useState(initialListId);
    const [list, setList] = useState<ListSummary | null>(null);
    const [lists, setLists] = useState<ListSummary[]>([]);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [candidates, setCandidates] = useState<ListCandidateRow[]>([]);
    const [mailboxes, setMailboxes] = useState<MailboxSummary[]>([]);
    const [name, setName] = useState('New outreach campaign');
    const [mailboxId, setMailboxId] = useState('');
    const [roleContext, setRoleContext] = useState('');
    const [steps, setSteps] = useState<OutreachStep[]>([defaultStep()]);
    const [selectedStepIndex, setSelectedStepIndex] = useState(0);
    const [schedule, setSchedule] = useState<CampaignSchedule>(defaultSchedule);
    const [scheduleNumberInputs, setScheduleNumberInputs] = useState({
        daily_campaign_cap: '100',
        min_spacing_minutes: '3',
        max_spacing_minutes: '7',
    });
    const [signature, setSignature] = useState<OutreachSignature>({
        sender_name: '',
        sender_email: '',
        sender_phone: '',
        sender_address: '',
        sender_website: '',
    });
    const [listSearchInput, setListSearchInput] = useState('');
    const [projectFilter, setProjectFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [listsLoading, setListsLoading] = useState(false);
    const [audienceLoading, setAudienceLoading] = useState(Boolean(initialListId));
    const [generating, setGenerating] = useState(false);
    const [launching, setLaunching] = useState(false);
    const [launchSuccessId, setLaunchSuccessId] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const audienceRequestRef = useRef(0);
    const listCacheRef = useRef(new Map<string, { list: ListSummary; candidates: ListCandidateRow[] }>());
    const signatureTouchedRef = useRef(false);
    const launchTimerRef = useRef<number | null>(null);

    useEffect(() => () => {
        if (launchTimerRef.current != null) window.clearTimeout(launchTimerRef.current);
    }, []);

    function replaceBuilderUrl(nextStep: BuilderStep, nextListId: string) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('step', nextStep);
        if (nextListId) params.set('list_id', nextListId);
        else params.delete('list_id');
        const suffix = params.toString();
        router.replace(`${pathname}${suffix ? `?${suffix}` : ''}`, { scroll: false });
    }

    function switchStep(step: BuilderStep) {
        setActiveStep(step);
        replaceBuilderUrl(step, selectedListId);
    }

    const applySelectedList = useCallback((listItem: ListSummary, candidateItems: ListCandidateRow[]) => {
        setList(listItem);
        setCandidates(candidateItems);
        setLists((current) => {
            if (current.some((item) => item.id === listItem.id)) return current;
            return [listItem, ...current];
        });
        setName((current) => {
            if (nameTouched) return current;
            if (current === 'New outreach campaign' || current.endsWith(' outreach')) {
                return `${listItem.name} outreach`;
            }
            return current;
        });
    }, [nameTouched]);

    function selectList(listId: string) {
        setSelectedListId(listId);
        setError('');
        setNotice('');
        replaceBuilderUrl(activeStep, listId);
    }

    useEffect(() => {
        let cancelled = false;
        async function loadSetup() {
            setLoading(true);
            try {
                const [mailboxItems, settingsPayload, listItems, projectItems] = await Promise.all([
                    fetchMailboxes(),
                    fetchSettings(),
                    fetchLists(),
                    fetchProjects({ archived: false }),
                ]);
                if (cancelled) return;
                setMailboxes(mailboxItems);
                setLists(listItems);
                setProjects(projectItems);
                const firstHealthy = mailboxItems.find((mailbox) => mailbox.status === 'healthy');
                if (firstHealthy) setMailboxId((current) => current || firstHealthy.id);
                setSchedule((current) => ({
                    ...current,
                    window_start_local: settingsPayload.outreach_defaults.send_window_start || firstHealthy?.send_window.start_local || current.window_start_local,
                    window_end_local: settingsPayload.outreach_defaults.send_window_end || firstHealthy?.send_window.end_local || current.window_end_local,
                    daily_campaign_cap: firstHealthy?.daily_cap || current.daily_campaign_cap,
                }));
                if (!signatureTouchedRef.current) {
                    const defaultSignature = settingsPayload.outreach_defaults.signature;
                    const accountName = [settingsPayload.account.first_name, settingsPayload.account.last_name].filter(Boolean).join(' ').trim();
                    setSignature((current) => ({
                        sender_name: current.sender_name || defaultSignature?.sender_name || accountName,
                        sender_email: current.sender_email || defaultSignature?.sender_email || firstHealthy?.email || settingsPayload.account.email,
                        sender_phone: current.sender_phone || defaultSignature?.sender_phone || settingsPayload.workspace.company_phone || '',
                        sender_address: current.sender_address || defaultSignature?.sender_address || settingsPayload.workspace.company_address || '',
                        sender_website: current.sender_website || defaultSignature?.sender_website || settingsPayload.workspace.company_website || '',
                    }));
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load campaign setup.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void loadSetup();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const search = listSearchInput.trim();
        let cancelled = false;
        const timer = window.setTimeout(() => {
            async function loadLists() {
                setListsLoading(true);
                try {
                    const items = await fetchLists({ search: search || null });
                    if (!cancelled) setLists(items);
                } catch (err) {
                    if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load lists.');
                } finally {
                    if (!cancelled) setListsLoading(false);
                }
            }
            void loadLists();
        }, 250);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [listSearchInput]);

    useEffect(() => {
        const requestId = audienceRequestRef.current + 1;
        audienceRequestRef.current = requestId;
        if (!selectedListId) {
            setList(null);
            setCandidates([]);
            setAudienceLoading(false);
            return;
        }
        const cached = listCacheRef.current.get(selectedListId);
        if (cached) {
            applySelectedList(cached.list, cached.candidates);
            setAudienceLoading(false);
            return;
        }
        let cancelled = false;
        async function loadAudience() {
            setAudienceLoading(true);
            try {
                const [listItem, candidatePage] = await Promise.all([
                    fetchList(selectedListId),
                    fetchListCandidates(selectedListId, { limit: 100 }),
                ]);
                if (cancelled || audienceRequestRef.current !== requestId) return;
                listCacheRef.current.set(selectedListId, { list: listItem, candidates: candidatePage.items });
                applySelectedList(listItem, candidatePage.items);
            } catch (err) {
                if (!cancelled && audienceRequestRef.current === requestId) {
                    setError(err instanceof Error ? err.message : 'Unable to load selected list.');
                    setList(null);
                    setCandidates([]);
                }
            } finally {
                if (!cancelled && audienceRequestRef.current === requestId) setAudienceLoading(false);
            }
        }
        void loadAudience();
        return () => {
            cancelled = true;
        };
    }, [selectedListId, applySelectedList]);

    const eligibleCount = useMemo(() => candidates.filter((candidate) => firstEmail(candidate)).length, [candidates]);
    const suppressedCount = Math.max(0, candidates.length - eligibleCount);
    const selectedMailbox = mailboxes.find((mailbox) => mailbox.id === mailboxId) ?? null;
    const activeIndex = BUILDER_STEPS.findIndex((step) => step.key === activeStep);
    const activeLabel = BUILDER_STEPS[activeIndex]?.label || 'Audience';
    const selectedStep = steps[Math.min(selectedStepIndex, steps.length - 1)] || steps[0];
    const filteredLists = useMemo(() => {
        const needle = listSearchInput.trim().toLowerCase();
        return lists.filter((item) => {
            if (projectFilter && item.project_id !== projectFilter) return false;
            if (!needle) return true;
            return `${item.name} ${item.project_name || ''}`.toLowerCase().includes(needle);
        });
    }, [lists, projectFilter, listSearchInput]);
    const launchBlockedReason = useMemo<string | null>(() => {
        if (!selectedListId) return 'Pick a list to send from.';
        if (!mailboxId) return 'Connect a healthy mailbox in Schedule.';
        if (eligibleCount === 0) return 'No candidates in this list have an email yet.';
        if (steps.some((step) => !step.subject.trim() || !step.body_text.trim())) return 'Every email step needs a subject and body.';
        if (steps.some((step) => step.delay_days < 0 || (step.daily_cap != null && step.daily_cap < 1))) return 'Fix invalid step delay or cap values.';
        if (schedule.daily_campaign_cap < 1 || schedule.min_spacing_minutes < 1 || schedule.max_spacing_minutes < schedule.min_spacing_minutes) {
            return 'Fix schedule caps and spacing before launch.';
        }
        if (schedule.window_end_local <= schedule.window_start_local) return 'Send window end must be after the start time.';
        if (!signature.sender_name.trim() || !signature.sender_email.trim() || !signature.sender_phone.trim() || !signature.sender_address.trim()) {
            return 'Fill the required signature fields.';
        }
        return null;
    }, [selectedListId, mailboxId, eligibleCount, steps, schedule, signature]);
    const launchReady = launchBlockedReason === null;
    const stepBlockedReason = useMemo<Record<BuilderStep, string | null>>(() => {
        const messageInvalid = steps.some((step) => !step.subject.trim() || !step.body_text.trim());
        const stepValuesInvalid = steps.some((step) => step.delay_days < 0 || (step.daily_cap != null && step.daily_cap < 1));
        const scheduleInvalid = schedule.daily_campaign_cap < 1 || schedule.min_spacing_minutes < 1 || schedule.max_spacing_minutes < schedule.min_spacing_minutes;
        const windowInvalid = schedule.window_end_local <= schedule.window_start_local;
        const signatureIncomplete = !signature.sender_name.trim() || !signature.sender_email.trim() || !signature.sender_phone.trim() || !signature.sender_address.trim();
        return {
            audience: !selectedListId
                ? 'Pick a list to send from.'
                : audienceLoading
                    ? 'Loading candidates…'
                    : eligibleCount === 0
                        ? 'No candidates in this list have an email yet.'
                        : null,
            'ai-message': messageInvalid ? 'Add a subject and body for every email.' : null,
            sequence: messageInvalid
                ? 'Add a subject and body for every email.'
                : stepValuesInvalid
                    ? 'Fix invalid step delay or cap values.'
                    : null,
            signature: signatureIncomplete ? 'Fill the required signature fields.' : null,
            schedule: !mailboxId
                ? 'Connect a healthy mailbox.'
                : scheduleInvalid
                    ? 'Fix schedule caps and spacing.'
                    : windowInvalid
                        ? 'Send window end must be after the start time.'
                        : null,
            review: launchBlockedReason,
        };
    }, [selectedListId, audienceLoading, eligibleCount, steps, schedule, signature, mailboxId, launchBlockedReason]);
    const currentStepBlockedReason = stepBlockedReason[activeStep];
    const firstBlockedIndex = BUILDER_STEPS.findIndex((step) => stepBlockedReason[step.key] != null);
    const maxReachableIndex = firstBlockedIndex === -1 ? BUILDER_STEPS.length - 1 : firstBlockedIndex;

    function updateSchedule(patch: Partial<CampaignSchedule>) {
        setSchedule((current) => ({ ...current, ...patch }));
    }

    function updateScheduleNumber(key: 'daily_campaign_cap' | 'min_spacing_minutes' | 'max_spacing_minutes', value: string) {
        setScheduleNumberInputs((current) => ({ ...current, [key]: value }));
        const parsed = Number(value);
        updateSchedule({ [key]: Number.isFinite(parsed) ? parsed : 0 });
    }

    function updateStep(index: number, patch: Partial<OutreachStep>) {
        setSteps((current) => current.map((step, stepIndex) => (stepIndex === index ? { ...step, ...patch } : step)));
    }

    async function handleGenerate() {
        if (!selectedListId) {
            setError('Choose a list before generating outreach.');
            return;
        }
        if (eligibleCount === 0) {
            setError('Add candidates with email data before generating outreach.');
            return;
        }
        setGenerating(true);
        setError('');
        try {
            const response = await composeCampaignMessage({
                list_id: selectedListId,
                role_context: roleContext || 'Recruiter outreach to qualified candidates for a relevant role.',
                followup_count: Math.max(0, steps.length - 1),
            });
            setSteps([
                {
                    step_order: 1,
                    subject: response.subject,
                    body_text: response.body_text,
                    body_html: response.body_html,
                    delay_days: 0,
                    mailbox_id: null,
                    send_after_local: schedule.window_start_local,
                    daily_cap: null,
                },
                ...response.followups.map((step, index) => ({
                    ...step,
                    step_order: index + 2,
                    mailbox_id: step.mailbox_id ?? null,
                    send_after_local: step.send_after_local || schedule.window_start_local,
                    daily_cap: step.daily_cap ?? null,
                })),
            ]);
            setSelectedStepIndex(0);
            setNotice('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to generate outreach.');
        } finally {
            setGenerating(false);
        }
    }

    function addFollowup() {
        setSteps((current) => {
            const next = [
                ...current,
                {
                    step_order: current.length + 1,
                    subject: 'Following up, {{first_name}}',
                    body_text: 'Hi {{first_name}},\n\nWanted to follow up on my previous note. Would it be worth a quick conversation?',
                    body_html: null,
                    delay_days: 3,
                    mailbox_id: null,
                    send_after_local: schedule.window_start_local,
                    daily_cap: null,
                },
            ];
            setSelectedStepIndex(next.length - 1);
            return next;
        });
    }

    function removeStep(index: number) {
        setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index).map((step, stepIndex) => ({ ...step, step_order: stepIndex + 1 })));
        setSelectedStepIndex((current) => Math.max(0, Math.min(current, steps.length - 2)));
    }

    function updateSignatureField(key: keyof OutreachSignature, value: string) {
        signatureTouchedRef.current = true;
        setSignature((current) => ({ ...current, [key]: value }));
    }

    async function handleLaunch() {
        if (!launchReady) {
            setError('Complete audience, mailbox, signature, and sequence before launch.');
            return;
        }
        setLaunching(true);
        setError('');
        try {
            const campaign = await createCampaign({
                name,
                list_id: selectedListId,
                mailbox_id: mailboxId,
                steps,
                schedule,
                signature,
            });
            const key = `${campaign.id}-${Date.now()}`;
            await launchCampaign(campaign.id, key);
            setLaunchSuccessId(campaign.id);
            launchTimerRef.current = window.setTimeout(() => {
                router.push(`/dashboard/outreach/campaigns/${campaign.id}`);
            }, 1100);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to launch campaign.');
        } finally {
            setLaunching(false);
        }
    }

    function goRelative(offset: number) {
        const nextStep = BUILDER_STEPS[Math.min(Math.max(activeIndex + offset, 0), BUILDER_STEPS.length - 1)]?.key;
        if (nextStep) switchStep(nextStep);
    }

    function renderAudiencePanel() {
        return (
            <section className={styles.builderPanel} role="tabpanel" aria-label="Audience">
                <div className={styles.builderToolbar}>
                    <label className={styles.compactField}>
                        <span>Campaign</span>
                        <TextField.Root size="3" value={name} onChange={(event) => {
                            setNameTouched(true);
                            setName(event.target.value);
                        }} />
                    </label>
                    <label className={styles.compactField}>
                        <span>Search</span>
                        <TextField.Root size="3" value={listSearchInput} placeholder="Search lists..." onChange={(event) => setListSearchInput(event.target.value)} />
                    </label>
                    <label className={styles.compactField}>
                        <span>Project</span>
                        <TahoeSelect size="3" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
                            <option value="">All projects</option>
                            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                        </TahoeSelect>
                    </label>
                </div>
                <div className={styles.builderTableShell}>
                    <div className={styles.tableScroll}>
                        <table className={`${styles.table} ${styles.compactTable}`}>
                            <thead>
                                <tr>
                                    <th>List</th>
                                    <th>Project</th>
                                    <th>Candidates</th>
                                    <th>Eligible</th>
                                    <th>Updated</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLists.map((item) => {
                                    const selected = item.id === selectedListId;
                                    const rowEligible = selected ? eligibleCount : null;
                                    const rowSuppressed = selected ? suppressedCount : null;
                                    return (
                                        <tr key={item.id} className={selected ? styles.selectedTableRow : styles.clickableRow} onClick={() => selectList(item.id)}>
                                            <td>
                                                <button type="button" className={styles.tableNameButton} onClick={() => selectList(item.id)}>
                                                    {selected ? '● ' : '○ '}{item.name}
                                                </button>
                                                {selected && rowSuppressed ? <div className={styles.rowSubtext}>{rowSuppressed} suppressed</div> : null}
                                            </td>
                                            <td>{item.project_name || 'No project'}</td>
                                            <td>{item.candidate_count}</td>
                                            <td>{rowEligible == null ? '--' : rowEligible}</td>
                                            <td>{formatDate(item.updated_at || item.created_at)}</td>
                                            <td><span className={item.candidate_count > 0 ? styles.statusPill : styles.pill}>{item.candidate_count > 0 ? 'Ready' : 'Empty'}</span></td>
                                        </tr>
                                    );
                                })}
                                {filteredLists.length === 0 ? (
                                    <tr><td colSpan={6} className={styles.tableMessage}>{listsLoading ? 'Loading lists...' : 'No lists found.'}</td></tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.tableFooter}>
                        <span>{filteredLists.length} lists</span>
                        <span>{list ? `Selected: ${list.name} · ${eligibleCount} eligible · ${suppressedCount} suppressed` : 'Select a list to continue'}</span>
                    </div>
                </div>
                {selectedListId && !audienceLoading && candidates.length === 0 ? (
                    <div className={styles.builderNotice}>
                        <strong>This list is empty.</strong>
                        <span>Add candidates from Search before launching.</span>
                        <Link href="/dashboard/search/new">Find candidates</Link>
                    </div>
                ) : null}
            </section>
        );
    }

    function renderAiPanel() {
        return (
            <section className={styles.builderPanel} role="tabpanel" aria-label="AI Message">
                <div className={styles.aiGrid}>
                    <div className={styles.aiPromptPanel}>
                        <label className={styles.compactField}>
                            <span>Context</span>
                            <textarea
                                className={styles.builderTextarea}
                                value={roleContext}
                                onChange={(event) => setRoleContext(event.target.value)}
                                placeholder="Senior backend engineers in SF with Go experience. Keep it direct and mention current company."
                                aria-label="Role and personalization context"
                            />
                        </label>
                        <div className={styles.inlineActions}>
                            <Button size="3" onClick={() => void handleGenerate()} disabled={generating || !selectedListId || eligibleCount === 0}>
                                {generating ? 'Generating...' : 'Generate with AI'}
                            </Button>
                            <Button size="3" variant="soft" onClick={() => switchStep('sequence')} disabled={!steps.length}>Edit in Sequence</Button>
                        </div>
                    </div>
                    <div className={styles.previewPanel}>
                        <div className={styles.builderPanelHeader}>
                            <h2>Preview</h2>
                            <span>{steps.length} email{steps.length === 1 ? '' : 's'}</span>
                        </div>
                        <div className={styles.previewBlock}>
                            <span className={styles.fieldLabel}>Subject</span>
                            <strong>{steps[0]?.subject || 'Generate or write a subject'}</strong>
                            <p>{steps[0]?.body_text || 'Generated copy will appear here.'}</p>
                        </div>
                        {steps.slice(1).map((step) => (
                            <div key={step.step_order} className={styles.previewBlock}>
                                <span className={styles.fieldLabel}>Follow-up {step.step_order - 1}</span>
                                <strong>{step.subject}</strong>
                                <p>{step.body_text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    function renderSequencePanel() {
        const activeStepItem = selectedStep || steps[0];
        return (
            <section className={styles.builderPanel} role="tabpanel" aria-label="Sequence">
                <div className={styles.sequenceGrid}>
                    <aside className={styles.stepRail}>
                        {steps.map((step, index) => (
                            <button
                                key={step.step_order}
                                type="button"
                                className={index === selectedStepIndex ? styles.stepRailItemActive : styles.stepRailItem}
                                onClick={() => setSelectedStepIndex(index)}
                            >
                                <span>Email {index + 1}</span>
                                <small>{scheduleLabel(step, index)}</small>
                            </button>
                        ))}
                        <Button size="3" variant="soft" onClick={addFollowup}>Add follow-up</Button>
                    </aside>
                    <div className={styles.stepEditor}>
                        <div className={styles.builderPanelHeader}>
                            <h2>Email {selectedStepIndex + 1}</h2>
                            {selectedStepIndex > 0 ? <Button size="3" variant="ghost" onClick={() => removeStep(selectedStepIndex)}>Remove</Button> : null}
                        </div>
                        <div className={styles.fieldGrid}>
                            <label className={styles.fieldGroup}>
                                <span className={styles.fieldLabel}>Subject</span>
                                <TextField.Root size="3" value={activeStepItem.subject} onChange={(event) => updateStep(selectedStepIndex, { subject: event.target.value })} />
                            </label>
                            <label className={styles.fieldGroup}>
                                <span className={styles.fieldLabel}>Delay days</span>
                                <TextField.Root size="3" type="number" min="0" max="60" value={String(activeStepItem.delay_days)} onChange={(event) => updateStep(selectedStepIndex, { delay_days: Math.max(0, Number(event.target.value) || 0) })} />
                            </label>
                            <label className={styles.fieldGroup}>
                                <span className={styles.fieldLabel}>Send after</span>
                                <TextField.Root size="3" type="time" value={activeStepItem.send_after_local || schedule.window_start_local} onChange={(event) => updateStep(selectedStepIndex, { send_after_local: event.target.value })} />
                            </label>
                        </div>
                        <label className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Body</span>
                            <textarea className={styles.builderTextareaLarge} value={activeStepItem.body_text} onChange={(event) => updateStep(selectedStepIndex, { body_text: event.target.value })} />
                        </label>
                    </div>
                </div>
            </section>
        );
    }

    function renderSignaturePanel() {
        return (
            <section className={styles.builderPanel} role="tabpanel" aria-label="Signature">
                <div className={styles.fieldGrid}>
                    {SIGNATURE_FIELDS.map(({ key, label, required }) => (
                        <label key={key} className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>{label}{required ? <span className={styles.requiredMarker}> *</span> : null}</span>
                            <TextField.Root size="3" value={String(signature[key] || '')} onChange={(event) => updateSignatureField(key, event.target.value)} aria-required={required || undefined} />
                        </label>
                    ))}
                </div>
            </section>
        );
    }

    function renderSchedulePanel() {
        return (
            <section className={styles.builderPanel} role="tabpanel" aria-label="Schedule">
                <div className={styles.scheduleGrid}>
                    <label className={styles.compactField}>
                        <span>Default mailbox</span>
                        <TahoeSelect size="3" value={mailboxId} onChange={(event) => setMailboxId(event.target.value)}>
                            <option value="">Select healthy mailbox</option>
                            {mailboxes.map((mailbox) => (
                                <option key={mailbox.id} value={mailbox.id} disabled={mailbox.status !== 'healthy'}>
                                    {mailbox.email} · {mailbox.status} · {mailbox.sent_today}/{mailbox.daily_cap}
                                </option>
                            ))}
                        </TahoeSelect>
                    </label>
                    <label className={styles.compactField}>
                        <span>Launch</span>
                        <TahoeSelect size="3" value={schedule.launch_mode} onChange={(event) => updateSchedule({ launch_mode: event.target.value as CampaignSchedule['launch_mode'] })}>
                            <option value="now">Now</option>
                            <option value="scheduled">Schedule later</option>
                        </TahoeSelect>
                    </label>
                    <label className={styles.compactField}>
                        <span>Start time</span>
                        <TextField.Root size="3" type="datetime-local" value={localStartAt(schedule)} disabled={schedule.launch_mode === 'now'} onChange={(event) => updateSchedule({ start_at: fromLocalStartAt(event.target.value) })} />
                    </label>
                    <label className={styles.compactField}>
                        <span>Window start</span>
                        <TextField.Root size="3" type="time" value={schedule.window_start_local} onChange={(event) => updateSchedule({ window_start_local: event.target.value })} />
                    </label>
                    <label className={styles.compactField}>
                        <span>Window end</span>
                        <TextField.Root size="3" type="time" value={schedule.window_end_local} onChange={(event) => updateSchedule({ window_end_local: event.target.value })} />
                    </label>
                    <label className={styles.compactField}>
                        <span>Daily cap</span>
                        <TextField.Root size="3" type="number" min="1" value={scheduleNumberInputs.daily_campaign_cap} onChange={(event) => updateScheduleNumber('daily_campaign_cap', event.target.value)} />
                    </label>
                    <label className={styles.compactField}>
                        <span>Spacing min</span>
                        <TextField.Root size="3" type="number" min="1" value={scheduleNumberInputs.min_spacing_minutes} onChange={(event) => updateScheduleNumber('min_spacing_minutes', event.target.value)} />
                    </label>
                    <label className={styles.compactField}>
                        <span>Spacing max</span>
                        <TextField.Root size="3" type="number" min="1" value={scheduleNumberInputs.max_spacing_minutes} onChange={(event) => updateScheduleNumber('max_spacing_minutes', event.target.value)} />
                    </label>
                </div>
                <div className={styles.weekdayRow} aria-label="Send days">
                    {WEEKDAYS.map((day) => {
                        const active = schedule.weekdays.includes(day.value);
                        return (
                            <button
                                key={day.value}
                                type="button"
                                className={active ? styles.weekdayActive : styles.weekday}
                                onClick={() => {
                                    const next = active
                                        ? schedule.weekdays.filter((value) => value !== day.value)
                                        : [...schedule.weekdays, day.value].sort();
                                    updateSchedule({ weekdays: next.length ? next : [day.value] });
                                }}
                            >
                                {day.label}
                            </button>
                        );
                    })}
                </div>
                <div className={styles.builderTableShell}>
                    <div className={styles.tableScroll}>
                        <table className={`${styles.table} ${styles.compactTable}`}>
                            <thead>
                                <tr>
                                    <th>Step</th>
                                    <th>Mailbox</th>
                                    <th>Delay</th>
                                    <th>Send after</th>
                                    <th>Cap</th>
                                    <th>Preview</th>
                                </tr>
                            </thead>
                            <tbody>
                                {steps.map((step, index) => (
                                    <tr key={step.step_order}>
                                        <td>Email {index + 1}</td>
                                        <td>
                                            <TahoeSelect size="3" value={step.mailbox_id || ''} onChange={(event) => updateStep(index, { mailbox_id: event.target.value || null })}>
                                                <option value="">Default</option>
                                                {mailboxes.map((mailbox) => <option key={mailbox.id} value={mailbox.id}>{mailbox.email}</option>)}
                                            </TahoeSelect>
                                        </td>
                                        <td><TextField.Root size="3" type="number" min="0" max="60" value={String(step.delay_days)} onChange={(event) => updateStep(index, { delay_days: Math.max(0, Number(event.target.value) || 0) })} /></td>
                                        <td><TextField.Root size="3" type="time" value={step.send_after_local || schedule.window_start_local} onChange={(event) => updateStep(index, { send_after_local: event.target.value })} /></td>
                                        <td><TextField.Root size="3" type="number" min="1" placeholder="Default" value={step.daily_cap == null ? '' : String(step.daily_cap)} onChange={(event) => updateStep(index, { daily_cap: event.target.value ? positiveNumber(event.target.value, 1) : null })} /></td>
                                        <td>{scheduleLabel(step, index)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.tableFooter}>
                        <span>{selectedMailbox ? selectedMailbox.email : 'No mailbox selected'}</span>
                        <span>{schedule.weekdays.length} send day{schedule.weekdays.length === 1 ? '' : 's'} · {schedule.window_start_local}-{schedule.window_end_local} · max {schedule.daily_campaign_cap}/day</span>
                    </div>
                </div>
            </section>
        );
    }

    function renderReviewPanel() {
        const checks = [
            { label: 'Audience', value: list ? `${list.name} · ${eligibleCount} eligible` : 'No list selected', ok: Boolean(selectedListId && eligibleCount > 0) },
            { label: 'Sequence', value: `${steps.length} email${steps.length === 1 ? '' : 's'}`, ok: steps.every((step) => step.subject.trim() && step.body_text.trim()) },
            { label: 'Sender', value: selectedMailbox ? `${selectedMailbox.email} · ${selectedMailbox.status}` : 'No mailbox', ok: Boolean(mailboxId) },
            { label: 'Schedule', value: `${schedule.window_start_local}-${schedule.window_end_local} · max ${schedule.daily_campaign_cap}/day`, ok: schedule.weekdays.length > 0 },
            { label: 'Sending', value: 'Delivered from your connected mailbox — no send credits charged', ok: true },
        ];
        return (
            <section className={styles.builderPanel} role="tabpanel" aria-label="Review">
                <div className={styles.reviewRows}>
                    {checks.map((check) => (
                        <div key={check.label} className={styles.reviewRow}>
                            <span>{check.ok ? '✓' : '!'}</span>
                            <strong>{check.label}</strong>
                            <p>{check.value}</p>
                        </div>
                    ))}
                </div>
                {launchBlockedReason ? <p className={styles.muted} role="status">{launchBlockedReason}</p> : null}
            </section>
        );
    }

    function renderActivePanel() {
        if (activeStep === 'ai-message') return renderAiPanel();
        if (activeStep === 'sequence') return renderSequencePanel();
        if (activeStep === 'signature') return renderSignaturePanel();
        if (activeStep === 'schedule') return renderSchedulePanel();
        if (activeStep === 'review') return renderReviewPanel();
        return renderAudiencePanel();
    }

    return (
        <section className={styles.builderWorkspace}>
            <div className={styles.builderTopbar}>
                <nav className={styles.builderTabs} aria-label="Campaign builder steps" role="tablist">
                    {BUILDER_STEPS.map((step, index) => (
                        <button
                            key={step.key}
                            type="button"
                            role="tab"
                            aria-selected={activeStep === step.key}
                            className={activeStep === step.key ? styles.builderTabActive : styles.builderTab}
                            onClick={() => switchStep(step.key)}
                            disabled={index > maxReachableIndex}
                        >
                            {step.label}
                        </button>
                    ))}
                </nav>
                <div className={styles.builderProgress}>{activeLabel} · Step {activeIndex + 1} of {BUILDER_STEPS.length}</div>
            </div>
            {error ? <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div> : null}
            {notice ? <div className={styles.banner}>{notice}</div> : null}
            <div className={styles.builderContent}>
                {loading ? (
                    <div className={styles.emptyState}>
                        <span className="tahoe-spinner" />
                        <p>Loading campaign builder...</p>
                    </div>
                ) : renderActivePanel()}
            </div>
            <div className={styles.stepFooter}>
                <Button size="3" variant="soft" onClick={() => goRelative(-1)} disabled={activeIndex <= 0}>Back</Button>
                <span className={styles.muted}>{currentStepBlockedReason || `${eligibleCount} eligible · ${steps.length} email${steps.length === 1 ? '' : 's'}`}</span>
                {activeStep === 'review' ? (
                    <Button size="3" onClick={() => void handleLaunch()} disabled={!launchReady || launching}>
                        {launching ? 'Launching...' : 'Launch campaign'}
                    </Button>
                ) : (
                    <Button size="3" onClick={() => goRelative(1)} disabled={Boolean(currentStepBlockedReason)}>Next</Button>
                )}
            </div>
            {launchSuccessId ? (
                <div className={styles.successOverlay} role="dialog" aria-modal="true" aria-label="Campaign launched">
                    <div className={styles.confetti} aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                    </div>
                    <div className={styles.successModal}>
                        <h2>Campaign launched</h2>
                        <p>Send tasks are queued. Follow-ups will stop for replied, bounced, or unsubscribed recipients.</p>
                        <Link className="tahoe-button" href={`/dashboard/outreach/campaigns/${launchSuccessId}`}>Open campaign</Link>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

export default function NewCampaignPage() {
    return (
        <Suspense fallback={<section className={styles.builderWorkspace}><div className={styles.emptyState}>Loading campaign builder...</div></section>}>
            <NewCampaignContent />
        </Suspense>
    );
}
