import type * as React from "react";

export {};

declare global {
    interface GoogleCredentialResponse {
        credential: string;
        select_by?: string;
    }

    interface GoogleIdConfiguration {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void | Promise<void>;
        cancel_on_tap_outside?: boolean;
        context?: "signin" | "signup";
        use_fedcm_for_prompt?: boolean;
    }

    interface GoogleAccountsId {
        initialize(config: GoogleIdConfiguration): void;
        renderButton(element: HTMLElement, options: Record<string, unknown>): void;
        prompt(): void;
        cancel(): void;
        disableAutoSelect(): void;
    }

    interface Window {
        google?: {
            accounts: {
                id: GoogleAccountsId;
            };
        };
    }

    type AltchaWidgetElement = HTMLElement & {
        verify(): void;
        reset(state?: string, error?: string): void;
        getState(): string;
        show(): void;
        hide(): void;
    };

    namespace JSX {
        interface IntrinsicElements {
            "altcha-widget": React.DetailedHTMLProps<
                React.HTMLAttributes<AltchaWidgetElement>,
                AltchaWidgetElement
            > & {
                auto?: string;
                challengeurl?: string;
                delay?: string | number;
                floating?: string | boolean;
                floatingpersist?: string | boolean;
                hidefooter?: string | boolean;
                hidelogo?: string | boolean;
                id?: string;
                name?: string;
                refetchonexpire?: string | boolean;
            };
        }
    }
}
