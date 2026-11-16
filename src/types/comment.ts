import type { Pagination } from './pagination';

export interface CommentAuthor {
    id: number;
    name?: string;
    username?: string;
    avatar?: string | null;
}

export interface Comment {
    id: number;
    postId: number;
    authorId: number;
    parentId: number | null;
    content: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    replies: Comment[];
    author?: CommentAuthor | null;
    user?: CommentAuthor | null;
    author_name?: string;
}

export interface CommentsResponse {
    data: Comment[];
    pagination: Pagination;
}
