'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Card, Flex, Text, TextField } from '@/components/ui/tahoe-ui';
import { fetchLists, type ListSummary } from '@/lib/organization';
import styles from '../projects.module.css';

export default function ListsDirectoryPage() {
    const [lists, setLists] = useState<ListSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');

    const loadLists = useCallback(async () => {
        setLoading(true);
        try {
            setLists(await fetchLists({ search }));
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        void loadLists();
    }, [loadLists]);

    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(searchInput), 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <TextField.Root
                    size="3"
                    style={{ minWidth: 280 }}
                    placeholder="Search lists"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                />
            </header>

            {loading ? (
                <div className={styles.emptyState}>
                    <span className="tahoe-spinner" />
                    <p>Loading lists…</p>
                </div>
            ) : null}

            {!loading && lists.length === 0 ? (
                <div className={styles.emptyState}>
                    <h2>No lists found</h2>
                    <p>Create a project, then save search candidates into a list to make it operational.</p>
                </div>
            ) : null}

            <div className={styles.grid}>
                {lists.map((list) => (
                    <Card key={list.id} className={styles.card}>
                        <Flex direction="column" gap="3">
                            <Text as="div" size="4" weight="medium">{list.name}</Text>
                            <Text as="div" size="2" color="gray">
                                {list.project_name || 'Project not found'} · {list.candidate_count} candidate{list.candidate_count === 1 ? '' : 's'}
                            </Text>
                            <Flex justify="end">
                                <Link href={`/dashboard/projects/lists/${list.id}`} className="tahoe-button">
                                    Open list
                                </Link>
                            </Flex>
                        </Flex>
                    </Card>
                ))}
            </div>
        </section>
    );
}
