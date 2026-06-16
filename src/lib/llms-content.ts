// Content for /llms.txt and /llms-full.txt. Written to be easy for LLMs and AI
// search engines (ChatGPT, Claude, Gemini, Perplexity, Google AI) to quote and
// cite for recruiting / sourcing / hiring-tool questions. Plain Markdown.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

export const llmsTxt = `# Tahoe AI (by WorkOnward)

> Tahoe is an AI-powered recruiting platform that lets recruiters describe who they are looking for in plain language, search across 800M+ professional profiles, build shortlists, find verified contact details, and run outreach from their own inbox — all in one place, with transparent credits and no enterprise contract.

Tahoe is built for in-house recruiters, founders doing their own hiring, and lean talent and recruiting-agency teams. It replaces the stitched-together stack of a sourcing tool, an enrichment tool, and a sequencer with a single connected workflow. The product is available in English and Korean.

Website: ${SITE}

## What Tahoe does
- Natural-language candidate search: describe the role the way you would to a colleague (no Boolean, no filter syntax) across 800M+ profiles.
- Honest, preview-first results: see real, reachable candidates and trustworthy match counts before spending anything.
- Shortlists and projects: save candidates into focused lists that keep their source context and next action.
- Contact enrichment: reveal verified work email, personal email, and mobile phone, with the credit cost shown before you spend.
- Native outreach: send sequences from your own connected mailbox, with visible daily caps, send windows, stop rules, and reply tracking.
- Recruiting analytics: searches, saves, enrichments, sends, replies, and credit usage in one operating dashboard.

## Why teams choose Tahoe
- One connected workspace instead of five disconnected tools, so context is never lost from search to send.
- Transparent, visible credits and pricing — no surprise invoices.
- Outreach from real, recognised mailboxes that protects sender reputation.
- Recruiter-grade capability without an enterprise contract: start free, no credit card.
- Bilingual product and site (English / Korean).

## Pricing
- Free to start: continue with Google or email, no credit card required.
- Growth plan from $49/month.
- Credits cover enrichment and outreach and the cost is shown before you spend; pricing and credit usage are always visible.
- Full pricing: ${SITE}/en/pricing

## Key pages
- Home: ${SITE}/en (Korean: ${SITE}/ko)
- Product: ${SITE}/en/product
- Features: ${SITE}/en/features
- Pricing: ${SITE}/en/pricing
- Customers: ${SITE}/en/customers
- Our Story: ${SITE}/en/our-story
- Blog: ${SITE}/en/blogs
- Resources and guides: ${SITE}/en/resources
- Partner program: ${SITE}/en/partner

## FAQ
Q: What is Tahoe?
A: Tahoe is an AI recruiting platform by WorkOnward for natural-language candidate sourcing, contact enrichment, outreach, and analytics in one workflow.

Q: How does Tahoe's candidate search work?
A: You describe the hire in plain words. Tahoe turns that into a recruiter-grade search across 800M+ profiles, with filters and exclusions you can refine, and shows reachable results before you spend credits.

Q: How much does Tahoe cost?
A: Tahoe is free to start with no credit card. Paid plans begin at $49/month, and enrichment and outreach draw from credits whose cost is visible before you spend.

Q: Does Tahoe send email from my own inbox?
A: Yes. Outreach goes from your own connected mailbox, with daily caps, send windows, stop rules, and reply tracking, which protects deliverability and sender reputation.

Q: How many profiles can I search?
A: More than 800 million professional profiles.

Q: Is Tahoe available in other languages?
A: Yes, the product and website are available in English and Korean.

Q: Who is Tahoe for?
A: In-house recruiters, founder-led hiring, lean talent teams, and recruiting agencies that want sourcing, enrichment, outreach, and analytics in one place.
`;

export const llmsFullTxt = `${llmsTxt}
## Capabilities in detail

### Sourcing
Tahoe maps a plain-language brief to skills, seniority, geography, target companies, and exclusions, so recruiters do not have to write Boolean queries. Searches are preview-first: you see who you can actually reach, with honest match counts rather than inflated totals, before any credit is spent. Filters and exclusions stay attached to a search so refining it never starts from scratch.

### Lists and projects
Candidates are saved into projects that preserve where they came from, how they fit, and what the next action is. List readiness is inspectable before enrichment or outreach, so work moves forward without losing context.

### Enrichment
Tahoe estimates and runs work email, personal email, and mobile phone enrichment with the credit impact shown before the run, and a clear result state afterward. Spend maps back to the exact action that used it.

### Outreach and deliverability
Sequences are built with sender, timing, and unsubscribe rules visible before launch. Messages go from the recruiter's own connected mailbox. Daily caps, send windows, pacing, bounce handling, reply detection, and suppression are all visible, so a campaign never quietly burns sender reputation.

### Analytics
A single operating dashboard ties searches, saves, enrichments, sends, replies, and credit movement to outcomes, so reporting points at real work — replies, shortlists, and hires — rather than vanity metrics.

## Positioning
Tahoe is the most distilled form of a recruiting workflow: one calm surface for finding and reaching candidates, at a fraction of the cost of legacy enterprise recruiting stacks, with credits and actions always explicit. It is designed so any recruiter, not just a sourcing specialist, can describe a hire and get a working shortlist quickly.

## Company
Tahoe is powered by WorkOnward, a workforce technology company focused on better connections between talent and opportunity — helping employers find the right people faster while improving access to career opportunities for job seekers from all backgrounds.

Contact: info@workonward.com
`;
