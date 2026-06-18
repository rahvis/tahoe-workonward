import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SignupPage from './page';
import { apiRequest } from '@/lib/api';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock }),
    usePathname: () => '/en/signup',
}));

vi.mock('@/lib/api', () => ({
    apiRequest: vi.fn(),
}));

vi.mock('@/components/auth/GoogleAuthSection', () => ({
    __esModule: true,
    default: () => <div data-testid="google-auth-section" />,
}));

const mockedApiRequest = vi.mocked(apiRequest);

beforeEach(() => {
    pushMock.mockReset();
    mockedApiRequest.mockReset();
});

test('submits signup and shows verification message', async () => {
    const user = userEvent.setup();
    mockedApiRequest.mockResolvedValue({ is_verified: false });

    render(<SignupPage />);

    await user.type(screen.getByPlaceholderText('John'), 'Tina');
    await user.type(screen.getByPlaceholderText('Doe'), 'Ng');
    await user.type(screen.getByPlaceholderText('you@company.com'), 'tina@acme.com');
    await user.type(screen.getByPlaceholderText('At least 12 characters'), 'super-secret');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'super-secret');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith('/auth/signup', {
            method: 'POST',
            body: {
                first_name: 'Tina',
                last_name: 'Ng',
                email: 'tina@acme.com',
                password: 'super-secret',
                confirm_password: 'super-secret',
                accepted_terms: true,
            },
        });
        expect(
            screen.getByText(/Check your email to verify your account/i),
        ).toBeInTheDocument();
    });
});

test('Create Account stays disabled until the terms checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    const submit = screen.getByRole('button', { name: 'Create Account' });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('checkbox'));
    expect(submit).toBeEnabled();
});

test('shows an inline error and blocks submit for a free email domain', async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByPlaceholderText('you@company.com'), 'tina@gmail.com');
    await user.click(screen.getByRole('checkbox'));

    expect(
        screen.getByText('Personal email providers aren’t allowed — please use your business email.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeDisabled();
    expect(mockedApiRequest).not.toHaveBeenCalled();
});
