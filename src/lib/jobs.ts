// API client for the Jobs feature (recruiter side). Mirrors backend jobs/models.py.
import { ApiError, apiRequest, getApiUrl, getToken } from '@/lib/api';

export type JobStatus = 'draft' | 'scheduled' | 'published' | 'closed' | 'archived';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'temp';
export type LocationType = 'remote' | 'hybrid' | 'onsite';
export type ExperienceLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
export type SalaryInterval = 'hourly' | 'monthly' | 'annual';

export type FormFieldType =
    | 'text' | 'textarea' | 'email' | 'phone' | 'url' | 'file' | 'location_autocomplete'
    | 'select' | 'radio' | 'multiselect' | 'yes_no' | 'consent' | 'section_header';

export interface FormFieldDef {
    id: string;
    type: FormFieldType;
    label: string;
    required: boolean;
    order: number;
    options: string[];
    help_text?: string | null;
    placeholder?: string | null;
    section?: string | null;
}

/** Editable job fields (JobBase). `title` required only on create. */
export interface JobInput {
    title?: string;
    department?: string | null;
    team?: string | null;
    employment_type?: EmploymentType | null;
    location_type?: LocationType | null;
    locations?: string[];
    summary?: string | null;
    description_md?: string | null;
    responsibilities?: string[];
    requirements?: string[];
    nice_to_have?: string[];
    skills_required?: string[];
    skills_preferred?: string[];
    experience_level?: ExperienceLevel | null;
    years_min?: number | null;
    years_max?: number | null;
    salary_min?: number | null;
    salary_max?: number | null;
    salary_currency?: string;
    salary_interval?: SalaryInterval;
    equity?: string | null;
    commission?: boolean;
    benefits?: string[];
    application_limits?: Record<string, unknown> | null;
    seo?: Record<string, unknown> | null;
}

