import { redirect } from 'next/navigation';

export default function ArchivedProjectsRedirect() {
    redirect('/dashboard/projects');
}
