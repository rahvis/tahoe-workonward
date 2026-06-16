'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import * as CookieConsent from 'vanilla-cookieconsent';
import { buildCookieConsentConfig, isCookieConsentPublicPath } from '@/lib/cookie-consent';

export default function PublicCookieConsent() {
    const pathname = usePathname();
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        if (!pathname) {
            return;
        }

        if (!isCookieConsentPublicPath(pathname)) {
            if (hasInitializedRef.current) {
                CookieConsent.hide();
                CookieConsent.hidePreferences();
            }
            return;
        }

        if (hasInitializedRef.current) {
            return;
        }

        hasInitializedRef.current = true;
        const locale = pathname.split('/')[1] === 'ko' ? 'ko' : 'en';
        void CookieConsent.run(buildCookieConsentConfig(locale));
    }, [pathname]);

    return null;
}
