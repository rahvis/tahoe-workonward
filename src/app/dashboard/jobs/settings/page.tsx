import { redirect } from 'next/navigation';

// Jobs Settings has been merged into the Organization page (career-page).
// Kept as a redirect so existing bookmarks/deep links still resolve.
export default function JobsSettingsRedirect() {
    redirect('/dashboard/jobs/career-page');
}