export interface Job extends JobInput {
    id: string;
    workspace_id: string;
    created_by: string;
    slug: string | null;
    status: JobStatus;
    title: string; // always present on a persisted job
    publish_at?: string | null;
    close_at?: string | null;
    published_at?: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

export interface Page<T> {
    items: T[];
    next_cursor: string | null;
}

export interface CheckSuggestion {
    field?: string | null;
    severity: 'info' | 'warning';
    issue: string;
    suggestion?: string | null;
}

export interface JobFormResponse {
    job_id: string | null;
    fields: FormFieldDef[];
    is_default: boolean;
    name?: string | null;
}

export interface FormTemplate {
    id: string;
    name: string;
    fields: FormFieldDef[];
    builtin: boolean;
}

// ── jobs CRUD ────────────────────────────────────────────────────────────────
export function listJobs(params: { status?: string; q?: string; cursor?: string; limit?: number } = {}): Promise<Page<Job>> {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.q) qs.set('q', params.q);
    if (params.cursor) qs.set('cursor', params.cursor);
    if (params.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString();
    return apiRequest<Page<Job>>(`/api/jobs${suffix ? `?${suffix}` : ''}`);
}

export function getJob(id: string): Promise<Job> {
    return apiRequest<Job>(`/api/jobs/${id}`);
}

export function createJob(input: JobInput): Promise<Job> {
    return apiRequest<Job>('/api/jobs', { method: 'POST', body: input });
}

export function updateJob(id: string, expectedUpdatedAt: string, changes: JobInput): Promise<Job> {
    return apiRequest<Job>(`/api/jobs/${id}`, {
        method: 'PATCH',
        body: { expected_updated_at: expectedUpdatedAt, changes },
    });
}

export async function deleteJob(id: string): Promise<void> {
    // Backend returns 204 (no body), which apiRequest can't parse — use raw fetch.
    const token = getToken();
    const res = await fetch(getApiUrl(`/api/jobs/${id}`), {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
        throw new ApiError(res.status, `Failed to delete job (HTTP ${res.status})`);
    }
}

export function duplicateJob(id: string): Promise<Job> {
    return apiRequest<Job>(`/api/jobs/${id}/duplicate`, { method: 'POST' });
}

// ── lifecycle ─────────────────────────────────────────────────────────────────
export function publishJob(
    id: string,
    body: { mode: 'now' | 'schedule'; publish_at?: string; close_at?: string },
): Promise<Job> {
    return apiRequest<Job>(`/api/jobs/${id}/publish`, { method: 'POST', body });
}

export const unpublishJob = (id: string) => apiRequest<Job>(`/api/jobs/${id}/unpublish`, { method: 'POST' });
export const closeJob = (id: string) => apiRequest<Job>(`/api/jobs/${id}/close`, { method: 'POST' });
export const reopenJob = (id: string) => apiRequest<Job>(`/api/jobs/${id}/reopen`, { method: 'POST' });

// ── AI builder ──────────────────────────────────────────────────────────────
export async function draftWithAI(prompt: string, signal?: AbortSignal): Promise<JobInput> {
    const res = await apiRequest<{ draft: JobInput }>('/api/jobs/draft-ai', {
        method: 'POST', body: { prompt }, signal,
    });
    return res.draft;
}

export async function checkPost(id: string): Promise<CheckSuggestion[]> {
    const res = await apiRequest<{ suggestions: CheckSuggestion[] }>(`/api/jobs/${id}/check`, { method: 'POST' });
    return res.suggestions;
}

// ── application form ──────────────────────────────────────────────────────────
export function getJobForm(id: string): Promise<JobFormResponse> {
    return apiRequest<JobFormResponse>(`/api/jobs/${id}/form`);
}

export function putJobForm(id: string, fields: FormFieldDef[], name?: string | null): Promise<JobFormResponse> {
    return apiRequest<JobFormResponse>(`/api/jobs/${id}/form`, {
        method: 'PUT', body: { fields, name: name ?? null, is_template: false },
    });
}

export async function listFormTemplates(): Promise<FormTemplate[]> {
    const res = await apiRequest<{ templates: FormTemplate[] }>('/api/jobs/form-templates');
    return res.templates;
}

// ── small shared helpers ──────────────────────────────────────────────────────
export const STATUS_LABELS: Record<JobStatus, string> = {
    draft: 'Draft', scheduled: 'Scheduled', published: 'Published', closed: 'Closed', archived: 'Archived',
};

// ── ATS: pipeline / applications (Phase 7) ────────────────────────────────────
export type ApplicationStatus = 'new' | 'in_review' | 'advanced' | 'rejected' | 'withdrawn' | 'hired';
export type ParseStatus = 'pending' | 'parsing' | 'parsed' | 'failed';

export interface ApplicationListItem {
    id: string;
    candidate_id: string;
    candidate_name: string | null;
    candidate_email: string;
    status: ApplicationStatus;
    stage_id: string | null;
    parse_status: ParseStatus;
    match_pct: number | null;
    years: number | null;
    city: string | null;
    country: string | null;
    top_evidence: string | null;
    applied_at: string;
    updated_at: string;
}

export interface PipelineStage {
    id: string;
    name: string;
    position: number;
    type: string | null;
    is_terminal: boolean;
    count: number;
}

export interface MatchRationaleItem { criterion: string; evidence: string; confidence: 'high' | 'medium' | 'low'; }

export interface ApplicationDetail {
    application: {
        id: string; job_id: string; candidate_id: string; status: ApplicationStatus;
        rejection_reason: string | null; stage_id: string | null; source: string | null;
        answers: Record<string, unknown> | null; parse_status: ParseStatus;
        resume_filename: string | null; resume_mime: string | null;
        applied_at: string; updated_at: string;
    };
    candidate: {
        id: string; email: string; full_name: string | null; phone: string | null;
        location: string | null; linkedin_url: string | null; github_url: string | null; portfolio_url: string | null;
    } | null;
    profile: Record<string, unknown> | null;
    profile_updated_at: string | null;
    score: {
        match_pct: number | null; semantic_score: number | null; structured_score: number | null;
        llm_score: number | null; rationale: MatchRationaleItem[] | null; gaps: string[];
    } | null;
}

export interface Note { id: string; application_id: string | null; author_id: string; body: string; mentions: string[]; created_at: string; }
export interface Scorecard { id: string; application_id: string | null; reviewer_id: string; ratings: Record<string, unknown> | null; overall: string | null; comment: string | null; created_at: string; }
export interface Activity { id: string; application_id: string | null; actor_id: string | null; kind: string | null; data: Record<string, unknown> | null; created_at: string; }
export interface BulkResult { succeeded: string[]; failed: Array<{ id: string; error: string }>; }

export function listApplications(
    jobId: string,
    params: { stage?: string; status?: string; sort?: 'match' | 'recent'; cursor?: string; limit?: number } = {},
): Promise<Page<ApplicationListItem>> {
    const qs = new URLSearchParams();
    if (params.stage) qs.set('stage', params.stage);
    if (params.status) qs.set('status', params.status);
    if (params.sort) qs.set('sort', params.sort);
    if (params.cursor) qs.set('cursor', params.cursor);
    if (params.limit) qs.set('limit', String(params.limit));
    const s = qs.toString();
    return apiRequest<Page<ApplicationListItem>>(`/api/jobs/${jobId}/applications${s ? `?${s}` : ''}`);
}

export async function listStages(jobId: string): Promise<PipelineStage[]> {
    const res = await apiRequest<{ stages: PipelineStage[] }>(`/api/jobs/${jobId}/stages`);
    return res.stages;
}

export const getApplicationDetail = (appId: string) => apiRequest<ApplicationDetail>(`/api/jobs/applications/${appId}`);

export function patchApplication(
    appId: string,
    expectedUpdatedAt: string,
    changes: { stage_id?: string; status?: ApplicationStatus; rejection_reason?: string },
): Promise<ApplicationDetail['application']> {
    return apiRequest(`/api/jobs/applications/${appId}`, {
        method: 'PATCH', body: { expected_updated_at: expectedUpdatedAt, ...changes },
    });
}

export function patchProfile(appId: string, expectedUpdatedAt: string, profile: Record<string, unknown>) {
    return apiRequest<{ profile: Record<string, unknown>; profile_updated_at: string }>(
        `/api/jobs/applications/${appId}/profile`,
        { method: 'PATCH', body: { expected_updated_at: expectedUpdatedAt, profile } },
    );
}

export const listNotes = (appId: string) => apiRequest<Note[]>(`/api/jobs/applications/${appId}/notes`);
export const addNote = (appId: string, body: string, mentions: string[] = []) =>
    apiRequest<Note>(`/api/jobs/applications/${appId}/notes`, { method: 'POST', body: { body, mentions } });

export const listScorecards = (appId: string) => apiRequest<Scorecard[]>(`/api/jobs/applications/${appId}/scorecards`);
export const addScorecard = (appId: string, sc: { overall?: string; comment?: string; ratings?: Record<string, unknown> }) =>
    apiRequest<Scorecard>(`/api/jobs/applications/${appId}/scorecard`, { method: 'POST', body: sc });

export const listActivity = (appId: string) => apiRequest<Activity[]>(`/api/jobs/applications/${appId}/activity`);
export const getResumeUrl = (appId: string) =>
    apiRequest<{ url: string; filename: string | null; expires_in: number }>(`/api/jobs/applications/${appId}/resume-url`);

export function bulkApplications(payload: {
    ids: string[]; action: 'move_stage' | 'set_status' | 'reject'; stage_id?: string; status?: ApplicationStatus; rejection_reason?: string;
}): Promise<BulkResult> {
    return apiRequest<BulkResult>('/api/jobs/applications/bulk', { method: 'POST', body: payload });
}

// ── NL talent search (Phase 8) ────────────────────────────────────────────────
export interface SearchFilters { skills?: string[]; min_years?: number | null; seniority?: string | null; country?: string | null; }

export interface SearchResultItem {
    application_id: string;
    candidate_id: string;
    job_id: string;
    candidate_name: string | null;
    candidate_email: string;
    match_pct: number | null;
    stage_id: string | null;
    years: number | null;
    city: string | null;
    country: string | null;
    evidence: string;
    why: string;
}

export interface SearchResponse {
    parsed_filters: { skills?: string[]; min_years?: number | null; seniority?: string | null; country?: string | null };
    results: SearchResultItem[];
}

export function talentSearch(query: string, jobId?: string, filters?: SearchFilters): Promise<SearchResponse> {
    return apiRequest<SearchResponse>('/api/jobs/search', {
        method: 'POST',
        body: { query, job_id: jobId ?? null, filters: filters ?? null },
    });
}

// ── CRM: send-only messaging (Phase 9) ────────────────────────────────────────
export interface SentEmail {
    id: string;
    candidate_id: string | null;
    application_id: string | null;
    reply_to: string | null;
    from_addr: string | null;
    to_addr: string | null;
    subject: string | null;
    status: string | null;
    sequence_id: string | null;
    sent_at: string | null;
    scheduled_at: string | null;
    created_at: string;
}

export interface MessageDraft { subject: string; body: string; }

export function sendMessage(payload: {
    candidate_id: string; application_id?: string; subject: string; body_text: string; body_html?: string; idempotency_key?: string;
}): Promise<SentEmail> {
    return apiRequest<SentEmail>('/api/jobs/messages/send', { method: 'POST', body: payload });
}

export function draftMessage(intent: string, candidateId?: string, jobId?: string): Promise<MessageDraft> {
    return apiRequest<MessageDraft>('/api/jobs/messages/draft', {
        method: 'POST', body: { intent, candidate_id: candidateId ?? null, job_id: jobId ?? null },
    });
}

export function listMessages(candidateId: string, cursor?: string): Promise<Page<SentEmail>> {
    const qs = new URLSearchParams({ candidate_id: candidateId });
    if (cursor) qs.set('cursor', cursor);
    return apiRequest<Page<SentEmail>>(`/api/jobs/messages?${qs.toString()}`);
}

export interface SequenceStepInput { subject: string; body_text: string; body_html?: string; delay_hours?: number; }
export function createSequence(candidateIds: string[], steps: SequenceStepInput[]): Promise<{ sequence_id: string; queued: number; skipped: string[] }> {
    return apiRequest('/api/jobs/sequences', { method: 'POST', body: { candidate_ids: candidateIds, steps } });
}

// ── Analytics (Phase 10) ──────────────────────────────────────────────────────
export interface FunnelStage { label: string; position: number; count: number; }
export interface TimeInStage { label: string; median_days: number | null; n: number; }
export interface TimeToHire { median_days: number | null; n: number; }
export interface AnalyticsOverview {
    total_applications: number;
    funnel: FunnelStage[];
    status_breakdown: Record<string, number>;
    time_in_stage: TimeInStage[];
    source_mix: Record<string, number>;
    time_to_hire: TimeToHire;
}
export interface EeoBucket { answer: string; count: number; }
export interface EeoDimension { dimension: string; total_responses: number; buckets: EeoBucket[]; suppressed_cells: number; }
export interface EeoResponse { min_cohort: number; dimensions: EeoDimension[]; note: string; }

export function getAnalytics(jobId?: string): Promise<AnalyticsOverview> {
    return apiRequest<AnalyticsOverview>(`/api/jobs/analytics${jobId ? `?job_id=${jobId}` : ''}`);
}
export function getEeo(jobId?: string): Promise<EeoResponse> {
    return apiRequest<EeoResponse>(`/api/jobs/analytics/eeo${jobId ? `?job_id=${jobId}` : ''}`);
}

// ── Career-page branding + settings + GDPR (Phase 11) ─────────────────────────
export interface Branding {
    company_name?: string | null;
    tagline?: string | null;
    logo_url?: string | null;
    accent_color?: string | null;
    about_html?: string | null;
}
export interface RankingWeights { semantic: number; structured: number; llm: number; }
export interface JobsSettings {
    ranking_weights?: RankingWeights | null;
    rejection_reasons?: string[];
    application_limit_per_email?: number | null;
}

export const getBranding = () => apiRequest<Branding>('/api/jobs/branding');
export const putBranding = (b: Branding) => apiRequest<Branding>('/api/jobs/branding', { method: 'PUT', body: b });
export const getJobsSettings = () => apiRequest<JobsSettings>('/api/jobs/settings');
export const putJobsSettings = (s: JobsSettings) => apiRequest<JobsSettings>('/api/jobs/settings', { method: 'PUT', body: s });
export const eraseCandidate = (candidateId: string) =>
    apiRequest<{ erased: boolean; applications?: number; files_deleted?: number }>(`/api/jobs/candidates/${candidateId}`, { method: 'DELETE' });

export function formatComp(job: Pick<Job, 'salary_min' | 'salary_max' | 'salary_currency' | 'salary_interval'>): string {
    if (job.salary_min == null && job.salary_max == null) return '';
    const cur = job.salary_currency || 'USD';
    const fmt = (n?: number | null) => (n == null ? '' : `${cur === 'USD' ? '$' : `${cur} `}${Math.round(n / 1000)}k`);
    const range = [fmt(job.salary_min), fmt(job.salary_max)].filter(Boolean).join('–');
    const per = job.salary_interval && job.salary_interval !== 'annual' ? `/${job.salary_interval}` : '';
    return `${range}${per}`;
}
