'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
    clearTrackedPublicPage,
    isPublicAnalyticsPath,
    syncAnalyticsConsent,
    trackPublicPageView,
} from '@/lib/public-analytics';

export default function PublicGoogleAnalytics() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname) {
            return;
        }

        if (!isPublicAnalyticsPath(pathname)) {
            clearTrackedPublicPage();
            return;
        }

        let active = true;

        const syncAndTrack = async () => {
            const granted = await syncAnalyticsConsent();

            if (active && granted) {
                trackPublicPageView(pathname);
            }
        };

        const handleConsentChange = () => {
            void syncAndTrack();
        };

        window.addEventListener('cc:onConsent', handleConsentChange as EventListener);
        window.addEventListener('cc:onChange', handleConsentChange as EventListener);

        void syncAndTrack();

        return () => {
            active = false;
            window.removeEventListener('cc:onConsent', handleConsentChange as EventListener);
            window.removeEventListener('cc:onChange', handleConsentChange as EventListener);
        };
    }, [pathname]);

    return null;
}
