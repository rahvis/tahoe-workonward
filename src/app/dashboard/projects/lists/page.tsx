'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dialog, Flex, TahoeSelect, Text, TextField } from '@/components/ui/tahoe-ui';
import {
    createList,
    fetchLists,
    fetchProjects,
    updateList,
    type ListSummary,
    type ProjectSummary,
} from '@/lib/organization';
import styles from '../projects.module.css';

type ListSort = 'updated_desc' | 'name_asc' | 'candidate_count_desc';

function formatDate(value?: string | null) {
    if (!value) return 'Recent';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recent';
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function getListUpdatedAt(list: ListSummary) {
    return list.updated_at ?? list.created_at ?? '';
}

function compareListDates(a: ListSummary, b: ListSummary) {
    const left = new Date(getListUpdatedAt(a)).getTime() || 0;
    const right = new Date(getListUpdatedAt(b)).getTime() || 0;
    return right - left;
}

function ListsDirectoryPageInner() {
    const searchParams = useSearchParams();
    const projectIdParam = searchParams.get('project_id');
    const projectIdFromUrl = projectIdParam && projectIdParam.trim() ? projectIdParam : 'all';
    const shouldOpenNewList = searchParams.get('new') === '1';
    const newListAutoOpenKeyRef = useRef<string | null>(null);
    const loadRequestIdRef = useRef(0);

    const [lists, setLists] = useState<ListSummary[]>([]);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [directoryError, setDirectoryError] = useState('');
    const [modalError, setModalError] = useState('');
    const [search, setSearch] = useState('');
    const [projectFilter, setProjectFilter] = useState(projectIdFromUrl);
    const [sortBy, setSortBy] = useState<ListSort>('updated_desc');
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false);
    const [createProjectId, setCreateProjectId] = useState(projectIdFromUrl === 'all' ? '' : projectIdFromUrl);
    const [newListName, setNewListName] = useState('');
    const [renameListName, setRenameListName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        const requestId = loadRequestIdRef.current + 1;
        loadRequestIdRef.current = requestId;
        setLoading(true);
        setDirectoryError('');
        try {
            const [listItems, projectItems] = await Promise.all([
                fetchLists(),
                fetchProjects({ archived: false }),
            ]);
            if (loadRequestIdRef.current !== requestId) return;
            setLists(listItems);
            setProjects(projectItems);
        } catch (err) {
            if (loadRequestIdRef.current !== requestId) return;
            setDirectoryError(err instanceof Error ? err.message : 'Unable to load lists.');
            setLists([]);
            setProjects([]);
        } finally {
            if (loadRequestIdRef.current !== requestId) return;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
        return () => {
            loadRequestIdRef.current += 1;
        };
    }, [load]);

    useEffect(() => {
        setProjectFilter(projectIdFromUrl);
        setCreateProjectId(projectIdFromUrl === 'all' ? '' : projectIdFromUrl);
    }, [projectIdFromUrl]);

    useEffect(() => {
        if (!shouldOpenNewList) {
            newListAutoOpenKeyRef.current = null;
            return;
        }
        if (newListAutoOpenKeyRef.current === projectIdFromUrl) return;
        newListAutoOpenKeyRef.current = projectIdFromUrl;
        setModalError('');
        setNewListName('');
        setCreateProjectId(projectIdFromUrl === 'all' ? '' : projectIdFromUrl);
        setCreateOpen(true);
    }, [projectIdFromUrl, shouldOpenNewList]);

    const filteredLists = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        const next = lists.filter((list) => {
            if (projectFilter !== 'all' && list.project_id !== projectFilter) return false;
            if (!normalizedSearch) return true;
            return [list.name, list.project_name ?? '']
                .join(' ')
                .toLowerCase()
                .includes(normalizedSearch);
        });

        next.sort((a, b) => {
            if (sortBy === 'name_asc') {
                return a.name.localeCompare(b.name);
            }
            if (sortBy === 'candidate_count_desc') {
                return b.candidate_count - a.candidate_count || compareListDates(a, b);
            }
            return compareListDates(a, b);
        });

        return next;
    }, [lists, projectFilter, search, sortBy]);

    const selectedList = useMemo(
        () => {
            const filteredSelection = selectedListId
                ? filteredLists.find((list) => list.id === selectedListId)
                : null;
            return filteredSelection ?? filteredLists[0] ?? null;
        },
        [filteredLists, selectedListId],
    );

    useEffect(() => {
        if (selectedListId && !filteredLists.some((list) => list.id === selectedListId)) {
            setSelectedListId(null);
        }
    }, [filteredLists, selectedListId]);

    useEffect(() => {
        if (renameOpen && selectedList) {
            setRenameListName(selectedList.name);
        }
    }, [renameOpen, selectedList]);

    function handleCreateOpenChange(open: boolean) {
        setCreateOpen(open);
        setModalError('');
        if (!open) {
            setNewListName('');
        }
    }

    function openCreateListModal() {
        setModalError('');
        setNewListName('');
        setCreateProjectId(projectFilter === 'all' ? '' : projectFilter);
        setCreateOpen(true);
    }

    function handleRenameOpenChange(open: boolean) {
        setRenameOpen(open);
        setModalError('');
        if (!open) {
            setRenameListName('');
        }
    }

    function openRenameModal() {
        if (!selectedList) return;
        setModalError('');
        setRenameListName(selectedList.name);
        setRenameOpen(true);
    }

    async function handleCreateList() {
        const trimmedName = newListName.trim();
        if (!trimmedName || !createProjectId || submitting) return;
        setSubmitting(true);
        setModalError('');
        try {
            const createdList = await createList(createProjectId, { name: trimmedName });
            setCreateOpen(false);
            setNewListName('');
            setSelectedListId(createdList.id);
            await load();
        } catch (err) {
            setModalError(err instanceof Error ? err.message : 'Unable to create list.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRenameList() {
        const trimmedName = renameListName.trim();
        if (!selectedList || !trimmedName || submitting) return;
        setSubmitting(true);
        setModalError('');
        try {
            const updated = await updateList(selectedList.id, { name: trimmedName });
            setLists((current) => current.map((list) => list.id === updated.id ? updated : list));
            setRenameOpen(false);
            setModalError('');
        } catch (err) {
            setModalError(err instanceof Error ? err.message : 'Unable to rename list.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className={styles.directoryPage}>
            <header className={styles.directoryHeader}>
                <div className={styles.directoryTitleGroup}>
                    <span className="tahoe-eyebrow">Projects</span>
                    <h1 className={styles.directoryTitle}>Lists</h1>
                </div>
                <div className={styles.directoryToolbar}>
                    <TextField.Root
                        size="3"
                        rootClassName={styles.directorySearch}
                        placeholder="Search lists or projects..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <TahoeSelect
                        size="3"
                        aria-label="Project filter"
                        value={projectFilter}
                        onChange={(event) => {
                            const nextProjectId = event.target.value;
                            setProjectFilter(nextProjectId);
                            setCreateProjectId(nextProjectId === 'all' ? '' : nextProjectId);
                        }}
                    >
                        <option value="all">All projects</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </TahoeSelect>
                    <TahoeSelect
                        size="3"
                        aria-label="List sort"
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value as ListSort)}
                    >
                        <option value="updated_desc">Updated</option>
                        <option value="name_asc">Name A-Z</option>
                        <option value="candidate_count_desc">Most candidates</option>
                    </TahoeSelect>
                    <Button size="3" type="button" onClick={openCreateListModal}>
                        + List
                    </Button>
                </div>
            </header>

            <div className={styles.directoryMetaBar}>
                <span>{lists.length} total</span>
                <span>{filteredLists.length} shown</span>
                {directoryError ? <span className={styles.inlineError}>{directoryError}</span> : null}
            </div>

            <div className={styles.directoryWorkspace}>
                <div className={styles.directoryTableShell}>
                    <div className={styles.directoryTableScroll}>
                        <table className={styles.directoryTable}>
                            <thead>
                                <tr>
                                    <th>List</th>
                                    <th>Project</th>
                                    <th>Candidates</th>
                                    <th>Updated</th>
                                    <th>Next</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 7 }).map((_, index) => (
                                        <tr key={`list-skeleton-${index}`}>
                                            <td colSpan={5}>
                                                <span className={styles.skeletonLine} />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredLists.length > 0 ? (
                                    filteredLists.map((list) => {
                                        const selected = selectedList?.id === list.id;
                                        return (
                                            <tr
                                                key={list.id}
                                                className={selected ? styles.selectedRow : undefined}
                                                onClick={() => setSelectedListId(list.id)}
                                            >
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={styles.rowNameButton}
                                                        onClick={() => setSelectedListId(list.id)}
                                                    >
                                                        <span className={styles.rowName}>{list.name}</span>
                                                    </button>
                                                </td>
                                                <td>{list.project_name || 'Project'}</td>
                                                <td>{list.candidate_count}</td>
                                                <td>{formatDate(getListUpdatedAt(list))}</td>
                                                <td>
                                                    <div className={styles.rowActions} onClick={(event) => event.stopPropagation()}>
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
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5}>
                                            <div className={styles.directoryEmpty}>
                                                <h2>{lists.length === 0 ? 'No lists yet' : 'No lists found'}</h2>
                                                <p>
                                                    {lists.length === 0
                                                        ? 'Create a list or save candidates from Search.'
                                                        : 'Clear search or change the project filter.'}
                                                </p>
                                                {lists.length === 0 ? (
                                                    <Button size="3" type="button" onClick={openCreateListModal}>
                                                        New list
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.directoryFooter}>
                        <span>{filteredLists.length} list{filteredLists.length === 1 ? '' : 's'}</span>
                    </div>
                </div>

                <aside className={styles.detailDrawer} aria-label="List details">
                    {selectedList ? (
                        <>
                            <div className={styles.drawerHeader}>
                                <span className="tahoe-eyebrow">List</span>
                                <h2>{selectedList.name}</h2>
                            </div>
                            <div className={styles.drawerStats}>
                                <div>
                                    <span>Project</span>
                                    <strong>{selectedList.project_name || 'Project'}</strong>
                                </div>
                                <div>
                                    <span>Candidates</span>
                                    <strong>{selectedList.candidate_count}</strong>
                                </div>
                                <div>
                                    <span>Updated</span>
                                    <strong>{formatDate(getListUpdatedAt(selectedList))}</strong>
                                </div>
                            </div>
                            <div className={styles.drawerActions}>
                                <Link href={`/dashboard/projects/lists/${selectedList.id}`} className="tahoe-button">
                                    Open
                                </Link>
                                {selectedList.candidate_count > 0 ? (
                                    <>
                                        <Link href={`/dashboard/projects/lists/${selectedList.id}?enrich=1`} className="tahoe-button-secondary">
                                            Enrich
                                        </Link>
                                        <Link href={`/dashboard/outreach/campaigns/new?list_id=${encodeURIComponent(selectedList.id)}`} className="tahoe-button-secondary">
                                            Campaign
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <button type="button" className="tahoe-button-secondary" disabled>
                                            Enrich
                                        </button>
                                        <button type="button" className="tahoe-button-secondary" disabled>
                                            Campaign
                                        </button>
                                    </>
                                )}
                                <button type="button" className="tahoe-button-ghost" onClick={openRenameModal}>
                                    Rename
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.drawerPlaceholder}>
                            <h2>Select a list</h2>
                            <p>Inspect the audience, then open it for enrichment or campaign work.</p>
                        </div>
                    )}
                </aside>
            </div>

            <Dialog.Root open={createOpen} onOpenChange={handleCreateOpenChange}>
                <Dialog.Content maxWidth="520px" style={{ padding: 24 }}>
                    <Dialog.Title>New list</Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                        Pick a project and name the audience.
                    </Dialog.Description>
                    <Flex direction="column" gap="4">
                        <Flex direction="column" gap="2">
                            <label className="tahoe-label" htmlFor="list-project">Project</label>
                            <TahoeSelect
                                id="list-project"
                                size="3"
                                value={createProjectId}
                                onChange={(event) => setCreateProjectId(event.target.value)}
                            >
                                <option value="">Choose project</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </TahoeSelect>
                        </Flex>
                        <Flex direction="column" gap="2">
                            <label className="tahoe-label" htmlFor="new-list-name">List name</label>
                            <TextField.Root
                                id="new-list-name"
                                size="3"
                                placeholder="Outreach Round 1"
                                value={newListName}
                                onChange={(event) => setNewListName(event.target.value)}
                            />
                        </Flex>
                        {modalError ? <Text size="2" color="red">{modalError}</Text> : null}
                    </Flex>
                    <Flex gap="3" justify="end" mt="5">
                        <Button size="3" variant="soft" color="gray" type="button" onClick={() => handleCreateOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button size="3" type="button" disabled={!createProjectId || !newListName.trim() || submitting} onClick={() => void handleCreateList()}>
                            {submitting ? 'Creating...' : 'Create list'}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root open={renameOpen} onOpenChange={handleRenameOpenChange}>
                <Dialog.Content maxWidth="480px" style={{ padding: 24 }}>
                    <Dialog.Title>Rename list</Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                        Keep the list name short and recognizable.
                    </Dialog.Description>
                    <Flex direction="column" gap="3">
                        <label className="tahoe-label" htmlFor="rename-list-name">List name</label>
                        <TextField.Root
                            id="rename-list-name"
                            size="3"
                            value={renameListName}
                            onChange={(event) => setRenameListName(event.target.value)}
                        />
                        {modalError ? <Text size="2" color="red">{modalError}</Text> : null}
                    </Flex>
                    <Flex gap="3" justify="end" mt="5">
                        <Button size="3" variant="soft" color="gray" type="button" onClick={() => handleRenameOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button size="3" type="button" disabled={!renameListName.trim() || submitting} onClick={() => void handleRenameList()}>
                            {submitting ? 'Saving...' : 'Save name'}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </section>
    );
}

export default function ListsDirectoryPage() {
    return (
        <Suspense fallback={<section className={styles.directoryPage}><span className="tahoe-spinner" /></section>}>
            <ListsDirectoryPageInner />
        </Suspense>
    );
}
