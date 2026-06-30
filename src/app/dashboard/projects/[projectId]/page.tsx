'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@/components/ui/tahoe-ui';
import {
    archiveProject,
    createList,
    fetchProject,
    fetchProjectLists,
    updateProject,
    type ListSummary,
    type ProjectSummary,
} from '@/lib/organization';
import styles from '../projects.module.css';
import { DEFAULT_PROJECT_COLOR, PROJECT_COLORS, colorName } from '../project-colors';

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
    const [project, setProject] = useState<ProjectSummary | null>(null);
    const [lists, setLists] = useState<ListSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newListName, setNewListName] = useState('');
    const [creatingList, setCreatingList] = useState(false);
    const [togglingArchive, setTogglingArchive] = useState(false);

    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState<string>(DEFAULT_PROJECT_COLOR);
    const [editError, setEditError] = useState('');
    const [editSubmitting, setEditSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [projectItem, listItems] = await Promise.all([
                fetchProject(projectId),
                fetchProjectLists(projectId),
            ]);
            setProject(projectItem);
            setLists(listItems);
            setError('');
        } catch (err) {
            setLists([]);
            setError(err instanceof Error ? err.message : 'Unable to load this project.');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void load();
    }, [load]);

    async function handleCreateList() {
        if (!newListName.trim() || creatingList) return;
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

    async function handleArchiveToggle() {
        if (!project || togglingArchive) return;
        setTogglingArchive(true);
        setError('');
        try {
            const updated = project.archived
                ? await updateProject(project.id, { archived: false })
                : await archiveProject(project.id);
            setProject(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update this project.');
        } finally {
            setTogglingArchive(false);
        }
    }

    function openEditModal() {
        if (!project) return;
        setEditName(project.name);
        setEditColor(project.color || DEFAULT_PROJECT_COLOR);
        setEditError('');
        setEditOpen(true);
    }

    function handleEditOpenChange(open: boolean) {
        setEditOpen(open);
        setEditError('');
        if (!open) {
            setEditColor(DEFAULT_PROJECT_COLOR);
        }
    }

    async function handleSaveEdit() {
        const trimmedName = editName.trim();
        if (!project || !trimmedName || editSubmitting) return;

        const payload: Record<string, unknown> = {};
        if (trimmedName !== project.name) payload.name = trimmedName;
        if (editColor !== (project.color || DEFAULT_PROJECT_COLOR)) payload.color = editColor;
        if (Object.keys(payload).length === 0) {
            handleEditOpenChange(false);
            return;
        }

        setEditSubmitting(true);
        setEditError('');
        try {
            const updated = await updateProject(project.id, payload);
            setProject(updated);
            handleEditOpenChange(false);
        } catch (err) {
            setEditError(err instanceof Error ? err.message : 'Unable to save changes.');
        } finally {
            setEditSubmitting(false);
        }
    }

    return (
        <section className={styles.directoryPage}>
            <header className={styles.directoryHeader}>
                <div className={styles.detailTitleRow}>
                    <span
                        className={styles.projectDot}
                        style={{ background: project?.color || 'var(--tahoe-color-accent)' }}
                        aria-hidden="true"
                    />
                    <h1 className={styles.detailTitle}>{project?.name || (loading ? 'Loading…' : 'Project')}</h1>
                    {project ? (
                        <span className={project.archived ? styles.statusMuted : styles.statusActive}>
                            {project.archived ? 'Archived' : 'Open'}
                        </span>
                    ) : null}
                    <div className={styles.detailTitleActions}>
                        <button
                            type="button"
                            className="tahoe-button-ghost"
                            disabled={!project}
                            onClick={openEditModal}
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            className="tahoe-button-ghost"
                            disabled={!project || togglingArchive}
                            onClick={() => void handleArchiveToggle()}
                        >
                            {togglingArchive
                                ? 'Working...'
                                : project?.archived
                                    ? 'Restore'
                                    : 'Archive'}
                        </button>
                        <Link href="/dashboard/projects" className="tahoe-button-secondary">
                            Back
                        </Link>
                    </div>
                </div>
                <div className={styles.directoryToolbar}>
                    <TextField.Root
                        size="3"
                        rootClassName={styles.directorySearch}
                        placeholder="New list name..."
                        value={newListName}
                        onChange={(event) => setNewListName(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                void handleCreateList();
                            }
                        }}
                    />
                    <Button size="3" type="button" onClick={() => void handleCreateList()} disabled={creatingList || !newListName.trim()}>
                        {creatingList ? 'Creating...' : '+ List'}
                    </Button>
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

            <Dialog.Root open={editOpen} onOpenChange={handleEditOpenChange}>
                <Dialog.Content maxWidth="520px" style={{ padding: 24 }}>
                    <Dialog.Title>Edit project</Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                        Rename the project or change its color.
                    </Dialog.Description>
                    <Flex direction="column" gap="4">
                        <Flex direction="column" gap="2">
                            <label className="tahoe-label" htmlFor="edit-project-name">Project name</label>
                            <TextField.Root
                                id="edit-project-name"
                                size="3"
                                value={editName}
                                onChange={(event) => setEditName(event.target.value)}
                            />
                        </Flex>
                        <Flex direction="column" gap="2">
                            <span className="tahoe-label">Color</span>
                            <Flex gap="2" wrap="wrap">
                                {PROJECT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        aria-label={`Use ${colorName(color)}`}
                                        aria-pressed={editColor === color}
                                        className={styles.colorSwatch}
                                        data-selected={editColor === color ? 'true' : undefined}
                                        style={{ background: color }}
                                        onClick={() => setEditColor(color)}
                                    />
                                ))}
                            </Flex>
                        </Flex>
                        {editError ? <Text size="2" color="red">{editError}</Text> : null}
                    </Flex>
                    <Flex gap="3" justify="end" mt="5">
                        <Button size="3" variant="soft" color="gray" type="button" onClick={() => handleEditOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button size="3" type="button" disabled={!editName.trim() || editSubmitting} onClick={() => void handleSaveEdit()}>
                            {editSubmitting ? 'Saving...' : 'Save changes'}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </section>
    );
}
