import { describe, it, expect } from 'vitest';
import type { Comment } from '../types';
import {sortCommentsByCreatedAt} from "./СommentsUtils.ts";

describe('sortCommentsByCreatedAt', () => {
    const comments = [
        { id: 1, createdAt: '2026-11-19T12:00:00' },
        { id: 2, createdAt: '2026-11-17T10:00:00' },
        { id: 3, createdAt: '2026-11-18T15:00:00' },
    ] as Comment[];

    it('should sort comments by createdAt in ascending order', () => {
        const result = sortCommentsByCreatedAt(comments);

        expect(result.map(({ id }) => id)).toEqual([2, 3, 1]);
    });

    it('should not mutate the original array', () => {
        const original = [...comments];

        sortCommentsByCreatedAt(comments);

        expect(comments).toEqual(original);
    });

    it('should return a new array', () => {
        const result = sortCommentsByCreatedAt(comments);

        expect(result).not.toBe(comments);
    });

    it('should return an empty array when comments are empty', () => {
        expect(sortCommentsByCreatedAt([])).toEqual([]);
    });

    it('should return the same order when comments are already sorted', () => {
        const sortedComments = [
            { id: 1, createdAt: '2026-11-17T10:00:00' },
            { id: 2, createdAt: '2026-11-18T10:00:00' },
            { id: 3, createdAt: '2026-11-19T10:00:00' },
        ] as Comment[];

        const result = sortCommentsByCreatedAt(sortedComments);

        expect(result.map(({ id }) => id)).toEqual([1, 2, 3]);
    });

    it('should handle comments with identical createdAt values', () => {
        const sameDateComments = [
            { id: 1, createdAt: '2026-11-19T10:00:00' },
            { id: 2, createdAt: '2026-11-19T10:00:00' },
        ] as Comment[];

        const result = sortCommentsByCreatedAt(sameDateComments);

        expect(result.map(({ id }) => id)).toEqual([1, 2]);
    });
});
