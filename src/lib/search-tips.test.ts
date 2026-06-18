import { beforeEach, expect, test } from 'vitest';

import {
    SEARCH_TIP_MAX_LOGINS,
    dismissSearchTip,
    isSearchTipDismissed,
    recordLoginForSearchTip,
    shouldShowSearchTip,
} from './search-tips';

beforeEach(() => {
    window.localStorage.clear();
});

test('shows for a brand-new user before any login is recorded', () => {
    expect(shouldShowSearchTip()).toBe(true);
});

test('each login increments the counter and the tip stays for the first 5 logins', () => {
    for (let i = 1; i <= SEARCH_TIP_MAX_LOGINS; i += 1) {
        recordLoginForSearchTip();
        expect(shouldShowSearchTip()).toBe(true);
    }
});

test('auto-hides after the 5th login', () => {
    for (let i = 0; i < SEARCH_TIP_MAX_LOGINS + 1; i += 1) {
        recordLoginForSearchTip();
    }
    expect(shouldShowSearchTip()).toBe(false);
});

test('dismissing hides it immediately, even within the first 5 logins', () => {
    recordLoginForSearchTip();
    expect(shouldShowSearchTip()).toBe(true);

    dismissSearchTip();

    expect(isSearchTipDismissed()).toBe(true);
    expect(shouldShowSearchTip()).toBe(false);
});

test('a dismissal sticks across further logins', () => {
    dismissSearchTip();
    recordLoginForSearchTip();
    expect(shouldShowSearchTip()).toBe(false);
});
