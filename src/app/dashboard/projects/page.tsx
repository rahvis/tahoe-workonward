'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dialog, Flex, TahoeSelect, Text, TextField } from '@/components/ui/tahoe-ui';
import {
    archiveProject,
    createList,
    createProject,
    fetchProjects,
    type ProjectSummary,
} from '@/lib/organization';
import styles from './projects.module.css';

type ProjectStatusFilter = 'open' | 'archived' | 'all';
type ProjectSort = 'updated_desc' | 'name_asc' | 'list_count_desc';

function formatDate(value?: string | null) {
    if (!value) return 'Recent';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recent';
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function getProjectUpdatedAt(project: ProjectSummary) {
    return project.updated_at ?? project.created_at ?? '';
}

function compareProjectDates(a: ProjectSummary, b: ProjectSummary) {
    const left = new Date(getProjectUpdatedAt(a)).getTime() || 0;
    const right = new Date(getProjectUpdatedAt(b)).getTime() || 0;
    return right - left;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [directoryError, setDirectoryError] = useState('');
    const [directoryWarning, setDirectoryWarning] = useState('');
    const [modalError, setModalError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('open');
    const [sortBy, setSortBy] = useState<ProjectSort>('updated_desc');
    const [createOpen, setCreateOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [firstListName, setFirstListName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [archivingId, setArchivingId] = useState<string | null>(null);
    const loadRequestIdRef = useRef(0);

    const loadProjects = useCallback(async () => {
        const requestId = loadRequestIdRef.current + 1;
        loadRequestIdRef.current = requestId;
        setLoading(true);
        setDirectoryError('');
        try {
            const [openItems, archivedItems] = await Promise.all([
                fetchProjects({ archived: false }),
                fetchProjects({ archived: true }),
            ]);
            if (loadRequestIdRef.current !== requestId) return;
            setProjects([...openItems, ...archivedItems]);
        } catch (err) {
            if (loadRequestIdRef.current !== requestId) return;
            setDirectoryError(err instanceof Error ? err.message : 'Unable to load projects.');
            setProjects([]);
        } finally {
            if (loadRequestIdRef.current !== requestId) return;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProjects();
        return () => {
            loadRequestIdRef.current += 1;
        };
    }, [loadProjects]);

    const filteredProjects = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        const next = projects.filter((project) => {
            if (statusFilter === 'open' && project.archived) return false;
            if (statusFilter === 'archived' && !project.archived) return false;
            if (!normalizedSearch) return true;
            return project.name.toLowerCase().includes(normalizedSearch);
        });

        next.sort((a, b) => {
            if (sortBy === 'name_asc') {
                return a.name.localeCompare(b.name);
            }
            if (sortBy === 'list_count_desc') {
                return b.list_count - a.list_count || compareProjectDates(a, b);
            }
            return compareProjectDates(a, b);
        });

        return next;
    }, [projects, search, sortBy, statusFilter]);

    const openCount = projects.filter((project) => !project.archived).length;
    const archivedCount = projects.filter((project) => project.archived).length;

    async function handleCreateProject() {
        const trimmedName = projectName.trim();
        if (!trimmedName || submitting) return;
        setSubmitting(true);
        setModalError('');
        setDirectoryWarning('');
        try {
            const createdProject = await createProject({ name: trimmedName });
            const trimmedListName = firstListName.trim();
            let firstListError = '';
            if (trimmedListName) {
                try {
                    await createList(createdProject.id, { name: trimmedListName });
                } catch (err) {
                    firstListError = err instanceof Error ? err.message : 'Unable to create the first list.';
                }
            }
            setCreateOpen(false);
            setProjectName('');
            setFirstListName('');
            await loadProjects();
            if (firstListError) {
                setDirectoryWarning(`Project created. First list was not created: ${firstListError}`);
            }
        } catch (err) {
            setModalError(err instanceof Error ? err.message : 'Unable to create project.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleArchive(project: ProjectSummary) {
        if (project.archived || archivingId) return;
        setArchivingId(project.id);
        setDirectoryError('');
        setDirectoryWarning('');
        try {
            await archiveProject(project.id);
            await loadProjects();
        } catch (err) {
            setDirectoryError(err instanceof Error ? err.message : 'Unable to archive project.');
        } finally {
            setArchivingId(null);
        }
    }

    function handleCreateOpenChange(open: boolean) {
        setCreateOpen(open);
        setModalError('');
        if (!open) {
            setProjectName('');
            setFirstListName('');
        }
    }

    return (
        <section className={styles.directoryPage}>
            <header className={styles.directoryHeader}>
                <div className={styles.directoryToolbar}>
                    <TextField.Root
                        size="3"
                        rootClassName={styles.directorySearch}
                        placeholder="Search projects..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <TahoeSelect
                        size="3"
                        aria-label="Project status"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as ProjectStatusFilter)}
                    >
                        <option value="open">Open</option>
                        <option value="archived">Archived</option>
                        <option value="all">All</option>
                    </TahoeSelect>
                    <TahoeSelect
                        size="3"
                        aria-label="Project sort"
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value as ProjectSort)}
                    >
                        <option value="updated_desc">Updated</option>
                        <option value="name_asc">Name A-Z</option>
                        <option value="list_count_desc">Most lists</option>
                    </TahoeSelect>
                    <Button size="3" type="button" onClick={() => handleCreateOpenChange(true)}>
                        + Project
                    </Button>
                </div>
            </header>

            <div className={styles.directoryMetaBar}>
                <span>{openCount} open</span>
                <span>{archivedCount} archived</span>
                {directoryWarning ? <span className={styles.inlineWarning}>{directoryWarning}</span> : null}
                {directoryError ? <span className={styles.inlineError}>{directoryError}</span> : null}
            </div>

            <div className={styles.singleDirectoryWorkspace}>
                <div className={styles.directoryTableShell}>
                    <div className={styles.directoryTableScroll}>
                        <table className={`${styles.directoryTable} ${styles.projectsDirectoryTable}`}>
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>Lists</th>
                                    <th>Updated</th>
                                    <th>Status</th>
                                    <th>Next</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 7 }).map((_, index) => (
                                        <tr key={`project-skeleton-${index}`}>
                                            <td colSpan={5}>
                                                <span className={styles.skeletonLine} />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredProjects.length > 0 ? (
                                    filteredProjects.map((project) => (
                                        <tr key={project.id}>
                                            <td>
                                                <Link href={`/dashboard/projects/${project.id}`} className={styles.rowNameLink}>
                                                    <span
                                                        className={styles.projectDot}
                                                        style={{ background: project.color || 'var(--tahoe-color-accent)' }}
                                                        aria-hidden="true"
                                                    />
                                                    <span className={styles.rowName}>{project.name}</span>
                                                </Link>
                                            </td>
                                            <td>{project.list_count}</td>
                                            <td>{formatDate(getProjectUpdatedAt(project))}</td>
                                            <td>
                                                <span className={project.archived ? styles.statusMuted : styles.statusActive}>
                                                    {project.archived ? 'Archived' : 'Open'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.rowActions} onClick={(event) => event.stopPropagation()}>
                                                    <Link href={`/dashboard/projects/${project.id}`} className="tahoe-button-secondary">
                                                        Open
                                                    </Link>
                                                    <Link href={`/dashboard/projects/lists?project_id=${encodeURIComponent(project.id)}`} className="tahoe-button-ghost">
                                                        Lists
                                                    </Link>
                                                    <Link href={`/dashboard/projects/lists?project_id=${encodeURIComponent(project.id)}&new=1`} className="tahoe-button-ghost">
                                                        New list
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="tahoe-button-ghost"
                                                        disabled={project.archived || archivingId === project.id}
                                                        onClick={() => void handleArchive(project)}
                                                    >
                                                        {project.archived ? 'Archived' : archivingId === project.id ? 'Archiving...' : 'Archive'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5}>
                                            <div className={styles.directoryEmpty}>
                                                <h2>{projects.length === 0 ? 'No projects yet' : 'No projects found'}</h2>
                                                <p>
                                                    {projects.length === 0
                                                        ? 'Create a project, then save candidates into a list.'
                                                        : 'Clear search or change the status filter.'}
                                                </p>
                                                {projects.length === 0 ? (
                                                    <Button size="3" type="button" onClick={() => handleCreateOpenChange(true)}>
                                                        New project
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
                        <span>{filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}</span>
                    </div>
                </div>

            </div>

            <Dialog.Root open={createOpen} onOpenChange={handleCreateOpenChange}>
                <Dialog.Content maxWidth="520px" style={{ padding: 24 }}>
                    <Dialog.Title>New project</Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                        Create the project container. Add a first list now if the audience is ready to organize.
                    </Dialog.Description>
                    <Flex direction="column" gap="4">
                        <Flex direction="column" gap="2">
                            <label className="tahoe-label" htmlFor="project-name">Project name</label>
                            <TextField.Root
                                id="project-name"
                                size="3"
                                placeholder="Series-B Backend Engineers"
                                value={projectName}
                                onChange={(event) => setProjectName(event.target.value)}
                            />
                        </Flex>
                        <Flex direction="column" gap="2">
                            <label className="tahoe-label" htmlFor="first-list-name">First list</label>
                            <TextField.Root
                                id="first-list-name"
                                size="3"
                                placeholder="Outreach Round 1"
                                value={firstListName}
                                onChange={(event) => setFirstListName(event.target.value)}
                            />
                            <Text size="2" color="gray">Optional. Leave blank to create only the project.</Text>
                        </Flex>
                        {modalError ? <Text size="2" color="red">{modalError}</Text> : null}
                    </Flex>
                    <Flex gap="3" justify="end" mt="5">
                        <Button size="3" variant="soft" color="gray" type="button" onClick={() => handleCreateOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button size="3" type="button" disabled={!projectName.trim() || submitting} onClick={() => void handleCreateProject()}>
                            {submitting ? 'Creating...' : 'Create project'}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </section>
    );
}
