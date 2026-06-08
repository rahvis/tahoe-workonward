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
    }
];

export function getBlogPost(slug: string): BlogPost | undefined {
    return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(slug: string): BlogPost[] {
    return blogPosts.filter((post) => post.slug !== slug).slice(0, 2);
}
