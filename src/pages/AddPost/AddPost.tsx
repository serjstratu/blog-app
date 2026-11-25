import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../providers/AuthProvider.tsx';
import type { CreatePostInput } from '../../types';
import { slugify } from '../../utils';
import { Breadcrumbs } from '../../components';
import './addPost.css';

const AddPost = () => {
    const { user, createPost } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [slugEdited, setSlugEdited] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const canCreate = user?.roles.some((role) =>
        ['admin', 'editor'].includes(role.toLowerCase())
    ) ?? false;

    if (!canCreate) {
        return <Navigate to={user ? `/user/${user.id}` : '/'} replace />;
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const input: CreatePostInput = {
            title: title.trim(),
            slug: (slugEdited ? slug : slugify(title)).trim(),
            content: String(form.get('content')).trim(),
            excerpt: String(form.get('excerpt')).trim(),
            image: String(form.get('image')).trim(),
            status: String(form.get('status')) as CreatePostInput['status'],
            categoryId: String(form.get('categoryId')).trim()
                ? Number(form.get('categoryId'))
                : null,
            tags: String(form.get('tags'))
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            isFeatured: form.get('isFeatured') === 'on',
        };

        setSubmitting(true);
        try {
            const post = await createPost(input);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['posts'] }),
                queryClient.invalidateQueries({ queryKey: ['dashboard-posts'] }),
            ]);
            toast.success('Post created successfully.');
            navigate(post.id ? `/post/${post.slug || post.id}` : '/blog', {
                state: { createdPost: post },
            });
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Could not create post'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="add-post" data-testid="add-post">
            <Breadcrumbs items={[
                { label: 'Home', to: '/' },
                { label: 'Profile', to: `/user/${user?.id}` },
                { label: 'Add post' },
            ]} />

            <header className="add-post__header" data-testid="add-post-header">
                <p>Create</p>
                <h1>New post</h1>
                <span>Write and publish a new article.</span>
            </header>

            <form
                className="add-post__form"
                onSubmit={handleSubmit}
                data-testid="add-post-form"
            >
                <label>
                    Title
                    <input
                        name="title"
                        data-testid="add-post-title"
                        value={title}
                        onChange={(event) => {
                            const value = event.target.value;
                            setTitle(value);

                            if (!slugEdited) {
                                setSlug(slugify(value));
                            }
                        }}
                        required
                        maxLength={200}
                    />
                </label>

                <label>
                    Slug
                    <input
                        name="slug"
                        data-testid="add-post-slug"
                        value={slug}
                        onChange={(event) => {
                            setSlugEdited(true);
                            setSlug(slugify(event.target.value));
                        }}
                        required
                        maxLength={220}
                    />
                </label>

                <label>
                    Content
                    <textarea
                        name="content"
                        data-testid="add-post-content"
                        rows={12}
                        required
                        maxLength={50000}
                    />
                </label>

                <label>
                    Excerpt
                    <textarea
                        name="excerpt"
                        data-testid="add-post-excerpt"
                        rows={3}
                        maxLength={500}
                    />
                </label>

                <label>
                    Cover image URL
                    <input
                        name="image"
                        data-testid="add-post-image"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                    />
                </label>
                <div className="add-post__row">
                    <label>
                        Category ID
                        <input
                            name="categoryId"
                            data-testid="add-post-category"
                            type="number"
                            min={1}
                            step={1}
                            placeholder="No category"
                        />
                    </label>

                    <label>
                        Status
                        <select
                            name="status"
                            data-testid="add-post-status"
                            defaultValue="draft"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </label>
                </div>

                <label>
                    Tags
                    <span className="add-post__hint">
                        Separate tags with commas
                    </span>
                    <input
                        name="tags"
                        data-testid="add-post-tags"
                        placeholder="react, typescript, frontend"
                    />
                </label>
                <label className="add-post__checkbox">
                    <input
                        name="isFeatured"
                        data-testid="add-post-featured"
                        type="checkbox"
                    />
                    Mark as featured
                </label>

                <button
                    className="add-post__submit"
                    data-testid="add-post-submit"
                    type="submit"
                    disabled={submitting}
                >
                    <FontAwesomeIcon icon={faFloppyDisk} />
                    {submitting ? 'Creating…' : 'Create post'}
                </button>
            </form>
        </section>
    );
};

export default AddPost;
