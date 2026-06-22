import { describe, expect, test } from 'vitest';

import { buildZones, normalizeOffsetQuery, rankZones } from './timezones';

// Fixed instant so offset-based assertions are deterministic.
const NOW = new Date('2026-06-22T12:00:00Z');
const zones = buildZones(NOW);

describe('buildZones', () => {
    test('includes UTC and common zones', () => {
        const ids = new Set(zones.map((zone) => zone.id));
        expect(ids.has('UTC')).toBe(true);
        expect(ids.has('America/Los_Angeles')).toBe(true);
        expect(ids.has('Asia/Tokyo')).toBe(true);
    });

    test('UTC reports a zero offset', () => {
        const utc = zones.find((zone) => zone.id === 'UTC');
        expect(utc?.offsetLabel).toBe('GMT+00:00');
        expect(utc?.offsetMinutes).toBe(0);
    });

    test('Tokyo reports +09:00 (no DST)', () => {
        const tokyo = zones.find((zone) => zone.id === 'Asia/Tokyo');
        expect(tokyo?.offsetLabel).toBe('GMT+09:00');
    });

    test('injects a valid but unlisted alias via ensure', () => {
        const withAlias = buildZones(NOW, 'Asia/Calcutta');
        expect(withAlias.some((zone) => zone.id === 'Asia/Calcutta')).toBe(true);
    });

    test('ignores an invalid ensure value', () => {
        const withGarbage = buildZones(NOW, 'Mars/Phobos');
        expect(withGarbage.some((zone) => zone.id === 'Mars/Phobos')).toBe(false);
    });
});

describe('normalizeOffsetQuery', () => {
    test.each([
        ['gmt-7', 'GMT-07:00'],
        ['-7', 'GMT-07:00'],
        ['utc+5:30', 'GMT+05:30'],
        ['+05:30', 'GMT+05:30'],
        ['utc', 'GMT+00:00'],
        ['gmt', 'GMT+00:00'],
    ])('%s -> %s', (input, expected) => {
        expect(normalizeOffsetQuery(input)).toBe(expected);
    });

    test.each(['tokyo', '', '+15', 'gmt+99:99'])('%s -> null', (input) => {
        expect(normalizeOffsetQuery(input)).toBeNull();
    });
});

describe('rankZones', () => {
    test('exact city match ranks first', () => {
        expect(rankZones('los angeles', zones)[0]?.id).toBe('America/Los_Angeles');
    });

    test('city prefix surfaces the zone', () => {
        const results = rankZones('tokyo', zones);
        expect(results[0]?.id).toBe('Asia/Tokyo');
    });

    test('offset query matches zones at that offset', () => {
        // Many zones share +09:00; with enough headroom Tokyo (a +09:00 zone) is included.
        const results = rankZones('gmt+9', zones, { limit: 15 });
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((zone) => zone.id === 'Asia/Tokyo')).toBe(true);
        expect(results[0]?.offsetLabel).toBe('GMT+09:00');
    });

    test('UTC is searchable', () => {
        expect(rankZones('utc', zones).some((zone) => zone.id === 'UTC')).toBe(true);
    });

    test('honors the result limit', () => {
        expect(rankZones('a', zones, { limit: 3 }).length).toBeLessThanOrEqual(3);
    });

    test('empty query surfaces the detected zone first', () => {
        const results = rankZones('', zones, { limit: 5, detected: 'Europe/London' });
        expect(results[0]?.id).toBe('Europe/London');
    });

    test('drops non-matching queries', () => {
        expect(rankZones('zzzznotazone', zones)).toHaveLength(0);
    });
});
