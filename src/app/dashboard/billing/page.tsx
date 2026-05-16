import { redirect } from 'next/navigation';

export default function BillingIndexPage() {
    redirect('/dashboard/billing/plan');
}

