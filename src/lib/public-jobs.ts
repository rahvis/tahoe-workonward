// Server-side data access for the PUBLIC job board (no auth, SSR/ISR).
// These run in Server Components / route handlers; they never read localStorage.
import type { FormFieldDef } from '@/lib/jobs';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PublicJobCard {
    slug: string;
    title: string;
    department: string | null;
    team: string | null;
    employment_type: string | null;
    location_type: string | null;
    locations: string[];
    summary: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string;
    salary_interval: string;
    equity: string | null;
    commission: boolean;
    published_at: string | null;
    close_at: string | null;
}

export interface PublicJobDetail extends PublicJobCard {
    description_md: string | null;
    responsibilities: string[];
    requirements: string[];
    nice_to_have: string[];
    skills_required: string[];
    benefits: string[];
    experience_level: string | null;
    application_limits: { max_per_60d?: number; no_reapply_days?: number } | null;
    seo: { meta_title?: string; meta_description?: string; og_image?: string } | null;
}

export interface Branding {
    company_name?: string | null;
    tagline?: string | null;
    logo_url?: string | null;
    accent_color?: string | null;
    about_html?: string | null;
}

export interface BoardResponse { items: PublicJobCard[]; next_cursor: string | null; }
export interface DetailResponse { job: PublicJobDetail; form: { fields: FormFieldDef[] }; branding?: Branding | null; }
export interface StatusResponse {
    job_title: string;
    job_slug: string | null;
    applied_at: string;
    status: string;
    timeline: Array<{ label: string; done: boolean }>;
}

export interface BoardFilters {
    q?: string; department?: string; location_type?: string; employment_type?: string; cursor?: string;
}

export async function fetchBoard(filters: BoardFilters = {}): Promise<BoardResponse> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
    const res = await fetch(`${API}/api/public/jobs?${qs.toString()}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Board request failed (${res.status})`);
    return res.json();
}

export async function fetchDetail(slug: string): Promise<DetailResponse | null> {
    const res = await fetch(`${API}/api/public/jobs/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Detail request failed (${res.status})`);
    return res.json();
}

export async function fetchStatus(token: string): Promise<StatusResponse | null> {
    const res = await fetch(`${API}/api/public/jobs/applications/${encodeURIComponent(token)}`, { cache: 'no-store' });
    if (res.status === 404 || res.status === 410) return null;
    if (!res.ok) throw new Error(`Status request failed (${res.status})`);
    return res.json();
}

export function formatComp(j: Pick<PublicJobCard, 'salary_min' | 'salary_max' | 'salary_currency' | 'salary_interval'>): string {
    if (j.salary_min == null && j.salary_max == null) return '';
    const cur = j.salary_currency || 'USD';
    const fmt = (n?: number | null) => (n == null ? '' : `${cur === 'USD' ? '$' : `${cur} `}${Math.round(n / 1000)}k`);
    const range = [fmt(j.salary_min), fmt(j.salary_max)].filter(Boolean).join('–');
    const per = j.salary_interval && j.salary_interval !== 'annual' ? `/${j.salary_interval}` : '';
    return `${range}${per}`;
}

export function locationLabel(j: Pick<PublicJobCard, 'location_type' | 'locations'>): string {
    const lt = j.location_type ? j.location_type[0].toUpperCase() + j.location_type.slice(1) : '';
    const locs = (j.locations || []).join(', ');
    return [lt, locs].filter(Boolean).join(' · ') || '—';
}
