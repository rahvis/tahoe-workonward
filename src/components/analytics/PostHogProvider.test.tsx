import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import posthog from 'posthog-js';
import PostHogProvider from './PostHogProvider';

vi.mock('posthog-js', () => ({ __esModule: true, default: { init: vi.fn() } }));
vi.mock('posthog-js/react', () => ({
    __esModule: true,
    PostHogProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const mockedInit = vi.mocked(posthog.init);

test('initializes PostHog once with the project token + host and renders children', async () => {
    const { rerender } = render(
        <PostHogProvider>
            <div>child content</div>
        </PostHogProvider>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();

    await waitFor(() => {
        expect(mockedInit).toHaveBeenCalledWith(
            'phc_r53U6SoKpxMwjXRkgf82nTxVFz2SmnMghTYrFcyBzxjm',
            expect.objectContaining({ api_host: 'https://us.i.posthog.com', defaults: '2026-05-30' }),
        );
    });

    // Re-render / re-mount must not re-initialize.
    rerender(
        <PostHogProvider>
            <div>child content</div>
        </PostHogProvider>,
    );
    render(
        <PostHogProvider>
            <div>another</div>
        </PostHogProvider>,
    );

    expect(mockedInit).toHaveBeenCalledTimes(1);
});
