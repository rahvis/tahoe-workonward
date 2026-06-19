import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import JobPostedModal from './JobPostedModal';

function renderModal(overrides: Partial<Parameters<typeof JobPostedModal>[0]> = {}) {
    const onFindCandidates = vi.fn();
    const onClose = vi.fn();
    render(
        <JobPostedModal
            open
            jobTitle="Senior Backend Engineer"
            publicUrl="https://tahoe.workonward.com/jobs/senior-backend-7f3a"
            finding={false}
            onFindCandidates={onFindCandidates}
            onClose={onClose}
            {...overrides}
        />,
    );
    return { onFindCandidates, onClose };
}

test('shows the live job and a working "View the posted job" link', () => {
    renderModal();
    expect(screen.getByText('Your job is live')).toBeInTheDocument();
    expect(screen.getByText(/Senior Backend Engineer/)).toBeInTheDocument();
    const view = screen.getByRole('link', { name: /View the posted job/i });
    expect(view).toHaveAttribute('href', 'https://tahoe.workonward.com/jobs/senior-backend-7f3a');
    expect(view).toHaveAttribute('target', '_blank');
});

test('"Find me candidates" and "Maybe later" fire their callbacks', () => {
    const { onFindCandidates, onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Find me candidates' }));
    expect(onFindCandidates).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Maybe later' }));
    expect(onClose).toHaveBeenCalledTimes(1);
});

test('while finding, the primary button shows progress and is disabled', () => {
    renderModal({ finding: true });
    const cta = screen.getByRole('button', { name: /Building your search/i });
    expect(cta).toBeDisabled();
});
