import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import { useAuth } from '../../providers/AuthProvider';
import { API_URL, DEFAULT_PAGE_SIZE } from '../../config';
import { getJson } from '../../config/getJson';
import { Loader, Pagination } from '../../components';
import type { Comment, CommentsResponse, Pagination as PaginationData, Post, PostsResponse } from '../../types';
import './dashboard.css';

type DashboardTab = 'posts' | 'comments';

export default function Dashboard() {
    const { user, accessToken, deletePost, deleteComment } = useAuth();
    const [tab, setTab] = useState<DashboardTab>('posts');
    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [postPagination, setPostPagination] = useState<PaginationData | null>(null);
    const [commentPagination, setCommentPagination] = useState<PaginationData | null>(null);
    const [postPage, setPostPage] = useState(1);
    const [commentPage, setCommentPage] = useState(1);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const isAdmin = user?.roles.some((role) => role.toLowerCase() === 'admin') ?? false;

    useEffect(() => {
        if (!isAdmin || !accessToken) return;
        let active = true;
        setLoading(true);
        const offset = (postPage - 1) * DEFAULT_PAGE_SIZE;
        getJson<PostsResponse>(`${API_URL}/posts?limit=${DEFAULT_PAGE_SIZE}&offset=${offset}`, {
            accept: '*/*', Authorization: `Bearer ${accessToken}`,
        }).then((response) => {
            if (!active) return;
            setPosts(response.data);
            setPostPagination(response.pagination);
        }).catch((error: unknown) => {
            if (active) toast.error(error instanceof Error ? error.message : 'Could not load posts');
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [isAdmin, accessToken, postPage]);

    useEffect(() => {
        if (!isAdmin || !accessToken) return;
        if (selectedPostId === null) {
            setComments([]);
            setCommentPagination(null);
            setLoading(false);
            return;
        }
        let active = true;
        setLoading(true);
        const offset = (commentPage - 1) * DEFAULT_PAGE_SIZE;
        getJson<Comment[] | CommentsResponse>(`${API_URL}/comments?postId=${selectedPostId}&limit=${DEFAULT_PAGE_SIZE}&offset=${offset}`, {
            accept: '*/*', Authorization: `Bearer ${accessToken}`,
        }).then((response) => {
            if (!active) return;
            if (Array.isArray(response)) {
                setComments(response);
                setCommentPagination(null);
            } else {
                setComments(response.data);
                setCommentPagination(response.pagination);
            }
        }).catch((error: unknown) => {
            if (active) toast.error(error instanceof Error ? error.message : 'Could not load comments');
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [isAdmin, accessToken, commentPage, selectedPostId]);

    if (!user || !isAdmin) return <Navigate to="/" replace />;

    const confirmDelete = async (kind: DashboardTab, id: number) => {
        const result = await Swal.fire({
            title: `Delete this ${kind === 'posts' ? 'post' : 'comment'}?`,
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            focusCancel: true,
            confirmButtonColor: '#d33',
        });
        if (!result.isConfirmed) return;

        const key = `${kind}-${id}`;
        setDeleting(key);
        try {
            if (kind === 'posts') {
                await deletePost(id);
                setPosts((current) => current.filter((post) => post.id !== id));
                toast.success('Post deleted.');
            } else {
                await deleteComment(id);
                setComments((current) => current.filter((comment) => comment.id !== id));
                toast.success('Comment deleted.');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Could not delete ${kind === 'posts' ? 'post' : 'comment'}`);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <section className="dashboard" aria-labelledby="dashboard-title">
            <header className="dashboard__header">
                <div><p className="dashboard__eyebrow">Administration</p><h1 id="dashboard-title">Dashboard</h1></div>
                <Link className="dashboard__add" to="/add">＋ New post</Link>
            </header>
            <div className="dashboard__tabs" role="tablist" aria-label="Dashboard content">
                <button type="button" role="tab" aria-selected={tab === 'posts'} onClick={() => setTab('posts')}>Posts</button>
                <button type="button" role="tab" aria-selected={tab === 'comments'} onClick={() => { setTab('comments'); setSelectedPostId(null); setCommentPage(1); }}>Comments</button>
            </div>

            {loading ? <Loader label={`Loading ${tab}`} /> : tab === 'posts' ? (
                <>
                    <div className="dashboard__table-wrap"><table className="dashboard__table">
                        <thead><tr><th>Post</th><th>Status</th><th>Created</th><th>Comments</th><th>Actions</th></tr></thead>
                        <tbody>{posts.map((post) => <tr key={post.id}>
                            <td><Link to={`/post/${post.slug}`}>{post.title}</Link><small>/{post.slug}</small></td>
                            <td><span className={`dashboard__status dashboard__status--${post.status}`}>{post.status}</span></td>
                            <td>{dayjs(post.createdAt).format('DD.MM.YYYY')}</td>
                            <td>{post.commentsCount}</td>
                            <td><button className="dashboard__delete" type="button" onClick={() => void confirmDelete('posts', post.id)} disabled={deleting === `posts-${post.id}`}>{deleting === `posts-${post.id}` ? 'Deleting…' : 'Delete'}</button></td>
                        </tr>)}</tbody>
                    </table></div>
                    {!posts.length && <p className="dashboard__empty">No posts found.</p>}
                    {postPagination && postPagination.totalPages > 1 && <Pagination currentPage={postPagination.currentPage} totalPages={postPagination.totalPages} hasNextPage={postPagination.hasNextPage} hasPreviousPage={postPagination.hasPreviousPage} disabled={loading} onPageChange={setPostPage} />}
                </>
            ) : (
                <>
                    <div className="dashboard__comment-filter">
                        <label htmlFor="dashboard-post-filter">Comments for post</label>
                        <select id="dashboard-post-filter" value={selectedPostId ?? ''} onChange={(event) => { setSelectedPostId(event.target.value ? Number(event.target.value) : null); setCommentPage(1); }}>
                            <option value="">Select a post…</option>
                            {posts.map((post) => <option value={post.id} key={post.id}>{post.title} (#{post.id})</option>)}
                        </select>
                        {postPagination && postPagination.totalPages > 1 && <Pagination currentPage={postPagination.currentPage} totalPages={postPagination.totalPages} hasNextPage={postPagination.hasNextPage} hasPreviousPage={postPagination.hasPreviousPage} disabled={loading} onPageChange={(nextPage) => { setPostPage(nextPage); setSelectedPostId(null); }} />}
                    </div>
                    {selectedPostId === null ? <p className="dashboard__empty">Select a post to view its comments.</p> : <>
                    <div className="dashboard__table-wrap"><table className="dashboard__table">
                        <thead><tr><th>Comment</th><th>Author</th><th>Post</th><th>Created</th><th>Actions</th></tr></thead>
                        <tbody>{comments.map((comment) => <tr key={comment.id}>
                            <td className="dashboard__comment">{comment.deletedAt ? 'This comment was deleted.' : comment.content}</td>
                            <td>{comment.author?.name ?? comment.author?.username ?? comment.author_name ?? `User ${comment.authorId}`}</td>
                            <td><Link to={`/post/${comment.postId}#comment-${comment.id}`}>Post {comment.postId}</Link></td>
                            <td>{dayjs(comment.createdAt).format('DD.MM.YYYY HH:mm')}</td>
                            <td><button className="dashboard__delete" type="button" onClick={() => void confirmDelete('comments', comment.id)} disabled={deleting === `comments-${comment.id}`}>{deleting === `comments-${comment.id}` ? 'Deleting…' : 'Delete'}</button></td>
                        </tr>)}</tbody>
                    </table></div>
                    {!comments.length && !loading && <p className="dashboard__empty">No comments found for this post.</p>}
                    {commentPagination && commentPagination.totalPages > 1 && <Pagination currentPage={commentPagination.currentPage} totalPages={commentPagination.totalPages} hasNextPage={commentPagination.hasNextPage} hasPreviousPage={commentPagination.hasPreviousPage} disabled={loading} onPageChange={setCommentPage} />}
                    </>}
                </>
            )}
        </section>
    );
}
