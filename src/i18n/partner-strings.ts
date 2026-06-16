// Client-safe strings for the partner program page (both locales bundled).
// The illustrative earnings card and partner-dashboard mock stay in English on
// purpose: they read as a product screenshot, the same way the home demo does.

export const partnerT = {
    en: {
        heroEyebrow: 'Tahoe Partner Program',
        heroTitlePre: 'Earn ',
        heroTitleEm: '30% recurring',
        heroTitlePost: ' revenue share for 12 months.',
        heroBody:
            'Tahoe pays creators, operators, and recruiting communities a real share of every paying customer they send. No earnings cap. Monthly Stripe payouts. A named human at WorkOnward helping you ship the next campaign.',
        heroApply: 'Apply to be a partner',
        heroFaq: 'Read the FAQ',
        heroMeta: 'Approval in 2-3 business days · Free to join',
        heroStats: [
            { value: '30%', label: 'recurring rev-share' },
            { value: '12 months', label: 'per paid customer' },
            { value: '60-day', label: 'attribution window' },
        ],

        benefitsEyebrow: 'Why partner with Tahoe',
        benefitsH2: 'Built for partners who actually ship, not just collect codes.',
        benefitsBody:
            'Tahoe is an AI recruiting platform that customers stay on for years. That makes recurring economics genuinely good for the people who introduce us, not a one-time bounty.',
        benefits: [
            {
                title: '30% recurring revenue share',
                body: 'Earn 30% of every paid Tahoe subscription you refer for a full 12 months, paid out monthly.',
            },
            {
                title: 'No earnings cap',
                body: 'Bring 5 customers or 5,000. Your share scales with the workspaces you send. No tiers, no resets.',
            },
            {
                title: 'Co-marketing assets',
                body: 'Approved demos, screenshot kits, comparison decks, and copy you can drop into your own channel.',
            },
            {
                title: 'A real partner manager',
                body: 'A named human at WorkOnward who answers in hours, not weeks, and helps you ship the next campaign.',
            },
        ],

        howEyebrow: 'How it works',
        howH2: 'Three steps from application to first payout.',
        howBody:
            'No spreadsheets, no manual claim links, no surprise reductions. Just send qualified workspaces, get paid.',
        howSteps: [
            {
                title: 'Apply in two minutes',
                body: 'Tell us about your audience and how you talk about recruiting tools. We review every application within 2-3 business days.',
            },
            {
                title: 'Get your link + assets',
                body: 'On approval you get a tracked partner link, a private dashboard, and our co-marketing kit, ready to drop into a video, post, or newsletter.',
            },
            {
                title: 'Earn 30% for 12 months',
                body: 'Every paid Tahoe subscription you refer pays you 30% recurring for 12 months. Payouts run monthly via Stripe.',
            },
        ],

        dashEyebrow: 'Partner dashboard',
        dashH2: 'Live earnings, attribution, and payout state in one calm surface.',
        dashBody:
            'Approved partners get a private dashboard built on the same platform Tahoe ships to recruiters. Track every referral, see your next Stripe payout, and grab assets in one place.',

        calcEyebrow: 'Earnings calculator',
        calcH2: 'See what 30% recurring actually pays.',
        calcBody:
            'Drag the inputs to model what you would earn each month, each year, and across the full 12-month payout window for every customer.',
        calcReferralsLabel: 'Active paying referrals',
        calcPlanLabel: 'Average customer plan ($/month)',
        calcHint: 'Math: referrals × plan × 30% rev-share, paid monthly for 12 months per customer.',
        calcMonthly: 'Estimated monthly earnings',
        calcYearly: 'Yearly',
        calcPerCustomer: 'Per customer · 12 months',
        calcLifetime: 'Lifetime program total at this run-rate:',

        faqEyebrow: 'FAQ',
        faqH2: 'Everything you might want to know before applying.',
        faqs: [
            {
                question: 'How does the 30% revenue share work?',
                answer: 'For every paid Tahoe subscription you refer, you earn 30% of what that customer pays Tahoe for 12 months, paid out monthly via Stripe. Annual plans count toward all 12 months on day one.',
            },
            {
                question: 'When and how do I get paid?',
                answer: 'Payouts run on the 1st of every month via Stripe Connect, covering qualified earnings from the previous calendar month, after a 10-day refund window. Minimum payout is $50.',
            },
            {
                question: 'How long does the cookie last?',
                answer: 'Your tracked partner link sets a 60-day attribution cookie. As long as the customer signs up within 60 days of the click, the workspace is attributed to you.',
            },
            {
                question: 'Can I run paid ads?',
                answer: 'Yes, on your own channels. We do ask that you avoid bidding on Tahoe-branded keywords or impersonating Tahoe in ads. Full guidelines are shared after approval.',
            },
            {
                question: 'What counts as a qualified referral?',
                answer: 'A referral is qualified once the workspace pays its first Tahoe invoice and stays past the 10-day refund window. Free trials and unpaid signups are tracked but only earn once they convert.',
            },
            {
                question: 'How do you protect my links from fraud?',
                answer: 'Every signup is run through device fingerprinting, IP heuristics, and refund-window checks before earnings post to your ledger. We will never claw back legitimate paid conversions.',
            },
            {
                question: 'How do I get support?',
                answer: 'Approved partners get a dedicated Slack channel and a named partner manager at WorkOnward. We respond inside one business day, usually faster.',
            },
        ],

        finalH2: 'Ready to earn alongside Tahoe?',
        finalBody:
            'Tahoe is built for recruiters who care about how they work. If your audience cares about that too, we want you in the program.',
        finalApply: 'Apply to be a partner',
        finalFaq: 'Read the FAQ',
        finalChecklist: [
            '30% recurring rev-share for 12 months',
            'Monthly payouts via Stripe Connect',
            '60-day attribution window',
            'A real human partner manager',
            'Co-marketing assets on day one',
        ],
    },

    ko: {
        heroEyebrow: 'Tahoe 파트너 프로그램',
        heroTitlePre: '12개월 동안 ',
        heroTitleEm: '30% 반복 수익',
        heroTitlePost: '을 셰어로 받으세요.',
        heroBody:
            'Tahoe는 크리에이터, 운영자, 채용 커뮤니티에게 소개해 준 유료 고객 한 명 한 명에 대한 실질적인 수익 셰어를 지급합니다. 수익 상한 없음. 매월 Stripe 정산. 다음 캠페인을 함께 만들어 줄 WorkOnward 전담 담당자가 함께합니다.',
        heroApply: '파트너 신청하기',
        heroFaq: 'FAQ 보기',
        heroMeta: '영업일 기준 2~3일 내 승인 · 가입 무료',
        heroStats: [
            { value: '30%', label: '반복 수익 셰어' },
            { value: '12개월', label: '유료 고객당 지급' },
            { value: '60일', label: '기여 인정 기간' },
        ],

        benefitsEyebrow: 'Tahoe와 파트너가 되어야 하는 이유',
        benefitsH2: '코드만 모으는 게 아니라, 실제로 성과를 내는 파트너를 위해 만들었습니다.',
        benefitsBody:
            'Tahoe는 고객이 몇 년씩 머무는 AI 채용 플랫폼입니다. 그래서 우리를 소개해 주는 분들에게 반복 수익 구조가 일회성 보상이 아니라 진짜로 좋은 조건이 됩니다.',
        benefits: [
            {
                title: '30% 반복 수익 셰어',
                body: '소개한 모든 유료 Tahoe 구독에 대해 12개월 내내 30%를 매월 정산받습니다.',
            },
            {
                title: '수익 상한 없음',
                body: '고객을 5명 데려오든 5,000명을 데려오든, 보내 준 워크스페이스만큼 셰어가 늘어납니다. 등급도, 리셋도 없습니다.',
            },
            {
                title: '공동 마케팅 자료',
                body: '승인된 데모, 스크린샷 키트, 비교 자료, 그리고 본인 채널에 바로 넣을 수 있는 카피를 제공합니다.',
            },
            {
                title: '진짜 파트너 매니저',
                body: '몇 주가 아니라 몇 시간 안에 답하고, 다음 캠페인을 함께 만들어 주는 WorkOnward 전담 담당자가 있습니다.',
            },
        ],

        howEyebrow: '진행 방식',
        howH2: '신청부터 첫 정산까지 단 세 단계.',
        howBody:
            '스프레드시트도, 수동 청구 링크도, 갑작스러운 삭감도 없습니다. 자격을 갖춘 워크스페이스를 보내면 정산받습니다.',
        howSteps: [
            {
                title: '2분 만에 신청',
                body: '여러분의 오디언스와 채용 도구를 어떻게 소개하는지 알려 주세요. 모든 신청을 영업일 기준 2~3일 내에 검토합니다.',
            },
            {
                title: '링크와 자료 받기',
                body: '승인되면 추적 가능한 파트너 링크, 전용 대시보드, 공동 마케팅 키트를 받아 영상, 게시물, 뉴스레터에 바로 넣을 수 있습니다.',
            },
            {
                title: '12개월 동안 30% 정산',
                body: '소개한 모든 유료 Tahoe 구독은 12개월 동안 30%를 반복 지급합니다. 정산은 Stripe를 통해 매월 이뤄집니다.',
            },
        ],

        dashEyebrow: '파트너 대시보드',
        dashH2: '수익, 기여, 정산 상태를 한 화면에서 차분하게.',
        dashBody:
            '승인된 파트너는 Tahoe가 리크루터에게 제공하는 것과 동일한 플랫폼 위에 만들어진 전용 대시보드를 받습니다. 모든 추천을 추적하고, 다음 Stripe 정산을 확인하고, 자료를 한곳에서 받으세요.',

        calcEyebrow: '수익 계산기',
        calcH2: '30% 반복 수익이 실제로 얼마인지 확인하세요.',
        calcBody:
            '입력값을 조정해 매월, 매년, 그리고 고객마다 12개월 전체 정산 기간 동안 얼마를 벌게 될지 시뮬레이션해 보세요.',
        calcReferralsLabel: '유료 활성 추천 수',
        calcPlanLabel: '고객 평균 요금제 ($/월)',
        calcHint: '계산식: 추천 수 × 요금제 × 30% 셰어, 고객당 12개월 동안 매월 지급.',
        calcMonthly: '예상 월 수익',
        calcYearly: '연간',
        calcPerCustomer: '고객당 · 12개월',
        calcLifetime: '이 추세 기준 프로그램 총 수익:',

        faqEyebrow: 'FAQ',
        faqH2: '신청하기 전에 알아 두면 좋은 모든 것.',
        faqs: [
            {
                question: '30% 수익 셰어는 어떻게 작동하나요?',
                answer: '소개한 모든 유료 Tahoe 구독에 대해, 해당 고객이 Tahoe에 지불하는 금액의 30%를 12개월 동안 Stripe로 매월 정산받습니다. 연간 요금제는 첫날부터 12개월 전체로 인정됩니다.',
            },
            {
                question: '언제, 어떻게 정산받나요?',
                answer: '정산은 매월 1일 Stripe Connect를 통해 이뤄지며, 10일 환불 기간이 지난 전월의 적격 수익이 대상입니다. 최소 정산 금액은 $50입니다.',
            },
            {
                question: '쿠키는 얼마나 유지되나요?',
                answer: '추적용 파트너 링크는 60일 기여 인정 쿠키를 설정합니다. 클릭 후 60일 이내에 고객이 가입하면 해당 워크스페이스가 여러분에게 귀속됩니다.',
            },
            {
                question: '유료 광고를 집행할 수 있나요?',
                answer: '네, 본인 채널에서는 가능합니다. 다만 Tahoe 브랜드 키워드 입찰이나 광고에서 Tahoe를 사칭하는 행위는 자제해 주세요. 전체 가이드라인은 승인 후 공유됩니다.',
            },
            {
                question: '무엇이 적격 추천으로 인정되나요?',
                answer: '워크스페이스가 첫 Tahoe 청구서를 결제하고 10일 환불 기간을 넘기면 추천이 적격으로 인정됩니다. 무료 체험과 미결제 가입은 추적되지만, 전환된 이후에만 수익이 발생합니다.',
            },
            {
                question: '제 링크를 어떻게 부정 사용으로부터 보호하나요?',
                answer: '모든 가입은 수익이 원장에 반영되기 전에 기기 핑거프린팅, IP 휴리스틱, 환불 기간 검증을 거칩니다. 정당한 유료 전환은 절대 회수하지 않습니다.',
            },
            {
                question: '지원은 어떻게 받나요?',
                answer: '승인된 파트너는 전용 Slack 채널과 WorkOnward 전담 파트너 매니저를 배정받습니다. 영업일 기준 하루 안에, 보통은 그보다 빠르게 답합니다.',
            },
        ],

        finalH2: 'Tahoe와 함께 수익을 만들 준비가 되셨나요?',
        finalBody:
            'Tahoe는 일하는 방식을 중요하게 여기는 리크루터를 위해 만들어졌습니다. 여러분의 오디언스도 그런 가치를 중요하게 여긴다면, 프로그램에 함께해 주세요.',
        finalApply: '파트너 신청하기',
        finalFaq: 'FAQ 보기',
        finalChecklist: [
            '12개월 동안 30% 반복 수익 셰어',
            'Stripe Connect를 통한 매월 정산',
            '60일 기여 인정 기간',
            '진짜 사람인 파트너 매니저',
            '첫날부터 제공되는 공동 마케팅 자료',
        ],
    },
} as const;
