import type { Locale } from './config';

// Client-safe strings for components that run in the browser (site chrome,
// language switcher, cookie consent, auth forms). Kept separate from the large
// server-only page dictionaries so client bundles stay small. Both locales are
// shipped here because the client selects by the current locale.

export const ui = {
    en: {
        nav: {
            product: 'Product',
            features: 'Features',
            pricing: 'Pricing',
            customers: 'Customers',
            ourStory: 'Our Story',
            blog: 'Blog',
            signIn: 'Sign in',
            startFree: 'Start for free',
        },
        footer: {
            brand:
                'Tahoe is the AI recruiting platform that sources, enriches, and sends outreach in one place. You just describe who you are looking for.',
            productHeading: 'Product',
            companyHeading: 'Company',
            legalHeading: 'Legal',
            contactHeading: 'Contact',
            features: 'Features',
            pricing: 'Pricing',
            ourStory: 'Our Story',
            blog: 'Blog',
            resources: 'Resources',
            customers: 'Customers',
            productVision: 'Product vision',
            partnerProgram: 'Partner program',
            privacy: 'Privacy',
            cookie: 'Cookie',
            cookieSettings: 'Cookie settings',
            terms: 'Terms',
            address: '124 E 14th St, New York, NY 10003',
            rights:
                '© 2026 WorkOnward. Made for recruiters who would rather hire than negotiate contracts.',
        },
        language: { label: 'Language', switchTo: 'View in 한국어' },
    },
    ko: {
        nav: {
            product: '제품',
            features: '기능',
            pricing: '요금',
            customers: '고객',
            ourStory: '브랜드 스토리',
            blog: '블로그',
            signIn: '로그인',
            startFree: '무료로 시작하기',
        },
        footer: {
            brand:
                'Tahoe는 후보자 검색, 정보 보강, 아웃리치를 한곳에서 처리하는 AI 채용 플랫폼입니다. 찾고 있는 인재를 설명하기만 하면 됩니다.',
            productHeading: '제품',
            companyHeading: '회사',
            legalHeading: '약관',
            contactHeading: '문의',
            features: '기능',
            pricing: '요금',
            ourStory: '브랜드 스토리',
            blog: '블로그',
            resources: '리소스',
            customers: '고객',
            productVision: '제품 비전',
            partnerProgram: '파트너 프로그램',
            privacy: '개인정보 처리방침',
            cookie: '쿠키',
            cookieSettings: '쿠키 설정',
            terms: '이용약관',
            address: '124 E 14th St, New York, NY 10003',
            rights: '© 2026 WorkOnward. 계약 협상보다 채용을 원하는 리크루터를 위해 만들었습니다.',
        },
        language: { label: '언어', switchTo: 'View in English' },
    },
} as const;

export type UiStrings = (typeof ui)[Locale];
