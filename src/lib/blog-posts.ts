export type BlogQuote = {
    text: string;
    attribution: string;
};

export type BlogSection = {
    body: string[];
    quote?: BlogQuote;
};

export type BlogInfographicMetric = {
    value: string;
    label: string;
    detail: string;
};

export type BlogInfographicRow = {
    label: string;
    value: string;
    note: string;
    bar: number;
};

export type BlogInfographic = {
    kicker: string;
    headline: string;
    deck: string;
    source: string;
    metrics: BlogInfographicMetric[];
    rows: BlogInfographicRow[];
};

export type BlogCitation = {
    label: string;
    source: string;
    url: string;
};

export type BlogPost = {
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    date: string;
    updated: string;
    summary: string;
    tags: string[];
    keywords: string[];
    readingTime: string;
    infographic: BlogInfographic;
    sections: BlogSection[];
    citations: BlogCitation[];
};

export type BlogAuthor = {
    name: string;
    bio: string;
};

export const blogAuthors: BlogAuthor[] = [
    {
        name: 'Dheerendra Panwar',
        bio: 'Dheerendra (Dhee) Panwar is an accomplished professional in the realm of Internet of Things (IoT) and Machine Learning (ML), boasting a rich background of over a decade in the field. He completed his master\'s degree in embedded electrical and computer systems at San Francisco State University, thereby strengthening his proficiency in this domain. Over the course of his career, he has made substantial contributions to a diverse array of IoT projects, spanning industries such as manufacturing, smart cities, retail, and energy. Having gained experience in both corporate enterprises and entrepreneurial ventures, he possesses a comprehensive grasp of the complexities of IoT/edge technologies and their pragmatic implementations.',
    },
    {
        name: 'Holly Oh Diamond',
        bio: 'Holly Jooyoung Diamond arrived in New York in 2009 with $400 and a resolve to build something that mattered. During the pandemic, she launched Mr. Mista Oh, a family-owned Korean restaurant in Manhattan to support her family. That firsthand struggle running a small business during crisis directly inspired her to build better software tools for hourly workers. Today she is the founder and CEO of WorkOnward (Techstars DC 23), a map-based hiring platform designed to make finding local hourly work easier for job seekers and small business owners. She serves as a Board Member of the New York State Restaurant Association, advises Documented, and leads DHD Consulting, a global recruiting firm with 5,000+ placements for clients including Samsung and CJ Corporation.',
    },
];

const sources = {
    shrm2026: {
        label: 'SHRM 2026 Talent Trends',
        source: 'SHRM',
        url: 'https://www.shrm.org/about/press-room/shrm-unveils-2026-talent-trends-report--data-driven-insights-for',
    },
    shrmAi2025: {
        label: 'AI in HR, 2025 Talent Trends',
        source: 'SHRM',
        url: 'https://www.shrm.org/topics-tools/research/2025-talent-trends/ai-in-hr',
    },
    icims2026: {
        label: 'Definitive Guide to AI Adoption in Talent Acquisition',
        source: 'iCIMS and Aptitude Research',
        url: 'https://www.icims.com/company/newsroom/aiadoptionreport2026/',
    },
    gem2026: {
        label: '2026 Recruiting Benchmarks Report',
        source: 'Gem',
        url: 'https://www.gem.com/blog/key-takeaways-from-the-2026-recruiting-benchmarks-report',
    },
    googleSender: {
        label: 'Email sender guidelines FAQ',
        source: 'Google Workspace Admin Help',
        url: 'https://support.google.com/a/answer/14229414?hl=en-GB',
    },
    googleAiSearch: {
        label: 'AI features and your website',
        source: 'Google Search Central',
        url: 'https://developers.google.com/search/docs/appearance/ai-features',
    },
    googleArticle: {
        label: 'Article structured data',
        source: 'Google Search Central',
        url: 'https://developers.google.com/search/docs/appearance/structured-data/article',
    },
    googleSeo: {
        label: 'SEO Starter Guide',
        source: 'Google Search Central',
        url: 'https://developers.google.cn/search/docs/fundamentals/seo-starter-guide?hl=en',
    },
    juiceboxAgents: {
        label: 'Juicebox Agents launch announcement',
        source: 'Business Wire',
        url: 'https://www.businesswire.com/news/home/20260520017045/en/Juicebox-Launches-AI-Agents-That-Continuously-Source-Top-Talent-Across-Every-Open-Role',
    },
    jeevaPricing: {
        label: 'Jeeva AI pricing and feature positioning',
        source: 'Jeeva AI',
        url: 'https://www.jeeva.ai/pricing',
    },
    atlasBenchmark2026: {
        label: 'State of Agency Recruitment: 2026 Benchmark Report',
        source: 'Atlas',
        url: 'https://recruitwithatlas.com/wp-content/uploads/2026/03/Atlas-Report-The-State-of-Agency-Recruitment-2026-Benchmark.pdf',
    },
    atlasAi2026: {
        label: 'AI and Automation in Agency Recruitment',
        source: 'Atlas',
        url: 'https://recruitwithatlas.com/wp-content/uploads/2025/10/Atlas-Report_-AI-Automation-in-Agency-Recruitment_-How-Recruiters-are-Adapting-for-2026.pdf',
    },
    peopleSearchBench: {
        label: 'PeopleSearchBench',
        source: 'arXiv',
        url: 'https://arxiv.org/abs/2603.27476',
    },
    recruitingControl: {
        label: 'Resume-ing Control',
        source: 'arXiv',
        url: 'https://arxiv.org/abs/2604.26851',
    },
    recruitingBias: {
        label: 'Human, Algorithm, or Both?',
        source: 'arXiv',
        url: 'https://arxiv.org/abs/2603.06240',
    },
    challengerMay2026: {
        label: 'May 2026 Job Cut Announcement Report',
        source: 'Challenger, Gray & Christmas',
        url: 'https://www.challengergray.com/blog/challenger-report-may-job-cuts-rise-16-from-april-highest-may-total-since-2020/',
    },
    comptiaState2026: {
        label: 'State of the Tech Workforce 2026',
        source: 'CompTIA',
        url: 'https://www.comptia.org/en/about-us/news/press-releases/key-employment-metrics-market-insights-and-the-impact-of-ai-revealed-in-comptia-state-of-tech-workforce-2026-report/',
    },
    comptiaApril2026: {
        label: 'April 2026 Tech Jobs Report',
        source: 'CompTIA',
        url: 'https://www.prnewswire.com/news-releases/new-tech-job-postings-hit-three-year-high-as-hiring-swings-into-positive-territory-comptia-analysis-reveals-302767083.html',
    },
};

