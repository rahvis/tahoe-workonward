import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ForgotPasswordPage from './page';
import { apiRequest } from '@/lib/api';

vi.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: () => null,
    }),
}));

vi.mock('@/lib/api', () => ({
    apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

beforeEach(() => {
    mockedApiRequest.mockReset();
});

test('submits forgot-password request', async () => {
    const user = userEvent.setup();
    mockedApiRequest.mockResolvedValue({ message: 'ok' });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith('/auth/forgot-password', {
            method: 'POST',
            body: {
                email: 'user@example.com',
            },
        });
        expect(screen.getByText(/Password reset link sent/i)).toBeInTheDocument();
    });
});
