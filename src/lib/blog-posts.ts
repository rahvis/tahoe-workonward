import type { Locale } from '@/i18n/config';

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

const blogPostsKo: BlogPost[] = [
    {
        slug: 'big-tech-firing-and-hiring-2026',
        title: '빅테크는 해고와 채용을 동시에 하고 있다',
        metaTitle: '2026년 빅테크 정리해고와 채용',
        metaDescription:
            '2026년 빅테크 정리해고, AI가 원인으로 지목된 일자리 감축, 그리고 테크 채용 신호를 데이터로 살펴보고, 정리해고된 인재를 소싱하기 위한 리크루팅 시사점을 정리합니다.',
        date: '2026-06-05',
        updated: '2026-06-05',
        summary:
            '2026년 테크 노동 시장은 단순한 정리해고 이야기가 아닙니다. 빅테크는 역할을 줄이면서도 AI 전환에 예산을 투입하고, 특정 기술 인재를 두고 여전히 경쟁하고 있습니다.',
        tags: ['테크 노동 시장', '정리해고', '채용'],
        keywords: [
            '2026년 빅테크 정리해고',
            '빅테크 해고와 채용',
            '2026년 기술 업계 정리해고',
            '2026년 AI 정리해고',
            '2026년 테크 채용',
            '해고된 테크 인재 소싱',
            '소프트웨어 엔지니어 채용',
            '정리해고 후보자 리크루팅',
            'AI 리크루팅 소프트웨어',
            'AI 소싱 소프트웨어',
            '인재 인텔리전스 플랫폼',
            '후보자 소싱',
            '리크루팅 자동화',
        ],
        readingTime: '7분 분량',
        infographic: makeInfographic(
            '2026 테크 노동 시장 신호',
            '빅테크의 감축, 채용, 그리고 재편',
            '기업이 예산을 AI, 인프라, 핵심 기술 직무로 재배분할 때, 같은 시장에서도 대규모 일자리 감축과 선별적 채용 수요가 동시에 나타날 수 있습니다.',
            '출처: Challenger, Gray & Christmas 2026년 5월; CompTIA 2026 테크 인력 보고서.',
            [
                { value: '38,242', label: '5월 테크 감축', detail: '2026년 5월에 발표된 테크 일자리 감축 규모로, 2024년 8월 이후 업계 최고치입니다.' },
                { value: '123,653', label: '연초 이후 테크 감축', detail: '2026년 5월까지 발표된 테크 감축 규모로, 2025년 같은 기간보다 66% 증가했습니다.' },
                { value: '271,483', label: '신규 테크 공고', detail: '전 산업에 걸친 2026년 4월 테크 직군 신규 채용 공고 수입니다.' },
            ],
            [
                { label: 'AI 감축 신호', value: '40%', note: 'AI는 5월 미국 고용주 감축 중 38,579건의 원인으로 지목됐습니다.', bar: 40 },
                { label: '5월 테크 채용', value: '11,250', note: 'Challenger 데이터에서 5월 채용 계획을 테크가 주도했습니다.', bar: 64 },
                { label: '활성 수요', value: '575k+', note: 'CompTIA 데이터 기준 4월 테크 직무 활성 공고 수입니다.', bar: 86 },
            ],
        ),
        sections: [
            {
                body: [
                    '2026년 빅테크 노동 시장은 하나의 이야기가 아닙니다. 해고 이야기이자, 채용 이야기이며, 동시에 예산 재배분 이야기입니다. Challenger, Gray & Christmas는 2026년 5월 테크 일자리 감축이 38,242건으로 2024년 8월 이후 월간 최고치이며, 5월까지 누적 123,653건이라고 발표했습니다.',
                    '이 수치는 후보자와 리크루터가 시장이 위축되고 있다고 느끼는 이유를 설명합니다. 하지만 모든 기술 직무가 사라지고 있다는 뜻은 아닙니다. CompTIA는 경제 전반에서 2026년 4월 테크 직군 신규 공고가 271,483건이었고, 그달 활성 테크 공고가 57만 5천 건을 넘었다고 보고했습니다.',
                ],
                quote: {
                    text: '노동 시장은 실시간으로 기술에 의해 재편되고 있습니다.',
                    attribution: 'Andy Challenger, Challenger, Gray & Christmas',
                },
            },
            {
                body: [
                    '여기서 중요한 리크루팅 포인트는 정리해고와 채용이 서로 반대 개념이 아니라는 것입니다. 대형 기술 기업은 한 기능을 축소하고, 관리 계층을 줄이고, 우선순위가 낮은 팀을 닫거나, 일반 직군 채용을 늦추면서도 AI 인프라, 사이버 보안, 시스템 엔지니어링, 데이터, 클라우드, 그리고 현재 전략에 맞물린 소프트웨어 직무는 계속 열어 둘 수 있습니다.',
                    'Challenger는 AI가 5월 감축 중 38,579건, 그달 전체 감축의 40%, 그리고 2026년 5월까지 누적 87,714건의 원인으로 지목됐다고 밝혔습니다. 이는 분명 중요한 노동 시장 신호이지만, 리크루터는 신중하게 해석해야 합니다. 정리해고 발표는 기업의 결정을 설명할 뿐, 후보자의 역량, 기술의 깊이, 향후 수요까지 온전히 설명해 주지는 않습니다.',
                ],
            },
            {
                body: [
                    'CompTIA는 그림의 다른 한쪽을 보여 줍니다. 2026 인력 보고서는 미국 순 테크 고용이 1.9%, 즉 185,499개의 새 일자리만큼 성장해 전국 테크 인력이 약 980만 명에 이를 것으로 전망합니다. 또한 2026년 1월에는 일정 수준의 AI 역량을 언급한 활성 공고가 27만 5천 건을 넘었다고 합니다.',
                    '그래서 가장 강력한 리크루팅 워크플로는 단순히 정리해고 명단을 긁어모으는 것이 아닙니다. 리크루터는 풀려난 인재를 직무 계열, 연차, 회사 맥락, 지역, 보안 인가, 클라우드 스택, AI 숙련도, 관리 범위, 대화 준비 상태별로 구분해야 합니다. 빅테크 정리해고는 후보자 공급을 만들지만, 좋은 소싱은 그 공급을 관련성 높은 후보 리스트로 바꿉니다.',
                ],
            },
            {
                body: [
                    '경력 구성도 중요합니다. CompTIA는 4월 테크 공고의 20%가 경력 0~3년을, 28%가 4~7년을, 17%가 8년 이상을 요구했다고 보고했습니다. 이런 분포 때문에 천편일률적인 아웃리치는 효과가 약합니다. 클라우드 인프라 팀을 떠나는 시니어 플랫폼 엔지니어에게는 광범위한 구조조정에 휘말린 주니어 분석가와는 다른 메시지가 필요합니다.',
                    '리크루터에게 실질적인 방법은 정리해고를 고려한 소싱 프로젝트를 구축하는 것입니다. 후보자를 회사 이벤트, 팀, 직무 계열, 기술 클러스터, 아웃리치 상태별로 저장하세요. 관련 있는 사람일 때만 연락처를 보강하세요. 시장 상황을 인지하되 착취적으로 들리지 않는 메시지를 순차적으로 보내세요. 발송 건수가 아니라 회신을 추적하세요.',
                ],
            },
            {
                body: [
                    'Tahoe는 2026년 빅테크 정리해고, AI 정리해고, 2026년 테크 채용, 해고된 소프트웨어 엔지니어, 정리해고된 테크 인재 리크루팅 같은 검색어 뒤에 숨은 진짜 의도에 답함으로써 이 주제에서 상위에 노출되어야 합니다. 구매자들은 인재가 어디로 이동하고 있는지, 어떤 직무가 여전히 수요가 있는지, 그리고 크레딧을 낭비하거나 발신자 평판을 해치지 않으면서 후보자에게 어떻게 연락할지를 묻고 있습니다.',
                    '답은 운영에 있습니다. 빅테크의 해고와 채용을 살아 있는 인재 지도로 다루세요. 최고의 리크루팅 팀은 정리해고 헤드라인에 단순히 반응하지 않습니다. 그들은 시장 신호를 타깃 후보 리스트, 검증된 연락처, 신중한 아웃리치, 그리고 측정 가능한 파이프라인 변화로 바꿉니다.',
                ],
            },
        ],
        citations: [sources.challengerMay2026, sources.comptiaState2026, sources.comptiaApril2026],
    }
];

const blogPostsByLocale: Record<Locale, BlogPost[]> = {
    en: blogPosts,
    ko: blogPostsKo,
};

export function getBlogPosts(locale: Locale): BlogPost[] {
    return blogPostsByLocale[locale] ?? blogPosts;
}

export function getBlogPost(locale: Locale, slug: string): BlogPost | undefined {
    return getBlogPosts(locale).find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(locale: Locale, slug: string): BlogPost[] {
    return getBlogPosts(locale).filter((post) => post.slug !== slug).slice(0, 2);
}
