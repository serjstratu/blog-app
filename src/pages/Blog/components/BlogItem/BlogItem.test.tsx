import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Post } from '../../../../types';
import BlogItem from './BlogItem';

const post: Post = {
    id: 3,
    title: 'Component design',
    slug: 'component-design',
    content: 'Full content text',
    excerpt: 'A short excerpt',
    image: 'https://example.com/post.webp',
    status: 'published',
    categoryId: null,
    tags: ['react hooks', 'ui'],
    views: 1245,
    likes: 17,
    dislikes: 2,
    commentsCount: 4,
    isFeatured: true,
    publishedAt: '2026-11-20T10:00:00.000Z',
    createdAt: '2026-11-19T10:00:00.000Z',
    updatedAt: '2026-11-20T10:00:00.000Z',
    userId: 11,
};

const renderItem = (item: Post) => render(
    <MemoryRouter>
        <BlogItem post={item} />
    </MemoryRouter>,
);

describe('BlogItem', () => {
    it('renders post media, metadata, links, tags, excerpt, and stats', () => {
        renderItem(post);

        expect(screen.getByTestId('blog-post-card')).toBeInTheDocument();
        expect(screen.getByTestId('blog-post-image')).toHaveAttribute('src', post.image);
        expect(screen.getByTestId('blog-post-featured')).toHaveTextContent('Featured');
        expect(screen.getByTestId('blog-post-date')).toHaveAttribute('dateTime', post.publishedAt);
        expect(screen.getByTestId('blog-post-date')).toHaveTextContent('20.11.2026');
        expect(screen.getByTestId('blog-post-title')).toHaveAttribute('href', '/post/component-design');
        expect(screen.getByTestId('blog-post-excerpt')).toHaveTextContent(post.excerpt!);
        expect(screen.getAllByTestId('blog-post-tag')).toHaveLength(2);
        expect(screen.getAllByTestId('blog-post-tag')[0]).toHaveAttribute('href', '/blog?tag=react%20hooks');
        expect(screen.getByTestId('blog-post-stats')).toHaveTextContent('1,245 views17 likes4 comments');
    });

    it('uses content and creation date when optional fields are empty', () => {
        renderItem({
            ...post,
            image: null,
            excerpt: null,
            tags: [],
            isFeatured: false,
            publishedAt: null,
        });

        expect(screen.queryByTestId('blog-post-image')).not.toBeInTheDocument();
        expect(screen.queryByTestId('blog-post-featured')).not.toBeInTheDocument();
        expect(screen.getByTestId('blog-post-date')).toHaveAttribute('dateTime', post.createdAt);
        expect(screen.getByTestId('blog-post-excerpt')).toHaveTextContent(post.content);
        expect(screen.queryByTestId('blog-post-tags')).not.toBeInTheDocument();
    });
});
