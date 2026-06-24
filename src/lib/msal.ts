// Lazily-initialized MSAL (Microsoft Entra) browser client. Mirrors the role of
// the Google Identity script for the Microsoft sign-in button: it produces an ID
// token client-side that the backend (`POST /auth/microsoft`) verifies and
// exchanges for a Tahoe session token.
import {
    PublicClientApplication,
    type Configuration,
} from '@azure/msal-browser';

export const MICROSOFT_SCOPES = ['openid', 'profile', 'email', 'User.Read'];

const CLIENT_ID = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
const AUTHORITY =
    process.env.NEXT_PUBLIC_MICROSOFT_AUTHORITY ||
    'https://login.microsoftonline.com/common';

export function isMicrosoftConfigured(): boolean {
    return Boolean(CLIENT_ID);
}

let instance: PublicClientApplication | null = null;
let initPromise: Promise<PublicClientApplication> | null = null;

/**
 * Returns an initialized MSAL instance (singleton), or `null` when Microsoft
 * sign-in is not configured / not running in the browser. MSAL v5 requires
 * `initialize()` to resolve before any other call, so callers must await this.
 */
export async function getMsalInstance(): Promise<PublicClientApplication | null> {
    if (!CLIENT_ID || typeof window === 'undefined') {
        return null;
    }
    if (instance) {
        return instance;
    }
    if (!initPromise) {
        const config: Configuration = {
            auth: {
                clientId: CLIENT_ID,
                authority: AUTHORITY,
                redirectUri:
                    process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI ||
                    `${window.location.origin}/auth/microsoft/callback`,
            },
            cache: { cacheLocation: 'sessionStorage' },
        };
        const pca = new PublicClientApplication(config);
        initPromise = pca.initialize().then(() => {
            instance = pca;
            return pca;
        });
    }
    return initPromise;
}
