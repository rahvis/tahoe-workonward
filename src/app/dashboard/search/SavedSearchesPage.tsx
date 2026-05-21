'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@/components/ui/icons';
import { Button, Dialog, Flex, TahoeSelect, Text, TextField } from '@/components/ui/tahoe-ui';
import {
    deleteSavedSearch,
    fetchProjects,
    fetchSavedSearches,
    type ProjectSummary,
    type SavedSearchSummary,
} from '@/lib/organization';
import { rerunSavedSearch } from '@/lib/api';
import { storeSearchPageBootstrap } from '@/lib/search-page-bootstrap';
import styles from './saved-searches.module.css';

type SavedSearchModeFilter = 'all' | 'legacy' | 'langgraph';
type SortKey = 'newest' | 'oldest' | 'name' | 'project';

type FilterEntry = {
    group: string;
    label: string;
    value: string;
};

function formatSavedAt(value?: string | null) {
    if (!value) return 'just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function timestamp(value?: string | null) {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function humanizeKey(value: string) {
    return value
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFilterValue(value: unknown): string {
    if (Array.isArray(value)) {
        return value
            .map((item) => formatFilterValue(item))
            .filter(Boolean)
            .join(', ');
    }
    if (isRecord(value)) {
        return Object.entries(value)
            .map(([key, item]) => `${humanizeKey(key)}: ${formatFilterValue(item)}`)
            .filter((item) => !item.endsWith(': '))
            .join(', ');
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value == null) return '';
    return String(value);
}

function collectFilterEntries(value: unknown, path: string[] = []): FilterEntry[] {
    if (Array.isArray(value)) {
        if (value.length === 0) return [];
        const formatted = formatFilterValue(value);
        if (!formatted) return [];
        const label = humanizeKey(path.at(-1) ?? 'Filter');
        const group = path.length > 1 ? humanizeKey(path[0]) : 'Filters';
        return [{ group, label, value: formatted }];
    }

    if (isRecord(value)) {
        return Object.entries(value).flatMap(([key, item]) => collectFilterEntries(item, [...path, key]));
    }

    const formatted = formatFilterValue(value);
    if (!formatted) return [];
    const label = humanizeKey(path.at(-1) ?? 'Filter');
    const group = path.length > 1 ? humanizeKey(path[0]) : 'Filters';
    return [{ group, label, value: formatted }];
}

function getFilterEntries(savedSearch: SavedSearchSummary) {
    return collectFilterEntries(savedSearch.structured_filters ?? {});
}

function formatFilterSummary(entries: FilterEntry[]) {
    if (entries.length === 0) return 'No filters';
    return `${entries.length} filter${entries.length === 1 ? '' : 's'}`;
}

function modeLabel(mode: SavedSearchSummary['mode']) {
    return mode === 'langgraph' ? 'LangGraph' : 'Legacy';
}

function groupEntries(entries: FilterEntry[]) {
    return entries.reduce<Record<string, FilterEntry[]>>((groups, entry) => {
        groups[entry.group] = [...(groups[entry.group] ?? []), entry];
        return groups;
    }, {});
}

function matchesSearch(savedSearch: SavedSearchSummary, query: string, projectName: string) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return true;
    const filters = getFilterEntries(savedSearch)
        .map((entry) => `${entry.group} ${entry.label} ${entry.value}`)
        .join(' ');
    return [
        savedSearch.name,
        savedSearch.prompt,
        savedSearch.mode,
        projectName,
        filters,
    ].some((value) => value.toLowerCase().includes(normalized));
}

