'use client';

import { useEffect, useId, useRef, useState } from 'react';
import publicStyles from '../public.module.css';
import styles from './location-autocomplete.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Searchable location field for the apply form. Reuses the public locations
 * autocomplete (Google Places) so typing a city resolves to a full
 * "City, Region, Country" string. If the user types only a country we keep the
 * "include your city" hint (rendered by the form's help text).
 */
export default function LocationAutocomplete({
    value, onChange, placeholder, required, ariaLabel,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    required?: boolean;
    ariaLabel?: string;
}) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const boxRef = useRef<HTMLDivElement>(null);
    const skipNext = useRef(false); // don't re-query right after a pick
    const listId = useId();

    useEffect(() => {
        if (skipNext.current) { skipNext.current = false; return; }
        const q = value.trim();
        const ctrl = new AbortController();
        // All state updates happen in this async callback (not synchronously in
        // the effect body) so they don't trigger cascading renders.
        const handle = setTimeout(async () => {
            if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
            try {
                const res = await fetch(`${API}/api/public/jobs/locations/autocomplete?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
                if (!res.ok) return;
                const data = await res.json();
                const preds: string[] = (data.predictions ?? [])
                    .map((p: { description?: string }) => p.description)
                    .filter(Boolean);
                setSuggestions(preds);
                setOpen(preds.length > 0);
                setActive(-1);
            } catch { /* aborted / offline → no suggestions */ }
        }, 250);
        return () => { clearTimeout(handle); ctrl.abort(); };
    }, [value]);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const pick = (s: string) => { skipNext.current = true; onChange(s); setOpen(false); setSuggestions([]); };

    return (
        <div className={styles.wrap} ref={boxRef}>
            <input
                className={publicStyles.input}
                style={{ width: '100%' }}
                type="text"
                value={value}
                placeholder={placeholder}
                required={required}
                aria-label={ariaLabel}
                autoComplete="off"
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => { if (suggestions.length) setOpen(true); }}
                onKeyDown={(e) => {
                    if (!open) return;
                    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(suggestions[active]); }
                    else if (e.key === 'Escape') setOpen(false);
                }}
            />
            {open && (
                <ul className={styles.list} role="listbox" id={listId}>
                    {suggestions.map((s, i) => (
                        <li
                            key={s}
                            role="option"
                            aria-selected={i === active}
                            className={`${styles.item} ${i === active ? styles.itemActive : ''}`}
                            onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
