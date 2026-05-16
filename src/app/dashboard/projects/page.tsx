'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Flex, Text, TextField } from '@/components/ui/tahoe-ui';
import {
    archiveProject,
    createProject,
    fetchProjects,
    type ProjectSummary,
} from '@/lib/organization';
import styles from './projects.module.css';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [newProjectName, setNewProjectName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadProjects = useCallback(async () => {
        setLoading(true);
        try {
            const items = await fetchProjects({ archived: false });
            setProjects(items);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProjects();
    }, [loadProjects]);

    async function handleCreateProject() {
        if (!newProjectName.trim()) return;
        setSubmitting(true);
        try {
            await createProject({ name: newProjectName.trim() });
            setNewProjectName('');
            await loadProjects();
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <Link href="/dashboard/projects/lists" className="tahoe-button-secondary">
                    View all lists
                </Link>
            </header>

            <div className={styles.formCard}>
                <Flex direction="column" gap="3">
                    <Text size="2" weight="medium">Create a new project</Text>
                    <Flex gap="3" wrap="wrap">
                        <TextField.Root
                            size="3"
                            style={{ minWidth: 280, flex: 1 }}
                            placeholder="Series-B Backend Engineers"
                            value={newProjectName}
                            onChange={(event) => setNewProjectName(event.target.value)}
                        />
                        <Button size="3" onClick={() => void handleCreateProject()} disabled={submitting || !newProjectName.trim()}>
                            {submitting ? 'Creating…' : 'Create project'}
                        </Button>
                    </Flex>
                </Flex>
            </div>

            {loading ? (
                <div className={styles.emptyState}>
                    <span className="tahoe-spinner" />
                    <p>Loading projects…</p>
                </div>
            ) : null}

            {!loading && projects.length === 0 ? (
                <div className={styles.emptyState}>
                    <h2>No projects yet</h2>
                    <p>Create a project first, then save preview candidates into lists inside it.</p>
                </div>
            ) : null}

            <div className={styles.grid}>
                {projects.map((project) => (
                    <Card key={project.id} className={styles.card}>
                        <Flex direction="column" gap="4">
                            <div>
                                <Text as="div" size="4" weight="medium">{project.name}</Text>
                                <div className={styles.summaryRow}>
                                    <span className={styles.metric}>{project.list_count} list{project.list_count === 1 ? '' : 's'}</span>
                                    <span className={styles.metric}>Starter workspace</span>
                                </div>
                            </div>

                            <Flex justify="between" align="center" wrap="wrap" gap="3">
                                <Text size="2" color="gray">
                                    Created {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'recently'}
                                </Text>
                                <Flex gap="2" wrap="wrap">
                                    <Link href={`/dashboard/projects/${project.id}`} className="tahoe-button">
                                        Open project
                                    </Link>
                                    <Button
                                        size="3"
                                        variant="soft"
                                        color="gray"
                                        onClick={() => void archiveProject(project.id).then(loadProjects)}
                                    >
                                        Archive
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
