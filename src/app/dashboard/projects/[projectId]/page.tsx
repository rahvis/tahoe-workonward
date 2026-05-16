'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Flex, Text, TextField } from '@/components/ui/tahoe-ui';
import {
    createList,
    fetchProject,
    fetchProjectLists,
    fetchSavedSearches,
    type ListSummary,
    type ProjectSummary,
    type SavedSearchSummary,
} from '@/lib/organization';
import styles from '../projects.module.css';

export default function ProjectDetailPage() {
    const params = useParams<{ projectId: string }>();
    const projectId = String(params.projectId);
    const [project, setProject] = useState<ProjectSummary | null>(null);
    const [lists, setLists] = useState<ListSummary[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearchSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [newListName, setNewListName] = useState('');
    const [creatingList, setCreatingList] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [projectItem, listItems, savedSearchItems] = await Promise.all([
                fetchProject(projectId),
                fetchProjectLists(projectId),
                fetchSavedSearches(projectId),
            ]);
            setProject(projectItem);
            setLists(listItems);
            setSavedSearches(savedSearchItems);
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
        } finally {
            setCreatingList(false);
        }
    }

    return (
        <section className={styles.page}>
            {loading ? (
                <div className={styles.emptyState}>
                    <span className="tahoe-spinner" />
                    <p>Loading project…</p>
                </div>
            ) : null}

            {!loading && project ? (
                <>
                    <header className={styles.header}>
                        <div>
                            <span className="tahoe-eyebrow">Project workspace</span>
                            <h1 className={styles.title}>{project.name}</h1>
                            <div className={styles.pills}>
                                <span className={styles.pill}>{lists.length} list{lists.length === 1 ? '' : 's'}</span>
                                <span className={styles.pill}>{savedSearches.length} saved search{savedSearches.length === 1 ? '' : 'es'}</span>
                            </div>
                        </div>
                        <Link href="/dashboard/projects" className="tahoe-button-secondary">
                            Back to projects
                        </Link>
                    </header>

                    <div className={styles.splitGrid}>
                        <div className={styles.grid}>
                            <div className={styles.formCard}>
                                <Flex direction="column" gap="3">
                                    <Text size="2" weight="medium">Create a list inside this project</Text>
                                    <Flex gap="3" wrap="wrap">
                                        <TextField.Root
                                            size="3"
                                            style={{ minWidth: 240, flex: 1 }}
                                            placeholder="Outreach Round 1"
                                            value={newListName}
                                            onChange={(event) => setNewListName(event.target.value)}
                                        />
                                        <Button size="3" onClick={() => void handleCreateList()} disabled={creatingList || !newListName.trim()}>
                                            {creatingList ? 'Creating…' : 'Create list'}
                                        </Button>
                                    </Flex>
                                </Flex>
                            </div>

                            <Card className={styles.card}>
                                <Flex direction="column" gap="4">
                                    <Text as="div" size="3" weight="medium">Lists</Text>
                                    {lists.length === 0 ? (
                                        <Text size="2" color="gray">No lists yet.</Text>
                                    ) : (
                                        lists.map((list) => (
                                            <Flex key={list.id} justify="between" align="center" wrap="wrap" gap="3">
                                                <div>
                                                    <Text as="div" size="2" weight="medium">{list.name}</Text>
                                                    <Text as="div" size="2" color="gray">
                                                        {list.candidate_count} candidate{list.candidate_count === 1 ? '' : 's'}
                                                    </Text>
                                                </div>
                                                <Link href={`/dashboard/projects/lists/${list.id}`} className="tahoe-button-secondary">
                                                    Open list
                                                </Link>
                                            </Flex>
                                        ))
                                    )}
                                </Flex>
                            </Card>
                        </div>

                        <Card className={styles.card}>
                            <Flex direction="column" gap="4">
                                <Text as="div" size="3" weight="medium">Saved searches</Text>
                                {savedSearches.length === 0 ? (
                                    <Text size="2" color="gray">
                                        No saved searches are attached to this project yet.
                                    </Text>
                                ) : (
                                    savedSearches.map((savedSearch) => (
                                        <div key={savedSearch.id}>
                                            <Text as="div" size="2" weight="medium">{savedSearch.name}</Text>
                                            <Text as="div" size="2" color="gray">{savedSearch.prompt}</Text>
                                        </div>
                                    ))
                                )}
                                <Link href="/dashboard/search/saved-searches" className="tahoe-button-secondary">
                                    Manage saved searches
                                </Link>
                            </Flex>
                        </Card>
                    </div>
                </>
            ) : null}
        </section>
    );
}
