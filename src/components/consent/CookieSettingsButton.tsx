'use client';

import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';

type CookieSettingsButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function CookieSettingsButton({
    children = 'Cookie settings',
    onClick,
    type = 'button',
    ...props
}: CookieSettingsButtonProps) {
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);

        if (event.defaultPrevented) {
            return;
        }

        try {
            CookieConsent.showPreferences();
        } catch {
            // Ignore early clicks before the public consent initializer runs.
        }
    };

    return (
        <button
            type={type}
            data-cc="show-preferencesModal"
            {...props}
            onClick={handleClick}
        >
            {children}
        </button>
    );
}
