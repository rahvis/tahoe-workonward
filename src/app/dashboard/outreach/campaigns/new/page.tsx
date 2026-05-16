'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, TextField, TahoeSelect } from '@/components/ui/tahoe-ui';
import {
    composeCampaignMessage,
    createCampaign,
    createList,
    createProject,
    fetchBillingSummary,
    fetchList,
    fetchListCandidates,
    fetchLists,
    fetchMailboxes,
    fetchProjects,
    fetchSettings,
    launchCampaign,
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

const DEFAULT_STEP: BuilderStep = 'audience';

const SIGNATURE_FIELDS: Array<{
    key: keyof OutreachSignature;
    label: string;
    required: boolean;
}> = [
    { key: 'sender_name', label: 'Sender name', required: true },
    { key: 'sender_email', label: 'Sender email', required: true },
    { key: 'sender_phone', label: 'Phone', required: true },
    { key: 'sender_address', label: 'Physical address', required: true },
    { key: 'sender_website', label: 'Website URL (optional)', required: false },
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
    };
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
    const [signature, setSignature] = useState<OutreachSignature>({
        sender_name: '',
        sender_email: '',
        sender_phone: '',
        sender_address: '',
        sender_website: '',
    });
    const [listSearchInput, setListSearchInput] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [newProjectName, setNewProjectName] = useState('');
    const [newListName, setNewListName] = useState('');
    const [loading, setLoading] = useState(true);
    const [listsLoading, setListsLoading] = useState(false);
    const [audienceLoading, setAudienceLoading] = useState(Boolean(initialListId));
    const [creatingList, setCreatingList] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [launching, setLaunching] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [availableCredits, setAvailableCredits] = useState<number | null>(null);
    const [lowCreditState, setLowCreditState] = useState<'healthy' | 'low' | 'critical' | 'empty'>('healthy');
    const [nameTouched, setNameTouched] = useState(false);
    const audienceRequestRef = useRef(0);
    const listCacheRef = useRef(new Map<string, { list: ListSummary; candidates: ListCandidateRow[] }>());
    const signatureTouchedRef = useRef(false);

    function replaceBuilderUrl(nextStep: BuilderStep, nextListId: string) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('step', nextStep);
        if (nextListId) {
            params.set('list_id', nextListId);
        } else {
            params.delete('list_id');
        }
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
                const [mailboxItems, billing, settingsPayload, listItems, projectItems] = await Promise.all([
                    fetchMailboxes(),
                    fetchBillingSummary(),
                    fetchSettings(),
                    fetchLists(),
                    fetchProjects({ archived: false }),
                ]);
                if (cancelled) return;
                setMailboxes(mailboxItems);
                setLists(listItems);
                setProjects(projectItems);
                setAvailableCredits(billing.available_credits);
                setLowCreditState(billing.low_credit_state);
                const firstHealthy = mailboxItems.find((mailbox) => mailbox.status === 'healthy');
                if (firstHealthy) {
                    setMailboxId((current) => current || firstHealthy.id);
                }
                if (!signatureTouchedRef.current) {
                    const defaultSignature = settingsPayload.outreach_defaults.signature;
                    const accountName = [settingsPayload.account.first_name, settingsPayload.account.last_name]
                        .filter(Boolean)
                        .join(' ')
                        .trim();
                    setSignature((current) => ({
                        sender_name: current.sender_name || defaultSignature?.sender_name || accountName,
                        sender_email: current.sender_email || defaultSignature?.sender_email || firstHealthy?.email || settingsPayload.account.email,
                        sender_phone: current.sender_phone || defaultSignature?.sender_phone || '',
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
    const estimatedCreditCost = eligibleCount * steps.length;
    const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
    const activeIndex = BUILDER_STEPS.findIndex((step) => step.key === activeStep);
    const activeLabel = BUILDER_STEPS[activeIndex]?.label || 'Audience';
    const launchBlockedReason = useMemo<string | null>(() => {
        if (!selectedListId) return 'Pick a list to send from.';
        if (!mailboxId) return 'Connect a healthy mailbox in Schedule.';
        if (eligibleCount === 0) return 'No candidates in this list have an email yet.';
        if (availableCredits != null && estimatedCreditCost > availableCredits) return 'Available credits are lower than the estimated send cost.';
        if (steps.some((step) => !step.subject.trim() || !step.body_text.trim())) {
            return 'Every email step needs a subject and body.';
        }
        if (
            !signature.sender_name.trim() ||
            !signature.sender_email.trim() ||
            !signature.sender_phone.trim() ||
            !signature.sender_address.trim()
        ) {
            return 'Fill the required signature fields (name, email, phone, physical address).';
        }
        return null;
    }, [selectedListId, mailboxId, eligibleCount, estimatedCreditCost, availableCredits, steps, signature]);
    const launchReady = launchBlockedReason === null;

    async function handleCreateAudienceList() {
        if (!newListName.trim()) {
            setError('Enter a list name before creating an audience list.');
            return;
        }
        setCreatingList(true);
        setError('');
        try {
            let projectId = selectedProjectId;
            if (newProjectName.trim()) {
                const createdProject = await createProject({ name: newProjectName.trim() });
                setProjects((current) => [createdProject, ...current]);
                projectId = createdProject.id;
                setSelectedProjectId(projectId);
            }
            if (!projectId) {
                throw new Error('Choose an existing project or enter a new project name.');
            }
            const createdList = await createList(projectId, { name: newListName.trim() });
            setLists((current) => [createdList, ...current.filter((item) => item.id !== createdList.id)]);
            setNewListName('');
            setNewProjectName('');
            setNotice('New list created. Add candidates from Search or Projects before launching this campaign.');
            selectList(createdList.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create audience list.');
        } finally {
            setCreatingList(false);
        }
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
                },
                ...response.followups,
            ]);
            setNotice('AI draft inserted. Tahoe will append the required signature and unsubscribe footer when sending.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to generate outreach.');
        } finally {
            setGenerating(false);
        }
    }

    function updateStep(index: number, patch: Partial<OutreachStep>) {
        setSteps((current) => current.map((step, stepIndex) => (
            stepIndex === index ? { ...step, ...patch } : step
        )));
    }

    function addFollowup() {
        setSteps((current) => [
            ...current,
            {
                step_order: current.length + 1,
                subject: 'Following up, {{first_name}}',
                body_text: 'Hi {{first_name}},\n\nWanted to follow up on my previous note. Would it be worth a quick conversation?',
                body_html: null,
                delay_days: 3,
            },
        ]);
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
                signature,
            });
            const key = `${campaign.id}-${Date.now()}`;
            await launchCampaign(campaign.id, key);
            router.push(`/dashboard/outreach/campaigns/${campaign.id}`);
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
            <section className={styles.card} role="tabpanel" aria-label="Audience">
                <div className={styles.cardHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Audience</h2>
                        <p className={styles.muted}>Choose a saved list, or create a new list shell and add candidates before launch.</p>
                    </div>
                    {audienceLoading ? <span className={styles.statusPill}>Loading list…</span> : null}
                </div>
                <div className={styles.fieldGrid}>
                    <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Campaign name</span>
                        <TextField.Root
                            size="3"
                            value={name}
                            onChange={(event) => {
                                setNameTouched(true);
                                setName(event.target.value);
                            }}
                        />
                    </label>
                    <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Search lists</span>
                        <TextField.Root
                            size="3"
                            value={listSearchInput}
                            placeholder="Search saved candidate lists"
                            onChange={(event) => setListSearchInput(event.target.value)}
                        />
                    </label>
                    <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Audience list</span>
                        <TahoeSelect
                            size="3"
                            value={selectedListId}
                            onChange={(event) => selectList(event.target.value)}
                            aria-label="Audience list"
                        >
                            <option value="">Select a saved list</option>
                            {lists.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} · {item.candidate_count} candidate{item.candidate_count === 1 ? '' : 's'}{item.project_name ? ` · ${item.project_name}` : ''}
                                </option>
                            ))}
                        </TahoeSelect>
                        {listsLoading ? <span className={styles.muted}>Refreshing lists…</span> : null}
                    </label>
                    <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Selected list</span>
                        <div className={styles.pills}>
                            <span className={styles.pill}>{list?.name || 'No list selected'}</span>
                            <span className={styles.pill}>{candidates.length} candidates</span>
                            <span className={styles.pill}>{eligibleCount} eligible</span>
                            <span className={styles.pill}>{suppressedCount} suppressed</span>
                        </div>
                    </div>
                </div>
                {selectedListId && !audienceLoading && candidates.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h3>This list is empty</h3>
                        <p>Add candidates from Search or open the list in Projects before generating or launching outreach.</p>
                        <div className={styles.actions}>
                            <Link className="tahoe-button" href="/dashboard/search/new">Find candidates</Link>
                            <Link className="tahoe-button-secondary" href={list ? `/dashboard/projects/lists/${list.id}` : '/dashboard/projects/lists'}>Open list</Link>
                        </div>
                    </div>
                ) : null}
                <div className={styles.inlineCard}>
                    <h3 className={styles.sectionTitle}>Create a new list</h3>
                    <p className={styles.muted}>New lists are reusable project assets. Add candidates from Search after creating the list.</p>
                    <div className={styles.fieldGrid}>
                        <label className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Project for new list</span>
                            <TahoeSelect
                                size="3"
                                value={selectedProjectId}
                                onChange={(event) => {
                                    setSelectedProjectId(event.target.value);
                                    if (event.target.value) setNewProjectName('');
                                }}
                            >
                                <option value="">Choose a project</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </TahoeSelect>
                            {selectedProject ? <span className={styles.muted}>{selectedProject.list_count} list{selectedProject.list_count === 1 ? '' : 's'} in this project</span> : null}
                        </label>
                        <label className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Or create project</span>
                            <TextField.Root
                                size="3"
                                value={newProjectName}
                                placeholder="Series-B backend search"
                                onChange={(event) => {
                                    setNewProjectName(event.target.value);
                                    if (event.target.value.trim()) setSelectedProjectId('');
                                }}
                            />
                        </label>
                        <label className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>New list name</span>
                            <TextField.Root
                                size="3"
                                value={newListName}
                                placeholder="Backend engineers for launch"
                                onChange={(event) => setNewListName(event.target.value)}
                            />
                        </label>
                    </div>
                    <div className={styles.actions}>
                        <Button size="3" variant="soft" onClick={() => void handleCreateAudienceList()} disabled={creatingList || !newListName.trim()}>
                            {creatingList ? 'Creating…' : 'Create and use list'}
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    function renderAiPanel() {
        return (
            <section className={styles.card} role="tabpanel" aria-label="AI Message">
                <h2 className={styles.sectionTitle}>AI Message</h2>
                <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Role and personalization context</span>
                    <textarea
                        className={styles.textarea}
                        value={roleContext}
                        onChange={(event) => setRoleContext(event.target.value)}
                        placeholder="Example: Senior product designers for a marketplace team. Mention their current company and keep it direct."
                        aria-label="Role and personalization context"
                    />
                </label>
                <div className={styles.actions}>
                    <Button size="3" variant="soft" onClick={() => void handleGenerate()} disabled={generating || !selectedListId || eligibleCount === 0}>
                        {generating ? 'Generating…' : 'Generate with AI'}
                    </Button>
                    <span className={styles.muted}>Variables are supported; Tahoe owns the legal footer.</span>
                </div>
            </section>
        );
    }

    function renderSequencePanel() {
        return (
            <section className={styles.card} role="tabpanel" aria-label="Sequence">
                <h2 className={styles.sectionTitle}>Sequence</h2>
                <div className={styles.grid}>
                    {steps.map((step, index) => (
                        <div key={step.step_order} className={styles.inlineCard}>
                            <div className={styles.header}>
                                <h3 className={styles.sectionTitle}>Email step {index + 1}</h3>
                                {index > 0 ? (
                                    <Button size="3" variant="ghost" onClick={() => setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index).map((item, stepIndex) => ({ ...item, step_order: stepIndex + 1 })))}>
                                        Remove
                                    </Button>
                                ) : null}
                            </div>
                            <div className={styles.fieldGrid}>
                                <label className={styles.fieldGroup}>
                                    <span className={styles.fieldLabel}>Subject</span>
                                    <TextField.Root size="3" value={step.subject} onChange={(event) => updateStep(index, { subject: event.target.value })} />
                                </label>
                                <label className={styles.fieldGroup}>
                                    <span className={styles.fieldLabel}>Delay days</span>
                                    <TextField.Root size="3" type="number" min="0" value={String(step.delay_days)} onChange={(event) => updateStep(index, { delay_days: Number(event.target.value) })} />
                                </label>
                            </div>
                            <label className={styles.fieldGroup}>
                                <span className={styles.fieldLabel}>Body</span>
                                <textarea className={styles.textarea} value={step.body_text} onChange={(event) => updateStep(index, { body_text: event.target.value })} />
                            </label>
                        </div>
                    ))}
                </div>
                <Button size="3" variant="soft" onClick={addFollowup}>Add follow-up</Button>
            </section>
        );
    }

    function renderSignaturePanel() {
        return (
            <section className={styles.card} role="tabpanel" aria-label="Signature">
                <h2 className={styles.sectionTitle}>Signature</h2>
                <p className={styles.muted}>Required for compliance: sender identity, phone, and physical postal address. Settings defaults are copied here, but edits are campaign-only.</p>
                <div className={styles.fieldGrid}>
                    {SIGNATURE_FIELDS.map(({ key, label, required }) => (
                        <label key={key} className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>
                                {label}
                                {required ? <span className={styles.requiredMarker} aria-hidden="true"> *</span> : null}
                            </span>
                            <TextField.Root
                                size="3"
                                value={String(signature[key] || '')}
                                onChange={(event) => updateSignatureField(key, event.target.value)}
                                aria-required={required || undefined}
                            />
                        </label>
                    ))}
                </div>
            </section>
        );
    }

    function renderSchedulePanel() {
        return (
            <section className={styles.card} role="tabpanel" aria-label="Schedule">
                <h2 className={styles.sectionTitle}>Schedule</h2>
                <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Sending mailbox</span>
                    <TahoeSelect size="3" value={mailboxId} onChange={(event) => setMailboxId(event.target.value)}>
                        <option value="">Select a healthy mailbox</option>
                        {mailboxes.map((mailbox) => (
                            <option key={mailbox.id} value={mailbox.id} disabled={mailbox.status !== 'healthy'}>
                                {mailbox.email} · {mailbox.status} · {mailbox.sent_today}/{mailbox.daily_cap} today
                            </option>
                        ))}
                    </TahoeSelect>
                </label>
                <p className={styles.muted}>Tahoe sends one email at a time per mailbox, respects mailbox windows and caps, and paces sends with a 3-7 minute jitter by default.</p>
            </section>
        );
    }

    function renderReviewPanel() {
        return (
            <section className={styles.card} role="tabpanel" aria-label="Review">
                <h2 className={styles.sectionTitle}>Review</h2>
                <div className={styles.pills}>
                    <span className={styles.pill}>Send only</span>
                    <span className={styles.pill}>Replies remain in Gmail</span>
                    <span className={styles.pill}>Unsubscribe included</span>
                    <span className={styles.pill}>One-click unsubscribe headers</span>
                </div>
                <p className={styles.muted}>
                    Launch creates Mongo-backed send tasks and returns immediately. Future sends stop for anyone marked replied, bounced, or unsubscribed.
                </p>
                <div className={styles.pills}>
                    <span className={styles.pill}>Audience: {list?.name || 'No list selected'}</span>
                    <span className={styles.pill}>Estimated emails: {eligibleCount * steps.length}</span>
                    <span className={styles.pill}>Estimated credit cost: {estimatedCreditCost}</span>
                    <span className={styles.pill}>Available credits: {availableCredits ?? '—'}</span>
                </div>
                {lowCreditState === 'low' || lowCreditState === 'critical' || lowCreditState === 'empty' ? (
                    <p className={styles.muted}>
                        Credit runway is getting tight. Tahoe holds the estimated send budget at launch and settles back down to actual sent emails when the campaign finishes or stops.
                    </p>
                ) : null}
                {launchBlockedReason ? (
                    <p className={styles.muted} role="status">{launchBlockedReason}</p>
                ) : null}
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
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className="tahoe-eyebrow">Guided campaign builder</span>
                    <h1 className={styles.title}>Create outreach campaign</h1>
                    <p className={styles.subtitle}>
                        One clean builder for audience, AI draft, follow-ups, signature, schedule, and final compliance review.
                    </p>
                </div>
            </header>

            {error ? <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div> : null}
            {notice ? <div className={styles.banner}>{notice}</div> : null}

            {loading ? (
                <div className={styles.emptyState}>
                    <span className="tahoe-spinner" />
                    <p>Loading campaign builder…</p>
                </div>
            ) : null}

            {!loading ? (
                <>
                    <nav className={styles.builderTabs} aria-label="Campaign builder steps" role="tablist">
                        {BUILDER_STEPS.map((step) => (
                            <button
                                key={step.key}
                                type="button"
                                role="tab"
                                aria-selected={activeStep === step.key}
                                className={activeStep === step.key ? styles.builderTabActive : styles.builderTab}
                                onClick={() => switchStep(step.key)}
                            >
                                {step.label}
                            </button>
                        ))}
                    </nav>
                    <div className={styles.builderCanvas}>
                        {renderActivePanel()}
                        <div className={styles.stepFooter}>
                            <Button size="3" variant="soft" onClick={() => goRelative(-1)} disabled={activeIndex <= 0}>Back</Button>
                            <span className={styles.muted}>{activeLabel} · Step {activeIndex + 1} of {BUILDER_STEPS.length}</span>
                            {activeStep === 'review' ? (
                                <Button size="3" onClick={() => void handleLaunch()} disabled={!launchReady || launching}>
                                    {launching ? 'Launching…' : 'Launch campaign'}
                                </Button>
                            ) : (
                                <Button size="3" onClick={() => goRelative(1)}>Next</Button>
                            )}
                        </div>
                    </div>
                </>
            ) : null}
        </section>
    );
}

export default function NewCampaignPage() {
    return (
        <Suspense fallback={<section className={styles.page}><div className={styles.emptyState}>Loading campaign builder…</div></section>}>
            <NewCampaignContent />
        </Suspense>
    );
}
