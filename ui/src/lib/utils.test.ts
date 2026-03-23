import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
    it('merges class names correctly', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
        expect(cn('base', true && 'active', false && 'hidden')).toBe('base active');
    });

    it('handles undefined and null values', () => {
        expect(cn('base', undefined, null, 'active')).toBe('base active');
    });

    it('handles empty strings', () => {
        expect(cn('base', '', 'active')).toBe('base active');
    });

    it('resolves Tailwind conflicts - padding', () => {
        const result = cn('px-2', 'px-4');
        expect(result).toBe('px-4');
    });

    it('resolves Tailwind conflicts - colors', () => {
        const result = cn('bg-red-500', 'bg-blue-500');
        expect(result).toBe('bg-blue-500');
    });

    it('handles complex class combinations', () => {
        const result = cn(
            'flex items-center',
            'p-4 bg-card',
            { 'border-red-500': true, 'border-green-500': false },
        );
        expect(result).toContain('flex');
        expect(result).toContain('items-center');
        expect(result).toContain('p-4');
        expect(result).toContain('border-red-500');
        expect(result).not.toContain('border-green-500');
    });

    it('handles arrays of classes', () => {
        const result = cn(['foo', 'bar'], 'baz');
        expect(result).toBe('foo bar baz');
    });
});
