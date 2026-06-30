'use client';

import { useEffect, useId, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
    Button,
    Dialog,
    Flex,
    Text,
    TextField,
} from '@/components/ui/tahoe-ui';
import {
    createList,
    createProject,
    fetchProjectLists,
    fetchProjects,
    importListCandidates,
    type ListSummary,
    type ProjectSummary,
    type SaveToListCandidatePayload,
    type SaveToListResponse,
} from '@/lib/organization';
import styles from './save-to-list-dialog.module.css';

interface SaveToListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidates: SaveToListCandidatePayload[];
    onSaved?: (result: SaveToListResponse, list: ListSummary) => void | Promise<void>;
}

type PickerOption = {
    id: string;
    name: string;
    meta?: string | null;
};

function SearchIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
                d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14 14L11.1 11.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ChevronIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
                d="M4.5 7.125L9 11.625L13.5 7.125"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

type InlinePickerProps = {
    id: string;
    label: string;
    open: boolean;
    disabled?: boolean;
    loading?: boolean;
    valueLabel?: string;
    placeholder: string;
    searchPlaceholder: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    onToggle: () => void;
    options: PickerOption[];
    selectedId: string;
    onSelect: (id: string) => void;
    emptyMessage: string;
    loadingMessage: string;
    panelRef: React.RefObject<HTMLDivElement | null>;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
};

