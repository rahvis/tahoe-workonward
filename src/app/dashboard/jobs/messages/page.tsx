'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import JobsBreadcrumb from '../_components/JobsBreadcrumb';
import MessageComposer from '../_components/MessageComposer';
import shared from '../_components/jobs-shared.module.css';

function MessagesInner() {
    const params = useSearchParams();
    const candidateId = params.get('candidate_id') ?? '';
    const applicationId = params.get('application_id') ?? undefined;
    const jobId = params.get('job_id') ?? undefined;
    const email = params.get('email') ?? '';
    const name = params.get('name') ?? '';

    if (!candidateId) {
        return (
            <div className={shared.page}>
                <JobsBreadcrumb items={[{ label: 'Messages' }]} />
                <div className={shared.empty}>Open a candidate from the pipeline and use the <strong>Email</strong> tab to message them.</div>
            </div>
        );
    }

    return (
        <div className={shared.page}>
            <JobsBreadcrumb items={[{ label: 'Messages' }, { label: name || email || 'Candidate' }]} />
            <p className={shared.subtle}>{email}</p>
            <MessageComposer candidateId={candidateId} applicationId={applicationId} jobId={jobId} />
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className={shared.page}><div className={shared.empty}>Loading…</div></div>}>
            <MessagesInner />
        </Suspense>
    );
}
