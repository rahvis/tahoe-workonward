import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import GoogleAuthSection from './GoogleAuthSection';
import { apiRequest, setToken } from '@/lib/api';

vi.mock('next/script', () => ({
    __esModule: true,
    default: ({ onLoad }: { onLoad?: () => void }) => {
        onLoad?.();
        return null;
    },
}));

vi.mock('@/lib/api', () => ({
    apiRequest: vi.fn(),
    setToken: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);
const mockedSetToken = vi.mocked(setToken);

beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'google-client-id');
    mockedApiRequest.mockReset();
    mockedSetToken.mockReset();
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

test('renders the official Google button and exchanges credentials on success', async () => {
    const initializeMock = vi.fn();
    const renderButtonMock = vi.fn();
    const promptMock = vi.fn();
    const cancelMock = vi.fn();
    const onError = vi.fn();
    const onSuccess = vi.fn();

    vi.stubGlobal('google', undefined);
    Object.defineProperty(window, 'google', {
        value: {
            accounts: {
                id: {
                    initialize: initializeMock,
                    renderButton: renderButtonMock,
                    prompt: promptMock,
                    cancel: cancelMock,
                    disableAutoSelect: vi.fn(),
                },
            },
        },
        writable: true,
    });

    mockedApiRequest.mockResolvedValue({ access_token: 'jwt-token' });

    render(
        <GoogleAuthSection
            context="signin"
            onError={onError}
            onSuccess={onSuccess}
        />,
    );

    await waitFor(() => {
        expect(initializeMock).toHaveBeenCalledTimes(1);
        expect(renderButtonMock).toHaveBeenCalledTimes(1);
        expect(promptMock).toHaveBeenCalledTimes(1);
    });

    const config = initializeMock.mock.calls[0][0] as GoogleIdConfiguration;
    await config.callback({ credential: 'google-credential', select_by: 'btn' });

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith('/auth/google', {
            method: 'POST',
            body: {
                credential: 'google-credential',
                context: 'signin',
                select_by: 'btn',
                accepted_terms: false,
            },
        });
        expect(mockedSetToken).toHaveBeenCalledWith('jwt-token');
        expect(onSuccess).toHaveBeenCalled();
    });
});

test('when disabled, skips One-Tap and blocks the credential callback', async () => {
    const initializeMock = vi.fn();
    const renderButtonMock = vi.fn();
    const promptMock = vi.fn();
    const onError = vi.fn();
    const onSuccess = vi.fn();

    vi.stubGlobal('google', undefined);
    Object.defineProperty(window, 'google', {
        value: {
            accounts: {
                id: {
                    initialize: initializeMock,
                    renderButton: renderButtonMock,
                    prompt: promptMock,
                    cancel: vi.fn(),
                    disableAutoSelect: vi.fn(),
                },
            },
        },
        writable: true,
    });

    render(
        <GoogleAuthSection
            context="signup"
            onError={onError}
            onSuccess={onSuccess}
            disabled
            disabledHint="Accept the terms first."
            acceptedTerms={false}
        />,
    );

    await waitFor(() => expect(renderButtonMock).toHaveBeenCalledTimes(1));
    // One-Tap must not auto-prompt while gated.
    expect(promptMock).not.toHaveBeenCalled();

    const config = initializeMock.mock.calls[0][0] as GoogleIdConfiguration;
    await config.callback({ credential: 'google-credential', select_by: 'btn' });

    expect(onError).toHaveBeenCalledWith('Accept the terms first.');
    expect(mockedApiRequest).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
});
