'use client';

import { Button, Dialog, Spinner } from '@/components/ui/tahoe-ui';
import styles from './job-posted-modal.module.css';

/**
 * Shown once when a recruiter publishes a job. Celebrates the live posting and nudges
 * them to proactively source: "Find me candidates" turns the job into a search query
 * and opens search pre-filled. Uses the dashboard design system (tahoe-ui), accent
 * orange primary, no emojis.
 */
export default function JobPostedModal({
    open,
    jobTitle,
    publicUrl,
    finding,
    onFindCandidates,
    onView,
    onClose,
}: {
    open: boolean;
    jobTitle: string;
    publicUrl: string;
    finding: boolean;
    onFindCandidates: () => void;
    onView?: () => void;
    onClose: () => void;
}) {
    return (
        <Dialog.Root open={open} onOpenChange={(next) => { if (!next && !finding) onClose(); }}>
            <Dialog.Content maxWidth="480px" style={{ padding: 24 }} aria-label="Your job is live">
                <Dialog.Title>Your job is live</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                    “{jobTitle}” is posted and discoverable on your job board and on Google.
                </Dialog.Description>

                {publicUrl ? (
                    <a className={styles.viewLink} href={publicUrl} target="_blank" rel="noreferrer" onClick={onView}>
                        View the posted job <span aria-hidden="true">↗</span>
                    </a>
                ) : null}

                <div className={styles.divider}><span>Don’t just wait for applicants</span></div>

                <p className={styles.pitch}>
                    While the right people apply, you can go find them too. Search 800M+ professional
                    profiles and source the perfect match for this role.
                </p>

                <div className={styles.actions}>
                    <Button
                        className={styles.findCta}
                        size="3"
                        onClick={onFindCandidates}
                        disabled={finding}
                    >
                        {finding ? <><Spinner /> Building your search…</> : 'Find me candidates'}
                    </Button>
                    <Button variant="ghost" size="3" onClick={onClose} disabled={finding}>
                        Maybe later
                    </Button>
                </div>
            </Dialog.Content>
        </Dialog.Root>
    );
}
