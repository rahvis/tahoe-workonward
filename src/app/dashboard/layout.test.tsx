import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DashboardLayout from './layout';
import {
    apiRequest,
    disableGoogleAutoSelect,
    isLoggedIn,
    removeToken,
} from '@/lib/api';

const pushMock = vi.fn();
let currentPathname = '/dashboard/search';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn() }),
    usePathname: () => currentPathname,
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api', () => ({
    apiRequest: vi.fn(),
    disableGoogleAutoSelect: vi.fn(),
    isLoggedIn: vi.fn(),
    removeToken: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);
const mockedDisableGoogleAutoSelect = vi.mocked(disableGoogleAutoSelect);
const mockedIsLoggedIn = vi.mocked(isLoggedIn);
const mockedRemoveToken = vi.mocked(removeToken);

beforeEach(() => {
    currentPathname = '/dashboard/search';
    pushMock.mockReset();
    mockedApiRequest.mockReset();
    mockedDisableGoogleAutoSelect.mockReset();
    mockedIsLoggedIn.mockReset();
    mockedRemoveToken.mockReset();
    mockedIsLoggedIn.mockReturnValue(true);
    mockedApiRequest.mockResolvedValue({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
    });
});

function getLinkByHref(href: string) {
    const link = screen.getAllByRole('link').find((candidate) => candidate.getAttribute('href') === href);
    expect(link).toBeTruthy();
    return link as HTMLAnchorElement;
}

test('logout clears auth state, disables Google auto select, and redirects to the landing page', async () => {
    const originalLocation = window.location;
    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
            ...originalLocation,
            set href(value: string) {
                hrefSetter(value);
            },
        },
    });

    try {
        const user = userEvent.setup();
        render(
            <DashboardLayout>
                <div>Dashboard Content</div>
            </DashboardLayout>,
        );

        const logoutButton = await screen.findByRole('button', { name: /log out/i });
        await user.click(logoutButton);

        await waitFor(() => {
            expect(mockedDisableGoogleAutoSelect).toHaveBeenCalledTimes(1);
            expect(mockedRemoveToken).toHaveBeenCalledTimes(1);
            expect(hrefSetter).toHaveBeenCalledWith('https://tahoe.workonward.com');
        });
    } finally {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation,
        });
    }
});

test('keeps the section-root subnav item highlighted on nested detail pages', async () => {
    currentPathname = '/dashboard/projects/project-123';
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    await screen.findByText('Dashboard Content');
    // "All Projects" owns project detail pages; "Lists" should not steal the highlight.
    expect(getLinkByHref('/dashboard/projects')).toHaveAttribute('aria-current', 'page');
    expect(getLinkByHref('/dashboard/projects/lists')).not.toHaveAttribute('aria-current');
});

test('marks the active primary nav item with aria-current for assistive tech', async () => {
    currentPathname = '/dashboard/mailboxes';
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    await screen.findByText('Dashboard Content');
    const sidebar = screen.getByRole('navigation', { name: /primary dashboard navigation/i });
    expect(within(sidebar).getByRole('link', { name: /mailboxes/i })).toHaveAttribute('aria-current', 'page');
    expect(within(sidebar).getByRole('link', { name: /billing/i })).not.toHaveAttribute('aria-current');
});

test('dashboard nav links mailboxes directly without nested mailbox subnav', async () => {
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    await screen.findByText('Dashboard Content');
    expect(getLinkByHref('/dashboard/mailboxes')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /connected mailboxes/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /send health/i })).not.toBeInTheDocument();
});

test('dashboard search nav hides saved searches', async () => {
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    expect(await screen.findByRole('link', { name: /new search/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /saved candidates/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /saved searches/i })).not.toBeInTheDocument();
});

test('dashboard nav links outreach directly without campaigns or replies subnav', async () => {
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    await screen.findByText('Dashboard Content');
    expect(getLinkByHref('/dashboard/outreach/campaigns')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^campaigns$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^replies$/i })).not.toBeInTheDocument();
});

test('dashboard nav keeps projects subnav limited to all projects and lists', async () => {
    const user = userEvent.setup();
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    const projectsButton = await screen.findByRole('button', { name: /projects/i });
    await user.click(projectsButton);

    expect(await screen.findByRole('link', { name: /all projects/i })).toHaveAttribute('href', '/dashboard/projects');
    expect(screen.getByRole('link', { name: /^lists$/i })).toHaveAttribute('href', '/dashboard/projects/lists');
    expect(screen.queryByRole('link', { name: /^archived$/i })).not.toBeInTheDocument();
});

test('dashboard nav keeps mailboxes below outreach with distinct icons', async () => {
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    await screen.findByText('Dashboard Content');
    const outreachLink = getLinkByHref('/dashboard/outreach/campaigns');
    const mailboxesLink = getLinkByHref('/dashboard/mailboxes');
    const outreachIcon = outreachLink.querySelector('svg')?.innerHTML;
    const mailboxesIcon = mailboxesLink.querySelector('svg')?.innerHTML;

    expect(outreachLink.compareDocumentPosition(mailboxesLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(outreachIcon).toBeTruthy();
    expect(mailboxesIcon).toBeTruthy();
    expect(outreachIcon).not.toEqual(mailboxesIcon);
});

test('links Analytics and Billing directly to their landing pages without subnav', async () => {
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    const sidebar = await screen.findByRole('navigation', { name: /primary dashboard navigation/i });

    // Analytics is a direct link to the overview — no expandable subnav.
    expect(within(sidebar).getByRole('link', { name: /analytics/i })).toHaveAttribute(
        'href',
        '/dashboard/analytics/overview',
    );
    expect(within(sidebar).queryByRole('button', { name: /analytics/i })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole('link', { name: /^overview$/i })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole('link', { name: /funnel/i })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole('link', { name: /campaign performance/i })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole('link', { name: /credit spend/i })).not.toBeInTheDocument();

    // Billing is a direct link to Plan & Credits — no expandable subnav.
    expect(within(sidebar).getByRole('link', { name: /billing/i })).toHaveAttribute(
        'href',
        '/dashboard/billing/plan',
    );
    expect(within(sidebar).queryByRole('button', { name: /billing/i })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole('link', { name: /plan & credits/i })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole('link', { name: /credit ledger/i })).not.toBeInTheDocument();
});
