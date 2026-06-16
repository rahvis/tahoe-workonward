import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ResetPasswordPage from './page';
import { apiRequest } from '@/lib/api';

let currentSearchParams = new URLSearchParams('token=reset-token-abc');

vi.mock('next/navigation', () => ({
    useSearchParams: () => currentSearchParams,
}));

vi.mock('@/lib/api', () => ({
    apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

beforeEach(() => {
    mockedApiRequest.mockReset();
    currentSearchParams = new URLSearchParams('token=reset-token-abc');
});

test('submits the token and new password, then shows success', async () => {
    const user = userEvent.setup();
    mockedApiRequest.mockResolvedValue({ message: 'Password reset successfully' });

    render(<ResetPasswordPage />);

    await user.type(screen.getByPlaceholderText('At least 12 characters'), 'super-secret-pw');
    await user.type(screen.getByPlaceholderText('Re-enter your new password'), 'super-secret-pw');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith('/auth/reset-password', {
            method: 'POST',
            body: { token: 'reset-token-abc', new_password: 'super-secret-pw' },
        });
    });

    expect(screen.getByText(/your password has been reset/i)).toBeInTheDocument();
});

test('blocks submit when the passwords do not match', async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(screen.getByPlaceholderText('At least 12 characters'), 'super-secret-pw');
    await user.type(screen.getByPlaceholderText('Re-enter your new password'), 'different-pw-12');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(mockedApiRequest).not.toHaveBeenCalled();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
});

test('shows an invalid-link state and skips the API when the token is missing', () => {
    currentSearchParams = new URLSearchParams();

    render(<ResetPasswordPage />);

    expect(screen.getByText(/this reset link is invalid or incomplete/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('At least 12 characters')).not.toBeInTheDocument();
    expect(mockedApiRequest).not.toHaveBeenCalled();
});