const coreKeywords = [
    'AI recruiting software',
    'AI sourcing software',
    'talent intelligence platform',
    'candidate sourcing',
    'recruiting automation',
    'recruiting outreach',
    'contact enrichment',
    'recruiting analytics',
    'recruitment CRM',
    'PeopleGPT alternative',
    'LinkedIn Recruiter alternative',
];

function keywords(...terms: string[]) {
    return Array.from(new Set([...terms, ...coreKeywords]));
}

function makeInfographic(
    kicker: string,
    headline: string,
    deck: string,
    source: string,
    metrics: BlogInfographicMetric[],
    rows: BlogInfographicRow[],
): BlogInfographic {
    return {
        kicker,
        headline,
        deck,
        source,
        metrics,
        rows,
    };
}

export const blogPosts: BlogPost[] = [
    {
        slug: 'big-tech-firing-and-hiring-2026',
        title: 'Big Tech is firing and hiring at the same time',
        metaTitle: 'Big Tech layoffs and hiring in 2026',
        metaDescription: 'A data-backed look at Big Tech layoffs, AI-cited job cuts, and tech hiring signals in 2026, with recruiting takeaways for sourcing laid-off talent.',
        date: '2026-06-05',
        updated: '2026-06-05',
        summary: 'The 2026 tech labor market is not a simple layoffs story. Big Tech is cutting roles, funding AI shifts, and still competing for specific technical talent.',
        tags: ['Tech labor market', 'Layoffs', 'Hiring'],
        keywords: keywords(
            'Big Tech layoffs 2026',
            'Big Tech firing and hiring',
            'technology layoffs 2026',
            'AI layoffs 2026',
            'tech hiring 2026',
            'laid off tech talent sourcing',
            'software engineer hiring',
            'recruiting laid off candidates',
        ),
        readingTime: '7 min read',
        infographic: makeInfographic(
            '2026 TECH LABOR SIGNALS',
            'Big Tech cuts, hires, and reshuffles',
            'The same market can show heavy job cuts and selective hiring demand when companies redirect budgets toward AI, infrastructure, and core technical roles.',
            'Sources: Challenger, Gray & Christmas May 2026; CompTIA 2026 tech workforce reports.',
            [
                { value: '38,242', label: 'Tech cuts in May', detail: 'Technology job cuts announced in May 2026, the sector high since August 2024.' },
                { value: '123,653', label: 'Tech cuts YTD', detail: 'Technology cuts announced through May 2026, up 66% from the same period in 2025.' },
                { value: '271,483', label: 'New tech postings', detail: 'New April 2026 postings for tech occupations across all industries.' },
            ],
            [
                { label: 'AI cut signal', value: '40%', note: 'AI accounted for 38,579 May cuts across U.S. employers.', bar: 40 },
                { label: 'May tech hiring', value: '11,250', note: 'Technology led May hiring plans in Challenger data.', bar: 64 },
                { label: 'Active demand', value: '575k+', note: 'Active April postings for technology positions in CompTIA data.', bar: 86 },
            ],
        ),
        sections: [
            {
                body: [
                    'The Big Tech job market in 2026 is not one story. It is a firing story, a hiring story, and a budget reallocation story happening at the same time. Challenger, Gray & Christmas reported 38,242 technology job cuts in May 2026, the highest monthly technology total since August 2024, and 123,653 technology cuts through May.',
                    'Those numbers explain why candidates and recruiters feel the market tightening. They do not mean every technical role is disappearing. CompTIA reported 271,483 new April job postings for technology occupations across the economy and more than 575,000 active tech postings that month.',
                ],
                quote: {
                    text: 'The labor market is being reshaped by technology in real time.',
                    attribution: 'Andy Challenger, Challenger, Gray & Christmas',
                },
            },
            {
                body: [
                    'The important recruiting point is that layoffs and hiring are not opposites. Large technology companies can reduce one function, flatten management, close lower-priority teams, or slow generalist hiring while still opening roles for AI infrastructure, cybersecurity, systems engineering, data, cloud, and software work tied to current strategy.',
                    'Challenger said AI was cited in 38,579 May cuts, 40% of all cuts that month, and 87,714 cuts through May 2026. That is a serious labor-market signal, but recruiters should read it carefully. A layoff announcement describes a company decision; it does not fully describe candidate quality, skill depth, or future demand.',
                ],
            },
            {
                body: [
                    'CompTIA adds the other side of the picture. Its 2026 workforce report projects U.S. net tech employment growth of 1.9%, or 185,499 new jobs, bringing the national tech workforce close to 9.8 million workers. It also says January 2026 had more than 275,000 active job postings referencing some level of AI skill.',
                    'That is why the strongest recruiting workflow is not simply to scrape layoff lists. Recruiters need to separate released talent by role family, seniority, company context, location, clearance, cloud stack, AI fluency, management scope, and readiness to talk. Big Tech layoffs create candidate supply, but good sourcing turns that supply into relevant shortlists.',
                ],
            },
            {
                body: [
                    'The experience mix also matters. CompTIA reported that 20% of April tech postings asked for zero to three years of experience, 28% asked for four to seven years, and 17% asked for eight years or more. That spread makes one-size-fits-all outreach weak. A senior platform engineer leaving a cloud infrastructure team needs a different message than an early-career analyst caught in a broad restructuring.',
                    'For recruiters, the practical move is to build layoff-aware sourcing projects. Save candidates by company event, team, job family, skill cluster, and outreach status. Enrich contacts only when the person is relevant. Sequence messages that acknowledge the market without sounding exploitative. Track replies, not just sends.',
                ],
            },
            {
                body: [
                    'Tahoe should rank for this topic by answering the real search intent behind phrases like Big Tech layoffs 2026, AI layoffs, tech hiring 2026, laid off software engineers, and recruiting laid-off tech talent. Buyers are asking where the talent is moving, which roles are still in demand, and how to contact candidates without wasting credits or damaging sender reputation.',
                    'The answer is operational: treat Big Tech firing and hiring as a live talent map. The best recruiting teams will not just react to layoff headlines. They will turn market signals into targeted candidate lists, verified contacts, careful outreach, and measurable pipeline movement.',
                ],
            },
        ],
        citations: [sources.challengerMay2026, sources.comptiaState2026, sources.comptiaApril2026],
    },
    {
        slug: 'from-search-to-outreach',
        title: 'From search to outreach without losing recruiter context',
        metaTitle: 'AI recruiting workflow: search to outreach',
        metaDescription: 'See how an AI recruiting workflow connects sourcing, candidate lists, enrichment, and outreach without losing recruiter context.',
        date: '2026-06-05',
        updated: '2026-06-05',
        summary: 'A good sourcing workflow does not end at search results. It carries the recruiter from query to list to outreach with the context still intact.',
        tags: ['Workflow', 'Search', 'Outreach'],
        keywords: keywords('AI recruiting workflow', 'recruiter workflow software', 'AI candidate sourcing workflow'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            '2026 TALENT WORKFLOW',
            'The search-to-outreach gap',
            'Recruiters need AI help, but the winning workflow is still a connected operating loop.',
            'Sources: SHRM 2026 Talent Trends; iCIMS/Aptitude 2026.',
            [
                { value: '68%', label: 'Recruiting difficulty', detail: 'HR pros reporting difficulty recruiting full-time employees.' },
                { value: '69%', label: 'AI used in TA', detail: 'Companies using AI somewhere in talent acquisition.' },
                { value: '18%', label: 'Broad AI usage', detail: 'Companies using AI broadly across hiring processes.' },
            ],
            [
                { label: 'Search intent', value: 'Brief', note: 'Role, seniority, location, skills, and exclusions stay visible.', bar: 78 },
                { label: 'List state', value: 'Saved', note: 'Selected candidates carry source query and project ownership.', bar: 70 },
                { label: 'Launch readiness', value: 'Ready', note: 'Contacts, suppression, sender, schedule, and cost are checked.', bar: 86 },
            ],
        ),
        sections: [
            {
                body: [
                    'AI recruiting software is now part of the daily talent conversation, but adoption by itself does not solve the handoff problem. SHRM says 68% of HR professionals still report difficulty recruiting full-time employees, and iCIMS with Aptitude Research says 69% of companies use AI somewhere in talent acquisition while only 18% use it broadly across hiring workflows.',
                    'That gap is where recruiter context gets lost. A recruiter starts with a role brief, turns it into a candidate sourcing search, saves a shortlist, checks contact enrichment, and then launches recruiting outreach. If each step lives in a separate tool, the user has to rebuild the reasoning every time.',
                ],
                quote: {
                    text: 'AI should elevate the recruiter, not replace them.',
                    attribution: 'Tim Sackett, Aptitude Research',
                },
            },
            {
                body: [
                    'A more useful workflow keeps the original search prompt, filters, selected candidates, and destination list close together. The product should make the next action obvious without forcing a recruiter to export a CSV, copy notes into a recruitment CRM, or remember why a profile was selected.',
                    'This is also an SEO and answer-engine problem. Buyers searching for AI sourcing software are not only asking for a database. They are asking whether the platform can help them move from talent intelligence to a working audience, clean contact data, and accountable outreach.',
                ],
            },
            {
                body: [
                    'Tahoe should position the blog around connected recruiting work: AI candidate search, saved lists, contact enrichment, email sequencing, sender health, and recruiting analytics. Those are the terms competitors surface, but the stronger angle is operational continuity rather than feature volume.',
                    'The practical test is simple. After any search, the recruiter should know who was selected, where the audience was saved, what contact data is missing, what outreach can run, and how much the action will cost. That is the context Google and buyers can understand.',
                ],
            },
        ],
        citations: [sources.shrm2026, sources.icims2026, sources.googleAiSearch, sources.googleSeo],
    },
    {
        slug: 'candidate-lists-as-recruiting-infrastructure',
        title: 'Candidate lists are recruiting infrastructure',
        metaTitle: 'Candidate lists for AI sourcing teams',
        metaDescription: 'Why candidate lists need source context, ownership, enrichment state, and next actions in modern AI sourcing workflows.',
        date: '2026-06-04',
        updated: '2026-06-05',
        summary: 'Candidate lists work best when they behave like operating objects: easy to scan, easy to filter, and ready for enrichment or outreach.',
        tags: ['Lists', 'Projects', 'Operations'],
        keywords: keywords('candidate list software', 'recruitment CRM lists', 'AI sourcing lists', 'talent pipeline management'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            'LIST OPERATIONS',
            'Lists are where sourcing becomes pipeline',
            'The strongest channels convert because the relationship and source context are preserved.',
            'Source: Gem 2026 Recruiting Benchmarks Report.',
            [
                { value: '93%', label: 'More applications', detail: 'Applications per recruiter compared with 2021.' },
                { value: '2.6%', label: 'Direct-source apps', detail: 'Share of applications from direct sourcing.' },
                { value: '11%', label: 'Direct-source hires', detail: 'Share of hires from direct sourcing.' },
            ],
            [
                { label: 'Direct sourcing', value: '4x', note: 'Hire yield versus its application share.', bar: 80 },
                { label: 'Referrals', value: '11x', note: 'Reported conversion versus inbound applicants.', bar: 92 },
                { label: 'Internal mobility', value: '32x', note: 'Highest relationship-driven conversion multiple.', bar: 100 },
            ],
        ),
        sections: [
            {
                body: [
                    'A candidate list is not a decorative folder. It is the object that turns an AI sourcing result into a recruiting pipeline. Gem reports that recruiters are handling 93% more applications than in 2021, which makes durable list context more valuable than another result page.',
                    'The list should carry the job, project, source search, owner, updated date, candidate count, enrichment state, and outreach readiness. When that state is available in rows, recruiters can compare audiences quickly and decide whether to enrich, message, archive, or keep sourcing.',
                ],
            },
            {
                body: [
                    'Gem also reports that direct sourcing represents 2.6% of applications but 11% of hires. That is the list-management argument in one number: lower-volume, higher-context channels need better operating surfaces, not more generic cards.',
                    'AI recruiting tools such as PeopleGPT-style search engines train buyers to expect fast discovery. Tahoe can compete by making the saved audience more useful after discovery: source reasoning, saved-search memory, contact quality, and launch state all stay attached to the candidate list.',
                ],
            },
            {
                body: [
                    'The content strategy should use terms buyers already search for: candidate list software, AI sourcing lists, recruitment CRM, talent pipeline management, contact enrichment, and recruiting outreach. The page should answer the operational question behind those terms: what happens after the shortlist is saved?',
                    'For E-E-A-T, the blog should show that Tahoe understands the daily work pattern. Recruiters do not need a lecture about lists. They need proof that the product keeps source context, next actions, and accountability in one place.',
                ],
            },
        ],
        citations: [sources.gem2026, sources.juiceboxAgents, sources.googleArticle],
    },
    {
        slug: 'credit-visibility-in-ai-recruiting',
        title: 'Credit visibility is part of recruiter trust',
        metaTitle: 'AI recruiting credits and transparent spend',
        metaDescription: 'Recruiting teams trust AI sourcing and enrichment more when credit holds, charges, releases, and balances are visible before work runs.',
        date: '2026-06-03',
        updated: '2026-06-05',
        summary: 'Recruiters trust AI-assisted workflows more when credit holds, charges, releases, and balances are visible before expensive work runs.',
        tags: ['Billing', 'Credits', 'Trust'],
        keywords: keywords('AI recruiting credits', 'contact enrichment pricing', 'recruiting software billing', 'transparent AI spend'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            'CREDIT TRUST',
            'AI spend needs a ledger, not a surprise',
            'Recruiting AI is scaling, but trust depends on explainable cost and governance.',
            'Sources: SHRM 2025 Talent Trends; iCIMS/Aptitude 2026.',
            [
                { value: '51%', label: 'AI for recruiting', detail: 'Organizations using AI to support recruiting efforts.' },
                { value: '89%', label: 'Efficiency gain', detail: 'AI-using HR pros saying it saves time or improves efficiency.' },
                { value: '45%', label: 'Governance gap', detail: 'Companies without a formal AI governance framework.' },
            ],
            [
                { label: 'Estimate', value: 'Before', note: 'Show projected search, enrichment, or campaign cost upfront.', bar: 82 },
                { label: 'Hold', value: 'During', note: 'Reserve credits while provider-backed work is running.', bar: 66 },
                { label: 'Charge or release', value: 'After', note: 'Ledger rows explain value delivered and unused credits.', bar: 90 },
            ],
        ),
        sections: [
            {
                body: [
                    'Credit visibility is not just a billing detail. In AI recruiting software, credits often sit between the recruiter and actions that cost real money: provider-backed people search, contact enrichment, email verification, mobile phone lookup, and campaign launch.',
                    'SHRM reports that 51% of organizations use AI to support recruiting and that 89% of HR professionals using AI for recruiting say it saves time or improves efficiency. That efficiency becomes easier to trust when the user can see the cost before the click and the ledger after the run.',
                ],
                quote: {
                    text: 'Technology alone will not transform hiring.',
                    attribution: 'Madeline Laurano, Aptitude Research',
                },
            },
            {
                body: [
                    'Competitor positioning also makes this expectation clear. Sales and sourcing platforms increasingly expose credits, email verification, real-time enrichment, sequences, and analytics as buying primitives. Recruiters will expect the same clarity in a talent intelligence workflow.',
                    'A transparent ledger should use plain states: grant, estimate, hold, charge, release, refund, and adjustment. It should connect each row to the search, list, enrichment run, or campaign that created it. That makes finance questions answerable without support tickets.',
                ],
            },
            {
                body: [
                    'This also supports Google E-E-A-T. A site that explains the operating model, acknowledges governance, and shows the user how spend is controlled is more trustworthy than a page promising unlimited AI magic. The language should be concrete: credit holds, enrichment cost, verified work email, campaign spend, ledger history, and workspace balance.',
                    'For AEO, a blog about credits should answer the question directly: how do AI recruiting credits work? They should reserve expected cost before work, charge only when value is delivered, release unused credits, and keep every movement visible in a ledger.',
                ],
            },
        ],
        citations: [sources.shrmAi2025, sources.icims2026, sources.jeevaPricing, sources.googleAiSearch],
    },
    {
        slug: 'why-recruiting-search-needs-context',
        title: 'Why recruiting search needs context, not just keywords',
        metaTitle: 'Context-aware AI recruiting search',
        metaDescription: 'Keyword search finds profiles. Context-aware AI recruiting search explains why candidates fit the role and what recruiters should do next.',
        date: '2026-06-02',
        updated: '2026-06-05',
        summary: 'Keyword search can find profiles. Context-aware recruiting search helps the team understand why those profiles belong in a hiring workflow.',
        tags: ['Search', 'Context', 'Workflow'],
        keywords: keywords('context-aware recruiting search', 'AI people search', 'semantic candidate search', 'talent intelligence search'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            'SEARCH QUALITY',
            'People search is now benchmarked on evidence',
            'Modern AI people search is judged by relevance, coverage, and profile utility, not keyword matches alone.',
            'Source: PeopleSearchBench, arXiv 2026.',
            [
                { value: '119', label: 'Real-world queries', detail: 'Benchmark queries across recruiting and adjacent people-search use cases.' },
                { value: '4', label: 'Use cases', detail: 'Recruiting, sales prospecting, expert search, and influencer discovery.' },
                { value: '3', label: 'Quality axes', detail: 'Relevance precision, effective coverage, and information utility.' },
            ],
            [
                { label: 'Prompt', value: 'Intent', note: 'The role brief becomes criteria, not just text matching.', bar: 76 },
                { label: 'Evidence', value: 'Fit', note: 'Returned profiles should satisfy explicit verifiable criteria.', bar: 88 },
                { label: 'Workflow', value: 'Next', note: 'Saved, enriched, suppressed, and campaign-ready state matters.', bar: 82 },
            ],
        ),
        sections: [
            {
                body: [
                    'AI people search is moving past keyword matching. PeopleSearchBench, published in 2026, evaluates AI-powered people search platforms on real-world queries and uses criteria-grounded verification to judge whether returned people satisfy explicit requirements.',
                    'That matters for recruiters because a keyword match is not a hiring argument. A senior backend engineer, platform engineer, and site reliability engineer can overlap heavily, but the recruiter still needs to explain why a specific person fits the role, location, seniority, company pattern, and hiring motion.',
                ],
            },
            {
                body: [
                    'Context-aware recruiting search should preserve the prompt, generated filters, exclusions, and selected evidence. If the recruiter searches for "founding product designers with B2B SaaS experience in New York," the saved candidate record should retain the reason each person appeared.',
                    'This is where Tahoe can differentiate from generic AI search tools. The search surface should not stop at ranking profiles. It should carry state into candidate lists, contact enrichment, outreach eligibility, and analytics so the team can audit the path from query to result.',
                ],
            },
            {
                body: [
                    'For SEO, this post should target semantic candidate search, context-aware recruiting search, AI people search, talent intelligence, and LinkedIn Recruiter alternative. The answer engine framing should be explicit: context is the role intent, filters, evidence, and workflow state that travel with each candidate.',
                    'For trust, the content should avoid claiming that AI has final judgment. Research on generative AI in recruiting warns that automation can shape decision inputs in ways users may not fully notice. Good product writing should emphasize recruiter control and inspectable evidence.',
                ],
            },
        ],
        citations: [sources.peopleSearchBench, sources.recruitingControl, sources.recruitingBias, sources.googleAiSearch],
    },
    {
        slug: 'contact-enrichment-before-campaign-launch',
        title: 'Contact enrichment belongs before campaign launch',
        metaTitle: 'Contact enrichment before recruiting outreach',
        metaDescription: 'Campaign launch is safer when recruiters can inspect work email readiness, suppression, enrichment cost, and sender risk first.',
        date: '2026-06-01',
        updated: '2026-06-05',
        summary: 'Campaign launch is calmer when contact readiness, suppression, and enrichment cost are visible before the first email is scheduled.',
        tags: ['Enrichment', 'Outreach', 'Contacts'],
        keywords: keywords('contact enrichment for recruiters', 'work email enrichment', 'email verification recruiting', 'candidate contact data'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            'CONTACT READINESS',
            'Bad contact data becomes sender risk',
            'Enrichment is not just a data append. It affects deliverability, eligibility, and campaign trust.',
            'Sources: Google sender guidelines; Atlas 2026 AI recruitment report.',
            [
                { value: '0.1%', label: 'Target spam rate', detail: 'Google says senders should keep user-reported spam below this level.' },
                { value: '0.3%', label: 'Hard ceiling', detail: 'Google says senders should prevent spam rates from reaching this level.' },
                { value: '25.81%', label: 'Unmet need', detail: 'Agency recruiters naming sourcing and discovery as the top unmet automation need.' },
            ],
            [
                { label: 'Find', value: 'Email', note: 'Verify work email before a candidate enters a sequence.', bar: 84 },
                { label: 'Suppress', value: 'Risk', note: 'Remove unsubscribed, bounced, unsafe, or duplicate records.', bar: 92 },
                { label: 'Launch', value: 'Eligible', note: 'Only reachable candidates should create campaign tasks.', bar: 78 },
            ],
        ),
        sections: [
            {
                body: [
                    'Contact enrichment belongs before campaign launch because outreach quality depends on who can actually receive a message. A campaign builder should show verified work email, missing contact fields, previous bounce state, unsubscribe state, duplicate records, and estimated enrichment cost before send tasks exist.',
                    'Google sender guidance gives this a hard operational edge: keep user-reported spam below 0.1% and prevent it from reaching 0.3% or higher. That means list quality and relevance are not abstract best practices. They affect whether future recruiting outreach reaches the inbox.',
                ],
            },
            {
                body: [
                    'The visible workflow should separate work email, personal email, phone, and manual override. Each field has a different purpose and risk profile. Recruiters should be able to enrich only what they need for the current audience instead of buying every possible data point by default.',
                    'Competitor pages in this market use terms like email finder, verification, real-time enrichment, credits, and sequences. Tahoe can use those keyword themes while taking a clearer recruiting angle: contact enrichment is a readiness check before outreach, not a hidden provider call after launch.',
                ],
            },
            {
                body: [
                    'For AEO, the direct answer is this: recruiters should enrich contacts before launch so the campaign audience is eligible, reachable, compliant, and costed. Enrichment after launch creates avoidable failures and makes the final audience count harder to trust.',
                    'For E-E-A-T, the article should cite sender requirements and explain the product consequence. It should not simply say "better data improves deliverability." It should show the exact checks a recruiting team needs before it schedules real messages.',
                ],
            },
        ],
        citations: [sources.googleSender, sources.atlasAi2026, sources.jeevaPricing],
    },
    {
        slug: 'mailbox-health-and-send-pacing',
        title: 'Mailbox health and send pacing should be visible',
        metaTitle: 'Recruiting mailbox health and send pacing',
        metaDescription: 'Recruiting outreach depends on sender health, daily caps, send windows, one-click unsubscribe, and visible pacing controls.',
        date: '2026-05-31',
        updated: '2026-06-05',
        summary: 'Recruiting outreach depends on sender health, daily caps, send windows, and spacing. Those controls should be visible before a campaign launches.',
        tags: ['Mailboxes', 'Outreach', 'Deliverability'],
        keywords: keywords('recruiting email deliverability', 'mailbox health recruiting', 'send pacing software', 'outreach sender limits'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            'SENDER HEALTH',
            'Pacing is part of the product',
            'Recruiting outreach needs visible limits because mailbox reputation can change daily.',
            'Source: Google Workspace email sender guidelines FAQ.',
            [
                { value: '<0.1%', label: 'Recommended spam rate', detail: 'Google guidance for expected delivery health.' },
                { value: '0.3%', label: 'Risk threshold', detail: 'Rates at or above this level have greater delivery impact.' },
                { value: '7 days', label: 'Recovery window', detail: 'Bulk senders need seven consecutive days below 0.3% for mitigation eligibility.' },
            ],
            [
                { label: 'Authentication', value: 'SPF/DKIM', note: 'Sender setup is a prerequisite, not an afterthought.', bar: 88 },
                { label: 'Unsubscribe', value: 'RFC 8058', note: 'One-click headers are required for commercial messages.', bar: 95 },
                { label: 'Pacing', value: 'Caps', note: 'Daily caps and send windows keep volume predictable.', bar: 82 },
            ],
        ),
        sections: [
            {
                body: [
                    'Mailbox health is not hidden infrastructure. It changes what a recruiter can promise to a hiring manager because daily caps, send windows, authentication, unsubscribe handling, and user complaints all affect delivery.',
                    'Google says user-reported spam should stay below 0.1% and should not reach 0.3% or higher. The same guidance explains that promotional senders need compliant one-click unsubscribe headers. Recruiting outreach tools should make those requirements visible where campaigns are launched.',
                ],
            },
            {
                body: [
                    'A recruiter should see which mailbox will send, whether it is connected, how many messages remain for the day, what local send window applies, and whether sequence spacing will delay follow-ups. These controls should be product behavior, not worker configuration hidden from the user.',
                    'This gives Tahoe a strong search position around recruiting email deliverability, mailbox health, sender limits, and send pacing. Those are high-intent queries because the buyer is usually trying to avoid a visible campaign failure.',
                ],
            },
            {
                body: [
                    'After launch, the same pacing model should explain task state. If a message is waiting for a send window, daily cap, suppression rule, reply stop, or bounce stop, the campaign workspace should say so plainly.',
                    'That is the trust loop. Before launch, the product helps the recruiter decide if the campaign is safe. After launch, it explains why messages are sending, waiting, or stopped.',
                ],
            },
        ],
        citations: [sources.googleSender, sources.googleArticle],
    },
    {
        slug: 'sequence-builders-need-operational-clarity',
        title: 'Sequence builders need operational clarity',
        metaTitle: 'Recruiting sequence builder with clear pacing',
        metaDescription: 'A recruiting sequence builder should show message content, delay rules, sender limits, stop conditions, and future send work before launch.',
        date: '2026-05-30',
        updated: '2026-06-05',
        summary: 'A sequence editor should make every follow-up, delay, sender, and send window easy to inspect before real candidates enter the campaign.',
        tags: ['Sequences', 'Scheduling', 'Outreach'],
        keywords: keywords('recruiting sequence builder', 'email sequence software recruiters', 'AI outreach sequencing', 'candidate outreach automation'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            'SEQUENCE OPERATIONS',
            'Every follow-up is future work',
            'AI adoption is strongest in the repetitive tasks that surround outreach, but recruiters still need control.',
            'Source: Atlas AI and Automation in Agency Recruitment report.',
            [
                { value: '85%', label: 'Admin automation', detail: 'Recruiters using AI for ATS, CRM, notes, or backend updates.' },
                { value: '60%', label: 'Outreach automation', detail: 'Recruiters automating messaging and outreach with AI.' },
                { value: '21.67%', label: 'Scheduling automation', detail: 'Recruiters using AI for interview scheduling.' },
            ],
            [
                { label: 'Step', value: 'Copy', note: 'Subject, variables, footer, and tone stay inspectable.', bar: 80 },
                { label: 'Delay', value: 'Timing', note: 'Each follow-up shows when it can become eligible.', bar: 86 },
                { label: 'Stop', value: 'State', note: 'Reply, bounce, unsubscribe, and unsafe states halt sends.', bar: 94 },
            ],
        ),
        sections: [
            {
                body: [
                    'A recruiting sequence builder is not a writing surface only. Every follow-up creates future work for every eligible candidate, so the editor needs to show content, timing, sender, stop rules, and expected campaign impact.',
                    'Atlas reports that recruiters using AI are most often automating backend administrative work, messaging and outreach, and scheduling. That makes sequence clarity more important, not less, because automation increases the number of future actions created from one setup screen.',
                ],
            },
            {
                body: [
                    'A compact step rail beside a focused editor is easier to operate than a stack of oversized email cards. The recruiter can scan the plan, edit one step, check delay rules, and confirm how replies, bounces, unsubscribes, and suppression stop future sends.',
                    'The page should use search terms that match buyer intent: recruiting sequence builder, AI outreach sequencing, candidate outreach automation, email sequence software for recruiters, and mailbox pacing. But the content should answer the practical question: what exactly will happen after launch?',
                ],
            },
            {
                body: [
                    'The safest product copy is precise. A follow-up does not "go out later" in the abstract. It becomes eligible after a delay, waits for the mailbox send window, respects daily caps, and is canceled if the candidate replies or becomes suppressed.',
                    'This is how the blog can rank and still be useful. It gives Google and buyers clear entities, clear workflow states, and clear operational rules rather than vague claims about personalized outreach at scale.',
                ],
            },
        ],
        citations: [sources.atlasAi2026, sources.googleSender, sources.icims2026],
    },
    {
        slug: 'analytics-should-answer-recruiting-questions',
        title: 'Analytics should answer recruiting questions',
        metaTitle: 'Recruiting analytics for AI sourcing teams',
        metaDescription: 'Recruiting analytics should connect searches, lists, enrichments, campaigns, replies, and credit spend to decisions.',
        date: '2026-05-29',
        updated: '2026-06-05',
        summary: 'Recruiting analytics should show workflow movement, reply outcomes, spend, and bottlenecks without forcing users to interpret decorative dashboards.',
        tags: ['Analytics', 'Funnel', 'Reporting'],
        keywords: keywords('recruiting analytics software', 'AI recruiting dashboard', 'talent acquisition analytics', 'recruiting funnel metrics'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            'RECRUITING ANALYTICS',
            'Dashboards should start with workload reality',
            'Recruiters have more volume, more interviews, and more open roles to interpret.',
            'Source: Gem 2026 Recruiting Benchmarks Report.',
            [
                { value: '13.4', label: 'Open roles', detail: 'Average open roles managed by a recruiter in the report.' },
                { value: '93%', label: 'More applications', detail: 'Applications per recruiter versus 2021.' },
                { value: '33%', label: 'More interviews', detail: 'Increase in interviews per hire since 2021.' },
            ],
            [
                { label: 'Sourcing', value: 'Search to list', note: 'Are searches becoming saved candidates?', bar: 78 },
                { label: 'Outreach', value: 'Send to reply', note: 'Which sequences create real conversations?', bar: 82 },
                { label: 'Spend', value: 'Credits to value', note: 'Which paid actions create useful pipeline?', bar: 72 },
            ],
        ),
        sections: [
            {
                body: [
                    'Recruiting analytics should answer working questions, not decorate a dashboard. A recruiter or talent leader wants to know whether searches become lists, lists become enriched audiences, campaigns create replies, and credit spend connects to useful pipeline.',
                    'Gem reports that recruiters are managing 13.4 open roles at a time, handling 93% more applications than in 2021, and seeing 33% more interviews per hire. That workload makes operational analytics more important than broad vanity charts.',
                ],
            },
            {
                body: [
                    'A useful Tahoe dashboard should start with stage movement: search, save, enrich, launch, send, reply, stop, and hire. Each metric should lead back to the list, campaign, search prompt, or credit ledger row that produced it.',
                    'This is a better SEO target than generic "AI analytics." The keyword cluster should include recruiting analytics software, AI recruiting dashboard, talent acquisition analytics, recruiting funnel metrics, candidate pipeline reporting, and credit spend reporting.',
                ],
            },
            {
                body: [
                    'AEO favors direct answers. The answer here is that recruiting analytics should connect every metric to a recruiter decision: where to source next, which list is ready, which campaign is blocked, which mailbox is constrained, and which paid action is worth repeating.',
                    'E-E-A-T comes from showing the workflow and citing the benchmark data behind the workload. If the article explains the real questions recruiters ask, it reads like product expertise rather than generic SaaS content.',
                ],
            },
        ],
        citations: [sources.gem2026, sources.googleAiSearch, sources.googleArticle],
    },
    {
        slug: 'projects-are-working-containers',
        title: 'Projects are working containers',
        metaTitle: 'Recruiting projects as workflow containers',
        metaDescription: 'Recruiting projects should organize lists, ownership, status, workflow state, and next actions without hiding row-level work.',
        date: '2026-05-28',
        updated: '2026-06-05',
        summary: 'A project is useful when it organizes lists, ownership, status, and next actions without becoming a decorative dashboard page.',
        tags: ['Projects', 'Lists', 'Operations'],
        keywords: keywords('recruiting project management', 'talent pipeline projects', 'candidate pipeline software', 'recruiting operations workflow'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            'PROJECT OPERATIONS',
            'Fragmented tools make projects carry more weight',
            'Projects should organize recruiting work because many teams still operate across disconnected systems.',
            'Source: Atlas State of Agency Recruitment 2026 Benchmark Report.',
            [
                { value: '56.16%', label: 'Fragmented tech', detail: 'Agencies describing their recruitment technology as functional but fragmented.' },
                { value: '28.77%', label: 'Integrated stack', detail: 'Agencies reporting a well-integrated and easy-to-manage stack.' },
                { value: '36.99%', label: 'Manual-work barrier', detail: 'Agencies naming too much manual work as their top operational challenge.' },
            ],
            [
                { label: 'Project', value: 'Role', note: 'Tie lists and campaigns to one hiring motion.', bar: 80 },
                { label: 'Ownership', value: 'Team', note: 'Show owner, status, updates, and handoff risk.', bar: 74 },
                { label: 'Actions', value: 'Next', note: 'Open lists, enrich contacts, launch outreach, or archive.', bar: 88 },
            ],
        ),
        sections: [
            {
                body: [
                    'Recruiting projects are working containers. They gather role context, hiring manager expectations, saved lists, candidate ownership, enrichment state, campaign activity, and analytics into a structure the team can revisit.',
                    'Atlas reports that 56.16% of agencies describe their recruitment technology setup as functional but fragmented. A project object becomes more important when recruiters are trying to coordinate sourcing, outreach, CRM updates, and reporting across multiple systems.',
                ],
            },
            {
                body: [
                    'The project page should not hide work behind a hero area. It should make the operating rows easy to scan: list count, updated date, owner, stage, contact readiness, active campaigns, and next action.',
                    'This aligns with how buyers search for recruiting project management, candidate pipeline software, recruitment CRM, and recruiting operations workflow. They are not looking for another status page. They are looking for a way to keep role-specific work from scattering.',
                ],
            },
            {
                body: [
                    'The strongest product story is that projects reduce context switching. The recruiter can open a project, inspect the lists attached to it, enrich missing contacts, launch a sequence, and explain progress in analytics without rebuilding the role narrative.',
                    'That is also the best answer-engine shape: a recruiting project is a container for a hiring motion, its candidate lists, its outreach activity, and the operational state needed to decide what happens next.',
                ],
            },
        ],
        citations: [sources.atlasBenchmark2026, sources.gem2026, sources.googleSeo],
    },
    {
        slug: 'save-to-list-is-a-core-handoff',
        title: 'Save to list is a core handoff',
        metaTitle: 'Save candidates to lists without losing context',
        metaDescription: 'The save-to-list action should confirm selected candidates, preserve source search context, and expose enrichment or outreach as the next step.',
        date: '2026-05-27',
        updated: '2026-06-05',
        summary: 'The save action should confirm the audience and offer the next useful choices: open the list, enrich contacts, or keep searching.',
        tags: ['Search', 'Lists', 'UX'],
        keywords: keywords('save candidates to list', 'AI sourcing shortlist', 'candidate shortlist software', 'recruiting search workflow'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            'SAVE HANDOFF',
            'Saving is where sourcing becomes accountable',
            'Top-of-funnel pressure makes the save action one of the most important moments in AI sourcing.',
            'Sources: Atlas 2026 benchmark; Gem 2026 benchmark.',
            [
                { value: '36.99%', label: 'Sourcing bottleneck', detail: 'Agencies saying candidate sourcing most commonly slows placements.' },
                { value: '2.6%', label: 'Direct-source apps', detail: 'Application share from direct sourcing in Gem data.' },
                { value: '11%', label: 'Direct-source hires', detail: 'Hire share from direct sourcing in Gem data.' },
            ],
            [
                { label: 'Confirm', value: 'Saved', note: 'Show exactly which candidates moved into which list.', bar: 82 },
                { label: 'Preserve', value: 'Source', note: 'Attach prompt, filters, page, and project to the list.', bar: 90 },
                { label: 'Continue', value: 'Next', note: 'Open list, enrich contacts, launch outreach, or keep searching.', bar: 86 },
            ],
        ),
        sections: [
            {
                body: [
                    'Saving candidates to a list is not the end of search. It is the handoff where AI candidate sourcing becomes accountable recruiting work. The product should confirm what changed, where the audience went, and what the recruiter can do next.',
                    'Atlas reports that candidate sourcing is the most common placement bottleneck for agencies, and Gem shows direct sourcing can produce outsized hiring yield compared with its application share. That makes the save action more than a convenience. It protects the value of a high-intent source channel.',
                ],
            },
            {
                body: [
                    'The success state should be short and specific: selected candidates saved, target list named, duplicates handled, source search attached, and next actions available. A recruiter should not need to navigate away just to verify the save.',
                    'This is the difference between a profile database and a recruiter operating system. The workflow already knows the prompt, filters, selected candidates, project, and likely next step. The interface should use that knowledge.',
                ],
            },
            {
                body: [
                    'The SEO cluster should include save candidates to list, AI sourcing shortlist, candidate shortlist software, recruiting search workflow, contact enrichment, and outreach-ready list. These terms are specific enough for Google indexing and close to buyer intent.',
                    'For answer engines, the direct answer is clear: save-to-list should preserve source context and route the recruiter to the next useful action, usually list inspection, contact enrichment, campaign launch, or continued sourcing.',
                ],
            },
        ],
        citations: [sources.atlasBenchmark2026, sources.gem2026, sources.googleAiSearch],
    },
    {
        slug: 'campaign-review-should-be-a-readiness-check',
        title: 'Campaign review should be a readiness check',
        metaTitle: 'Recruiting campaign review checklist',
        metaDescription: 'A recruiting campaign review should verify audience, contacts, sender health, schedule, credits, unsubscribe handling, and stop rules before launch.',
        date: '2026-05-26',
        updated: '2026-06-05',
        summary: 'Launch review should focus on audience, sequence, sender, schedule, credits, and compliance instead of repeating setup text.',
        tags: ['Campaigns', 'Review', 'Compliance'],
        keywords: keywords('recruiting campaign checklist', 'candidate outreach compliance', 'campaign readiness review', 'recruiting outreach software'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            'CAMPAIGN READINESS',
            'A launch review should catch what can break',
            'Campaign readiness connects AI governance, sender rules, and operational checks before messages are scheduled.',
            'Sources: iCIMS/Aptitude 2026; Google sender guidelines.',
            [
                { value: '82%', label: 'Explainability priority', detail: 'Companies saying transparency and explainability in AI systems are important.' },
                { value: '45%', label: 'No AI framework', detail: 'Companies without a formal AI governance framework.' },
                { value: '0.3%', label: 'Spam ceiling', detail: 'Google threshold that senders should prevent reaching.' },
            ],
            [
                { label: 'Audience', value: 'Eligible', note: 'Total, selected, suppressed, and missing-contact counts.', bar: 86 },
                { label: 'Sender', value: 'Healthy', note: 'Mailbox, authentication, cap, window, and unsubscribe state.', bar: 94 },
                { label: 'Spend', value: 'Visible', note: 'Credits, enrichment, and campaign cost are estimated.', bar: 76 },
            ],
        ),
        sections: [
            {
                body: [
                    'Campaign review should be a readiness check, not documentation. The recruiter has already built the audience and sequence. The review step should verify the few things that can break once real candidate messages are scheduled.',
                    'The checklist should include eligible audience, suppressed records, missing contacts, sender mailbox, daily cap, send window, sequence timing, unsubscribe handling, stop rules, credit estimate, and compliance state.',
                ],
            },
            {
                body: [
                    'iCIMS and Aptitude Research report that 82% of companies consider AI transparency and explainability important, while 45% do not yet have a formal AI governance framework. A campaign review is a practical place to make governance visible without turning the product into policy text.',
                    'Google sender rules add another concrete layer. A campaign review should help protect mailbox reputation by making unsubscribe readiness, sender limits, and suppression state visible before launch.',
                ],
            },
            {
                body: [
                    'After launch, the product should route to the campaign workspace where the recruiter can inspect recipients, scheduled tasks, replies, bounces, stops, and credit movements. A generic success page wastes the moment when the user needs operational visibility.',
                    'The keyword strategy should target recruiting campaign checklist, candidate outreach compliance, campaign readiness review, sender health, recruiting outreach software, and AI sequence launch. The article should answer the buyer question: what should I check before sending recruiting outreach?',
                ],
            },
        ],
        citations: [sources.icims2026, sources.googleSender, sources.googleArticle],
    },
    {
        slug: 'why-one-screen-workspaces-help-recruiters',
        title: 'Why one-screen workspaces help recruiters',
        metaTitle: 'One-screen recruiting workspace for AI sourcing',
        metaDescription: 'Fixed recruiter workspaces keep filters, tables, selected context, and next actions visible during high-volume sourcing and outreach work.',
        date: '2026-05-25',
        updated: '2026-06-05',
        summary: 'Fixed-height workspaces help recruiters keep filters, tables, selected context, and next actions visible during repeated daily work.',
        tags: ['UX', 'Dashboard', 'Workflow'],
        keywords: keywords('recruiting workspace', 'AI sourcing dashboard', 'recruiter productivity software', 'one screen recruiting workflow'),
        readingTime: '6 min read',
        infographic: makeInfographic(
            'WORKSPACE UX',
            'Recruiters need less context recovery',
            'High workload makes persistent controls and dense, readable tables more useful than page-to-page navigation.',
            'Sources: Atlas 2026 benchmark; Gem 2026 benchmark.',
            [
                { value: '45.2%', label: 'Busy workload', detail: 'Agency recruiters describing workload as manageable but busy.' },
                { value: '35.6%', label: 'Often overwhelming', detail: 'Agency recruiters reporting often overwhelming workload.' },
                { value: '13.4', label: 'Open roles', detail: 'Average open roles per recruiter in Gem benchmark data.' },
            ],
            [
                { label: 'Top rail', value: 'Controls', note: 'Search, filters, tabs, and primary action stay visible.', bar: 88 },
                { label: 'Center', value: 'Rows', note: 'Candidate or list rows scroll without losing the workflow.', bar: 82 },
                { label: 'Side panel', value: 'Context', note: 'Selected object details and next actions stay in place.', bar: 78 },
            ],
        ),
        sections: [
            {
                body: [
                    'Recruiting dashboards are used repeatedly while a recruiter scans, filters, selects, compares, and acts. A one-screen workspace reduces context recovery by keeping the controls, rows, selected object, and next actions visible together.',
                    'Atlas reports that 45.2% of agency recruiters describe workload as manageable but busy, while 35.6% say it is often overwhelming. Gem reports 13.4 open roles per recruiter. Those numbers argue for operational density, not oversized cards and page-to-page navigation.',
                ],
            },
            {
                body: [
                    'A fixed workspace can still be calm. The table scrolls internally, the filter rail stays in place, the selected candidate or list opens in a side panel, and the action bar makes save, enrich, campaign, or archive available without moving the user away.',
                    'This is a strong SEO angle because buyers search for recruiter productivity software, AI sourcing dashboard, recruiting workspace, candidate pipeline software, and recruiting operations workflow. The content should connect those terms to actual user behavior.',
                ],
            },
            {
                body: [
                    'The answer-engine version is simple: one-screen recruiting workspaces help because they keep source context, row comparison, selected details, and next actions visible during repeated sourcing and outreach tasks.',
                    'That answer should be backed by product-specific detail. Tahoe can describe sticky controls, dense tables, right-side context, internal scrolling, keyboard-friendly actions, and visible workflow state in language both recruiters and search engines can parse.',
                ],
            },
        ],
        citations: [sources.atlasBenchmark2026, sources.gem2026, sources.googleSeo],
    },
];

export function getBlogPost(slug: string): BlogPost | undefined {
    return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(slug: string): BlogPost[] {
    return blogPosts.filter((post) => post.slug !== slug).slice(0, 2);
}
