import { redirect } from 'next/navigation';
import { isLocale } from '@/i18n/config';

export default async function BlogRedirectPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const locale = isLocale(lang) ? lang : 'en';
    redirect(`/${locale}/blogs`);
}
