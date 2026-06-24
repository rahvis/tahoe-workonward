'use client';

// Microsoft Entra redirect URI target (registered as the SPA redirect in Azure:
// https://tahoe.workonward.com/auth/microsoft/callback). This route is NON-localized
// on purpose — middleware skips `/auth/*` so the auth response fragment is not lost
// to a locale redirect. With the MSAL popup flow this page loads inside the popup;
// MSAL processes the response and the popup closes itself. The redirect-flow path
// is handled by handleRedirectPromise() below as a fallback.
import { useEffect } from 'react';
import { getMsalInstance } from '@/lib/msal';

export default function MicrosoftCallbackPage() {
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const msal = await getMsalInstance();
                if (!msal) {
                    return;
                }
                const result = await msal.handleRedirectPromise();
                // Only the full-page redirect flow lands here with a result; the
                // popup flow resolves in the opener window instead.
                if (!cancelled && result && window.opener == null) {
                    window.location.replace('/dashboard');
                }
            } catch {
                // Swallow — the opener window surfaces any real error to the user.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main
            style={{
                display: 'flex',
                minHeight: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'system-ui, sans-serif',
                color: '#444',
            }}
        >
            <p>Completing Microsoft sign-in…</p>
        </main>
    );
}
