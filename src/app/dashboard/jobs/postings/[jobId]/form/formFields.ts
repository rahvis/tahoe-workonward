// Pure helpers for the application-form builder (kept side-effect-free so the
// serialize/reorder logic is unit-testable).
import type { FormFieldDef, FormFieldType } from '@/lib/jobs';

export const FIELD_TYPES: FormFieldType[] = [
    'text', 'textarea', 'email', 'phone', 'url', 'file', 'location_autocomplete',
    'select', 'radio', 'multiselect', 'yes_no', 'consent', 'section_header',
];

export const TYPES_WITH_OPTIONS: FormFieldType[] = ['select', 'radio', 'multiselect'];

let _counter = 0;
function newId(prefix = 'field'): string {
    _counter += 1;
    return `${prefix}_${Date.now().toString(36)}_${_counter}`;
}

export function blankField(type: FormFieldType = 'text'): FormFieldDef {
    return { id: newId(), type, label: 'New field', required: false, order: 0, options: [], help_text: null, placeholder: null, section: null };
}

export function screeningQuestion(): FormFieldDef {
    return { ...blankField('textarea'), label: 'Screening question' };
}

/** Re-number `order` to match list position (1-based) and trim labels/options. */
export function normalizeFields(fields: FormFieldDef[]): FormFieldDef[] {
    return fields.map((f, i) => ({
        ...f,
        label: (f.label ?? '').trim() || 'Untitled field',
        order: i + 1,
        options: (f.options ?? []).map((o) => o.trim()).filter(Boolean),
    }));
}

export function moveField(fields: FormFieldDef[], index: number, dir: -1 | 1): FormFieldDef[] {
    const target = index + dir;
    if (target < 0 || target >= fields.length) return fields;
    const next = fields.slice();
    [next[index], next[target]] = [next[target], next[index]];
    return normalizeFields(next);
}

export const DIVERSITY_FIELDS: FormFieldDef[] = [
    { id: 'div_header', type: 'section_header', label: 'Diversity Survey (optional)', required: false, order: 0, options: [], help_text: 'Voluntary; not used in hiring decisions.', placeholder: null, section: 'diversity' },
    { id: 'div_age', type: 'radio', label: 'What is your current age?', required: false, order: 0, options: ['Under 30', '30-39', '40-49', '50-59', '60 or older', 'I prefer not to answer'], help_text: null, placeholder: null, section: 'diversity' },
    { id: 'div_gender', type: 'radio', label: 'What is your gender identity?', required: false, order: 0, options: ['Man', 'Woman', 'Non-Binary', 'Another Gender Identity', 'I prefer not to answer'], help_text: null, placeholder: null, section: 'diversity' },
    { id: 'div_ethnicity', type: 'multiselect', label: 'Which ethnicity(ies) do you identify with?', required: false, order: 0, options: ['Asian or Asian American', 'Black or African American', 'Hispanic or Latine', 'Indigenous or Native American', 'Native Hawaiian or Other Pacific Islander', 'White', 'Other', 'I prefer not to answer'], help_text: null, placeholder: null, section: 'diversity' },
];

export function hasDiversity(fields: FormFieldDef[]): boolean {
    return fields.some((f) => f.section === 'diversity');
}

export function withoutDiversity(fields: FormFieldDef[]): FormFieldDef[] {
    return normalizeFields(fields.filter((f) => f.section !== 'diversity'));
}

export function withDiversity(fields: FormFieldDef[]): FormFieldDef[] {
    if (hasDiversity(fields)) return fields;
    return normalizeFields([...fields, ...DIVERSITY_FIELDS]);
}
