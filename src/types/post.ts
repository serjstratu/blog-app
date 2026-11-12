import type {Pagination} from "./pagination.ts";

export interface PostsResponse {
    data: Post[];
    pagination: Pagination;
}

export interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    image: string | null;
    status: string;
    categoryId: number | null;
    tags: string[];
    views: number;
    likes: number;
    dislikes: number;
    commentsCount: number;
    isFeatured: boolean;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    userId: number;
}