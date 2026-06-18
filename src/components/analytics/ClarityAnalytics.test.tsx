import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Clarity from '@microsoft/clarity';
import ClarityAnalytics from './ClarityAnalytics';

vi.mock('@microsoft/clarity', () => ({
    __esModule: true,
    default: { init: vi.fn() },
}));

const mockedInit = vi.mocked(Clarity.init);

test('initializes Clarity once with the project id, and never double-inits on re-render', async () => {
    const { rerender } = render(<ClarityAnalytics />);

    await waitFor(() => {
        expect(mockedInit).toHaveBeenCalledWith('x94q9pnbrh');
    });

    // Re-render (and StrictMode double-invoke) must not initialize Clarity again.
    rerender(<ClarityAnalytics />);
    render(<ClarityAnalytics />);

    expect(mockedInit).toHaveBeenCalledTimes(1);
});
