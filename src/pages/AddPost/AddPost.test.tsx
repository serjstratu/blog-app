import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import AddPost from './AddPost';
import { renderWithQueryClient } from '../../test/renderWithQueryClient';
import type { CreatePostInput } from '../../types';

const mocks = vi.hoisted(() => ({
    useAuth: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
}));

const CreatedPostRoute = () => {
    const location = useLocation();
    const createdPost = (location.state as { createdPost?: { id: number } } | null)?.createdPost;
    return <div data-testid="post-page" data-created-post-id={createdPost?.id} data-post-path={location.pathname}>Post details</div>;
};

vi.mock('../../providers/AuthProvider', () => ({
    useAuth: mocks.useAuth,
}));

vi.mock('react-toastify', () => ({
    toast: {
        success: mocks.toastSuccess,
        error: mocks.toastError,
    },
}));

describe('AddPost', () => {
    const mockCreatePost = vi.fn();

    const editorUser = {
        id: 1,
        roles: ['editor'],
    };

    const renderComponent = (user = editorUser) => {
        mocks.useAuth.mockReturnValue({
            user,
            createPost: mockCreatePost,
        });

        return renderWithQueryClient(
            <MemoryRouter initialEntries={['/add-post']}>
                <Routes>
                    <Route path="/add-post" element={<AddPost />} />
                    <Route
                        path="/user/:id"
                        element={<div data-testid="profile-page">Profile</div>}
                    />
                    <Route
                        path="/post/:id"
                        element={<CreatedPostRoute />}
                    />
                    <Route
                        path="/blog"
                        element={<div data-testid="blog-page">Blog</div>}
                    />
                    <Route
                        path="/"
                        element={<div data-testid="home-page">Home</div>}
                    />
                </Routes>
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockCreatePost.mockResolvedValue({ id: 123, slug: 'created-post', status: 'draft' });
    });

    describe('Rendering', () => {
        it('should render the AddPost form', () => {
            renderComponent();

            expect(screen.getByTestId('add-post')).toBeInTheDocument();
            expect(screen.getByTestId('add-post-header')).toBeInTheDocument();
            expect(screen.getByTestId('add-post-form')).toBeInTheDocument();

            expect(screen.getByTestId('add-post-title')).toBeInTheDocument();
            expect(screen.getByTestId('add-post-slug')).toBeInTheDocument();
            expect(screen.getByTestId('add-post-content')).toBeInTheDocument();
            expect(screen.getByTestId('add-post-excerpt')).toBeInTheDocument();
            expect(screen.getByTestId('add-post-image')).toBeInTheDocument();
            expect(screen.getByTestId('add-post-category')).toBeInTheDocument();
            expect(screen.getByTestId('add-post-status')).toBeInTheDocument();
            expect(screen.getByTestId('add-post-tags')).toBeInTheDocument();
            expect(screen.getByTestId('add-post-featured')).toBeInTheDocument();
            expect(screen.getByTestId('add-post-submit')).toBeInTheDocument();
        });

        it('should render the back to profile link', () => {
            renderComponent();

            expect(screen.getByTestId('add-post-back')).toHaveAttribute(
                'href',
                '/user/1'
            );
        });
    });

    describe('Authorization', () => {
        it('should redirect users without editor or admin role to their profile', () => {
            renderComponent({
                id: 2,
                roles: ['user'],
            });

            expect(screen.getByTestId('profile-page')).toBeInTheDocument();
            expect(screen.queryByTestId('add-post')).not.toBeInTheDocument();
        });

        it('should redirect unauthenticated users to home', () => {
            renderComponent(null as never);

            expect(screen.getByTestId('home-page')).toBeInTheDocument();
            expect(screen.queryByTestId('add-post')).not.toBeInTheDocument();
        });

        it('should allow admin users to create posts', () => {
            renderComponent({
                id: 3,
                roles: ['admin'],
            });

            expect(screen.getByTestId('add-post')).toBeInTheDocument();
        });
    });

    describe('Slug generation', () => {
        it('should automatically generate slug from title', async () => {
            const user = userEvent.setup();

            renderComponent();

            await user.type(
                screen.getByTestId('add-post-title'),
                'My First Blog Post'
            );

            expect(screen.getByTestId('add-post-slug')).toHaveValue(
                'my-first-blog-post'
            );
        });
    });

    describe('Form submission', () => {
        it('should submit correctly formatted post data', async () => {
            const user = userEvent.setup();

            renderComponent();

            await user.type(
                screen.getByTestId('add-post-title'),
                'My First Post'
            );

            await user.type(
                screen.getByTestId('add-post-content'),
                'This is my article content.'
            );

            await user.type(
                screen.getByTestId('add-post-excerpt'),
                'My article excerpt.'
            );

            await user.type(
                screen.getByTestId('add-post-image'),
                'https://example.com/image.jpg'
            );

            await user.type(
                screen.getByTestId('add-post-category'),
                '5'
            );

            await user.selectOptions(
                screen.getByTestId('add-post-status'),
                'published'
            );

            await user.type(
                screen.getByTestId('add-post-tags'),
                'react, typescript, frontend'
            );

            await user.click(screen.getByTestId('add-post-featured'));

            await user.type(
                screen.getByTestId('add-post-content'),
                ' '
            );

            await user.click(screen.getByTestId('add-post-submit'));

            await waitFor(() => {
                expect(mockCreatePost).toHaveBeenCalledWith({
                    title: 'My First Post',
                    slug: 'my-first-post',
                    content: 'This is my article content.',
                    excerpt: 'My article excerpt.',
                    image: 'https://example.com/image.jpg',
                    status: 'published',
                    categoryId: 5,
                    tags: ['react', 'typescript', 'frontend'],
                    isFeatured: true,
                } satisfies CreatePostInput);
            });

            expect(mocks.toastSuccess).toHaveBeenCalledWith(
                'Post created successfully.'
            );
        });

        it('should navigate to the created post', async () => {
            const user = userEvent.setup();

            renderComponent();

            await user.type(
                screen.getByTestId('add-post-title'),
                'Test Post'
            );

            await user.type(
                screen.getByTestId('add-post-content'),
                'Post content'
            );

            await user.click(screen.getByTestId('add-post-submit'));

            expect(await screen.findByTestId('post-page')).toBeInTheDocument();
            expect(screen.getByTestId('post-page')).toHaveAttribute('data-created-post-id', '123');
            expect(screen.getByTestId('post-page')).toHaveAttribute('data-post-path', '/post/created-post');
        });

        it('should navigate to blog when created post has no ID', async () => {
            const user = userEvent.setup();

            mockCreatePost.mockResolvedValue({});

            renderComponent();

            await user.type(
                screen.getByTestId('add-post-title'),
                'Test Post'
            );

            await user.type(
                screen.getByTestId('add-post-content'),
                'Post content'
            );

            await user.click(screen.getByTestId('add-post-submit'));

            expect(await screen.findByTestId('blog-page')).toBeInTheDocument();
        });

        it('should submit null categoryId when category is empty', async () => {
            const user = userEvent.setup();

            renderComponent();

            await user.type(
                screen.getByTestId('add-post-title'),
                'Test Post'
            );

            await user.type(
                screen.getByTestId('add-post-content'),
                'Post content'
            );

            await user.click(screen.getByTestId('add-post-submit'));

            await waitFor(() => {
                expect(mockCreatePost).toHaveBeenCalledWith(
                    expect.objectContaining({
                        categoryId: null,
                    })
                );
            });
        });
    });

    describe('Error handling', () => {
        it('should display error toast when post creation fails', async () => {
            const user = userEvent.setup();

            mockCreatePost.mockRejectedValue(new Error('Server error'));

            renderComponent();

            await user.type(
                screen.getByTestId('add-post-title'),
                'Test Post'
            );

            await user.type(
                screen.getByTestId('add-post-content'),
                'Post content'
            );

            await user.click(screen.getByTestId('add-post-submit'));

            await waitFor(() => {
                expect(mocks.toastError).toHaveBeenCalledWith('Server error');
            });

            expect(screen.getByTestId('add-post-submit')).toBeEnabled();
        });

        it('should display fallback error for unknown exceptions', async () => {
            const user = userEvent.setup();

            mockCreatePost.mockRejectedValue('Unexpected error');

            renderComponent();

            await user.type(
                screen.getByTestId('add-post-title'),
                'Test Post'
            );

            await user.type(
                screen.getByTestId('add-post-content'),
                'Post content'
            );

            await user.click(screen.getByTestId('add-post-submit'));

            await waitFor(() => {
                expect(mocks.toastError).toHaveBeenCalledWith(
                    'Could not create post'
                );
            });
        });
    });

    describe('Loading state', () => {
        it('should disable submit button while creating a post', async () => {
            const user = userEvent.setup();

            let resolveCreatePost!: (value: { id: number }) => void;

            mockCreatePost.mockImplementation(
                () =>
                    new Promise((resolve) => {
                        resolveCreatePost = resolve;
                    })
            );

            renderComponent();

            await user.type(
                screen.getByTestId('add-post-title'),
                'Test Post'
            );

            await user.type(
                screen.getByTestId('add-post-content'),
                'Post content'
            );

            const submitButton = screen.getByTestId('add-post-submit');

            await user.click(submitButton);

            expect(submitButton).toBeDisabled();
            expect(submitButton).toHaveTextContent('Creating…');

            resolveCreatePost({ id: 123 });

            await waitFor(() => {
                expect(submitButton).toBeEnabled();
            });
        });
    });
});
