import { describe, expect, it } from 'vitest';
import type { FormFieldDef } from '@/lib/jobs';
import {
    blankField,
    hasDiversity,
    moveField,
    normalizeFields,
    withDiversity,
    withoutDiversity,
} from './formFields';

const sample: FormFieldDef[] = [
    { id: 'a', type: 'text', label: '  Name  ', required: true, order: 9, options: [], help_text: null, placeholder: null, section: null },
    { id: 'b', type: 'select', label: 'Pick', required: false, order: 3, options: [' x ', '', 'y'], help_text: null, placeholder: null, section: null },
];

describe('normalizeFields', () => {
    it('renumbers order to 1-based position and trims labels/options', () => {
        const out = normalizeFields(sample);
        expect(out.map((f) => f.order)).toEqual([1, 2]);
        expect(out[0].label).toBe('Name');
        expect(out[1].options).toEqual(['x', 'y']); // blank dropped, trimmed
    });

    it('defaults an empty label', () => {
        const out = normalizeFields([{ ...blankField(), label: '   ' }]);
        expect(out[0].label).toBe('Untitled field');
    });

    it('round-trips a normalized list unchanged', () => {
        const once = normalizeFields(sample);
        expect(normalizeFields(once)).toEqual(once);
    });
});

describe('moveField', () => {
    it('swaps adjacent fields and renumbers', () => {
        const moved = moveField(normalizeFields(sample), 0, 1);
        expect(moved.map((f) => f.id)).toEqual(['b', 'a']);
        expect(moved.map((f) => f.order)).toEqual([1, 2]);
    });

    it('is a no-op at the boundaries', () => {
        const norm = normalizeFields(sample);
        expect(moveField(norm, 0, -1)).toBe(norm);
        expect(moveField(norm, 1, 1)).toBe(norm);
    });
});

describe('diversity toggle', () => {
    it('adds and removes the diversity section idempotently', () => {
        const base = normalizeFields(sample);
        expect(hasDiversity(base)).toBe(false);
        const withDiv = withDiversity(base);
        expect(hasDiversity(withDiv)).toBe(true);
        expect(withDiversity(withDiv)).toBe(withDiv); // idempotent (same ref)
        const removed = withoutDiversity(withDiv);
        expect(hasDiversity(removed)).toBe(false);
        expect(removed.map((f) => f.id)).toEqual(['a', 'b']);
    });
});
