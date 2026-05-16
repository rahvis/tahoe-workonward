'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Flex, Text } from '@/components/ui/tahoe-ui';
import { fetchProjects, updateProject, type ProjectSummary } from '@/lib/organization';
import styles from '../projects.module.css';

export default function ArchivedProjectsPage() {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProjects = useCallback(async () => {
        setLoading(true);
        try {
            setProjects(await fetchProjects({ archived: true }));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProjects();
    }, [loadProjects]);

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <Link href="/dashboard/projects" className="tahoe-button-secondary">
                    Back to active projects
                </Link>
            </header>

            {loading ? (
                <div className={styles.emptyState}>
                    <span className="tahoe-spinner" />
                    <p>Loading archived projects…</p>
                </div>
            ) : null}

            {!loading && projects.length === 0 ? (
                <div className={styles.emptyState}>
                    <h2>No archived projects</h2>
                    <p>Projects archived from the active view will appear here.</p>
                </div>
            ) : null}

            <div className={styles.grid}>
                {projects.map((project) => (
                    <Card key={project.id} className={styles.card}>
                        <Flex direction="column" gap="4">
                            <div>
                                <Text as="div" size="4" weight="medium">{project.name}</Text>
                                <Text as="div" size="2" color="gray">
                                    {project.list_count} list{project.list_count === 1 ? '' : 's'}
                                </Text>
                            </div>
                            <Flex justify="end">
                                <Button
                                    size="3"
                                    onClick={() => void updateProject(project.id, { archived: false }).then(loadProjects)}
                                >
                                    Restore
                                </Button>
                            </Flex>
                        </Flex>
                    </Card>
                ))}
            </div>
        </section>
    );
}
