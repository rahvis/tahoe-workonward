'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { TextField } from '@/components/ui/tahoe-ui';
import { buildZones, detectTimezone, rankZones, type ZoneMeta } from '@/lib/timezones';
import styles from './timezone-picker.module.css';

const MAX_RESULTS = 5;

// Searchable timezone combobox. Modeled on the address-autocomplete pattern (keyboard nav + ARIA +
// listbox), but synchronous over an in-memory IANA list. The stored value is always a valid IANA id:
// the user must pick from the list, and a half-typed query reverts on blur.
export function TimezonePicker({
    value,
    onChange,
    id,
    placeholder = 'Search city, region, or GMT offset',
    disabled,
}: {
    value: string;
    onChange: (timezone: string) => void;
    id?: string;
    placeholder?: string;
    disabled?: boolean;
}) {
    const [query, setQuery] = useState(value);
    const [prevValue, setPrevValue] = useState(value);
    const [focused, setFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    // Detected zone only influences the empty-query suggestion order (the listbox is never rendered
    // during SSR since it requires focus), so a lazy initial read is hydration-safe.
    const [detected] = useState<string | null>(() => detectTimezone());
    const valueRef = useRef(value);
    const listId = id ? `${id}-tz-list` : 'tz-list';

    // Reset the editable query when the external value changes (e.g. the modal switches to a
    // different mailbox) — the render-time "adjust state on prop change" pattern, no effect needed.
    if (value !== prevValue) {
        setPrevValue(value);
        setQuery(value);
    }

    // Keep the latest committed value available to the blur-revert closure.
    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    const zones = useMemo<ZoneMeta[]>(() => buildZones(new Date(), value), [value]);

    // Treat "query unchanged from the stored value" as an empty search so focusing shows the
    // detected + common-zone suggestions rather than only the current zone.
    const searchTerm = query.trim() === value.trim() ? '' : query;
    const matches = useMemo(
        () => rankZones(searchTerm, zones, { limit: MAX_RESULTS, detected }),
        [searchTerm, zones, detected],
    );

    const showList = focused && matches.length > 0;
    const valueRecognized = value === '' || zones.some((zone) => zone.id === value);

    function selectZone(zone: ZoneMeta) {
        setQuery(zone.id);
        valueRef.current = zone.id;
        onChange(zone.id);
        setFocused(false);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (!showList) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const zone = matches[activeIndex];
            if (zone) selectZone(zone);
        } else if (event.key === 'Escape') {
            setFocused(false);
        }
    }

    return (
        <div className={styles.wrap}>
            <TextField.Root
                size="3"
                id={id}
                value={query}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="off"
                role="combobox"
                aria-expanded={showList}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={showList ? `${listId}-opt-${activeIndex}` : undefined}
                onFocus={() => {
                    setFocused(true);
                    setActiveIndex(0);
                }}
                onBlur={() =>
                    window.setTimeout(() => {
                        setFocused(false);
                        // Revert any uncommitted text; only an explicit selection updates the value.
                        setQuery(valueRef.current);
                    }, 150)
                }
                onKeyDown={handleKeyDown}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                }}
            />
            {showList ? (
                <div id={listId} className={styles.suggestions} role="listbox">
                    {matches.map((zone, index) => (
                        <button
                            key={zone.id}
                            id={`${listId}-opt-${index}`}
                            type="button"
                            role="option"
                            aria-selected={index === activeIndex}
                            className={index === activeIndex ? styles.suggestionActive : styles.suggestion}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectZone(zone)}
                        >
                            <span className={styles.suggestionMain}>{zone.label}</span>
                            <span className={styles.suggestionSecondary}>
                                {zone.offsetLabel}
                                {zone.abbreviation ? ` · ${zone.abbreviation}` : ''}
                            </span>
                        </button>
                    ))}
                </div>
            ) : null}
            {!valueRecognized ? (
                <span className={styles.hint}>Not a recognized timezone — pick one from the list.</span>
            ) : null}
        </div>
    );
}

export default TimezonePicker;
