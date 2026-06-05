export type BlogSection = {
    heading: string;
    body: string[];
};

export type BlogPost = {
    slug: string;
    title: string;
    date: string;
    summary: string;
    tags: string[];
    readingTime: string;
    sections: BlogSection[];
};

export const blogPosts: BlogPost[] = [
    {
        slug: 'from-search-to-outreach',
        title: 'From search to outreach without losing recruiter context',
        date: '2026-06-05',
        summary: 'How Tahoe turns a plain-English sourcing query into a working list, enriched contacts, and a campaign-ready audience.',
        tags: ['Workflow', 'Search', 'Outreach'],
        readingTime: '4 min read',
        sections: [
            {
                heading: 'The handoff is the workflow',
                body: [
                    'Recruiting teams lose time when search, list building, enrichment, and outreach live in separate tools. Tahoe treats that handoff as the core product surface, not an export step.',
                    'The practical goal is simple: a recruiter should understand the query, the selected candidates, the list they saved, and the next action without opening a second system.',
                ],
            },
            {
                heading: 'Lists are operational objects',
                body: [
                    'A list is not just a folder. It carries candidate state, enrichment readiness, campaign readiness, and the recruiting context that helps the next person understand why the audience exists.',
                    'That is why Tahoe keeps list actions close to the search and campaign workflows instead of burying them in a directory-style page.',
                ],
            },
            {
                heading: 'Outreach should start with confidence',
                body: [
                    'Before a campaign launches, the recruiter should know the eligible audience, suppressed candidates, sender mailbox, schedule, and sequence timing.',
                    'This keeps launch decisions explicit and makes follow-up delivery easier to inspect after the campaign is live.',
                ],
            },
        ],
    },
    {
        slug: 'candidate-lists-as-recruiting-infrastructure',
        title: 'Candidate lists are recruiting infrastructure',
        date: '2026-06-04',
        summary: 'Why dense list views, clear ownership, and contact-readiness signals matter more than decorative project cards.',
        tags: ['Lists', 'Projects', 'Operations'],
        readingTime: '3 min read',
        sections: [
            {
                heading: 'Scanning beats browsing',
                body: [
                    'Recruiters work across many roles, hiring managers, and campaign audiences. Dense rows make it easier to compare lists, see counts, and decide what needs attention.',
                    'Cards can work for discovery, but operational recruiting needs predictable columns, compact controls, and visible next actions.',
                ],
            },
            {
                heading: 'The right metric is the next action',
                body: [
                    'A useful list screen answers whether the audience is ready to enrich, ready to campaign, or needs cleanup first.',
                    'When that state is visible, the recruiter can act from the table instead of opening every list just to understand what changed.',
                ],
            },
            {
                heading: 'Context stays with the object',
                body: [
                    'Projects and lists should carry enough context to make the next move obvious: open, enrich, campaign, rename, or archive.',
                    'Tahoe keeps those actions close to the object while preserving a single-screen dashboard model.',
                ],
            },
        ],
    },
    {
        slug: 'credit-visibility-in-ai-recruiting',
        title: 'Credit visibility is part of recruiter trust',
        date: '2026-06-03',
        summary: 'A transparent credit model helps recruiting teams understand the cost of search, enrichment, and outreach before work starts.',
        tags: ['Billing', 'Credits', 'Trust'],
        readingTime: '4 min read',
        sections: [
            {
                heading: 'Credits should be inspectable',
                body: [
                    'Recruiters should not need to wait for an invoice to understand spend. Credits are clearer when every grant, hold, charge, and release is visible in one ledger.',
                    'That transparency also makes enrichment and outreach decisions less risky because teams can estimate before they run the workflow.',
                ],
            },
            {
                heading: 'Operational cost belongs near the action',
                body: [
                    'The best place to show cost is the point where a recruiter chooses to enrich contacts, launch a campaign, or run a provider-backed search page.',
                    'Tahoe keeps those estimates close to the action so the user can decide with context instead of hunting through billing pages.',
                ],
            },
            {
                heading: 'Trust compounds through boring details',
                body: [
                    'Clear balances, predictable caps, and plain-language ledger rows are not flashy features, but they make daily recruiting operations easier to defend.',
                    'For a SaaS recruiting workflow, that trust is as important as the search result itself.',
                ],
            },
        ],
    },
    {
        slug: 'why-recruiting-search-needs-context',
        title: 'Why recruiting search needs context, not just keywords',
        date: '2026-06-02',
        summary: 'Search gets more useful when the product remembers the hiring context, target companies, geography, and candidate readiness.',
        tags: ['Search', 'Context', 'Workflow'],
        readingTime: '3 min read',
        sections: [
            {
                heading: 'A query is only the start',
                body: [
                    'A good recruiting search starts with intent, but the workflow becomes useful when the system keeps track of what the recruiter is trying to build.',
                    'That context turns results into an audience instead of a disconnected set of profiles.',
                ],
            },
            {
                heading: 'Context reduces rework',
                body: [
                    'When filters, selected candidates, and list ownership stay visible, recruiters avoid repeating the same setup work across tools.',
                    'Tahoe keeps the search surface close to lists and outreach so the next action is obvious.',
                ],
            },
        ],
    },
    {
        slug: 'contact-enrichment-before-campaign-launch',
        title: 'Contact enrichment belongs before campaign launch',
        date: '2026-06-01',
        summary: 'Teams should know which contacts are ready, missing, suppressed, or expensive before they schedule a sequence.',
        tags: ['Enrichment', 'Outreach', 'Contacts'],
        readingTime: '4 min read',
        sections: [
            {
                heading: 'Readiness beats guessing',
                body: [
                    'Campaign quality drops when recruiters discover missing contacts only after launch. Contact readiness should be visible before a sequence is scheduled.',
                    'That means showing eligible candidates, suppressed records, and enrichment estimates in the same workflow.',
                ],
            },
            {
                heading: 'Costs need context',
                body: [
                    'Enrichment is easier to trust when the user sees what each field costs and how that cost changes the campaign audience.',
                    'A clear estimate keeps the launch decision grounded in real operational data.',
                ],
            },
        ],
    },
    {
        slug: 'mailbox-health-and-send-pacing',
        title: 'Mailbox health and send pacing should be visible',
        date: '2026-05-31',
        summary: 'Recruiting outreach works better when send limits, mailbox health, and sequence pacing are visible before emails go out.',
        tags: ['Mailboxes', 'Outreach', 'Deliverability'],
        readingTime: '3 min read',
        sections: [
            {
                heading: 'Pacing is product behavior',
                body: [
                    'Mailbox limits are not only infrastructure settings. They shape how quickly a recruiter can reach an audience and how safely a campaign can scale.',
                    'Tahoe surfaces conservative caps and pacing so launch expectations are clear.',
                ],
            },
            {
                heading: 'Healthy senders are easier to trust',
                body: [
                    'A campaign builder should make the selected sender, daily cap, and send window visible before launch.',
                    'This makes outreach predictable without asking recruiters to reason through backend worker details.',
                ],
            },
        ],
    },
    {
        slug: 'sequence-builders-need-operational-clarity',
        title: 'Sequence builders need operational clarity',
        date: '2026-05-30',
        summary: 'A sequence editor should make every follow-up, delay, sender, and send window easy to inspect before launch.',
        tags: ['Sequences', 'Scheduling', 'Outreach'],
        readingTime: '4 min read',
        sections: [
            {
                heading: 'Every step should answer when',
                body: [
                    'Recruiters need to know whether an email sends immediately, after three business days, or after a specific local time window opens.',
                    'A compact step rail and editor make that easier than stacking large email cards.',
                ],
            },
            {
                heading: 'Follow-ups are commitments',
                body: [
                    'A follow-up is not just text. It creates future send work for every eligible recipient unless the candidate replies, bounces, unsubscribes, or is otherwise stopped.',
                    'That operational meaning should be visible in the builder and in the launched campaign workspace.',
                ],
            },
        ],
    },
    {
        slug: 'analytics-should-answer-recruiting-questions',
        title: 'Analytics should answer recruiting questions',
        date: '2026-05-29',
        summary: 'Recruiting analytics are most useful when they show workflow movement, reply outcomes, spend, and bottlenecks without visual noise.',
        tags: ['Analytics', 'Funnel', 'Reporting'],
        readingTime: '3 min read',
        sections: [
            {
                heading: 'Dashboards should start with decisions',
                body: [
                    'Analytics pages should help a recruiter decide where the workflow is stuck: search, save, enrich, send, reply, or spend.',
                    'That means compact metrics, simple charts, and drilldowns that lead to the underlying work.',
                ],
            },
            {
                heading: 'Less color, more signal',
                body: [
                    'Operational dashboards do not need heavy decoration to feel useful. Light dividers, readable tables, and restrained chart colors help teams scan faster.',
                    'The best analytics surface gets out of the way of the question.',
                ],
            },
        ],
    },
    {
        slug: 'projects-are-working-containers',
        title: 'Projects are working containers',
        date: '2026-05-28',
        summary: 'A project should help recruiters understand ownership, lists, status, and next actions without becoming a decorative dashboard.',
        tags: ['Projects', 'Lists', 'Operations'],
        readingTime: '3 min read',
        sections: [
            {
                heading: 'Projects organize work',
                body: [
                    'Projects are useful when they collect candidate lists, ownership, and status into one place that recruiters can scan quickly.',
                    'They become less useful when the interface hides those details behind large cards and repeated copy.',
                ],
            },
            {
                heading: 'Rows scale better',
                body: [
                    'A dense project table makes comparison faster across roles, hiring managers, and campaigns.',
                    'The row can still carry context through actions and detail panels without taking over the whole page.',
                ],
            },
        ],
    },
    {
        slug: 'save-to-list-is-a-core-handoff',
        title: 'Save to list is a core handoff',
        date: '2026-05-27',
        summary: 'The moment a recruiter saves candidates should offer the next useful choices: open the list, enrich contacts, or keep searching.',
        tags: ['Search', 'Lists', 'UX'],
        readingTime: '3 min read',
        sections: [
            {
                heading: 'Saving is not the finish line',
                body: [
                    'When candidates are saved, the system should not leave the recruiter wondering where the work went.',
                    'The next action is usually to open the list, enrich contacts, or continue sourcing against the same role.',
                ],
            },
            {
                heading: 'Feedback matters',
                body: [
                    'A good success state confirms the saved audience and exposes the next workflow step.',
                    'This keeps the search-to-list handoff explicit and reduces navigation friction.',
                ],
            },
        ],
    },
    {
        slug: 'campaign-review-should-be-a-readiness-check',
        title: 'Campaign review should be a readiness check',
        date: '2026-05-26',
        summary: 'Launch review should focus on audience, sender, sequence, schedule, credits, and compliance instead of repeating setup text.',
        tags: ['Campaigns', 'Review', 'Compliance'],
        readingTime: '4 min read',
        sections: [
            {
                heading: 'Review should be compact',
                body: [
                    'The review screen is where a recruiter confirms the campaign can safely launch. It should not read like documentation.',
                    'A readiness checklist is easier to scan than several paragraphs of explanatory text.',
                ],
            },
            {
                heading: 'Launch state should be explicit',
                body: [
                    'After launch, the user should see that the campaign exists, what tasks were created, and where to inspect recipients.',
                    'Routing directly to the campaign workspace keeps the operational loop closed.',
                ],
            },
        ],
    },
    {
        slug: 'why-one-screen-workspaces-help-recruiters',
        title: 'Why one-screen workspaces help recruiters',
        date: '2026-05-25',
        summary: 'Fixed-height workspaces with internal scrolling keep controls, tables, and selected context visible during repeated recruiting work.',
        tags: ['UX', 'Dashboard', 'Workflow'],
        readingTime: '3 min read',
        sections: [
            {
                heading: 'The page should hold the workflow',
                body: [
                    'Recruiting dashboards are used repeatedly. Important controls should not disappear because the page scrolled past them.',
                    'A fixed workspace keeps filters, tables, pagination, and selected context in predictable places.',
                ],
            },
            {
                heading: 'Density is not clutter',
                body: [
                    'Dense rows can be calm when typography, spacing, and actions are consistent.',
                    'For operational users, that density often creates less cognitive load than a page full of large cards.',
                ],
            },
        ],
    },
];

export function getBlogPost(slug: string): BlogPost | undefined {
    return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(slug: string): BlogPost[] {
    return blogPosts.filter((post) => post.slug !== slug).slice(0, 2);
}
