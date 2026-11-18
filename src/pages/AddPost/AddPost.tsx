import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../providers/AuthProvider.tsx';
import type { CreatePostInput } from '../../features/auth/types/auth.types.ts';
import {slugify} from "../../utils";
import './addPost.css';

const AddPost = () => {
    const { user, createPost } = useAuth();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [slugEdited, setSlugEdited] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const canCreate = user?.roles.some((role) => ['admin', 'editor'].includes(role.toLowerCase())) ?? false;
    if (!canCreate) return <Navigate to={user ? `/user/${user.id}` : '/'} replace />;

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
            categoryId: String(form.get('categoryId')).trim() ? Number(form.get('categoryId')) : null,
            tags: String(form.get('tags')).split(',').map((tag) => tag.trim()).filter(Boolean),
            isFeatured: form.get('isFeatured') === 'on',
        };

        setSubmitting(true);
        try {
            const post = await createPost(input);
            toast.success('Post created successfully.');
            navigate(post.id ? `/post/${post.id}` : '/blog');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not create post');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="add-post">
            <Link className="add-post__back" to={`/user/${user?.id}`}><FontAwesomeIcon icon={faArrowLeft} /> Back to profile</Link>
            <header className="add-post__header">
                <p>Create</p>
                <h1>New post</h1>
                <span>Write and publish a new article.</span>
            </header>
            <form className="add-post__form" onSubmit={handleSubmit}>
                <label>Title
                    <input name="title" value={title} onChange={(event) => {
                        const value = event.target.value;
                        setTitle(value);
                        if (!slugEdited) setSlug(slugify(value));
                    }} required maxLength={200} />
                </label>
                <label>Slug
                    <input name="slug" value={slug} onChange={(event) => {
                        setSlugEdited(true);
                        setSlug(slugify(event.target.value));
                    }} required maxLength={220} />
                </label>
                <label>Content
                    <textarea name="content" rows={12} required maxLength={50000} />
                </label>
                <label>Excerpt
                    <textarea name="excerpt" rows={3} maxLength={500} />
                </label>
                <label>Cover image URL
                    <input name="image" type="url" placeholder="https://example.com/image.jpg" />
                </label>
                <div className="add-post__row">
                    <label>Category ID
                        <input name="categoryId" type="number" min={1} step={1} placeholder="No category" />
                    </label>
                    <label>Status
                        <select name="status" defaultValue="draft">
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </label>
                </div>
                <label>Tags <span className="add-post__hint">Separate tags with commas</span>
                    <input name="tags" placeholder="react, typescript, frontend" />
                </label>
                <label className="add-post__checkbox">
                    <input name="isFeatured" type="checkbox" />
                    Mark as featured
                </label>
                <button className="add-post__submit" type="submit" disabled={submitting}>
                    <FontAwesomeIcon icon={faFloppyDisk} /> {submitting ? 'Creating…' : 'Create post'}
                </button>
            </form>
        </section>
    );
};

export default AddPost;
