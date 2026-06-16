import type { Locale } from '@/i18n/config';

export type ResourceListItem = {
    term?: string;
    description: string;
};

export type ResourceExampleTier = 'Simple' | 'Moderate' | 'Complex';

export type ResourceBlock =
    | { type: 'paragraph'; text: string }
    | { type: 'list'; ordered?: boolean; items: ResourceListItem[] }
    | { type: 'quote'; text: string; attribution?: string }
    | { type: 'table'; caption?: string; headers: string[]; rows: string[][] }
    | { type: 'example'; tier: ResourceExampleTier; prompt: string; note?: string };

export type ResourceSection = {
    heading: string;
    blocks: ResourceBlock[];
};

export type Resource = {
    slug: string;
    category: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    date: string;
    updated: string;
    summary: string;
    tags: string[];
    keywords: string[];
    readingTime: string;
    intro: string[];
    sections: ResourceSection[];
};

export const resources: Resource[] = [
    {
        slug: 'search-tips-and-tricks',
        category: 'Search',
        title: 'Tips & tricks for search',
        metaTitle: 'Tahoe Search Tips & Tricks',
        metaDescription:
            'A complete, tested guide to Tahoe search: how every filter works, how to write clear prompts for any kind of role, worked simple-to-complex examples, and tables to fix too-few, too-many, and off-target results.',
        date: '2026-06-13',
        updated: '2026-06-13',
        summary:
            'A tested playbook for Tahoe search — how the filters work, how to write prompts for every kind of role (from the corporate office to the kitchen line), worked simple-to-complex examples, and tables to fix too-few, too-many, and off-target results.',
        tags: ['Search', 'Sourcing', 'Filters', 'Prompts', 'Best practices'],
        keywords: [
            'tahoe search tips',
            'ai recruiting search',
            'how to write a sourcing query',
            'candidate search filters',
            'hospitality recruiting search',
            'sourcing prompt examples',
        ],
        readingTime: '12 min read',
        intro: [
            'Tahoe turns a plain-English prompt into a structured set of filters, then ranks the matching people for you. You describe the role the way you would explain it to a colleague, review the filters Tahoe derives in the popup, and run the search. No Boolean strings, no special syntax.',
            'This guide covers how each filter behaves, how to write a clear prompt for any kind of role — corporate and professional, engineering, sales, finance, healthcare, skilled trades, frontline and logistics, and hospitality and food service — and how to widen or tighten a search that returns too few, too many, or off-target results. Every example below was run against the live candidate database before it was written down, so they are known to return real people.',
        ],
        sections: [
            // ── How it works ────────────────────────────────────────────────
            {
                heading: 'How Tahoe search works',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'You write a prompt, Tahoe parses it into filters, and you review those filters in the popup before the search runs. The first screen of matches comes back ranked, with the strongest fits first. You can edit any filter and run again — your edits are exactly what gets searched.',
                    },
                    {
                        type: 'paragraph',
                        text: 'Two kinds of levers shape a search. Hard filters decide who is included or excluded — job title, country, US state, experience range, department, management level, company industry, and the yes/no toggles. Ranking levers only change the order — skills, keywords, and a city. Knowing which is which is the key to controlling your results.',
                    },
                    {
                        type: 'quote',
                        text: 'Search finds people. It does not answer questions about people. Ask it for line cooks in Texas — not for how many line cooks are in Texas.',
                    },
                ],
            },
            // ── Filter reference ────────────────────────────────────────────
            {
                heading: 'The filters you can use',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'These are the levers available in the filter popup, in plain terms. "Hard" filters include or exclude people; "Ranking" levers only reorder the results you already have.',
                    },
                    {
                        type: 'table',
                        headers: ['Filter', 'What it does', 'Type'],
                        rows: [
                            ['Job title', 'Matches the person’s current title and headline, for example "line cook" or "registered nurse". This is your main lever.', 'Hard'],
                            ['Location — country / US state', 'Restricts results to a country or a US state. These are the only true geographic limits.', 'Hard'],
                            ['Location — city', 'Pushes people in that city up the ranking, but does not remove people elsewhere.', 'Ranking'],
                            ['Skills or keywords', 'Words that should appear in someone’s skills, headline, or summary. They improve ranking.', 'Ranking'],
                            ['Experience (months)', 'A minimum and/or maximum total work experience, in months (5 years = 60 months).', 'Hard'],
                            ['Currently employed', 'Limit to people working now, or not. "Any" applies no limit.', 'Hard'],
                            ['Decision maker', 'Limit to people flagged as decision makers. "Any" applies no limit.', 'Hard'],
                            ['Departments', 'The function a person works in, for example Sales, Operations, or Medical.', 'Hard'],
                            ['Management level', 'A seniority band such as Manager, Director, or Senior.', 'Hard'],
                            ['Company — industry', 'The industry of the person’s employer, for example Restaurants or Hospitals and Health Care.', 'Hard'],
                            ['Company — name / HQ country', 'Specific employers, or where the employer is headquartered.', 'Hard'],
                            ['Education', 'Schools, degrees, and graduation years.', 'Hard'],
                            ['Certifications', 'Certification titles or the body that issued them.', 'Hard'],
                            ['Languages', 'A language, with optional proficiency.', 'Hard'],
                            ['Min followers / connections', 'A minimum number of LinkedIn followers or connections.', 'Hard'],
                        ],
                    },
                    {
                        type: 'quote',
                        text: 'A city sharpens the ranking; it does not fence the search in. To truly limit geography, name the country or the US state.',
                    },
                    {
                        type: 'paragraph',
                        text: 'A few filters read from a fixed list of values, so it pays to use the names the platform recognises:',
                    },
                    {
                        type: 'list',
                        items: [
                            { term: 'Departments that match well', description: 'Engineering and Technical, Sales, Marketing, Operations, Finance & Accounting, Customer Service, Human Resources, Medical, Trades. For kitchen, restaurant, retail, nursing, or construction roles, lead with the job title instead of a department — those are carried far more reliably on the title than on the department tag.' },
                            { term: 'Management levels that match well', description: 'Manager, Director, Senior, Specialist, Owner. If a level returns too little, drop it and rely on job title plus experience.' },
                            { term: 'Industries (use these exact names)', description: 'Restaurants, Hospitality, Hospitals and Health Care, IT Services and IT Consulting, Software Development, Construction, Retail, Financial Services.' },
                        ],
                    },
                ],
            },
            // ── Anatomy of a prompt ─────────────────────────────────────────
            {
                heading: 'Anatomy of a strong prompt',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'A good prompt reads like a sentence you would say to a hiring manager. Name the role, then add only the constraints that truly matter.',
                    },
                    {
                        type: 'list',
                        ordered: true,
                        items: [
                            { term: 'Lead with the job title', description: 'Use the plain, common title — "line cook", "registered nurse", "account executive". Spell it out; avoid abbreviations and internal jargon.' },
                            { term: 'Add a real geographic limit', description: 'Name a country or a US state to actually restrict the pool. A city only nudges the ranking.' },
                            { term: 'Add one or two must-have skills', description: 'These reorder results so the best fits surface first. Keep them few — every extra requirement shrinks the pool.' },
                            { term: 'Set seniority only if it matters', description: 'Use a minimum experience in months, or a management level such as Manager or Director.' },
                            { term: 'Review the popup, then run', description: 'Confirm the parsed filters match your intent before searching. Your edits win.' },
                        ],
                    },
                    {
                        type: 'quote',
                        text: 'One idea per requirement. "Senior line cooks who can also run a busy brunch service and do inventory" parses into far cleaner filters when written as "Line cooks in Texas with at least 3 years of experience."',
                    },
                ],
            },
            // ── Hospitality & food (largest) ────────────────────────────────
            {
                heading: 'Recipes: hospitality & food service',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'Kitchen, restaurant, hotel, and catering roles search best on the job title plus a real location, with the Restaurants or Hospitality industry added when you want to tighten the setting. Start simple and add constraints only if the pool is too large.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Line cooks in the United States', note: 'Filters: Job title + Location (country). Verified live: ~250,000 candidates.' },
                    { type: 'example', tier: 'Simple', prompt: 'Servers in the United States', note: 'Filters: Job title + Location (country). Verified live: ~1.6 million candidates.' },
                    { type: 'example', tier: 'Simple', prompt: 'Bartenders in the United States', note: 'Filters: Job title + Location (country). Verified live: ~600,000 candidates.' },
                    { type: 'example', tier: 'Simple', prompt: 'Baristas in the United States', note: 'Filters: Job title + Location (country). Verified live: ~490,000 candidates.' },
                    { type: 'example', tier: 'Simple', prompt: 'Pastry chefs in the United States', note: 'Filters: Job title + Location (country). Verified live: ~39,000 candidates.' },
                    { type: 'example', tier: 'Simple', prompt: 'Catering managers in the United States', note: 'Filters: Job title + Location (country). Verified live: ~74,000 candidates.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Sous chefs in New York', note: 'Filters: Job title + Location (US state). Verified live: ~11,000 candidates.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Prep cooks in California', note: 'Filters: Job title + Location (US state). Verified live: ~8,000 candidates.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Restaurant managers in Texas with restaurant management experience', note: 'Filters: Job title + Location (US state) + Skill. Verified live: ~15,000 candidates.' },
                    { type: 'example', tier: 'Complex', prompt: 'Executive chefs in the United States with fine dining experience in the restaurants industry', note: 'Filters: Job title + Location (country) + Skill + Company industry. Verified live: ~7,700 candidates.' },
                    { type: 'example', tier: 'Complex', prompt: 'Kitchen managers in Florida with at least 3 years of experience in the restaurants industry', note: 'Filters: Job title + Location (US state) + Experience (36 months) + Company industry. Verified live: ~1,100 candidates.' },
                    { type: 'example', tier: 'Complex', prompt: 'Hotel general managers in the United States in the hospitality industry at the manager level', note: 'Filters: Job title + Location (country) + Company industry + Management level. Verified live: ~2,700 candidates.' },
                ],
            },
            // ── Corporate / professional ────────────────────────────────────
            {
                heading: 'Recipes: corporate & professional',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'Office and professional roles are well covered. Use the title, a location, and a skill or experience minimum to focus the pool.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Project managers in the United States', note: 'Filters: Job title + Location (country). Verified live: millions of candidates — narrow it next.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Executive assistants in the United States with calendar management experience', note: 'Filters: Job title + Location (country) + Skill. Verified live: ~1 million candidates.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Operations managers in Illinois with at least 5 years of experience', note: 'Filters: Job title + Location (US state) + Experience (60 months). Verified live: ~85,000 candidates.' },
                    { type: 'example', tier: 'Complex', prompt: 'Human resources managers in the United States with recruiting experience at the manager level', note: 'Filters: Job title + Location (country) + Skill + Management level. Verified live: ~100,000 candidates.' },
                ],
            },
            // ── Engineering / tech ──────────────────────────────────────────
            {
                heading: 'Recipes: engineering & technical',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'For technical roles, add the core technology as a skill to push the best matches to the top, and a seniority band when you need it.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Software engineers in the United States', note: 'Filters: Job title + Location (country). Verified live: ~1.8 million candidates.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Data scientists in California with Python experience', note: 'Filters: Job title + Location (US state) + Skill. Verified live: ~38,000 candidates.' },
                    { type: 'example', tier: 'Complex', prompt: 'Backend engineers in the United States with Python experience at the senior level', note: 'Filters: Job title + Location (country) + Skill + Management level. Verified live: ~7,000 candidates.' },
                ],
            },
            // ── Sales / marketing ───────────────────────────────────────────
            {
                heading: 'Recipes: sales & marketing',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'Sales and marketing titles are common, so add a domain skill or a management level to find the right tier.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Account executives in the United States', note: 'Filters: Job title + Location (country). Verified live: ~1.5 million candidates.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Marketing managers in New York with at least 4 years of experience', note: 'Filters: Job title + Location (US state) + Experience (48 months). Verified live: ~97,000 candidates.' },
                    { type: 'example', tier: 'Complex', prompt: 'Sales directors in the United States with SaaS experience at the director level', note: 'Filters: Job title + Location (country) + Skill + Management level. Verified live: ~250,000 candidates.' },
                ],
            },
            // ── Finance / operations ────────────────────────────────────────
            {
                heading: 'Recipes: finance & operations',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'Use the financial services industry and an experience minimum to separate seasoned candidates from early-career ones.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Accountants in the United States', note: 'Filters: Job title + Location (country). Verified live: ~1.3 million candidates.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Staff accountants in Texas with at least 2 years of experience', note: 'Filters: Job title + Location (US state) + Experience (24 months). Verified live: ~27,000 candidates.' },
                    { type: 'example', tier: 'Complex', prompt: 'Financial analysts in the United States in the financial services industry with at least 3 years of experience', note: 'Filters: Job title + Location (country) + Company industry + Experience (36 months). Verified live: ~77,000 candidates.' },
                ],
            },
            // ── Healthcare / clinical ───────────────────────────────────────
            {
                heading: 'Recipes: healthcare & clinical',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'Healthcare searches the title strongly. To tighten the setting, add the "Hospitals and Health Care" industry rather than a department.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Registered nurses in the United States', note: 'Filters: Job title + Location (country). Verified live: ~1.3 million candidates.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Medical assistants in Texas', note: 'Filters: Job title + Location (US state). Verified live: ~65,000 candidates.' },
                    { type: 'example', tier: 'Complex', prompt: 'Registered nurses in California in the hospitals and health care industry with at least 2 years of experience', note: 'Filters: Job title + Location (US state) + Company industry + Experience (24 months). Verified live: ~52,000 candidates.' },
                ],
            },
            // ── Skilled trades / field ──────────────────────────────────────
            {
                heading: 'Recipes: skilled trades & field roles',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'Trade and field roles match cleanly on the job title. The Trades department works well as an extra constraint when a title is broad.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Electricians in the United States', note: 'Filters: Job title + Location (country). Verified live: ~390,000 candidates.' },
                    { type: 'example', tier: 'Simple', prompt: 'Diesel mechanics in the United States', note: 'Filters: Job title + Location (country). Verified live: ~35,000 candidates.' },
                    { type: 'example', tier: 'Moderate', prompt: 'HVAC technicians in Texas', note: 'Filters: Job title + Location (US state). Verified live: ~4,000 candidates.' },
                    { type: 'example', tier: 'Complex', prompt: 'Welders in the United States in the trades department', note: 'Filters: Job title + Location (country) + Department. Verified live: ~53,000 candidates.' },
                ],
            },
            // ── Frontline / retail / logistics ──────────────────────────────
            {
                heading: 'Recipes: frontline, retail & logistics',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'High-volume frontline roles return large pools, so add a state, an industry, or a skill to focus them.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Warehouse associates in the United States', note: 'Filters: Job title + Location (country). Verified live: ~300,000 candidates.' },
                    { type: 'example', tier: 'Simple', prompt: 'Truck drivers in the United States', note: 'Filters: Job title + Location (country). Verified live: ~430,000 candidates.' },
                    { type: 'example', tier: 'Simple', prompt: 'Customer service representatives in the United States', note: 'Filters: Job title + Location (country). Verified live: ~1.6 million candidates.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Store managers in Florida in the retail industry', note: 'Filters: Job title + Location (US state) + Company industry. Verified live: ~17,000 candidates.' },
                    { type: 'example', tier: 'Complex', prompt: 'Forklift operators in the United States with warehouse experience', note: 'Filters: Job title + Location (country) + Skill. Verified live: ~157,000 candidates.' },
                ],
            },
            // ── General-tab levers ──────────────────────────────────────────
            {
                heading: 'Using the General filters',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'The General tab carries the simple yes/no and range levers. They combine with any role family above.',
                    },
                    { type: 'example', tier: 'Moderate', prompt: 'Sales managers in the United States with at least 5 years of experience who are currently employed', note: 'Filters: Job title + Location (country) + Experience (60 months) + Currently employed = Yes. Verified live: ~2.1 million candidates.' },
                    { type: 'example', tier: 'Moderate', prompt: 'General managers in the United States who are decision makers', note: 'Filters: Job title + Location (country) + Decision maker = Yes. Verified live: ~300,000 candidates.' },
                    { type: 'example', tier: 'Complex', prompt: 'Registered nurses in the United States with 2 to 10 years of experience', note: 'Filters: Job title + Location (country) + Experience (24–120 months). Verified live: ~300,000 candidates.' },
                ],
            },
            // ── Too few ─────────────────────────────────────────────────────
            {
                heading: 'Fixing too few results',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'A small pool almost always means the hard filters are too tight. Relax them in this order — geography and experience first, then the title, then the optional tags.',
                    },
                    {
                        type: 'table',
                        headers: ['Lever', 'Why it narrows', 'What to do'],
                        rows: [
                            ['Location (city)', 'A city is only a ranking nudge — if you meant it as a limit, you may have over-tightened elsewhere.', 'Switch to the US state or country for the real limit; let the city rank.'],
                            ['Location (US state)', 'A single state is a small slice of the country.', 'Search the whole country, or add neighbouring states.'],
                            ['Experience (months)', 'A tight band removes many capable people.', 'Widen it (e.g., 24–120 instead of 36–60), or remove the maximum.'],
                            ['Job title', 'A long, exact title matches very few headlines.', 'Use a shorter or adjacent title — "cook" instead of "lead line cook".'],
                            ['Skills or keywords', 'Each one is expected to appear, so several together shrink the pool.', 'Keep the one or two that matter; let the rest go.'],
                            ['Company industry', 'The name must match the platform’s list.', 'Use a known value (e.g., "Restaurants", "Hospitals and Health Care") or remove it.'],
                            ['Department / Management level', 'Not every profile carries these tags.', 'Lead with the job title instead, or pick a broader level.'],
                            ['Currently employed / Decision maker', '"Yes" removes everyone not flagged.', 'Set them back to "Any".'],
                            ['Education / Certifications', 'Few profiles list these in full.', 'Make them optional, or remove them.'],
                        ],
                    },
                ],
            },
            // ── Too many ────────────────────────────────────────────────────
            {
                heading: 'Fixing too many results',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'A large pool is a good problem — there is plenty of talent to rank. The current filters do not support "NOT" or exclusions, so you narrow by adding the right positive constraints, not by removing people.',
                    },
                    {
                        type: 'table',
                        headers: ['Goal', 'What to do'],
                        rows: [
                            ['Surface the best first', 'Add a skill or keyword that defines a great match — it reorders without excluding anyone.'],
                            ['Add one hard limit', 'Add a US state, a department (e.g., Sales, Operations, Medical, Trades), or a management level (e.g., Manager, Director).'],
                            ['Match the right seniority', 'Set a minimum experience in months (60 ≈ 5 years).'],
                            ['Match the right setting', 'Add a company industry that fits (e.g., "Restaurants", "Retail", "Hospitals and Health Care").'],
                            ['Keep it to people in role now', 'Set "Currently employed" to Yes.'],
                        ],
                    },
                ],
            },
            // ── Off-target ──────────────────────────────────────────────────
            {
                heading: 'Fixing off-target results',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'If the right kind of person is not showing up, the cause is usually an ambiguous word or a missing limit. Work from the symptom.',
                    },
                    {
                        type: 'table',
                        headers: ['Symptom', 'Likely cause', 'Fix'],
                        rows: [
                            ['Other countries mixed in', 'Only a city was given — that ranks, it does not limit.', 'Add the country or the US state.'],
                            ['Wrong function (e.g., project leads showing for "chef")', 'An ambiguous title word.', 'Use a more specific title — "executive chef" or "sous chef" instead of "chef".'],
                            ['Right title, wrong seniority', 'No level or experience was set.', 'Add a minimum experience in months, or a management level.'],
                            ['Right people ranked low', 'The defining skill is missing.', 'Add the must-have skill as a keyword so it boosts ranking.'],
                        ],
                    },
                ],
            },
            // ── Avoid analytical ────────────────────────────────────────────
            {
                heading: 'Avoid analytical questions',
                blocks: [
                    {
                        type: 'quote',
                        text: 'Search retrieves people who match — it does not count, average, rank cities, or compare groups. Phrase every prompt as "find people who…".',
                    },
                    {
                        type: 'list',
                        items: [
                            { term: 'Don’t: "How many line cooks are in Texas?"', description: 'Do: "Line cooks in Texas" — then read the result count on the screen.' },
                            { term: 'Don’t: "Average experience of nurses in California"', description: 'Do: "Registered nurses in California with at least 2 years of experience".' },
                            { term: 'Don’t: "Which cities have the most welders?"', description: 'Do: "Welders in the United States", then add a state to focus.' },
                            { term: 'Don’t: "Compare bartenders and servers"', description: 'Do: run two searches — "Bartenders in the United States" and "Servers in the United States".' },
                        ],
                    },
                ],
            },
            // ── Checklist ───────────────────────────────────────────────────
            {
                heading: 'A quick checklist',
                blocks: [
                    {
                        type: 'list',
                        items: [
                            { description: 'Named the job title in plain, common words?' },
                            { description: 'Set a country or US state for a real geographic limit (not just a city)?' },
                            { description: 'Added one or two must-have skills as keywords?' },
                            { description: 'Set a minimum experience in months if seniority matters?' },
                            { description: 'Reviewed the parsed filters in the popup before running?' },
                            { description: 'Kept it to "find people who…" — no counts, averages, or comparisons?' },
                        ],
                    },
                ],
            },
        ],
    },
];