function InlinePicker({
    id,
    label,
    open,
    disabled = false,
    loading = false,
    valueLabel,
    placeholder,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    onToggle,
    options,
    selectedId,
    onSelect,
    emptyMessage,
    loadingMessage,
    panelRef,
    searchInputRef,
}: InlinePickerProps) {
    return (
        <div ref={panelRef} className={styles.inlinePicker}>
            <button
                id={id}
                type="button"
                className={[
                    styles.inlinePickerTrigger,
                    open ? styles.inlinePickerTriggerOpen : '',
                    disabled ? styles.inlinePickerTriggerDisabled : '',
                ].filter(Boolean).join(' ')}
                onClick={onToggle}
                disabled={disabled}
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-controls={`${id}-panel`}
            >
                <span className={valueLabel ? styles.inlinePickerValue : styles.inlinePickerPlaceholder}>
                    {valueLabel || placeholder}
                </span>
                <span className={styles.inlinePickerChevron}>
                    <ChevronIcon />
                </span>
            </button>

            {open ? (
                <div id={`${id}-panel`} className={styles.inlinePickerPanel}>
                    <Text size="2" weight="medium" className={styles.inlinePickerPanelTitle}>
                        {label}
                    </Text>
                    <TextField.Root
                        ref={searchInputRef}
                        size="3"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(event) => onSearchChange(event.target.value)}
                        rootClassName={styles.inlinePickerSearchField}
                    >
                        <TextField.Slot>
                            <span className={styles.inlinePickerSearchIcon}>
                                <SearchIcon />
                            </span>
                        </TextField.Slot>
                    </TextField.Root>

                    <div className={styles.inlinePickerOptions} role="listbox" aria-label={label}>
                        {loading ? (
                            <div className={styles.inlinePickerState}>{loadingMessage}</div>
                        ) : options.length > 0 ? (
                            options.map((option) => {
                                const isSelected = option.id === selectedId;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        className={[
                                            styles.inlinePickerOption,
                                            isSelected ? styles.inlinePickerOptionSelected : '',
                                        ].filter(Boolean).join(' ')}
                                        onClick={() => onSelect(option.id)}
                                    >
                                        <span className={styles.inlinePickerOptionText}>
                                            <span className={styles.inlinePickerOptionName}>{option.name}</span>
                                            {option.meta ? (
                                                <span className={styles.inlinePickerOptionMeta}>{option.meta}</span>
                                            ) : null}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className={[
                                                styles.inlinePickerOptionCheck,
                                                isSelected ? styles.inlinePickerOptionCheckVisible : '',
                                            ].filter(Boolean).join(' ')}
                                        >
                                            ✓
                                        </span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className={styles.inlinePickerState}>{emptyMessage}</div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function filterOptions<T extends PickerOption>(options: T[], query: string) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => {
        const haystack = [option.name, option.meta ?? ''].join(' ').toLowerCase();
        return haystack.includes(normalizedQuery);
    });
}

function resetPickerState(setter: Dispatch<SetStateAction<boolean>>, searchSetter: Dispatch<SetStateAction<string>>) {
    setter(false);
    searchSetter('');
}

export default function SaveToListDialog({
    open,
    onOpenChange,
    candidates,
    onSaved,
}: SaveToListDialogProps) {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [lists, setLists] = useState<ListSummary[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedListId, setSelectedListId] = useState<string>('');
    const [newProjectName, setNewProjectName] = useState('');
    const [newListName, setNewListName] = useState('');
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingLists, setLoadingLists] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [projectPickerOpen, setProjectPickerOpen] = useState(false);
    const [listPickerOpen, setListPickerOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');
    const [listSearch, setListSearch] = useState('');
    const projectPickerRef = useRef<HTMLDivElement | null>(null);
    const listPickerRef = useRef<HTMLDivElement | null>(null);
    const projectSearchInputRef = useRef<HTMLInputElement | null>(null);
    const listSearchInputRef = useRef<HTMLInputElement | null>(null);
    const projectPickerId = useId();
    const listPickerId = useId();

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        async function loadProjects() {
            setLoadingProjects(true);
            setError('');
            setProjects([]);
            setLists([]);
            setSelectedProjectId('');
            setSelectedListId('');
            setNewProjectName('');
            setNewListName('');
            setLoadingLists(false);
            setProjectSearch('');
            setListSearch('');
            setProjectPickerOpen(false);
            setListPickerOpen(false);
            try {
                const projectItems = await fetchProjects({ archived: false });
                if (cancelled) return;
                setProjects(projectItems);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Unable to load projects.');
                }
            } finally {
                if (!cancelled) {
                    setLoadingProjects(false);
                }
            }
        }
        void loadProjects();
        return () => {
            cancelled = true;
        };
    }, [open]);

    useEffect(() => {
        if (!open || !selectedProjectId) {
            setLists([]);
            setSelectedListId('');
            setLoadingLists(false);
            return;
        }
        let cancelled = false;
        async function loadLists() {
            setLoadingLists(true);
            setError('');
            try {
                const listItems = await fetchProjectLists(selectedProjectId);
                if (cancelled) return;
                setLists(listItems);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Unable to load lists.');
                }
            } finally {
                if (!cancelled) {
                    setLoadingLists(false);
                }
            }
        }
        void loadLists();
        return () => {
            cancelled = true;
        };
    }, [open, selectedProjectId]);

    useEffect(() => {
        if (!open) return;
        function handlePointerDown(event: MouseEvent) {
            const target = event.target as Node | null;
            if (!target) return;
            if (projectPickerRef.current && !projectPickerRef.current.contains(target)) {
                setProjectPickerOpen(false);
            }
            if (listPickerRef.current && !listPickerRef.current.contains(target)) {
                setListPickerOpen(false);
            }
        }
        document.addEventListener('mousedown', handlePointerDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
        };
    }, [open]);

    useEffect(() => {
        if (projectPickerOpen) {
            projectSearchInputRef.current?.focus();
        }
    }, [projectPickerOpen]);

    useEffect(() => {
        if (listPickerOpen) {
            listSearchInputRef.current?.focus();
        }
    }, [listPickerOpen]);

    const candidateCount = useMemo(() => candidates.length, [candidates.length]);
    const projectOptions = useMemo<PickerOption[]>(
        () =>
            projects.map((project) => ({
                id: project.id,
                name: project.name,
                meta: project.list_count === 1 ? '1 list' : `${project.list_count} lists`,
            })),
        [projects],
    );
    const listOptions = useMemo<PickerOption[]>(
        () =>
            lists.map((list) => ({
                id: list.id,
                name: list.name,
                meta: list.candidate_count === 1 ? '1 candidate' : `${list.candidate_count} candidates`,
            })),
        [lists],
    );
    const filteredProjectOptions = useMemo(
        () => filterOptions(projectOptions, projectSearch),
        [projectOptions, projectSearch],
    );
    const filteredListOptions = useMemo(
        () => filterOptions(listOptions, listSearch),
        [listOptions, listSearch],
    );
    const selectedProject = useMemo(
        () => projects.find((project) => project.id === selectedProjectId) ?? null,
        [projects, selectedProjectId],
    );
    const selectedList = useMemo(
        () => lists.find((list) => list.id === selectedListId) ?? null,
        [lists, selectedListId],
    );

    function handleProjectSelect(projectId: string) {
        setSelectedProjectId(projectId);
        setSelectedListId('');
        setNewProjectName('');
        setProjectSearch('');
        setListSearch('');
        setLists([]);
        setError('');
        setProjectPickerOpen(false);
        setListPickerOpen(false);
    }

    function handleListSelect(listId: string) {
        setSelectedListId(listId);
        setNewListName('');
        setListSearch('');
        setError('');
        setListPickerOpen(false);
    }

    function handleProjectInputChange(value: string) {
        setNewProjectName(value);
        if (value.trim()) {
            setSelectedProjectId('');
            setSelectedListId('');
            setLists([]);
            setListSearch('');
            setError('');
            resetPickerState(setProjectPickerOpen, setProjectSearch);
            resetPickerState(setListPickerOpen, setListSearch);
        }
    }

    function handleListInputChange(value: string) {
        setNewListName(value);
        if (value.trim()) {
            setSelectedListId('');
            setError('');
            resetPickerState(setListPickerOpen, setListSearch);
        }
    }

    async function handleSave() {
        if (candidateCount === 0) return;
        setSaving(true);
        setError('');
        try {
            let projectId = selectedProjectId;
            if (!projectId) {
                if (!newProjectName.trim()) {
                    throw new Error('Choose a project or enter a new project name.');
                }
                const createdProject = await createProject({ name: newProjectName.trim() });
                projectId = createdProject.id;
                setProjects((current) => [createdProject, ...current]);
                setSelectedProjectId(projectId);
            }

            let targetList = lists.find((item) => item.id === selectedListId) ?? null;
            if (!targetList) {
                if (!newListName.trim()) {
                    throw new Error('Choose a list or enter a new list name.');
                }
                targetList = await createList(projectId, { name: newListName.trim() });
                setLists((current) => [targetList!, ...current]);
                setSelectedListId(targetList.id);
            }

            const result = await importListCandidates(targetList.id, candidates);
            await onSaved?.(result, targetList);
            onOpenChange(false);
            setNewProjectName('');
            setNewListName('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save candidates to the selected list.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="560px" style={{ padding: 24 }}>
                <>
                        <Dialog.Title>Save candidates to a list</Dialog.Title>
                        <Dialog.Description size="2" mb="4">
                            Move selected preview candidates into a durable project list so they can be reused across Tahoe.
                        </Dialog.Description>

                        <Flex direction="column" gap="4">
                            <Flex direction="column" gap="2">
                                <label className="tahoe-label" htmlFor={projectPickerId}>Project</label>
                                <InlinePicker
                                    id={projectPickerId}
                                    label="Choose a project"
                                    open={projectPickerOpen}
                                    disabled={loadingProjects}
                                    loading={loadingProjects}
                                    valueLabel={selectedProject?.name}
                                    placeholder={loadingProjects ? 'Loading projects…' : 'Choose a project'}
                                    searchPlaceholder="Search projects"
                                    searchValue={projectSearch}
                                    onSearchChange={setProjectSearch}
                                    onToggle={() => {
                                        setListPickerOpen(false);
                                        setProjectPickerOpen((current) => !current);
                                    }}
                                    options={filteredProjectOptions}
                                    selectedId={selectedProjectId}
                                    onSelect={handleProjectSelect}
                                    emptyMessage={projectSearch.trim() ? 'No matching projects.' : 'No projects available yet.'}
                                    loadingMessage="Loading projects…"
                                    panelRef={projectPickerRef}
                                    searchInputRef={projectSearchInputRef}
                                />
                                <TextField.Root
                                    size="3"
                                    placeholder="Or create a new project"
                                    value={newProjectName}
                                    onChange={(event) => handleProjectInputChange(event.target.value)}
                                />
                            </Flex>

                            <Flex direction="column" gap="2">
                                <label className="tahoe-label" htmlFor={listPickerId}>List</label>
                                <InlinePicker
                                    id={listPickerId}
                                    label="Choose a list"
                                    open={listPickerOpen}
                                    disabled={!selectedProjectId || loadingProjects}
                                    loading={loadingLists}
                                    valueLabel={selectedList?.name}
                                    placeholder={
                                        !selectedProjectId
                                            ? 'Choose a project first'
                                            : loadingLists
                                                ? 'Loading lists…'
                                                : 'Choose a list'
                                    }
                                    searchPlaceholder="Search lists"
                                    searchValue={listSearch}
                                    onSearchChange={setListSearch}
                                    onToggle={() => {
                                        if (!selectedProjectId || loadingProjects) return;
                                        setProjectPickerOpen(false);
                                        setListPickerOpen((current) => !current);
                                    }}
                                    options={filteredListOptions}
                                    selectedId={selectedListId}
                                    onSelect={handleListSelect}
                                    emptyMessage={
                                        listSearch.trim()
                                            ? 'No matching lists in this project.'
                                            : 'No lists in this project yet.'
                                    }
                                    loadingMessage="Loading lists…"
                                    panelRef={listPickerRef}
                                    searchInputRef={listSearchInputRef}
                                />
                                <TextField.Root
                                    size="3"
                                    placeholder="Or create a new list"
                                    value={newListName}
                                    onChange={(event) => handleListInputChange(event.target.value)}
                                />
                            </Flex>

                            <Flex direction="column" gap="1">
                                <Text size="2" weight="medium">
                                    {candidateCount} candidate{candidateCount === 1 ? '' : 's'} selected
                                </Text>
                                <Text size="2" color="gray">
                                    Tahoe will keep the originating search prompt, query hash, preview page, and save timestamp with each imported candidate.
                                </Text>
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
                            <Button
                                size="3"
                                onClick={() => void handleSave()}
                                disabled={saving || candidateCount === 0}
                            >
                                {saving ? 'Saving…' : 'Save candidates'}
                            </Button>
                        </Flex>
                    </>
            </Dialog.Content>
        </Dialog.Root>
    );
}
