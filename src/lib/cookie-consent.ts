export const PUBLIC_COOKIE_CONSENT_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/verify-email",
  "/privacy",
  "/terms",
  "/cookie",
]);

// Strip a leading /en or /ko locale segment so the public-path check works on the
// localized routes (e.g. /ko/privacy -> /privacy).
function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|ko)(\/.*)?$/);
  if (match) {
    return match[2] || "/";
  }
  return pathname;
}

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function isCookieConsentPublicPath(pathname: string): boolean {
  return PUBLIC_COOKIE_CONSENT_PATHS.has(normalizePathname(stripLocale(pathname)));
}

type ConsentLocale = "en" | "ko";

export function buildCookieConsentConfig(locale: ConsentLocale = "en") {
  const link = (path: string) => `/${locale}${path}`;
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
      default: locale,
      translations: {
        en: {
          consentModal: {
            title: "Tahoe uses cookies and browser storage",
            description:
              "Tahoe uses essential browser technologies to keep the site secure, support Google sign-in and anti-abuse flows, preserve necessary product state, and, if you allow it, measure how the landing page is used.",
            acceptNecessaryBtn: "Accept",
            showPreferencesBtn: "Settings",
            footer: `<a href="${link("/cookie")}">Cookie</a><a href="${link("/privacy")}">Privacy</a>`,
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
                  "<ul><li>Authentication token storage for signed-in product access</li><li>Session-based recruiter workflow state, such as saved-search restart context</li><li>Google identity and sign-in support where you choose to use it</li><li>Anti-abuse and security tooling for login, signup, and verification flows</li><li>Optional Google Analytics measurement on the public landing page if you enable analytics</li></ul>",
              },
              {
                title: "Browser controls and more information",
                description: `You can clear cookies or browser storage in your browser settings. For more detail, see Tahoe’s <a href="${link("/cookie")}">Cookie Policy</a> and <a href="${link("/privacy")}">Privacy Policy</a>.`,
              },
            ],
          },
        },
        ko: {
          consentModal: {
            title: "Tahoe는 쿠키와 브라우저 저장소를 사용합니다",
            description:
              "Tahoe는 사이트를 안전하게 유지하고, Google 로그인과 오용 방지 흐름을 지원하고, 필요한 제품 상태를 보존하며, 동의하시는 경우 랜딩 페이지 이용 현황을 측정하기 위해 필수 브라우저 기술을 사용합니다.",
            acceptNecessaryBtn: "동의",
            showPreferencesBtn: "설정",
            footer: `<a href="${link("/cookie")}">쿠키</a><a href="${link("/privacy")}">개인정보</a>`,
          },
          preferencesModal: {
            title: "쿠키 설정",
            savePreferencesBtn: "설정 저장",
            closeIconLabel: "쿠키 설정 닫기",
            sections: [
              {
                title: "Tahoe의 현재 브라우저 기술 사용",
                description:
                  "Tahoe는 공개 페이지에서 계정 접근, Google 인증 흐름, 사람 확인 보호 장치, 핵심 사이트 기능에 필요한 브라우저 상태를 지원하기 위해 필수 브라우저 기술을 사용합니다. 분석을 켜시면 Tahoe는 랜딩 페이지에서 Google Analytics를 사용해 방문과 마케팅 콘텐츠에 대한 참여를 파악합니다.",
              },
              {
                title: "필수 항목",
                description:
                  "이 기술들은 Tahoe가 안전하고 올바르게 작동하는 데 필요합니다. 이 패널에서 끌 수 없습니다.",
                linkedCategory: "necessary",
              },
              {
                title: "성능 분석",
                description:
                  "이 카테고리를 활성화하면 Tahoe는 랜딩 페이지에서 Google Analytics를 사용해 방문, 스크롤 깊이, 섹션 이동, 소셜 링크 클릭, 로그인 또는 체험 의도 클릭을 측정할 수 있습니다. 이 카테고리는 선택 사항입니다.",
                linkedCategory: "analytics",
              },
              {
                title: "Tahoe가 현재 사용하는 항목",
                description:
                  "<ul><li>로그인한 제품 접근을 위한 인증 토큰 저장</li><li>저장된 검색 재시작 맥락 등 세션 기반 채용 워크플로 상태</li><li>사용을 선택하신 경우 Google 인증 및 로그인 지원</li><li>로그인, 회원가입, 인증 흐름을 위한 오용 방지 및 보안 도구</li><li>분석을 활성화한 경우 공개 랜딩 페이지에서의 선택적 Google Analytics 측정</li></ul>",
              },
              {
                title: "브라우저 제어 및 추가 정보",
                description: `브라우저 설정에서 쿠키나 브라우저 저장소를 지울 수 있습니다. 자세한 내용은 Tahoe의 <a href="${link("/cookie")}">쿠키 정책</a>과 <a href="${link("/privacy")}">개인정보 처리방침</a>을 참고하세요.`,
              },
            ],
          },
        },
      },
    },
  };
}
