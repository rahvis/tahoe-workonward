'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button, TextField } from '@/components/ui/tahoe-ui';
import {
    createList,
    fetchProjectLists,
    type ListSummary,
} from '@/lib/organization';
import styles from '../projects.module.css';

function formatDate(value?: string | null) {
    if (!value) return 'Recent';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recent';
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function getListUpdatedAt(list: ListSummary) {
    return list.updated_at ?? list.created_at ?? '';
}

export default function ProjectDetailPage() {
    const params = useParams<{ projectId: string }>();
    const projectId = String(params.projectId);
    const [lists, setLists] = useState<ListSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newListName, setNewListName] = useState('');
    const [creatingList, setCreatingList] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setLists(await fetchProjectLists(projectId));
            setError('');
        } catch (err) {
            setLists([]);
            setError(err instanceof Error ? err.message : 'Unable to load project lists.');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void load();
    }, [load]);

    async function handleCreateList() {
        if (!newListName.trim()) return;
        setCreatingList(true);
        try {
            await createList(projectId, { name: newListName.trim() });
            setNewListName('');
            await load();
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create list.');
        } finally {
            setCreatingList(false);
        }
    }

    return (
        <section className={styles.directoryPage}>
            <header className={styles.directoryHeader}>
                <div className={styles.directoryToolbar}>
                    <TextField.Root
                        size="3"
                        rootClassName={styles.directorySearch}
                        placeholder="New list name..."
                        value={newListName}
                        onChange={(event) => setNewListName(event.target.value)}
                    />
                    <Button size="3" type="button" onClick={() => void handleCreateList()} disabled={creatingList || !newListName.trim()}>
                        {creatingList ? 'Creating...' : '+ List'}
                    </Button>
                    <Link href="/dashboard/projects" className="tahoe-button-secondary">
                        Back
                    </Link>
                </div>
            </header>

            <div className={styles.directoryMetaBar}>
                <span>{lists.length} list{lists.length === 1 ? '' : 's'}</span>
                {error ? <span className={styles.inlineError}>{error}</span> : null}
            </div>

            <div className={styles.singleDirectoryWorkspace}>
                <div className={styles.directoryTableShell}>
                    <div className={styles.directoryTableScroll}>
                        <table className={`${styles.directoryTable} ${styles.projectListTable}`}>
                            <thead>
                                <tr>
                                    <th>List</th>
                                    <th>Candidates</th>
                                    <th>Updated</th>
                                    <th>Next</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 7 }).map((_, index) => (
                                        <tr key={`project-list-skeleton-${index}`}>
                                            <td colSpan={4}>
                                                <span className={styles.skeletonLine} />
                                            </td>
                                        </tr>
                                    ))
                                ) : lists.length > 0 ? (
                                    lists.map((list) => (
                                        <tr key={list.id}>
                                            <td>
                                                <Link href={`/dashboard/projects/lists/${list.id}`} className={styles.rowNameLink}>
                                                    <span className={styles.rowName}>{list.name}</span>
                                                </Link>
                                            </td>
                                            <td>{list.candidate_count}</td>
                                            <td>{formatDate(getListUpdatedAt(list))}</td>
                                            <td>
                                                <div className={styles.rowActions}>
                                                    <Link href={`/dashboard/projects/lists/${list.id}`} className="tahoe-button-secondary">
                                                        Open
                                                    </Link>
                                                    {list.candidate_count > 0 ? (
                                                        <Link href={`/dashboard/projects/lists/${list.id}?enrich=1`} className="tahoe-button-ghost">
                                                            Enrich
                                                        </Link>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4}>
                                            <div className={styles.directoryEmpty}>
                                                <h2>No lists yet</h2>
                                                <p>Create a list or save candidates from Search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.directoryFooter}>
                        <span>{lists.length} list{lists.length === 1 ? '' : 's'}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
