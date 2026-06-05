import { redirect } from 'next/navigation';

type LegacyBlogPostRedirectProps = {
    params: Promise<{ slug: string }>;
};

export default async function LegacyBlogPostRedirect({ params }: LegacyBlogPostRedirectProps) {
    const { slug } = await params;
    redirect(`/blogs/${slug}`);
}
