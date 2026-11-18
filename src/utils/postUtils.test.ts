import { describe, expect, it } from 'vitest';
import {slugify} from "./postUtils.ts";

describe('slugify', () => {
    it('should convert text to lowercase', () => {
        expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should trim leading and trailing whitespace', () => {
        expect(slugify('  hello world  ')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
        expect(slugify('hello world example')).toBe('hello-world-example');
    });

    it('should replace special characters with hyphens', () => {
        expect(slugify('hello@world!example')).toBe('hello-world-example');
    });

    it('should remove leading and trailing hyphens', () => {
        expect(slugify('!!!hello world!!!')).toBe('hello-world');
    });

    it('should replace consecutive special characters with a single hyphen', () => {
        expect(slugify('hello   @@@   world')).toBe('hello-world');
    });

    it('should preserve numbers', () => {
        expect(slugify('React 19 TypeScript 5')).toBe('react-19-typescript-5');
    });

    it('should return an empty string for empty input', () => {
        expect(slugify('')).toBe('');
    });

    it('should return an empty string for whitespace-only input', () => {
        expect(slugify('   ')).toBe('');
    });

    it('should return an empty string when input contains only special characters', () => {
        expect(slugify('!@#$%^&*()')).toBe('');
    });
});
