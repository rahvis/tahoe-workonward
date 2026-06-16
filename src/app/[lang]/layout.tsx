import { notFound } from 'next/navigation';
import { locales, isLocale } from '@/i18n/config';
import HtmlLangSync from '@/components/i18n/HtmlLangSync';

// Statically render both locales.
export function generateStaticParams() {
    return locales.map((lang) => ({ lang }));
}

export default async function LangLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!isLocale(lang)) {
        notFound();
    }
    return (
        <>
            <HtmlLangSync lang={lang} />
            {children}
        </>
    );
}
