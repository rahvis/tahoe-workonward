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

export function getResource(slug: string): Resource | undefined {
    return resources.find((resource) => resource.slug === slug);
}

export function getRelatedResources(slug: string, limit = 3): Resource[] {
    return resources.filter((resource) => resource.slug !== slug).slice(0, limit);
}
