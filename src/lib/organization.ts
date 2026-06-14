import type { PreviewGridRow } from '@/app/dashboard/search/preview-grid';
import { apiRequest } from '@/lib/api';

export interface WorkspaceSummary {
    id: string;
    name: string;
    owner_user_id: string;
    plan: 'starter' | 'growth' | 'pro' | 'enterprise';
    created_at?: string | null;
    updated_at?: string | null;
}

export interface ProjectSummary {
    id: string;
    workspace_id: string;
    name: string;
    color?: string | null;
    archived: boolean;
    list_count: number;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface ListSummary {
    id: string;
    workspace_id: string;
    project_id: string;
    name: string;
    candidate_count: number;
    project_name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface SavedSearchSummary {
    id: string;
    workspace_id: string;
    name: string;
    prompt: string;
    mode: 'legacy' | 'langgraph';
    structured_filters: Record<string, unknown>;
    project_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface SavedCandidate extends Omit<PreviewGridRow, 'id'> {
    id: string;
    candidate_id?: string | null;
    coresignal_id: number;
    page: number | null;
    page_rank: number | null;
    pipeline: string | null;
    query_hash: string | null;
    search_session_id: string | null;
    search_prompt: string | null;
    searched_at: string | null;
    saved_origin: 'durable_list' | 'legacy_preview_compat';
    list_count: number;
}

export interface CandidatesResponse {
    candidates: SavedCandidate[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

export interface SaveToListCandidatePayload {
    id: number;
    full_name?: string | null;
    websites_linkedin?: string | null;
    headline?: string | null;
    location_full?: string | null;
    location_country?: string | null;
    connections_count?: number | null;
    follower_count?: number | null;
    company_name?: string | null;
    company_linkedin_url?: string | null;
    company_website?: string | null;
    company_industry?: string | null;
    job_title?: string | null;
    department?: string | null;
    management_level?: string | null;
    company_location_hq_full_address?: string | null;
    company_location_hq_country?: string | null;
    score?: number | null;
    source_query_hash?: string | null;
    source_search_prompt?: string | null;
    source_preview_page?: number | null;
    pipeline?: string | null;
    searched_at?: string | null;
}

export interface SaveToListResponse {
    new_candidate_count: number;
    existing_candidate_count: number;
    new_membership_count: number;
    already_in_list_count: number;
}

export interface EnrichedEmailValue {
    value: string;
    status?: string | null;
    source?: 'manual' | 'provider' | null;
    run_id?: string | null;
    enriched_at?: string | null;
    updated_at?: string | null;
}

export interface EnrichedPhoneValue {
    number: string;
    region?: string | null;
    status?: string | null;
    source?: 'manual' | 'provider' | null;
    run_id?: string | null;
    enriched_at?: string | null;
    updated_at?: string | null;
}

export type ContactFieldStateStatus = 'not_requested' | 'pending' | 'found' | 'not_found' | 'failed';

export interface ContactFieldState {
    status: ContactFieldStateStatus;
    run_id?: string | null;
    updated_at?: string | null;
}

export interface CandidateContact {
    work_email?: EnrichedEmailValue | null;
    personal_email?: EnrichedEmailValue | null;
    phone?: EnrichedPhoneValue | null;
    field_statuses?: Record<string, ContactFieldState> | null;
    last_run_id?: string | null;
    last_status?: string | null;
    last_enriched_at?: string | null;
}

export type EnrichmentStatus =
    | 'NOT_REQUESTED'
    | 'PENDING'
    | 'DONE'
    | 'EMAIL_NOT_FOUND'
    | 'PHONE_NOT_FOUND'
    | 'NO_DATA_FOUND'
    | 'PARTIAL'
    | 'FAILED';

export interface ListCandidateRow extends SaveToListCandidatePayload {
    membership_id: string;
    candidate_id: string;
    source: string;
    source_id: string;
    added_at?: string | null;
    contact?: CandidateContact | null;
    contact_field_states?: Record<string, ContactFieldState> | null;
    enrichment_status?: EnrichmentStatus | null;
}

export interface PaginatedListCandidatesResponse {
    items: ListCandidateRow[];
    next_cursor: string | null;
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

export interface CreditBalanceResponse {
    workspace_id: string;
    balance: number;
    currency: 'credits';
}

export interface ProviderCreditBucket {
    allocated: number;
    used: number;
    remaining: number;
}

export interface ProviderAccountBalances {
    coresignal_search_remaining: number | null;
    coresignal_collect_remaining: number | null;
    fullenrich_balance: number | null;
}

export interface ProviderCreditsResponse {
    workspace_id: string;
    enabled: boolean;
    buckets: Record<string, ProviderCreditBucket>;
    account: ProviderAccountBalances;
    allocated_at: string | null;
}

export async function fetchProviderCredits(options?: { signal?: AbortSignal }) {
    return apiRequest<ProviderCreditsResponse>('/credits/providers', options);
}

export interface BillingLimits {
    mailboxes: number;
    active_campaigns: number;
}

export interface BillingPlan {
    key: 'starter' | 'growth' | 'pro' | 'enterprise';
    name: string;
    monthly_price_usd: number;
    yearly_price_usd: number;
    monthly_credits: number;
    provider_search_credits?: number;
    provider_enrich_credits?: number;
    limits: BillingLimits;
    stripe_product_lookup_key: string;
    stripe_monthly_price_lookup_key: string;
    stripe_yearly_price_lookup_key: string;
}

export interface TopUpPack {
    key: string;
    credits: number;
    price_usd: number;
    stripe_product_lookup_key: string;
    stripe_price_lookup_key: string;
    /** Provider bucket this pack refills: "coresignal_search" | "fullenrich". */
    bucket?: string | null;
}

export interface BillingCatalogResponse {
    plans: BillingPlan[];
    topups: TopUpPack[];
    rate_card: Record<string, number>;
    low_credit_thresholds: number[];
    automatic_tax_enabled: boolean;
    portal_enabled: boolean;
}

export interface SearchAccessResponse {
    /** True when the recruiter has used their free search and isn't subscribed. */
    locked: boolean;
    free_search_used: boolean;
    subscription_active: boolean;
    trial_enabled: boolean;
}

export async function fetchSearchAccess(options?: { signal?: AbortSignal }) {
    return apiRequest<SearchAccessResponse>('/search/access', options);
}

export interface BillingCreditBucket {
    kind: 'subscription' | 'top_up' | 'promo' | 'legacy';
    label: string;
    available: number;
    reserved: number;
    consumed: number;
    expires_at?: string | null;
}

export interface BillingUsageSummary {
    search: number;
    enrichment: number;
    outreach: number;
}

export interface BillingWorkspaceState {
    stripe_customer_id?: string | null;
    subscription_id?: string | null;
    plan_key?: 'starter' | 'growth' | 'pro' | 'enterprise' | null;
    interval?: 'month' | 'year' | null;
    subscription_status?: string | null;
    current_period_start?: string | null;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
    next_invoice_at?: string | null;
    active_entitlements?: string[];
    next_credit_grant_at?: string | null;
    last_credit_grant_at?: string | null;
    limits?: BillingLimits | null;
}

export interface BillingSummary {
    workspace_id: string;
    billing: BillingWorkspaceState;
    available_credits: number;
    reserved_credits: number;
    monthly_included_credits: number;
    buckets: BillingCreditBucket[];
    usage_this_cycle: BillingUsageSummary;
    low_credit_thresholds: number[];
    low_credit_state: 'healthy' | 'low' | 'critical' | 'empty';
}

export interface BillingLedgerRow {
    id: string;
    workspace_id: string;
    kind:
        | 'plan_grant'
        | 'topup_grant'
        | 'search_charge'
        | 'enrichment_hold'
        | 'enrichment_release'
        | 'enrichment_settle'
        | 'send_hold'
        | 'send_release'
        | 'send_settle'
        | 'refund_credit'
        | 'manual_adjustment';
    amount: number;
    created_at?: string | null;
    reason?: string | null;
    source?: string | null;
    source_ref?: string | null;
    idempotency_key: string;
    metadata: Record<string, unknown>;
}

export interface BillingLedgerResponse {
    items: BillingLedgerRow[];
    current_balance: number;
}

export type AnalyticsRangeKey = '7d' | '30d' | '90d' | '365d';

export interface AnalyticsSeriesPoint {
    day: string;
    value: number;
}

export interface AnalyticsCreditTrendPoint {
    day: string;
    search: number;
    enrichment: number;
    outreach: number;
    total: number;
}

export interface AnalyticsKpiCard {
    key: string;
    label: string;
    value: number;
    display_value: string;
    delta_pct?: number | null;
    trend: number[];
    detail?: string | null;
}

export interface AnalyticsBreakdownRow {
    key: string;
    label: string;
    value: number;
    percentage: number;
    metadata: Record<string, unknown>;
}

export interface AnalyticsCreditSnapshot {
    available: number;
    reserved: number;
    monthly_included: number;
    spent_in_range: number;
    credit_runway_days?: number | null;
}

export interface AnalyticsReleaseSignal {
    key: string;
    label: string;
    status: 'healthy' | 'warning' | 'critical';
    value: string;
    detail?: string | null;
}

export interface AnalyticsRollupMetadata {
    range: AnalyticsRangeKey;
    generated_at: string;
    last_rollup_at?: string | null;
    rollup_status: 'fresh' | 'stale' | 'missing';
    rollup_lag_seconds?: number | null;
    rollup_message?: string | null;
}

export interface AnalyticsOverviewResponse extends AnalyticsRollupMetadata {
    kpis: AnalyticsKpiCard[];
    activity_trend: AnalyticsSeriesPoint[];
    credit_spend_trend: AnalyticsCreditTrendPoint[];
    source_mix: AnalyticsBreakdownRow[];
    workflow_mix: AnalyticsBreakdownRow[];
    credit_snapshot: AnalyticsCreditSnapshot;
    release_signals: AnalyticsReleaseSignal[];
}

export interface AnalyticsFunnelStage {
    key: string;
    label: string;
    count: number;
    conversion_from_previous?: number | null;
    avg_hours_from_previous?: number | null;
}

export interface AnalyticsFunnelResponse extends AnalyticsRollupMetadata {
    stages: AnalyticsFunnelStage[];
}

export interface AnalyticsCampaignLeaderboardRow {
    campaign_id: string;
    campaign_name: string;
    status: string;
    project_id?: string | null;
    project_name?: string | null;
    sent: number;
    replied: number;
    bounced: number;
    active_enrollments: number;
    reply_rate: number;
}

export interface AnalyticsCampaignPerformanceResponse extends AnalyticsRollupMetadata {
    summary: AnalyticsKpiCard[];
    reply_rate_trend: AnalyticsSeriesPoint[];
    send_volume_trend: AnalyticsSeriesPoint[];
    campaign_leaderboard: AnalyticsCampaignLeaderboardRow[];
}

export interface AnalyticsCampaignEnrollmentRow {
    id: string;
    candidate_id: string;
    candidate_name?: string | null;
    candidate_email?: string | null;
    company_name?: string | null;
    job_title?: string | null;
    status: string;
    current_step_order: number;
    next_send_at?: string | null;
    last_error?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface AnalyticsCampaignStatusBreakdown {
    status: string;
    count: number;
    percentage: number;
}

export interface AnalyticsCampaignDetailResponse extends AnalyticsRollupMetadata {
    campaign: AnalyticsCampaignLeaderboardRow;
    daily: AnalyticsSeriesPoint[];
    reply_rate_trend: AnalyticsSeriesPoint[];
    status_breakdown: AnalyticsCampaignStatusBreakdown[];
    enrollments: AnalyticsCampaignEnrollmentRow[];
    task_health: AnalyticsKpiCard[];
    next_cursor?: string | null;
}

export interface AnalyticsSpendCategory {
    key: string;
    label: string;
    credits: number;
    percentage: number;
}

export interface AnalyticsSpendAttributionRow {
    key: string;
    label: string;
    credits: number;
    percentage: number;
    project_id?: string | null;
    campaign_id?: string | null;
}

export interface AnalyticsHighCostEvent {
    idempotency_key: string;
    kind: string;
    label: string;
    credits: number;
    created_at?: string | null;
    project_id?: string | null;
    project_name?: string | null;
    campaign_id?: string | null;
    campaign_name?: string | null;
    source_ref?: string | null;
    metadata: Record<string, unknown>;
}

export interface AnalyticsSpendResponse extends AnalyticsRollupMetadata {
    categories: AnalyticsSpendCategory[];
    daily: AnalyticsCreditTrendPoint[];
    by_project: AnalyticsSpendAttributionRow[];
    by_campaign: AnalyticsSpendAttributionRow[];
    high_cost_events: AnalyticsHighCostEvent[];
    credit_snapshot: AnalyticsCreditSnapshot;
    unit_economics: AnalyticsKpiCard[];
}

export interface AnalyticsPredictionCard {
    key: string;
    label: string;
    display_value: string;
    value?: number | null;
    insufficient_data: boolean;
    method_label: string;
    explanation: string;
}

export interface AnalyticsPredictionsResponse extends AnalyticsRollupMetadata {
    projected_topup_at?: string | null;
    predictions: AnalyticsPredictionCard[];
}

export interface AccountSettings {
    first_name: string;
    last_name: string;
    email: string;
    timezone: string;
    auth_methods: string[];
    is_verified: boolean;
    account_deletion?: AccountDeletionStatus | null;
    account_deletion_confirmation_text: string;
}

export interface AccountDeletionStatus {
    request_id: string;
    status: DataRequest['status'];
    requested_at?: string | null;
    active_subscription_at_request: boolean;
    message?: string | null;
}

export interface WorkspaceSettings {
    name: string;
    billing_contact_email?: string | null;
    timezone: string;
    company_website?: string | null;
    company_address?: string | null;
    company_address_meta?: AddressMetadata | null;
}

export interface AddressComponent {
    long_name: string;
    short_name?: string | null;
    types: string[];
}

export interface AddressLocation {
    latitude: number;
    longitude: number;
}

export interface AddressMetadata {
    source: 'google_places' | 'manual';
    place_id?: string | null;
    formatted_address?: string | null;
    address_components?: AddressComponent[];
    location?: AddressLocation | null;
}

export interface AddressPrediction {
    place_id: string;
    text: string;
    main_text?: string | null;
    secondary_text?: string | null;
    types: string[];
}

export interface AddressAutocompleteResponse {
    predictions: AddressPrediction[];
}

export interface AddressDetailsResponse extends AddressMetadata {
    source: 'google_places';
    place_id: string;
    formatted_address: string;
    address_components: AddressComponent[];
}

export interface OutreachDefaults {
    signature?: OutreachSignature | null;
    reply_to_email?: string | null;
    send_window_start: string;
    send_window_end: string;
    send_window_timezone: string;
    unsubscribe_footer: string;
}

export interface ComplianceSettings {
    retention_days: number;
    privacy_contact_email?: string | null;
    legal_basis_note: string;
    privacy_policy_url?: string | null;
    terms_url?: string | null;
}

export interface NotificationSettings {
    billing_low_credit: boolean;
    campaign_send_health: boolean;
    enrichment_completed: boolean;
    referral_updates: boolean;
    security_alerts: boolean;
}

export interface IntegrationStatus {
    key: string;
    label: string;
    status: 'connected' | 'not_connected' | 'configured' | 'not_configured';
    detail?: string | null;
}

export interface SettingsAuditEvent {
    id: string;
    workspace_id: string;
    actor_user_id: string;
    event_type: string;
    target: string;
    created_at?: string | null;
    metadata: Record<string, unknown>;
}

export interface SecuritySettings {
    auth_methods: string[];
    email_verified: boolean;
    active_sessions_supported: boolean;
    two_factor_supported: boolean;
    sso_supported: boolean;
    recent_sensitive_events: SettingsAuditEvent[];
}

export type DataRequestType = 'account_delete' | 'workspace_export' | 'workspace_delete' | 'candidate_export' | 'candidate_delete' | 'candidate_anonymize';
export type DataRequestCreateType = Exclude<DataRequestType, 'account_delete'>;

export interface DataRequest {
    id: string;
    workspace_id: string;
    request_type: DataRequestType;
    status: 'requested' | 'in_review' | 'completed' | 'rejected' | 'cancelled';
    subject_email_masked?: string | null;
    candidate_id?: string | null;
    notes?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    completed_at?: string | null;
}

export interface ReferralInvite {
    id: string;
    email_masked: string;
    status: 'invited' | 'converted' | 'reward_issued' | 'expired';
    referral_code: string;
    referee_discount_percent: number;
    referrer_reward_percent: number;
    sent_at?: string | null;
    expires_at?: string | null;
    converted_at?: string | null;
    reward_issued_at?: string | null;
}

export interface ReferralProgramSummary {
    referral_code: string;
    share_url: string;
    referee_discount_percent: number;
    referrer_reward_percent: number;
    invite_expires_days: number;
    reward_expires_days: number;
    terms: string[];
    invites: ReferralInvite[];
}

export interface PaymentMethodSummary {
    id?: string | null;
    type: string;
    brand?: string | null;
    last4?: string | null;
    exp_month?: number | null;
    exp_year?: number | null;
    billing_name?: string | null;
    billing_email?: string | null;
    is_default: boolean;
}

export interface InvoiceSummary {
    id: string;
    number?: string | null;
    status?: string | null;
    currency: string;
    amount_due: number;
    amount_paid: number;
    hosted_invoice_url?: string | null;
    invoice_pdf?: string | null;
    created_at?: string | null;
    due_date?: string | null;
}

export interface PaymentSettingsResponse {
    stripe_configured: boolean;
    stripe_customer_id?: string | null;
    billing_email?: string | null;
    default_payment_method?: PaymentMethodSummary | null;
    payment_methods: PaymentMethodSummary[];
    recent_invoices: InvoiceSummary[];
    can_update_payment_method: boolean;
    can_remove_payment_method: boolean;
    can_view_invoices: boolean;
    message?: string | null;
}

export interface SettingsPayload {
    account: AccountSettings;
    workspace: WorkspaceSettings;
    outreach_defaults: OutreachDefaults;
    compliance: ComplianceSettings;
    notifications: NotificationSettings;
    integrations: IntegrationStatus[];
    security: SecuritySettings;
    referral: ReferralProgramSummary;
    data_requests: DataRequest[];
    audit_events: SettingsAuditEvent[];
}

export interface ReferralInviteResponse {
    invite: ReferralInvite;
    referral: ReferralProgramSummary;
}

export interface CheckoutSessionResponse {
    url: string;
    session_id?: string | null;
}

export interface PortalSessionResponse {
    url: string;
}

export interface EnrichmentEstimateRequest {
    list_id: string;
    scope: 'all_in_list' | 'selected_candidate_ids';
    candidate_ids?: string[];
    fields: Array<'work_email' | 'personal_email' | 'phone'>;
}

export interface EnrichmentEstimateResponse {
    target_candidate_count: number;
    estimated_credits: number;
    balance: number;
    balance_after: number;
    skipped_inflight: number;
}

export interface EnrichmentRunSummary {
    id: string;
    workspace_id: string;
    list_id: string;
    status: 'pending' | 'in_progress' | 'completed' | 'partially_completed' | 'failed' | 'cancelled';
    requested_fields: Array<'work_email' | 'personal_email' | 'phone'>;
    target_candidate_count: number;
    estimated_credits: number;
    actual_credits: number;
    skipped_inflight: number;
    webhook_events_received: number;
    client_idempotency_key?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    completed_at?: string | null;
}

export interface EnrichmentTaskSummary {
    total: number;
    pending: number;
    claimed: number;
    submitted: number;
    completed: number;
    failed: number;
}

export interface EnrichmentRunDetail extends EnrichmentRunSummary {
    task_summary: EnrichmentTaskSummary;
}

export interface EnrichmentRunsResponse {
    items: EnrichmentRunSummary[];
}

export interface EnrichmentRunCreateRequest extends EnrichmentEstimateRequest {
    idempotency_key: string;
}

export interface MailboxSendWindow {
    start_local: string;
    end_local: string;
    weekdays: number[];
    timezone: string;
}

export interface MailboxSummary {
    id: string;
    workspace_id: string;
    user_id: string;
    email: string;
    provider: 'gmail';
    google_subject: string;
    scopes: string[];
    mailbox_mode: 'send_only_minimal_scope';
    daily_cap: number;
    send_window: MailboxSendWindow;
    sent_today: number;
    sent_today_reset_at?: string | null;
    last_send_at?: string | null;
    last_test_send_at?: string | null;
    status: 'healthy' | 'error' | 'disconnected';
    last_error?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface MailboxConnectResponse {
    url: string;
}

export interface MailboxSettingsUpdateRequest {
    daily_cap?: number;
    send_window?: MailboxSendWindow;
}

export interface MailboxTestSendResponse {
    mailbox_id: string;
    status: 'healthy' | 'error' | 'disconnected';
    sent_to: string;
    provider_message_id?: string | null;
    provider_thread_id?: string | null;
    last_test_send_at?: string | null;
}

export interface MailboxDeleteResponse {
    mailbox_id: string;
    email: string;
    deleted: boolean;
}

export interface OutreachSignature {
    sender_name: string;
    sender_email: string;
    sender_phone: string;
    sender_address: string;
    sender_website?: string | null;
}

export interface OutreachStep {
    step_order: number;
    subject: string;
    body_text: string;
    body_html?: string | null;
    delay_days: number;
    mailbox_id?: string | null;
    send_after_local?: string | null;
    daily_cap?: number | null;
}

export interface CampaignSchedule {
    timezone: string;
    launch_mode: 'now' | 'scheduled';
    start_at?: string | null;
    weekdays: number[];
    window_start_local: string;
    window_end_local: string;
    daily_campaign_cap: number;
    min_spacing_minutes: number;
    max_spacing_minutes: number;
}

export interface CampaignSummary {
    id: string;
    workspace_id: string;
    name: string;
    list_id: string;
    list_name?: string | null;
    mailbox_id?: string | null;
    mailbox_email?: string | null;
    status: 'draft' | 'launched' | 'paused' | 'stopped' | 'completed';
    steps: OutreachStep[];
    schedule?: CampaignSchedule;
    signature?: OutreachSignature | null;
    audience_count: number;
    eligible_count: number;
    suppressed_count: number;
    sent_count: number;
    replied_count: number;
    bounced_count: number;
    created_at?: string | null;
    updated_at?: string | null;
    launched_at?: string | null;
}

export interface EnrollmentSummary {
    id: string;
    campaign_id: string;
    candidate_id: string;
    candidate_name?: string | null;
    candidate_email?: string | null;
    company_name?: string | null;
    job_title?: string | null;
    status: 'ready' | 'sent' | 'replied' | 'bounced' | 'paused' | 'completed' | 'stopped' | 'suppressed' | 'unsubscribed';
    current_step_order: number;
    next_send_at?: string | null;
    gmail_thread_id?: string | null;
    last_error?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface CampaignDetail extends CampaignSummary {
    enrollments: EnrollmentSummary[];
}

export interface CampaignComposeResponse {
    subject: string;
    body_text: string;
    body_html?: string | null;
    followups: OutreachStep[];
    variables_used: string[];
    compliance_notes: string[];
}

export interface CampaignLaunchResponse {
    campaign_id: string;
    status: CampaignSummary['status'];
    audience_count: number;
    eligible_count: number;
    suppressed_count: number;
    first_step_tasks_created: number;
}

export function previewCandidateToImportPayload(
    row: PreviewGridRow,
    metadata?: {
        queryHash?: string | null;
        searchPrompt?: string | null;
        previewPage?: number | null;
        pipeline?: string | null;
        searchedAt?: string | null;
    },
): SaveToListCandidatePayload {
    return {
        id: row.id,
        full_name: row.full_name,
        websites_linkedin: row.websites_linkedin,
        headline: row.headline,
        location_full: row.location_full,
        location_country: row.location_country,
        connections_count: row.connections_count,
        follower_count: row.follower_count,
        company_name: row.company_name,
        company_linkedin_url: row.company_linkedin_url,
        company_website: row.company_website,
        company_industry: row.company_industry,
        job_title: row.job_title,
        department: row.department,
        management_level: row.management_level,
        company_location_hq_full_address: row.company_location_hq_full_address,
        company_location_hq_country: row.company_location_hq_country,
        score: row.score,
        source_query_hash: metadata?.queryHash ?? row.query_hash ?? null,
        source_search_prompt: metadata?.searchPrompt ?? row.search_prompt ?? null,
        source_preview_page: metadata?.previewPage ?? row.page ?? null,
        pipeline: metadata?.pipeline ?? row.pipeline ?? null,
        searched_at: metadata?.searchedAt ?? row.searched_at ?? null,
    };
}

export async function fetchWorkspace() {
    return apiRequest<WorkspaceSummary>('/workspace');
}

export async function fetchProjects({ archived = false }: { archived?: boolean } = {}) {
    return apiRequest<ProjectSummary[]>(`/projects?archived=${archived ? 'true' : 'false'}`);
}

export async function fetchProject(projectId: string) {
    return apiRequest<ProjectSummary>(`/projects/${projectId}`);
}

export async function createProject(payload: { name: string; color?: string | null }) {
    return apiRequest<ProjectSummary>('/projects', { method: 'POST', body: payload });
}

export async function updateProject(projectId: string, payload: Record<string, unknown>) {
    return apiRequest<ProjectSummary>(`/projects/${projectId}`, { method: 'PATCH', body: payload });
}

export async function archiveProject(projectId: string) {
    return apiRequest<ProjectSummary>(`/projects/${projectId}`, { method: 'DELETE' });
}

export async function fetchProjectLists(projectId: string) {
    return apiRequest<ListSummary[]>(`/projects/${projectId}/lists`);
}

export async function fetchLists(params?: { projectId?: string | null; search?: string | null }) {
    const searchParams = new URLSearchParams();
    if (params?.projectId) searchParams.set('project_id', params.projectId);
    if (params?.search) searchParams.set('search', params.search);
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest<ListSummary[]>(`/lists${suffix}`);
}

export async function fetchMailboxes() {
    return apiRequest<MailboxSummary[]>('/mailboxes');
}

export async function fetchMailboxConnectUrl(returnPath: string = '/dashboard/mailboxes') {
    const params = new URLSearchParams({ return_path: returnPath });
    return apiRequest<MailboxConnectResponse>(`/mailboxes/google/connect?${params.toString()}`);
}

export async function updateMailbox(mailboxId: string, payload: MailboxSettingsUpdateRequest) {
    return apiRequest<MailboxSummary>(`/mailboxes/${mailboxId}`, { method: 'PATCH', body: payload });
}

export async function sendMailboxTest(mailboxId: string) {
    return apiRequest<MailboxTestSendResponse>(`/mailboxes/${mailboxId}/test`, { method: 'POST' });
}

export async function disconnectMailbox(mailboxId: string) {
    return apiRequest<MailboxSummary>(`/mailboxes/${mailboxId}/disconnect`, { method: 'POST' });
}

export async function deleteMailbox(mailboxId: string) {
    return apiRequest<MailboxDeleteResponse>(`/mailboxes/${mailboxId}`, { method: 'DELETE' });
}

export async function fetchCampaigns(options: { signal?: AbortSignal } = {}) {
    return apiRequest<CampaignSummary[]>('/campaigns', options);
}

export async function createCampaign(payload: {
    name: string;
    list_id: string;
    mailbox_id?: string | null;
    steps?: OutreachStep[];
    schedule?: CampaignSchedule;
    signature?: OutreachSignature | null;
}) {
    return apiRequest<CampaignSummary>('/campaigns', { method: 'POST', body: payload });
}

export async function fetchCampaign(campaignId: string, options: { signal?: AbortSignal } = {}) {
    return apiRequest<CampaignDetail>(`/campaigns/${campaignId}`, options);
}

export async function updateCampaign(campaignId: string, payload: Record<string, unknown>) {
    return apiRequest<CampaignSummary>(`/campaigns/${campaignId}`, { method: 'PATCH', body: payload });
}

export async function composeCampaignMessage(payload: {
    list_id: string;
    role_context: string;
    tone?: string;
    followup_count?: number;
}) {
    return apiRequest<CampaignComposeResponse>('/campaigns/compose', { method: 'POST', body: payload });
}

export async function launchCampaign(campaignId: string, launchIdempotencyKey: string) {
    return apiRequest<CampaignLaunchResponse>(`/campaigns/${campaignId}/launch`, {
        method: 'POST',
        body: { launch_idempotency_key: launchIdempotencyKey },
    });
}

export async function pauseCampaign(campaignId: string) {
    return apiRequest<CampaignSummary>(`/campaigns/${campaignId}/pause`, { method: 'POST' });
}

export async function resumeCampaign(campaignId: string) {
    return apiRequest<CampaignSummary>(`/campaigns/${campaignId}/resume`, { method: 'POST' });
}

export async function stopCampaign(campaignId: string) {
    return apiRequest<CampaignSummary>(`/campaigns/${campaignId}/stop`, { method: 'POST' });
}

export async function markEnrollmentReplied(campaignId: string, enrollmentId: string) {
    return apiRequest<{ enrollment: EnrollmentSummary }>(`/campaigns/${campaignId}/enrollments/${enrollmentId}/mark-replied`, { method: 'POST' });
}

export async function markEnrollmentBounced(campaignId: string, enrollmentId: string) {
    return apiRequest<{ enrollment: EnrollmentSummary }>(`/campaigns/${campaignId}/enrollments/${enrollmentId}/mark-bounced`, { method: 'POST' });
}

export async function fetchList(listId: string) {
    return apiRequest<ListSummary>(`/lists/${listId}`);
}

export async function createList(projectId: string, payload: { name: string }) {
    return apiRequest<ListSummary>(`/projects/${projectId}/lists`, { method: 'POST', body: payload });
}

export async function updateList(listId: string, payload: Record<string, unknown>) {
    return apiRequest<ListSummary>(`/lists/${listId}`, { method: 'PATCH', body: payload });
}

export async function deleteList(listId: string) {
    return apiRequest<{ deleted: boolean; list_id: string }>(`/lists/${listId}`, { method: 'DELETE' });
}

export async function fetchListCandidates(
    listId: string,
    params?: { cursor?: string | null; limit?: number; page?: number; perPage?: number; search?: string | null },
) {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('per_page', String(params.perPage));
    if (params?.search) searchParams.set('search', params.search);
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest<PaginatedListCandidatesResponse>(`/lists/${listId}/candidates${suffix}`);
}

export async function updateListCandidateContact(
    listId: string,
    candidateId: string,
    payload: { phone?: string | null; work_email?: string | null; personal_email?: string | null },
) {
    return apiRequest<ListCandidateRow>(
        `/lists/${listId}/candidates/${candidateId}/contact`,
        { method: 'PATCH', body: payload },
    );
}

export async function importListCandidates(listId: string, candidates: SaveToListCandidatePayload[]) {
    return apiRequest<SaveToListResponse>(`/lists/${listId}/candidates`, {
        method: 'POST',
        body: { candidates },
    });
}

export async function removeListCandidates(listId: string, candidateIds: string[]) {
    return apiRequest<{ deleted_count: number; candidate_count: number }>(`/lists/${listId}/candidates`, {
        method: 'DELETE',
        body: { candidate_ids: candidateIds },
    });
}

export async function fetchSavedCandidates(params: { page: number; search?: string }) {
    const searchParams = new URLSearchParams({
        page: String(params.page),
        per_page: '20',
    });
    if (params.search) {
        searchParams.set('search', params.search);
    }
    return apiRequest<CandidatesResponse>(`/candidates?${searchParams.toString()}`);
}

export async function fetchSavedSearches(projectId?: string | null) {
    const suffix = projectId ? `?project_id=${encodeURIComponent(projectId)}` : '';
    return apiRequest<SavedSearchSummary[]>(`/saved-searches${suffix}`);
}

export async function createSavedSearch(payload: {
    name: string;
    prompt: string;
    mode: 'legacy' | 'langgraph';
    structured_filters: Record<string, unknown>;
    project_id?: string | null;
}) {
    return apiRequest<SavedSearchSummary>('/saved-searches', { method: 'POST', body: payload });
}

export async function deleteSavedSearch(savedSearchId: string) {
    return apiRequest<{ deleted: boolean; saved_search_id: string }>(`/saved-searches/${savedSearchId}`, {
        method: 'DELETE',
    });
}

export async function fetchCreditBalance() {
    return apiRequest<CreditBalanceResponse>('/credits/balance');
}

export async function fetchBillingCatalog(options?: { signal?: AbortSignal }) {
    return apiRequest<BillingCatalogResponse>('/billing/catalog', options);
}

export async function fetchBillingSummary(options?: { signal?: AbortSignal }) {
    return apiRequest<BillingSummary>('/billing/summary', options);
}

export async function fetchBillingLedger(kinds?: string[]) {
    const suffix = kinds && kinds.length > 0 ? `?kinds=${encodeURIComponent(kinds.join(','))}` : '';
    return apiRequest<BillingLedgerResponse>(`/billing/ledger${suffix}`);
}

export async function fetchSettings(options?: { signal?: AbortSignal }) {
    return apiRequest<SettingsPayload>('/settings', options);
}

export async function fetchPaymentSettings(options?: { signal?: AbortSignal }) {
    return apiRequest<PaymentSettingsResponse>('/settings/payment', options);
}

export async function autocompleteAddress(input: string, sessionToken: string, options?: { signal?: AbortSignal }) {
    return apiRequest<AddressAutocompleteResponse>('/settings/address/autocomplete', {
        method: 'POST',
        body: { input, session_token: sessionToken },
        signal: options?.signal,
    });
}

export async function fetchAddressDetails(placeId: string, sessionToken: string, options?: { signal?: AbortSignal }) {
    return apiRequest<AddressDetailsResponse>('/settings/address/details', {
        method: 'POST',
        body: { place_id: placeId, session_token: sessionToken },
        signal: options?.signal,
    });
}

export async function updateAccountSettings(payload: Partial<AccountSettings>) {
    return apiRequest<SettingsPayload>('/settings/account', { method: 'PATCH', body: payload });
}

export async function updateWorkspaceSettings(payload: Partial<WorkspaceSettings>) {
    return apiRequest<SettingsPayload>('/settings/workspace', { method: 'PATCH', body: payload });
}

export async function updateOutreachDefaults(payload: Partial<OutreachDefaults>) {
    return apiRequest<SettingsPayload>('/settings/outreach-defaults', { method: 'PATCH', body: payload });
}

export async function updateComplianceSettings(payload: Partial<ComplianceSettings>) {
    return apiRequest<SettingsPayload>('/settings/compliance', { method: 'PATCH', body: payload });
}

export async function updateNotificationSettings(payload: Partial<NotificationSettings>) {
    return apiRequest<SettingsPayload>('/settings/notifications', { method: 'PATCH', body: payload });
}

export async function createDataRequest(payload: {
    request_type: DataRequestCreateType;
    subject_email?: string | null;
    candidate_id?: string | null;
    notes?: string | null;
    confirmation?: string | null;
}) {
    return apiRequest<DataRequest>('/settings/data-requests', { method: 'POST', body: payload });
}

export async function requestAccountDeletion(payload: { confirmation: string; reason?: string | null }) {
    return apiRequest<DataRequest>('/settings/account-deletion/request', { method: 'POST', body: payload });
}

export async function fetchReferralProgram() {
    return apiRequest<ReferralProgramSummary>('/settings/referrals');
}

export async function inviteReferral(email: string) {
    return apiRequest<ReferralInviteResponse>('/settings/referrals/invite', { method: 'POST', body: { email } });
}

function analyticsQuery(params?: {
    range?: AnalyticsRangeKey;
    campaignId?: string | null;
    projectId?: string | null;
}) {
    const searchParams = new URLSearchParams();
    if (params?.range) searchParams.set('range', params.range);
    if (params?.campaignId) searchParams.set('campaign_id', params.campaignId);
    if (params?.projectId) searchParams.set('project_id', params.projectId);
    return searchParams.toString() ? `?${searchParams.toString()}` : '';
}

export async function fetchAnalyticsOverview(params?: {
    range?: AnalyticsRangeKey;
}, options?: {
    signal?: AbortSignal;
}) {
    return apiRequest<AnalyticsOverviewResponse>(`/analytics/overview${analyticsQuery(params)}`, options);
}

export async function fetchAnalyticsFunnel(params?: {
    range?: AnalyticsRangeKey;
}, options?: {
    signal?: AbortSignal;
}) {
    return apiRequest<AnalyticsFunnelResponse>(`/analytics/funnel${analyticsQuery(params)}`, options);
}

export async function fetchAnalyticsCampaignPerformance(params?: {
    range?: AnalyticsRangeKey;
    campaignId?: string | null;
    projectId?: string | null;
}, options?: {
    signal?: AbortSignal;
}) {
    return apiRequest<AnalyticsCampaignPerformanceResponse>(`/analytics/campaigns${analyticsQuery(params)}`, options);
}

export async function fetchAnalyticsCampaignDetail(campaignId: string, params?: {
    range?: AnalyticsRangeKey;
    limit?: number;
    cursor?: string | null;
}, options?: {
    signal?: AbortSignal;
}) {
    const searchParams = new URLSearchParams();
    if (params?.range) searchParams.set('range', params.range);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest<AnalyticsCampaignDetailResponse>(`/analytics/campaigns/${campaignId}/detail${query}`, options);
}

export async function fetchAnalyticsSpend(params?: {
    range?: AnalyticsRangeKey;
}, options?: {
    signal?: AbortSignal;
}) {
    return apiRequest<AnalyticsSpendResponse>(`/analytics/spend${analyticsQuery(params)}`, options);
}

export async function fetchAnalyticsPredictions(params?: {
    range?: AnalyticsRangeKey;
}, options?: {
    signal?: AbortSignal;
}) {
    return apiRequest<AnalyticsPredictionsResponse>(`/analytics/predictions${analyticsQuery(params)}`, options);
}

export async function createSubscriptionCheckout(payload: {
    plan_key: 'starter' | 'growth' | 'pro' | 'enterprise';
    interval: 'month' | 'year';
    success_path?: string;
    cancel_path?: string;
}) {
    return apiRequest<CheckoutSessionResponse>('/billing/checkout/subscription', {
        method: 'POST',
        body: payload,
    });
}

export async function createTopUpCheckout(payload: {
    pack_key: string;
    success_path?: string;
    cancel_path?: string;
}) {
    return apiRequest<CheckoutSessionResponse>('/billing/checkout/topup', {
        method: 'POST',
        body: payload,
    });
}

export async function createBillingPortal(
    returnPath: string = '/dashboard/billing/plan',
    flowType?: 'subscription_update' | 'subscription_cancel' | 'payment_method_update',
) {
    return apiRequest<PortalSessionResponse>('/billing/portal', {
        method: 'POST',
        body: { return_path: returnPath, flow_type: flowType },
    });
}

export async function estimateEnrichmentRun(payload: EnrichmentEstimateRequest) {
    return apiRequest<EnrichmentEstimateResponse>('/enrichment/runs/estimate', {
        method: 'POST',
        body: payload,
    });
}

export async function createEnrichmentRun(payload: EnrichmentRunCreateRequest) {
    return apiRequest<EnrichmentRunSummary>('/enrichment/runs', {
        method: 'POST',
        body: payload,
    });
}

export async function fetchEnrichmentRuns(listId?: string | null) {
    const suffix = listId ? `?list_id=${encodeURIComponent(listId)}` : '';
    return apiRequest<EnrichmentRunsResponse>(`/enrichment/runs${suffix}`);
}

export async function fetchEnrichmentRun(runId: string) {
    return apiRequest<EnrichmentRunDetail>(`/enrichment/runs/${runId}`);
}
