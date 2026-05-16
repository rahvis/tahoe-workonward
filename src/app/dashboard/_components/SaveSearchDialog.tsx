'use client';

import { useEffect, useState } from 'react';
import {
    Button,
    Dialog,
    Flex,
    TahoeSelect,
    Text,
    TextField,
} from '@/components/ui/tahoe-ui';
import {
    createSavedSearch,
    fetchProjects,
    type ProjectSummary,
    type SavedSearchSummary,
} from '@/lib/organization';

interface SaveSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'legacy' | 'langgraph';
    prompt: string;
    structuredFilters: Record<string, unknown>;
    defaultName?: string;
    onSaved?: (savedSearch: SavedSearchSummary) => void | Promise<void>;
}

export default function SaveSearchDialog({
    open,
    onOpenChange,
    mode,
    prompt,
    structuredFilters,
    defaultName,
    onSaved,
}: SaveSearchDialogProps) {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [name, setName] = useState(defaultName || '');
    const [projectId, setProjectId] = useState('');

    useEffect(() => {
        if (!open) return;
        setName(defaultName || prompt.slice(0, 80));
        let cancelled = false;
        async function loadProjects() {
            setLoading(true);
            try {
                const items = await fetchProjects({ archived: false });
                if (cancelled) return;
                setProjects(items);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Unable to load projects.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }
        void loadProjects();
        return () => {
            cancelled = true;
        };
    }, [defaultName, open, prompt]);

    async function handleSave() {
        setSaving(true);
        setError('');
        try {
            const savedSearch = await createSavedSearch({
                name: name.trim() || prompt.slice(0, 80),
                prompt,
                mode,
                structured_filters: structuredFilters,
                project_id: projectId || null,
            });
            await onSaved?.(savedSearch);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save search.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="520px" style={{ padding: 24 }}>
                <Dialog.Title>Save search</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                    Reuse this search prompt and its current filters later from Search &gt; Saved Searches.
                </Dialog.Description>

                <Flex direction="column" gap="4">
                    <Flex direction="column" gap="2">
                        <label className="tahoe-label" htmlFor="save-search-name">Search name</label>
                        <TextField.Root
                            size="3"
                            id="save-search-name"
                            placeholder="Name this search"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </Flex>

                    <Flex direction="column" gap="2">
                        <label className="tahoe-label" htmlFor="save-search-project">Project (optional)</label>
                        <TahoeSelect
                            id="save-search-project"
                            size="3"
                            value={projectId}
                            onChange={(event) => setProjectId(event.target.value)}
                            disabled={loading}
                        >
                            <option value="">Associate with a project</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </TahoeSelect>
                    </Flex>

                    <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">Prompt</Text>
                        <Text size="2" color="gray">{prompt}</Text>
                    </Flex>

                    {error ? (
                        <Text size="2" color="red">
                            {error}
                        </Text>
                    ) : null}
                </Flex>

                <Flex gap="3" justify="end" mt="5">
                    <Dialog.Close>
                        <Button size="3" variant="soft" color="gray">
                            Cancel
                        </Button>
                    </Dialog.Close>
                    <Button size="3" onClick={() => void handleSave()} disabled={saving || !prompt.trim()}>
                        {saving ? 'Saving…' : 'Save search'}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
