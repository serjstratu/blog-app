import { describe, it, expect } from 'vitest';
import {formatDate} from "./dateUtils.ts";

describe('formatDate', () => {
    it('should format a valid date', () => {
        expect(formatDate('2026-11-19T10:30:00')).toBe('19.11.2026 10:30');
    });

    it('should return an em dash when value is null', () => {
        expect(formatDate(null)).toBe('—');
    });

    it('should return an em dash when value is an empty string', () => {
        expect(formatDate('')).toBe('—');
    });

    it('should format date with midnight time', () => {
        expect(formatDate('2026-01-05T00:00:00')).toBe('05.01.2026 00:00');
    });

    it('should format date with single-digit day and month', () => {
        expect(formatDate('2026-02-03T09:05:00')).toBe('03.02.2026 09:05');
    });
});
