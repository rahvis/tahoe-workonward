import { redirect } from 'next/navigation';
import { isLocale } from '@/i18n/config';

type LegacyBlogPostRedirectProps = {
    params: Promise<{ slug: string; lang: string }>;
};

export default async function LegacyBlogPostRedirect({ params }: LegacyBlogPostRedirectProps) {
    const { slug, lang } = await params;
    const locale = isLocale(lang) ? lang : 'en';
    redirect(`/${locale}/blogs/${slug}`);
}
