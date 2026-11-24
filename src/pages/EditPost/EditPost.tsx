import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useAuth } from '../../providers/AuthProvider';
import { API_URL } from '../../config';
import { getJson } from '../../config/getJson';
import { Loader } from '../../components';
import type { CreatePostInput, Post } from '../../types';
import './editPost.css';

export default function EditPost() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, updatePost } = useAuth();
    const routePost = (location.state as { post?: Post } | null)?.post;
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const canEdit = user?.roles.some((role) => ['admin', 'editor'].includes(role.toLowerCase())) ?? false;
    const isAdmin = user?.roles.some((role) => role.toLowerCase() === 'admin') ?? false;

    useEffect(() => {
        if (!id || !canEdit) {
            setLoading(false);
            return;
        }
        if (routePost && String(routePost.id) === id) {
            setPost(routePost);
            setLoading(false);
            return;
        }
        let active = true;
        setLoading(true);
        getJson<Post>(`${API_URL}/posts/${id}`)
            .then((result) => { if (active) setPost(result); })
            .catch((error: unknown) => {
                if (active) toast.error(error instanceof Error ? error.message : 'Could not load post');
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id, canEdit, routePost]);

    if (!canEdit) return <Navigate to={user ? `/user/${user.id}` : '/'} replace />;
    if (loading) return <Loader label="Loading post" />;
    if (!post) return <section className="edit-post"><h1>Post not found</h1><Link to="/dashboard">Back to dashboard</Link></section>;
    if (!isAdmin && post.userId !== user?.id) return <Navigate to="/dashboard" replace />;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const input: CreatePostInput = {
            title: String(form.get('title')).trim(),
            slug: String(form.get('slug')).trim(),
            content: String(form.get('content')).trim(),
            excerpt: String(form.get('excerpt')).trim(),
            image: String(form.get('image')).trim(),
            status: String(form.get('status')) as CreatePostInput['status'],
            categoryId: String(form.get('categoryId')).trim() ? Number(form.get('categoryId')) : null,
            tags: String(form.get('tags')).split(',').map((tag) => tag.trim()).filter(Boolean),
            isFeatured: form.get('isFeatured') === 'on',
        };

        setSaving(true);
        try {
            const updated = await updatePost(post.id, input);
            toast.success('Post updated successfully.');
            navigate('/dashboard', { replace: true, state: { updatedPost: updated } });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not update post');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="edit-post" data-testid="edit-post">
            <Link className="edit-post__back" to="/dashboard"><FontAwesomeIcon icon={faArrowLeft} /> Back to dashboard</Link>
            <header className="edit-post__header"><p>Edit</p><h1>Edit post</h1><span>Update the post details and content.</span></header>
            <form className="edit-post__form" onSubmit={handleSubmit} data-testid="edit-post-form">
                <label>Title<input name="title" data-testid="edit-post-title" defaultValue={post.title} required maxLength={200} /></label>
                <label>Slug<input name="slug" data-testid="edit-post-slug" defaultValue={post.slug} required maxLength={220} /></label>
                <label>Content<textarea name="content" data-testid="edit-post-content" rows={12} defaultValue={post.content} required maxLength={50000} /></label>
                <label>Excerpt<textarea name="excerpt" data-testid="edit-post-excerpt" rows={3} defaultValue={post.excerpt ?? ''} maxLength={500} /></label>
                <label>Cover image URL<input name="image" data-testid="edit-post-image" type="url" defaultValue={post.image ?? ''} /></label>
                <div className="edit-post__row">
                    <label>Category ID<input name="categoryId" data-testid="edit-post-category" type="number" min={1} step={1} defaultValue={post.categoryId ?? ''} placeholder="No category" /></label>
                    <label>Status<select name="status" data-testid="edit-post-status" defaultValue={post.status}><option value="draft">Draft</option><option value="published">Published</option></select></label>
                </div>
                <label>Tags<span className="edit-post__hint">Separate tags with commas</span><input name="tags" data-testid="edit-post-tags" defaultValue={post.tags.join(', ')} /></label>
                <label className="edit-post__checkbox"><input name="isFeatured" data-testid="edit-post-featured" type="checkbox" defaultChecked={post.isFeatured} />Mark as featured</label>
                <button className="edit-post__submit" data-testid="edit-post-submit" type="submit" disabled={saving}><FontAwesomeIcon icon={faFloppyDisk} />{saving ? 'Saving…' : 'Save changes'}</button>
            </form>
        </section>
    );
}
