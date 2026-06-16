import type { Metadata } from 'next';
import { OG_IMAGES } from '@/lib/og';
import { type Locale, isLocale } from '@/i18n/config';
import { buildAlternates, buildOgLocale } from '@/i18n/metadata';
import { partnerT } from '@/i18n/partner-strings';
import { faqLd } from '@/lib/structured-data';
import JsonLd from '@/components/seo/JsonLd';

const META = {
    en: {
        title: 'Partner Program — 30% recurring revenue share',
        description:
            'Earn 30% recurring revenue share for 12 months on every paying customer you refer to Tahoe. No earnings cap, monthly Stripe payouts, and a real partner manager. Free to join.',
        ogDescription:
            'Refer recruiters to Tahoe and earn 30% recurring for 12 months. No cap, monthly Stripe payouts, co-marketing assets, and a named partner manager.',
    },
    ko: {
        title: '파트너 프로그램 — 30% 반복 수익 셰어',
        description:
            'Tahoe에 소개한 모든 유료 고객에 대해 12개월 동안 30% 반복 수익 셰어를 받으세요. 수익 상한 없음, 매월 Stripe 정산, 그리고 진짜 파트너 매니저. 가입은 무료입니다.',
        ogDescription:
            '리크루터를 Tahoe에 소개하고 12개월 동안 30%를 반복으로 받으세요. 상한 없음, 매월 Stripe 정산, 공동 마케팅 자료, 전담 파트너 매니저.',
    },
} as const;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const m = META[locale];
    return {
        title: m.title,
        description: m.description,
        alternates: buildAlternates(locale, '/partner'),
        openGraph: {
            title: `${m.title} | Tahoe AI`,
            description: m.ogDescription,
            url: `/${locale}/partner`,
            siteName: 'Tahoe AI',
            images: OG_IMAGES,
            type: 'website',
            ...buildOgLocale(locale),
        },
    };
}

export default async function PartnerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const faqs = partnerT[locale].faqs.map((f) => ({ q: f.question, a: f.answer }));
    return (
        <>
            <JsonLd data={faqLd(faqs)} />
            {children}
        </>
    );
}
