import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { TimezonePicker } from './timezone-picker';

describe('TimezonePicker', () => {
    test('selecting a searched zone calls onChange with the IANA id', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<TimezonePicker value="America/Los_Angeles" onChange={onChange} />);

        const input = screen.getByRole('combobox');
        await user.click(input);
        await user.clear(input);
        await user.type(input, 'tokyo');

        const option = await screen.findByRole('option', { name: /Asia\/Tokyo/ });
        await user.click(option);

        expect(onChange).toHaveBeenCalledWith('Asia/Tokyo');
    });

    test('keyboard Enter selects the active match', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<TimezonePicker value="America/Los_Angeles" onChange={onChange} />);

        const input = screen.getByRole('combobox');
        await user.click(input);
        await user.clear(input);
        await user.type(input, 'tokyo{Enter}');

        expect(onChange).toHaveBeenCalledWith('Asia/Tokyo');
    });

    test('reverts uncommitted text to the stored value on blur', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<TimezonePicker value="America/Los_Angeles" onChange={onChange} />);

        const input = screen.getByRole('combobox') as HTMLInputElement;
        await user.click(input);
        await user.clear(input);
        await user.type(input, 'zzznotazone');
        await user.tab();

        await waitFor(() => expect(input.value).toBe('America/Los_Angeles'));
        expect(onChange).not.toHaveBeenCalled();
    });

    test('flags an unrecognized stored value', () => {
        render(<TimezonePicker value="Mars/Phobos" onChange={() => undefined} />);
        expect(screen.getByText(/not a recognized timezone/i)).toBeInTheDocument();
    });

    test('accepts a valid stored value without a warning', () => {
        render(<TimezonePicker value="America/Los_Angeles" onChange={() => undefined} />);
        expect(screen.queryByText(/not a recognized timezone/i)).not.toBeInTheDocument();
    });
});
