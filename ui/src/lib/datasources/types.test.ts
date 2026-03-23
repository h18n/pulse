import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseRelativeTime, calculateStep, interpolateVariables } from './types';

describe('DataSource Types Utilities', () => {

    describe('parseRelativeTime', () => {
        const mockNow = new Date('2023-01-01T12:00:00Z').getTime();

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(mockNow);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should handle "now"', () => {
            expect(parseRelativeTime('now')).toBe(mockNow);
        });

        it('should handle "now-1h"', () => {
            const expected = mockNow - 60 * 60 * 1000;
            expect(parseRelativeTime('now-1h')).toBe(expected);
        });

        it('should handle "now-1d"', () => {
            const expected = mockNow - 24 * 60 * 60 * 1000;
            expect(parseRelativeTime('now-1d')).toBe(expected);
        });

        it('should handle "now-1w"', () => {
            const expected = mockNow - 7 * 24 * 60 * 60 * 1000;
            expect(parseRelativeTime('now-1w')).toBe(expected);
        });

        it('should handle "now-10m"', () => {
            const expected = mockNow - 10 * 60 * 1000;
            expect(parseRelativeTime('now-10m')).toBe(expected);
        });

        it('should handle "now-30s"', () => {
            const expected = mockNow - 30 * 1000;
            expect(parseRelativeTime('now-30s')).toBe(expected);
        });

        it('should handle "now/d" (start of day)', () => {
            const date = new Date(mockNow);
            date.setHours(0, 0, 0, 0);
            expect(parseRelativeTime('now/d')).toBe(date.getTime());
        });

        it('should handle "now/w" (start of week)', () => {
            const date = new Date(mockNow);
            // Sunday is 0
            date.setDate(date.getDate() - date.getDay());
            date.setHours(0, 0, 0, 0);
            expect(parseRelativeTime('now/w')).toBe(date.getTime());
        });

        it('should handle "now/M" (start of month)', () => {
            const date = new Date(mockNow);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            expect(parseRelativeTime('now/M')).toBe(date.getTime());
        });

        it('should handle ISO date string', () => {
            const iso = '2022-01-01T00:00:00Z';
            expect(parseRelativeTime(iso)).toBe(Date.parse(iso));
        });

        it('should default to now for invalid strings', () => {
            expect(parseRelativeTime('invalid')).toBe(mockNow);
        });
    });

    describe('calculateStep', () => {
        it('should calculate step correctly', () => {
            const from = 1000;
            const to = 11000; // 10 seconds
            const maxPoints = 10;
            // (10 / 10) = 1, but min is 15
            expect(calculateStep(from, to, maxPoints)).toBe(15);
        });

        it('should return larger step for large ranges', () => {
            const from = 0;
            const to = 3600 * 1000; // 1 hour = 3600 seconds
            const maxPoints = 10;
            // 3600 / 10 = 360
            expect(calculateStep(from, to, maxPoints)).toBe(360);
        });
    });

    describe('interpolateVariables', () => {
        it('should replace single variable', () => {
            const query = 'select * from table where id = $id';
            const variables = { id: '123' };
            expect(interpolateVariables(query, variables)).toBe('select * from table where id = 123');
        });

        it('should replace array variable with pipe separator', () => {
            const query = 'job =~ "$job"';
            const variables = { job: ['prom', 'node'] };
            expect(interpolateVariables(query, variables)).toBe('job =~ "prom|node"');
        });

        it('should handle multiple occurrences', () => {
            const query = '$var and $var';
            const variables = { var: 'val' };
            expect(interpolateVariables(query, variables)).toBe('val and val');
        });
    });
});