// Korean edition. Example `prompt` strings are kept in English on purpose: each
// is a literal query whose "verified live" candidate count was measured against
// the live database, so translating the prompt would invalidate that claim.
const resourcesKo: Resource[] = [
    {
        slug: 'search-tips-and-tricks',
        category: '검색',
        title: '검색 팁 & 트릭',
        metaTitle: 'Tahoe 검색 팁 & 트릭',
        metaDescription:
            'Tahoe 검색 완전 가이드: 각 필터의 작동 방식, 어떤 직무에든 명확한 프롬프트를 작성하는 법, 간단함부터 복잡함까지의 실전 예시, 그리고 결과가 너무 적거나 너무 많거나 빗나갈 때 바로잡는 표.',
        date: '2026-06-13',
        updated: '2026-06-13',
        summary:
            'Tahoe 검색을 위한 검증된 플레이북 — 필터 작동 방식, 모든 직무(사무실부터 주방 라인까지)에 맞는 프롬프트 작성법, 간단함부터 복잡함까지의 실전 예시, 그리고 결과가 너무 적거나 너무 많거나 빗나갈 때 바로잡는 표.',
        tags: ['검색', '소싱', '필터', '프롬프트', '모범 사례'],
        keywords: [
            'Tahoe 검색 팁',
            'AI 리크루팅 검색',
            '소싱 쿼리 작성법',
            '후보자 검색 필터',
            '호스피탈리티 리크루팅 검색',
            '소싱 프롬프트 예시',
        ],
        readingTime: '12분 분량',
        intro: [
            'Tahoe는 평이한 문장으로 쓴 프롬프트를 구조화된 필터 세트로 바꾼 뒤, 매칭되는 사람들을 순위로 정렬해 보여 줍니다. 동료에게 설명하듯 직무를 묘사하고, 팝업에 표시된 Tahoe의 도출 필터를 검토한 다음 검색을 실행하면 됩니다. 불리언 문자열도, 특수 문법도 필요 없습니다.',
            '이 가이드는 각 필터가 어떻게 동작하는지, 어떤 직무(사무·전문직, 엔지니어링, 영업, 재무, 헬스케어, 숙련 기술직, 현장·물류, 호스피탈리티·외식)에든 명확한 프롬프트를 작성하는 법, 그리고 결과가 너무 적거나, 너무 많거나, 빗나갈 때 검색을 넓히거나 좁히는 법을 다룹니다. 아래 예시 프롬프트는 모두 영어로 표기했으며, 글로 옮기기 전에 실제 후보자 데이터베이스에서 직접 실행해 실재하는 사람들이 검색됨을 확인한 것입니다.',
        ],
        sections: [
            {
                heading: 'Tahoe 검색의 작동 방식',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '프롬프트를 작성하면 Tahoe가 이를 필터로 해석하고, 검색이 실행되기 전에 팝업에서 그 필터를 검토할 수 있습니다. 첫 화면에는 가장 잘 맞는 사람부터 순위대로 결과가 돌아옵니다. 어떤 필터든 수정한 뒤 다시 실행할 수 있으며, 수정한 내용이 그대로 검색에 반영됩니다.',
                    },
                    {
                        type: 'paragraph',
                        text: '검색을 좌우하는 지렛대는 두 종류입니다. 하드 필터는 누구를 포함하거나 제외할지 결정합니다 — 직무명, 국가, 미국 주, 경력 범위, 부서, 관리 직급, 회사 산업, 그리고 예/아니오 토글입니다. 랭킹 지렛대는 순서만 바꿉니다 — 스킬, 키워드, 도시입니다. 무엇이 어느 쪽인지 아는 것이 결과를 통제하는 열쇠입니다.',
                    },
                    {
                        type: 'quote',
                        text: '검색은 사람을 찾습니다. 사람에 대한 질문에 답하지는 않습니다. 텍사스의 라인쿡을 요청하세요 — 텍사스에 라인쿡이 몇 명인지가 아니라요.',
                    },
                ],
            },
            {
                heading: '사용할 수 있는 필터',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '필터 팝업에서 쓸 수 있는 지렛대를 쉬운 말로 정리했습니다. "하드" 필터는 사람을 포함하거나 제외하고, "랭킹" 지렛대는 이미 가진 결과의 순서만 바꿉니다.',
                    },
                    {
                        type: 'table',
                        headers: ['필터', '기능', '유형'],
                        rows: [
                            ['직무명', '현재 직함과 헤드라인을 매칭합니다. 예: "line cook" 또는 "registered nurse". 가장 핵심적인 지렛대입니다.', '하드'],
                            ['위치 — 국가 / 미국 주', '결과를 특정 국가나 미국 주로 제한합니다. 이것이 유일한 진짜 지리적 한계입니다.', '하드'],
                            ['위치 — 도시', '해당 도시의 사람을 순위에서 위로 올리지만, 다른 지역 사람을 제거하지는 않습니다.', '랭킹'],
                            ['스킬 또는 키워드', '누군가의 스킬, 헤드라인, 요약에 나타나야 할 단어입니다. 순위를 개선합니다.', '랭킹'],
                            ['경력(개월)', '총 경력의 최소 및/또는 최대값을 개월 단위로 지정합니다(5년 = 60개월).', '하드'],
                            ['현재 재직 중', '지금 일하는 사람으로 한정하거나 그 반대로 합니다. "모두"는 제한을 적용하지 않습니다.', '하드'],
                            ['의사결정권자', '의사결정권자로 표시된 사람으로 한정합니다. "모두"는 제한을 적용하지 않습니다.', '하드'],
                            ['부서', '사람이 속한 직능입니다. 예: 영업, 운영, 의료.', '하드'],
                            ['관리 직급', 'Manager, Director, Senior 같은 연차/직급 구간입니다.', '하드'],
                            ['회사 — 산업', '소속 회사의 산업입니다. 예: Restaurants 또는 Hospitals and Health Care.', '하드'],
                            ['회사 — 이름 / 본사 국가', '특정 회사, 또는 그 회사의 본사 위치입니다.', '하드'],
                            ['학력', '학교, 학위, 졸업 연도입니다.', '하드'],
                            ['자격증', '자격증 명칭 또는 발급 기관입니다.', '하드'],
                            ['언어', '언어, 선택적으로 숙련도까지 지정합니다.', '하드'],
                            ['최소 팔로워 / 커넥션', 'LinkedIn 팔로워 또는 커넥션의 최소 수입니다.', '하드'],
                        ],
                    },
                    {
                        type: 'quote',
                        text: '도시는 순위를 날카롭게 다듬을 뿐, 검색을 가두지 않습니다. 지리를 진짜로 제한하려면 국가나 미국 주를 지정하세요.',
                    },
                    {
                        type: 'paragraph',
                        text: '일부 필터는 고정된 값 목록에서 읽어 들이므로, 플랫폼이 인식하는 이름을 쓰는 것이 좋습니다:',
                    },
                    {
                        type: 'list',
                        items: [
                            { term: '잘 매칭되는 부서', description: 'Engineering and Technical, Sales, Marketing, Operations, Finance & Accounting, Customer Service, Human Resources, Medical, Trades. 주방, 레스토랑, 리테일, 간호, 건설 직무는 부서보다 직무명을 앞세우세요 — 이런 직무는 부서 태그보다 직무명에 훨씬 안정적으로 담겨 있습니다.' },
                            { term: '잘 매칭되는 관리 직급', description: 'Manager, Director, Senior, Specialist, Owner. 직급으로 결과가 너무 적게 나오면 직급을 빼고 직무명과 경력에 의존하세요.' },
                            { term: '산업(이 정확한 이름을 사용하세요)', description: 'Restaurants, Hospitality, Hospitals and Health Care, IT Services and IT Consulting, Software Development, Construction, Retail, Financial Services.' },
                        ],
                    },
                ],
            },
            {
                heading: '강력한 프롬프트의 구조',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '좋은 프롬프트는 채용 담당자에게 말하듯 한 문장처럼 읽힙니다. 직무를 먼저 말하고, 정말 중요한 제약만 덧붙이세요.',
                    },
                    {
                        type: 'list',
                        ordered: true,
                        items: [
                            { term: '직무명을 앞세우세요', description: '평이하고 흔한 직함을 쓰세요 — "line cook", "registered nurse", "account executive". 줄임말과 사내 용어는 피하고 풀어서 쓰세요.' },
                            { term: '진짜 지리적 한계를 넣으세요', description: '풀을 실제로 제한하려면 국가나 미국 주를 지정하세요. 도시는 순위만 살짝 밀어 올립니다.' },
                            { term: '필수 스킬 한두 개를 넣으세요', description: '가장 잘 맞는 사람이 위로 오도록 순서를 바꿔 줍니다. 적게 유지하세요 — 요구사항이 늘수록 풀이 줄어듭니다.' },
                            { term: '필요할 때만 연차를 설정하세요', description: '최소 경력을 개월 단위로, 또는 Manager·Director 같은 관리 직급으로 지정하세요.' },
                            { term: '팝업을 검토한 뒤 실행하세요', description: '검색 전에 해석된 필터가 의도와 맞는지 확인하세요. 당신의 수정이 우선합니다.' },
                        ],
                    },
                    {
                        type: 'quote',
                        text: '요구사항 하나에 아이디어 하나. "바쁜 브런치 서비스도 돌리고 재고 관리도 하는 시니어 라인쿡"은 "텍사스에서 경력 3년 이상인 라인쿡"으로 쓸 때 훨씬 깔끔한 필터로 해석됩니다.',
                    },
                ],
            },
            {
                heading: '레시피: 호스피탈리티 & 외식',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '주방, 레스토랑, 호텔, 케이터링 직무는 직무명 더하기 진짜 위치로 가장 잘 검색됩니다. 환경을 좁히고 싶을 때는 Restaurants 또는 Hospitality 산업을 추가하세요. 간단하게 시작하고, 풀이 너무 클 때만 제약을 더하세요.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Line cooks in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 250,000명.' },
                    { type: 'example', tier: 'Simple', prompt: 'Servers in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 160만 명.' },
                    { type: 'example', tier: 'Simple', prompt: 'Bartenders in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 600,000명.' },
                    { type: 'example', tier: 'Simple', prompt: 'Baristas in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 490,000명.' },
                    { type: 'example', tier: 'Simple', prompt: 'Pastry chefs in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 39,000명.' },
                    { type: 'example', tier: 'Simple', prompt: 'Catering managers in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 74,000명.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Sous chefs in New York', note: '필터: 직무명 + 위치(미국 주). 실시간 검증: 후보자 약 11,000명.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Prep cooks in California', note: '필터: 직무명 + 위치(미국 주). 실시간 검증: 후보자 약 8,000명.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Restaurant managers in Texas with restaurant management experience', note: '필터: 직무명 + 위치(미국 주) + 스킬. 실시간 검증: 후보자 약 15,000명.' },
                    { type: 'example', tier: 'Complex', prompt: 'Executive chefs in the United States with fine dining experience in the restaurants industry', note: '필터: 직무명 + 위치(국가) + 스킬 + 회사 산업. 실시간 검증: 후보자 약 7,700명.' },
                    { type: 'example', tier: 'Complex', prompt: 'Kitchen managers in Florida with at least 3 years of experience in the restaurants industry', note: '필터: 직무명 + 위치(미국 주) + 경력(36개월) + 회사 산업. 실시간 검증: 후보자 약 1,100명.' },
                    { type: 'example', tier: 'Complex', prompt: 'Hotel general managers in the United States in the hospitality industry at the manager level', note: '필터: 직무명 + 위치(국가) + 회사 산업 + 관리 직급. 실시간 검증: 후보자 약 2,700명.' },
                ],
            },
            {
                heading: '레시피: 사무 & 전문직',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '사무·전문직 직무는 데이터가 잘 갖춰져 있습니다. 직무명, 위치, 그리고 스킬이나 최소 경력으로 풀을 좁히세요.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Project managers in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 수백만 명 — 다음 단계에서 좁히세요.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Executive assistants in the United States with calendar management experience', note: '필터: 직무명 + 위치(국가) + 스킬. 실시간 검증: 후보자 약 100만 명.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Operations managers in Illinois with at least 5 years of experience', note: '필터: 직무명 + 위치(미국 주) + 경력(60개월). 실시간 검증: 후보자 약 85,000명.' },
                    { type: 'example', tier: 'Complex', prompt: 'Human resources managers in the United States with recruiting experience at the manager level', note: '필터: 직무명 + 위치(국가) + 스킬 + 관리 직급. 실시간 검증: 후보자 약 100,000명.' },
                ],
            },
            {
                heading: '레시피: 엔지니어링 & 기술직',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '기술 직무는 핵심 기술을 스킬로 추가해 가장 잘 맞는 사람을 위로 올리고, 필요하면 연차 구간을 더하세요.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Software engineers in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 180만 명.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Data scientists in California with Python experience', note: '필터: 직무명 + 위치(미국 주) + 스킬. 실시간 검증: 후보자 약 38,000명.' },
                    { type: 'example', tier: 'Complex', prompt: 'Backend engineers in the United States with Python experience at the senior level', note: '필터: 직무명 + 위치(국가) + 스킬 + 관리 직급. 실시간 검증: 후보자 약 7,000명.' },
                ],
            },
            {
                heading: '레시피: 영업 & 마케팅',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '영업·마케팅 직함은 흔하므로, 도메인 스킬이나 관리 직급을 더해 적절한 층을 찾으세요.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Account executives in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 150만 명.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Marketing managers in New York with at least 4 years of experience', note: '필터: 직무명 + 위치(미국 주) + 경력(48개월). 실시간 검증: 후보자 약 97,000명.' },
                    { type: 'example', tier: 'Complex', prompt: 'Sales directors in the United States with SaaS experience at the director level', note: '필터: 직무명 + 위치(국가) + 스킬 + 관리 직급. 실시간 검증: 후보자 약 250,000명.' },
                ],
            },
            {
                heading: '레시피: 재무 & 운영',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '재무 서비스 산업과 최소 경력을 사용해 숙련된 후보자와 초년 후보자를 구분하세요.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Accountants in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 130만 명.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Staff accountants in Texas with at least 2 years of experience', note: '필터: 직무명 + 위치(미국 주) + 경력(24개월). 실시간 검증: 후보자 약 27,000명.' },
                    { type: 'example', tier: 'Complex', prompt: 'Financial analysts in the United States in the financial services industry with at least 3 years of experience', note: '필터: 직무명 + 위치(국가) + 회사 산업 + 경력(36개월). 실시간 검증: 후보자 약 77,000명.' },
                ],
            },
            {
                heading: '레시피: 헬스케어 & 임상',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '헬스케어는 직무명으로 강하게 검색됩니다. 환경을 좁히려면 부서 대신 "Hospitals and Health Care" 산업을 추가하세요.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Registered nurses in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 130만 명.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Medical assistants in Texas', note: '필터: 직무명 + 위치(미국 주). 실시간 검증: 후보자 약 65,000명.' },
                    { type: 'example', tier: 'Complex', prompt: 'Registered nurses in California in the hospitals and health care industry with at least 2 years of experience', note: '필터: 직무명 + 위치(미국 주) + 회사 산업 + 경력(24개월). 실시간 검증: 후보자 약 52,000명.' },
                ],
            },
            {
                heading: '레시피: 숙련 기술직 & 현장직',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '기술직·현장직은 직무명으로 깔끔하게 매칭됩니다. 직함이 넓을 때는 Trades 부서를 추가 제약으로 쓰면 잘 동작합니다.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Electricians in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 390,000명.' },
                    { type: 'example', tier: 'Simple', prompt: 'Diesel mechanics in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 35,000명.' },
                    { type: 'example', tier: 'Moderate', prompt: 'HVAC technicians in Texas', note: '필터: 직무명 + 위치(미국 주). 실시간 검증: 후보자 약 4,000명.' },
                    { type: 'example', tier: 'Complex', prompt: 'Welders in the United States in the trades department', note: '필터: 직무명 + 위치(국가) + 부서. 실시간 검증: 후보자 약 53,000명.' },
                ],
            },
            {
                heading: '레시피: 현장·리테일·물류',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '대량 채용 현장직은 풀이 크게 나오므로, 주·산업·스킬을 더해 좁히세요.',
                    },
                    { type: 'example', tier: 'Simple', prompt: 'Warehouse associates in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 300,000명.' },
                    { type: 'example', tier: 'Simple', prompt: 'Truck drivers in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 430,000명.' },
                    { type: 'example', tier: 'Simple', prompt: 'Customer service representatives in the United States', note: '필터: 직무명 + 위치(국가). 실시간 검증: 후보자 약 160만 명.' },
                    { type: 'example', tier: 'Moderate', prompt: 'Store managers in Florida in the retail industry', note: '필터: 직무명 + 위치(미국 주) + 회사 산업. 실시간 검증: 후보자 약 17,000명.' },
                    { type: 'example', tier: 'Complex', prompt: 'Forklift operators in the United States with warehouse experience', note: '필터: 직무명 + 위치(국가) + 스킬. 실시간 검증: 후보자 약 157,000명.' },
                ],
            },
            {
                heading: 'General 필터 사용하기',
                blocks: [
                    {
                        type: 'paragraph',
                        text: 'General 탭에는 간단한 예/아니오 토글과 범위 지렛대가 있습니다. 위의 어떤 직무군과도 함께 조합됩니다.',
                    },
                    { type: 'example', tier: 'Moderate', prompt: 'Sales managers in the United States with at least 5 years of experience who are currently employed', note: '필터: 직무명 + 위치(국가) + 경력(60개월) + 현재 재직 중 = 예. 실시간 검증: 후보자 약 210만 명.' },
                    { type: 'example', tier: 'Moderate', prompt: 'General managers in the United States who are decision makers', note: '필터: 직무명 + 위치(국가) + 의사결정권자 = 예. 실시간 검증: 후보자 약 300,000명.' },
                    { type: 'example', tier: 'Complex', prompt: 'Registered nurses in the United States with 2 to 10 years of experience', note: '필터: 직무명 + 위치(국가) + 경력(24~120개월). 실시간 검증: 후보자 약 300,000명.' },
                ],
            },
            {
                heading: '결과가 너무 적을 때 바로잡기',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '풀이 작다는 건 거의 언제나 하드 필터가 너무 빡빡하다는 뜻입니다. 지리와 경력을 먼저, 그다음 직무명, 마지막으로 선택적 태그 순으로 완화하세요.',
                    },
                    {
                        type: 'table',
                        headers: ['지렛대', '왜 좁아지는가', '무엇을 할까'],
                        rows: [
                            ['위치(도시)', '도시는 순위를 미는 역할만 합니다 — 한계로 의도했다면 다른 곳을 과하게 조였을 수 있습니다.', '진짜 한계는 미국 주나 국가로 바꾸고, 도시는 순위에 맡기세요.'],
                            ['위치(미국 주)', '단일 주는 전국의 작은 조각입니다.', '전국을 검색하거나 인접 주를 추가하세요.'],
                            ['경력(개월)', '좁은 구간은 유능한 사람을 많이 걸러 냅니다.', '구간을 넓히거나(예: 36~60 대신 24~120) 최대값을 제거하세요.'],
                            ['직무명', '길고 정확한 직함은 헤드라인을 거의 매칭하지 못합니다.', '더 짧거나 인접한 직함을 쓰세요 — "lead line cook" 대신 "cook".'],
                            ['스킬 또는 키워드', '각 단어가 나타나야 하므로 여러 개를 함께 쓰면 풀이 줄어듭니다.', '중요한 한두 개만 남기고 나머지는 빼세요.'],
                            ['회사 산업', '이름이 플랫폼 목록과 일치해야 합니다.', '알려진 값(예: "Restaurants", "Hospitals and Health Care")을 쓰거나 제거하세요.'],
                            ['부서 / 관리 직급', '모든 프로필이 이 태그를 갖고 있지는 않습니다.', '직무명을 앞세우거나 더 넓은 직급을 고르세요.'],
                            ['현재 재직 중 / 의사결정권자', '"예"는 표시되지 않은 모두를 제거합니다.', '다시 "모두"로 되돌리세요.'],
                            ['학력 / 자격증', '이를 온전히 기재한 프로필은 드뭅니다.', '선택사항으로 두거나 제거하세요.'],
                        ],
                    },
                ],
            },
            {
                heading: '결과가 너무 많을 때 바로잡기',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '풀이 큰 건 좋은 문제입니다 — 순위를 매길 인재가 많다는 뜻이니까요. 현재 필터는 "NOT"이나 제외를 지원하지 않으므로, 사람을 빼는 게 아니라 알맞은 긍정 제약을 더해 좁힙니다.',
                    },
                    {
                        type: 'table',
                        headers: ['목표', '무엇을 할까'],
                        rows: [
                            ['최고의 사람을 먼저 노출', '좋은 매칭을 정의하는 스킬이나 키워드를 추가하세요 — 누구도 제외하지 않고 순서만 바꿉니다.'],
                            ['하드 한계 하나 추가', '미국 주, 부서(예: Sales, Operations, Medical, Trades), 또는 관리 직급(예: Manager, Director)을 추가하세요.'],
                            ['알맞은 연차 매칭', '최소 경력을 개월 단위로 설정하세요(60 ≈ 5년).'],
                            ['알맞은 환경 매칭', '맞는 회사 산업을 추가하세요(예: "Restaurants", "Retail", "Hospitals and Health Care").'],
                            ['지금 재직 중인 사람만', '"현재 재직 중"을 예로 설정하세요.'],
                        ],
                    },
                ],
            },
            {
                heading: '빗나간 결과 바로잡기',
                blocks: [
                    {
                        type: 'paragraph',
                        text: '원하는 부류의 사람이 보이지 않는다면, 보통 모호한 단어나 빠진 한계가 원인입니다. 증상에서 출발하세요.',
                    },
                    {
                        type: 'table',
                        headers: ['증상', '유력한 원인', '해결'],
                        rows: [
                            ['다른 나라가 섞임', '도시만 지정함 — 도시는 순위를 매길 뿐 제한하지 않습니다.', '국가나 미국 주를 추가하세요.'],
                            ['엉뚱한 직능(예: "chef"에 프로젝트 리드가 나옴)', '모호한 직함 단어.', '더 구체적인 직함을 쓰세요 — "chef" 대신 "executive chef"나 "sous chef".'],
                            ['직함은 맞는데 연차가 틀림', '직급이나 경력을 설정하지 않음.', '최소 경력을 개월 단위로, 또는 관리 직급을 추가하세요.'],
                            ['맞는 사람이 낮게 순위 매겨짐', '핵심 스킬이 빠짐.', '필수 스킬을 키워드로 추가해 순위를 끌어올리세요.'],
                        ],
                    },
                ],
            },
            {
                heading: '분석형 질문은 피하세요',
                blocks: [
                    {
                        type: 'quote',
                        text: '검색은 매칭되는 사람을 가져올 뿐 — 세거나, 평균을 내거나, 도시 순위를 매기거나, 그룹을 비교하지 않습니다. 모든 프롬프트를 "…한 사람을 찾아라" 형태로 쓰세요.',
                    },
                    {
                        type: 'list',
                        items: [
                            { term: '하지 마세요: "텍사스에 라인쿡이 몇 명?"', description: '이렇게: "Line cooks in Texas" — 그런 다음 화면의 결과 수를 읽으세요.' },
                            { term: '하지 마세요: "캘리포니아 간호사의 평균 경력"', description: '이렇게: "Registered nurses in California with at least 2 years of experience".' },
                            { term: '하지 마세요: "어느 도시에 용접공이 가장 많은가?"', description: '이렇게: "Welders in the United States", 그런 다음 주를 추가해 좁히세요.' },
                            { term: '하지 마세요: "바텐더와 서버 비교"', description: '이렇게: 두 번 검색하세요 — "Bartenders in the United States"와 "Servers in the United States".' },
                        ],
                    },
                ],
            },
            {
                heading: '빠른 체크리스트',
                blocks: [
                    {
                        type: 'list',
                        items: [
                            { description: '직무명을 평이하고 흔한 단어로 지정했나요?' },
                            { description: '진짜 지리적 한계를 위해 국가나 미국 주를 설정했나요(도시만이 아니라)?' },
                            { description: '필수 스킬 한두 개를 키워드로 추가했나요?' },
                            { description: '연차가 중요하다면 최소 경력을 개월 단위로 설정했나요?' },
                            { description: '실행 전에 팝업에서 해석된 필터를 검토했나요?' },
                            { description: '"…한 사람을 찾아라"로 유지했나요 — 집계, 평균, 비교 없이?' },
                        ],
                    },
                ],
            },
        ],
    },
];

const resourcesByLocale: Record<Locale, Resource[]> = {
    en: resources,
    ko: resourcesKo,
};

export function getResources(locale: Locale): Resource[] {
    return resourcesByLocale[locale] ?? resources;
}

export function getResource(locale: Locale, slug: string): Resource | undefined {
    return getResources(locale).find((resource) => resource.slug === slug);
}

export function getRelatedResources(locale: Locale, slug: string, limit = 3): Resource[] {
    return getResources(locale).filter((resource) => resource.slug !== slug).slice(0, limit);
}
