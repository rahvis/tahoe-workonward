// Shared project color palette. The backend defaults a project's color to
// DEFAULT_PROJECT_COLOR; the swatches below are the choices offered in the
// create/edit dialogs across the Projects surfaces.
export const DEFAULT_PROJECT_COLOR = '#202020';

export const PROJECT_COLORS = [
    '#202020',
    '#FF682C',
    '#2563EB',
    '#7C3AED',
    '#16A34A',
    '#D97706',
    '#DC2626',
    '#0891B2',
];

// Human-readable names so the swatch aria-labels announce "Use Orange" rather
// than the raw hex code to screen-reader users.
const COLOR_NAMES: Record<string, string> = {
    '#202020': 'Charcoal',
    '#FF682C': 'Orange',
    '#2563EB': 'Blue',
    '#7C3AED': 'Violet',
    '#16A34A': 'Green',
    '#D97706': 'Amber',
    '#DC2626': 'Red',
    '#0891B2': 'Cyan',
};

export function colorName(color: string): string {
    return COLOR_NAMES[color] ?? color;
}
