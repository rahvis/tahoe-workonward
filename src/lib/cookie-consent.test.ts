import { buildCookieConsentConfig, isCookieConsentPublicPath } from './cookie-consent';

test('only public marketing, auth, and legal routes use the public consent manager', () => {
    expect(isCookieConsentPublicPath('/')).toBe(true);
    expect(isCookieConsentPublicPath('/login')).toBe(true);
    expect(isCookieConsentPublicPath('/privacy')).toBe(true);
    expect(isCookieConsentPublicPath('/dashboard/search/new')).toBe(false);
});

test('cookie consent config includes optional analytics controls for public pages', () => {
    const config = buildCookieConsentConfig();

    expect(config.cookie.name).toBe('tahoe_cookie_consent');
    expect(config.categories.necessary.readOnly).toBe(true);
    expect(config.categories.analytics.enabled).toBe(true);
    expect(
        config.language.translations.en.preferencesModal.sections.some(
            (section) => section.linkedCategory === 'analytics' && /google analytics/i.test(section.description),
        ),
    ).toBe(true);
});
