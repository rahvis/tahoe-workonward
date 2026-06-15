import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ForgotPasswordPage from './page';
import { apiRequest } from '@/lib/api';

vi.mock('@/lib/api', () => ({
    apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

beforeEach(() => {
    mockedApiRequest.mockReset();
});

test('submits the normalized email and shows the generic confirmation', async () => {
    const user = userEvent.setup();
    mockedApiRequest.mockResolvedValue({ message: 'ok' });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'User@Example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith('/auth/forgot-password', {
            method: 'POST',
            body: { email: 'user@example.com' },
        });
    });

    expect(screen.getByText(/a reset link is on its way/i)).toBeInTheDocument();
    // Google-only users are guided without leaking whether the email exists.
    expect(screen.getByText(/don't have a password to reset/i)).toBeInTheDocument();
});

test('does not call the API when the email is empty', async () => {
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(mockedApiRequest).not.toHaveBeenCalled();
    expect(screen.getByText('Please enter your email address.')).toBeInTheDocument();
});
