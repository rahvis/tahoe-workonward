import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, isLocale } from '@/i18n/config';

// Paths that must NEVER be locale-prefixed (the authenticated app, the API, and
// the dynamic OG image route). Everything else public (marketing, legal, auth)
// is redirected to /{locale}/... The matcher already drops _next, files with an
// extension (sitemap.xml, robots.txt, llms.txt, manifest.webmanifest, images),
// and /api.
const SKIP_PREFIXES = ['/dashboard', '/api', '/og', '/dsl', '/logs'];

function pathHasLocale(pathname: string): boolean {
    const first = pathname.split('/')[1];
    return isLocale(first);
}

function detectLocale(req: NextRequest): string {
    const cookie = req.cookies.get('NEXT_LOCALE')?.value;
    if (isLocale(cookie)) return cookie;
    const accept = (req.headers.get('accept-language') || '').toLowerCase();
    for (const part of accept.split(',')) {
        const code = part.split(';')[0].trim();
        if (code === 'ko' || code.startsWith('ko-')) return 'ko';
        if (code === 'en' || code.startsWith('en-')) return 'en';
    }
    return defaultLocale;
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        return NextResponse.next();
    }
    if (pathHasLocale(pathname)) {
        return NextResponse.next();
    }

    // Redirect an unprefixed public path to its localized URL, preserving the
    // query string (so emailed /reset-password?token=… and /verify-email?token=…
    // links keep working with no backend change).
    const locale = detectLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    const res = NextResponse.redirect(url);
    res.cookies.set('NEXT_LOCALE', locale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
    });
    return res;
}

export const config = {
    // Run on everything except Next internals, the API, and any path containing a
    // dot (static files, sitemap.xml, robots.txt, llms.txt, manifest, images).
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
