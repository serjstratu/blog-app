import type { Comment } from '../types';

export const sortCommentsByCreatedAt = (comments: Comment[]): Comment[] =>
    [...comments].sort(
        (first, second) =>
            new Date(first.createdAt).getTime() -
            new Date(second.createdAt).getTime(),
    );
