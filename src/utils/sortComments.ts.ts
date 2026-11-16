import dayjs from 'dayjs';
import type { Comment } from '../types';

export const sortCommentsByCreatedAt = (comments: Comment[]): Comment[] =>
    [...comments].sort(
        (first, second) =>
            dayjs(first.createdAt).valueOf() -
            dayjs(second.createdAt).valueOf(),
    );