export default function SavedSearchesPage() {
    const router = useRouter();
    const [savedSearches, setSavedSearches] = useState<SavedSearchSummary[]>([]);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [projectFilter, setProjectFilter] = useState('all');
    const [modeFilter, setModeFilter] = useState<SavedSearchModeFilter>('all');
    const [sortKey, setSortKey] = useState<SortKey>('newest');
    const [activeSearch, setActiveSearch] = useState<SavedSearchSummary | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SavedSearchSummary | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [rerunningId, setRerunningId] = useState<string | null>(null);
    const [rerunError, setRerunError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [savedSearchItems, projectItems] = await Promise.all([
                fetchSavedSearches(),
                fetchProjects({ archived: false }),
            ]);
            setSavedSearches(savedSearchItems);
            setProjects(projectItems);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const projectNameById = useMemo(
        () => Object.fromEntries(projects.map((project) => [project.id, project.name])),
        [projects],
    );

    const projectOptions = useMemo(
        () => [...projects].sort((left, right) => left.name.localeCompare(right.name)),
        [projects],
    );

    const getProjectName = useCallback(
        (savedSearch: SavedSearchSummary) => {
            if (!savedSearch.project_id) return 'No project';
            return projectNameById[savedSearch.project_id] || 'Project linked';
        },
        [projectNameById],
    );

    const visibleSavedSearches = useMemo(() => {
        return savedSearches
            .filter((savedSearch) => {
                if (projectFilter === 'none' && savedSearch.project_id) return false;
                if (projectFilter !== 'all' && projectFilter !== 'none' && savedSearch.project_id !== projectFilter) return false;
                if (modeFilter !== 'all' && savedSearch.mode !== modeFilter) return false;
                return matchesSearch(savedSearch, query, getProjectName(savedSearch));
            })
            .sort((left, right) => {
                if (sortKey === 'oldest') return timestamp(left.created_at) - timestamp(right.created_at);
                if (sortKey === 'name') return left.name.localeCompare(right.name);
                if (sortKey === 'project') return getProjectName(left).localeCompare(getProjectName(right));
                return timestamp(right.created_at) - timestamp(left.created_at);
            });
    }, [getProjectName, modeFilter, projectFilter, query, savedSearches, sortKey]);

    const handleRerun = useCallback(
        async (savedSearch: SavedSearchSummary) => {
            setRerunError(null);
            setRerunningId(savedSearch.id);
            try {
                const response = await rerunSavedSearch(savedSearch.id);
                storeSearchPageBootstrap(response);
                router.push(`/dashboard/search/new?mode=${response.mode}`);
            } catch (error) {
                setRerunError(error instanceof Error ? error.message : 'Failed to rerun saved search');
                setRerunningId(null);
            }
        },
        [router],
    );

    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        setRerunError(null);
        setDeletingId(deleteTarget.id);
        try {
            await deleteSavedSearch(deleteTarget.id);
            setSavedSearches((current) => current.filter((item) => item.id !== deleteTarget.id));
            setActiveSearch((current) => (current?.id === deleteTarget.id ? null : current));
            setDeleteTarget(null);
        } catch (error) {
            setRerunError(error instanceof Error ? error.message : 'Failed to delete saved search');
        } finally {
            setDeletingId(null);
        }
    }, [deleteTarget]);

    const renderFilterSummary = (savedSearch: SavedSearchSummary) => {
        const entries = getFilterEntries(savedSearch);
        const previewEntries = entries.slice(0, 2);
        return (
            <div className={styles.filterSummary}>
                <span>{formatFilterSummary(entries)}</span>
                {previewEntries.length > 0 ? (
                    <div className={styles.filterChips}>
                        {previewEntries.map((entry) => (
                            <span key={`${entry.group}-${entry.label}-${entry.value}`} className={styles.filterChip}>
                                {entry.label}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    };

    const renderDetailFilters = (savedSearch: SavedSearchSummary) => {
        const grouped = groupEntries(getFilterEntries(savedSearch));
        const groupNames = Object.keys(grouped);
        if (groupNames.length === 0) {
            return <p className={styles.emptyFilters}>No structured filters were saved with this search.</p>;
        }

        return (
            <div className={styles.filterGroups}>
                {groupNames.map((group) => (
                    <section key={group} className={styles.filterGroup}>
                        <h3>{group}</h3>
                        <dl>
                            {grouped[group].map((entry) => (
                                <div key={`${entry.label}-${entry.value}`} className={styles.filterRow}>
                                    <dt>{entry.label}</dt>
                                    <dd>{entry.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ))}
            </div>
        );
    };

    return (
        <section className={styles.page}>
            <header className={styles.toolbar}>
                <Flex className={styles.toolbarRow} gap="3" align="center" wrap="wrap">
                    <div className={styles.searchWrap}>
                        <TextField.Root
                            size="3"
                            rootClassName={styles.searchShell}
                            placeholder="Search saved searches..."
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        >
                            <TextField.Slot>
                                <MagnifyingGlassIcon />
                            </TextField.Slot>
                        </TextField.Root>
                    </div>
                    <TahoeSelect
                        size="3"
                        className={styles.select}
                        aria-label="Project filter"
                        value={projectFilter}
                        onChange={(event) => setProjectFilter(event.target.value)}
                    >
                        <option value="all">All projects</option>
                        <option value="none">No project</option>
                        {projectOptions.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </TahoeSelect>
                    <TahoeSelect
                        size="3"
                        className={styles.select}
                        aria-label="Mode filter"
                        value={modeFilter}
                        onChange={(event) => setModeFilter(event.target.value as SavedSearchModeFilter)}
                    >
                        <option value="all">All modes</option>
                        <option value="langgraph">LangGraph</option>
                        <option value="legacy">Legacy</option>
                    </TahoeSelect>
                    <TahoeSelect
                        size="3"
                        className={styles.select}
                        aria-label="Sort saved searches"
                        value={sortKey}
                        onChange={(event) => setSortKey(event.target.value as SortKey)}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="name">Name</option>
                        <option value="project">Project</option>
                    </TahoeSelect>
                    <Text size="2" color="gray" className={styles.resultCount}>
                        {visibleSavedSearches.length} saved search{visibleSavedSearches.length === 1 ? '' : 'es'}
                    </Text>
                </Flex>
            </header>

            {rerunError ? (
                <div className={styles.errorBanner} role="alert">
                    {rerunError}
                </div>
            ) : null}

            <div className={styles.resultsArea}>
                {loading ? (
                    <div className={styles.emptyState}>
                        <span className="tahoe-spinner" />
                        <p>Loading saved searches...</p>
                    </div>
                ) : null}

                {!loading && savedSearches.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h2 className={styles.emptyTitle}>No saved searches yet</h2>
                        <p className={styles.emptyBody}>
                            Save a search from Search &gt; New Search to reuse it later from this list.
                        </p>
                    </div>
                ) : null}

                {!loading && savedSearches.length > 0 && visibleSavedSearches.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h2 className={styles.emptyTitle}>No matching saved searches</h2>
                        <p className={styles.emptyBody}>
                            Try a different keyword, project, mode, or sort option.
                        </p>
                    </div>
                ) : null}

                {!loading && visibleSavedSearches.length > 0 ? (
                    <div className={styles.tableShell}>
                        <div className={styles.tableScroll}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Search Name</th>
                                        <th>Project</th>
                                        <th>Prompt</th>
                                        <th>Filters</th>
                                        <th>Mode</th>
                                        <th>Saved</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleSavedSearches.map((savedSearch) => (
                                        <tr
                                            key={savedSearch.id}
                                            className={styles.row}
                                            tabIndex={0}
                                            onClick={() => setActiveSearch(savedSearch)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    setActiveSearch(savedSearch);
                                                }
                                            }}
                                        >
                                            <td className={styles.nameCell}>
                                                <button
                                                    type="button"
                                                    className={styles.rowTitleButton}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setActiveSearch(savedSearch);
                                                    }}
                                                >
                                                    {savedSearch.name}
                                                </button>
                                            </td>
                                            <td>{getProjectName(savedSearch)}</td>
                                            <td className={styles.promptCell}>{savedSearch.prompt}</td>
                                            <td>{renderFilterSummary(savedSearch)}</td>
                                            <td>
                                                <span className={styles.modePill}>{modeLabel(savedSearch.mode)}</span>
                                            </td>
                                            <td>{formatSavedAt(savedSearch.created_at)}</td>
                                            <td>
                                                <Flex gap="2" wrap="nowrap" className={styles.rowActions}>
                                                    <Button
                                                        size="1"
                                                        disabled={rerunningId === savedSearch.id}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            void handleRerun(savedSearch);
                                                        }}
                                                    >
                                                        {rerunningId === savedSearch.id ? 'Starting...' : 'Run again'}
                                                    </Button>
                                                    <Button
                                                        size="1"
                                                        variant="soft"
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setActiveSearch(savedSearch);
                                                        }}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="1"
                                                        variant="soft"
                                                        color="gray"
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setDeleteTarget(savedSearch);
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </Flex>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>

            <Dialog.Root open={Boolean(activeSearch)} onOpenChange={(open) => !open && setActiveSearch(null)}>
                {activeSearch ? (
                    <Dialog.Content maxWidth="760px" className={styles.detailDialog} aria-label="Saved search details">
                        <Dialog.Title>{activeSearch.name}</Dialog.Title>
                        <Dialog.Description size="2" mb="4">
                            Inspect the prompt and filters before starting a fresh run.
                        </Dialog.Description>

                        <div className={styles.detailGrid}>
                            <section className={styles.detailSection}>
                                <h3>Project</h3>
                                <p>{getProjectName(activeSearch)}</p>
                            </section>
                            <section className={styles.detailSection}>
                                <h3>Search mode</h3>
                                <p>{modeLabel(activeSearch.mode)}</p>
                            </section>
                            <section className={styles.detailSection}>
                                <h3>Saved</h3>
                                <p>{formatSavedAt(activeSearch.created_at)}</p>
                            </section>
                            <section className={styles.detailSection}>
                                <h3>Updated</h3>
                                <p>{formatSavedAt(activeSearch.updated_at)}</p>
                            </section>
                        </div>

                        <section className={styles.promptBlock}>
                            <h3>Prompt</h3>
                            <p>{activeSearch.prompt}</p>
                        </section>

                        <section className={styles.filtersBlock}>
                            <h3>Filters</h3>
                            {renderDetailFilters(activeSearch)}
                        </section>

                        <Flex gap="3" justify="end" mt="5" wrap="wrap">
                            <Button
                                size="3"
                                variant="soft"
                                color="gray"
                                type="button"
                                onClick={() => setDeleteTarget(activeSearch)}
                            >
                                Delete
                            </Button>
                            <Dialog.Close>
                                <Button size="3" variant="soft" color="gray" type="button">
                                    Close
                                </Button>
                            </Dialog.Close>
                            <Button
                                size="3"
                                type="button"
                                disabled={rerunningId === activeSearch.id}
                                onClick={() => void handleRerun(activeSearch)}
                            >
                                {rerunningId === activeSearch.id ? 'Starting...' : 'Run again'}
                            </Button>
                        </Flex>
                    </Dialog.Content>
                ) : null}
            </Dialog.Root>

            <Dialog.Root open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                {deleteTarget ? (
                    <Dialog.Content maxWidth="420px" className={styles.confirmDialog} aria-label="Delete saved search confirmation">
                        <Dialog.Title>Delete saved search?</Dialog.Title>
                        <Dialog.Description size="2" mb="4">
                            <span className={styles.deleteSearchName}>{deleteTarget.name}</span> will be removed. This will not delete saved candidates or project lists.
                        </Dialog.Description>
                        <Flex gap="3" justify="end" mt="5">
                            <Dialog.Close>
                                <Button size="3" variant="soft" color="gray" type="button">
                                    Cancel
                                </Button>
                            </Dialog.Close>
                            <Button
                                size="3"
                                type="button"
                                disabled={deletingId === deleteTarget.id}
                                onClick={() => void handleDelete()}
                            >
                                {deletingId === deleteTarget.id ? 'Deleting...' : 'Delete saved search'}
                            </Button>
                        </Flex>
                    </Dialog.Content>
                ) : null}
            </Dialog.Root>
        </section>
    );
}
