import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useAuth } from '../../providers/AuthProvider';
import { API_URL, DEFAULT_PAGE_SIZE } from '../../config';
import { getJson } from '../../config/getJson';
import { Loader } from '../../components';
import type { Comment, CommentsResponse, Pagination as PaginationData, Post, PostsResponse } from '../../types';
import { DashComments, DashPosts } from './component';
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
    const navigate = useNavigate();
    const isAdmin = user?.roles.some((role) => role.toLowerCase() === 'admin') ?? false;
    const isEditor = user?.roles.some((role) => role.toLowerCase() === 'editor') ?? false;
    const canAccessDashboard = isAdmin || isEditor;

    useEffect(() => {
        if (!canAccessDashboard || !accessToken) return;
        let active = true;
        setLoading(true);
        const offset = (postPage - 1) * DEFAULT_PAGE_SIZE;
        const query = new URLSearchParams({ limit: String(DEFAULT_PAGE_SIZE), offset: String(offset) });
        query.set('include_unpublished', 'true');
        if (isEditor && !isAdmin && user) query.set('user_id', String(user.id));
        getJson<PostsResponse>(`${API_URL}/posts?${query.toString()}`, {
            accept: '*/*', Authorization: `Bearer ${accessToken}`,
        }).then((response) => {
            if (!active) return;
            setPosts(response.data);
            setPostPagination(response.pagination);
        }).catch((error: unknown) => {
            if (active) toast.error(error instanceof Error ? error.message : 'Could not load posts');
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [canAccessDashboard, isAdmin, isEditor, user?.id, accessToken, postPage]);

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

    if (!user || !canAccessDashboard) return <Navigate to="/" replace />;

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
                {isAdmin && <button type="button" role="tab" aria-selected={tab === 'comments'} onClick={() => { setTab('comments'); setSelectedPostId(null); setCommentPage(1); }}>Comments</button>}
            </div>

            {loading ? <Loader label={`Loading ${tab}`} /> : tab === 'posts' ? (
                <DashPosts
                    posts={posts}
                    pagination={postPagination}
                    loading={loading}
                    deleting={deleting}
                    onPageChange={setPostPage}
                    onDelete={(postId: number) => void confirmDelete('posts', postId)}
                    onEdit={(post) => navigate(`/post/edit/${post.id}`, { state: { post } })}
                />
            ) : (
                <DashComments
                    posts={posts}
                    comments={comments}
                    selectedPostId={selectedPostId}
                    postPagination={postPagination}
                    commentPagination={commentPagination}
                    loading={loading}
                    deleting={deleting}
                    onSelectPost={(postId) => { setSelectedPostId(postId); setCommentPage(1); }}
                    onPostPageChange={(nextPage) => { setPostPage(nextPage); setSelectedPostId(null); }}
                    onCommentPageChange={setCommentPage}
                    onDelete={(commentId) => void confirmDelete('comments', commentId)}
                />
            )}
        </section>
    );
}
