'use client';
import { useEffect } from 'react';

// The single root layout renders <html lang="en"> for the whole app (marketing,
// auth, and the English-only dashboard share it). For localized routes this
// corrects document.documentElement.lang on the client. hreflang + og:locale +
// the /ko URL are the authoritative signals for crawlers; this is the a11y/JS
// complement.
export default function HtmlLangSync({ lang }: { lang: string }) {
    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);
    return null;
}
