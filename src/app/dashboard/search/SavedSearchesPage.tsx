'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Flex, Text } from '@/components/ui/tahoe-ui';
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

function formatSavedAt(value?: string | null) {
    if (!value) return 'just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

export default function SavedSearchesPage() {
    const router = useRouter();
    const [savedSearches, setSavedSearches] = useState<SavedSearchSummary[]>([]);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);

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

    const [rerunningId, setRerunningId] = useState<string | null>(null);
    const [rerunError, setRerunError] = useState<string | null>(null);

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

    return (
        <section className={styles.page}>
            {loading ? (
                <div className={styles.emptyState}>
                    <span className="tahoe-spinner" />
                    <p>Loading saved searches…</p>
                </div>
            ) : null}

            {rerunError ? (
                <div className={styles.errorBanner} role="alert">
                    {rerunError}
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

            <div className={styles.grid}>
                {savedSearches.map((savedSearch) => (
                    <Card key={savedSearch.id} className={styles.card}>
                        <Flex direction="column" gap="4">
                            <div>
                                <Text as="div" size="2" weight="medium">
                                    {savedSearch.name}
                                </Text>
                                <Text as="div" size="2" color="gray">
                                    {savedSearch.project_id ? projectNameById[savedSearch.project_id] || 'Project linked' : 'No project attached'}
                                </Text>
                            </div>

                            <Text size="2" color="gray">
                                {savedSearch.prompt}
                            </Text>

                            <Flex justify="between" align="center" wrap="wrap" gap="3">
                                <Text size="1" color="gray">
                                    Saved {formatSavedAt(savedSearch.created_at)}
                                </Text>
                                <Flex gap="2" wrap="wrap">
                                    <Button
                                        disabled={rerunningId === savedSearch.id}
                                        onClick={() => void handleRerun(savedSearch)}
                                    >
                                        {rerunningId === savedSearch.id ? 'Starting…' : 'Run again'}
                                    </Button>
                                    <Button
                                        variant="soft"
                                        color="gray"
                                        onClick={() => void deleteSavedSearch(savedSearch.id).then(load)}
                                    >
                                        Delete
                                    </Button>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Card>
                ))}
            </div>
        </section>
    );
}
