export const PUBLIC_COOKIE_CONSENT_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/privacy",
  "/terms",
  "/cookie",
]);

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function isCookieConsentPublicPath(pathname: string): boolean {
  return PUBLIC_COOKIE_CONSENT_PATHS.has(normalizePathname(pathname));
}

export function buildCookieConsentConfig() {
  return {
    mode: "opt-in" as const,
    hideFromBots: true,
    disablePageInteraction: false,
    cookie: {
      name: "tahoe_cookie_consent",
      sameSite: "Lax" as const,
      path: "/",
      expiresAfterDays: 182,
    },
    guiOptions: {
      consentModal: {
        layout: "cloud inline" as const,
        position: "bottom center" as const,
        equalWeightButtons: true,
        flipButtons: false,
      },
      preferencesModal: {
        layout: "box" as const,
        equalWeightButtons: false,
        flipButtons: false,
      },
    },
    categories: {
      necessary: {
        enabled: true,
        readOnly: true,
      },
      analytics: {
        enabled: true,
        readOnly: false,
      },
    },
    language: {
      default: "en",
      translations: {
        en: {
          consentModal: {
            title: "Tahoe uses cookies and browser storage",
            description:
              "Tahoe uses essential browser technologies to keep the site secure, support Google sign-in and anti-abuse flows, preserve necessary product state, and, if you allow it, measure how the landing page is used.",
            acceptNecessaryBtn: "Accept",
            showPreferencesBtn: "Settings",
            footer:
              '<a href="/cookie">Cookie</a><a href="/privacy">Privacy</a>',
          },
          preferencesModal: {
            title: "Cookie settings",
            savePreferencesBtn: "Save settings",
            closeIconLabel: "Close cookie settings",
            sections: [
              {
                title: "Tahoe’s current browser-technology use",
                description:
                  "Tahoe uses essential browser technologies on public pages to support account access, Google identity flows, human-verification safeguards, and the browser state needed for core site functionality. If you turn analytics on, Tahoe also uses Google Analytics on its landing page to understand visits and engagement with marketing content.",
              },
              {
                title: "Strictly necessary",
                description:
                  "These technologies are required for Tahoe to operate securely and correctly. They cannot be turned off from this panel.",
                linkedCategory: "necessary",
              },
              {
                title: "Performance analytics",
                description:
                  "If you enable this category, Tahoe can use Google Analytics on its landing page to measure visits, scroll depth, section navigation, social-link clicks, and sign-in or trial-intent clicks. This category is optional.",
                linkedCategory: "analytics",
              },
              {
                title: "What Tahoe currently uses",
                description:
                  "<ul><li>Authentication token storage for signed-in product access</li><li>Session-based recruiter workflow state, such as saved-search restart context</li><li>Google identity and sign-in support where you choose to use it</li><li>Anti-abuse and security tooling for login, signup, and recovery flows</li><li>Optional Google Analytics measurement on the public landing page if you enable analytics</li></ul>",
              },
              {
                title: "Browser controls and more information",
                description:
                  'You can clear cookies or browser storage in your browser settings. For more detail, see Tahoe’s <a href="/cookie">Cookie Policy</a> and <a href="/privacy">Privacy Policy</a>.',
              },
            ],
          },
        },
      },
    },
  };
}
