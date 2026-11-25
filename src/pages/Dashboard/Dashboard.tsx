import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useAuth } from '../../providers/AuthProvider';
import { API_URL, DEFAULT_PAGE_SIZE } from '../../config';
import { Breadcrumbs, Loader } from '../../components';
import type { Comment, CommentsResponse, Pagination as PaginationData, PostsResponse } from '../../types';
import { DashComments, DashPosts } from './component';
import './dashboard.css';

type DashboardTab = 'posts' | 'comments';

export default function Dashboard() {
    const { user, accessToken, deletePost, deleteComment } = useAuth();
    const [tab, setTab] = useState<DashboardTab>('posts');
    const [postPage, setPostPage] = useState(1);
    const [commentPage, setCommentPage] = useState(1);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isAdmin = user?.roles.some((role) => role.toLowerCase() === 'admin') ?? false;
    const isEditor = user?.roles.some((role) => role.toLowerCase() === 'editor') ?? false;
    const canAccessDashboard = isAdmin || isEditor;

    const postsQuery = useQuery({
        queryKey: ['dashboard-posts', user?.id, isAdmin, isEditor, postPage],
        enabled: canAccessDashboard && Boolean(accessToken),
        queryFn: async () => {
        const offset = (postPage - 1) * DEFAULT_PAGE_SIZE;
        const query = new URLSearchParams({ limit: String(DEFAULT_PAGE_SIZE), offset: String(offset) });
        query.set('include_unpublished', 'true');
        if (isEditor && !isAdmin && user) query.set('user_id', String(user.id));
        const response = await fetch(`${API_URL}/posts?${query.toString()}`, {
            headers: { accept: '*/*', Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json() as Promise<PostsResponse>;
        },
    });

    const commentsQuery = useQuery({
        queryKey: ['dashboard-comments', selectedPostId, commentPage],
        enabled: isAdmin && Boolean(accessToken) && selectedPostId !== null,
        queryFn: async () => {
        const offset = (commentPage - 1) * DEFAULT_PAGE_SIZE;
        const response = await fetch(`${API_URL}/comments?postId=${selectedPostId}&limit=${DEFAULT_PAGE_SIZE}&offset=${offset}`, {
            headers: { accept: '*/*', Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json() as Promise<Comment[] | CommentsResponse>;
        },
    });

    const posts = postsQuery.data?.data ?? [];
    const postPagination = postsQuery.data?.pagination ?? null;
    const commentResult = commentsQuery.data;
    const comments = Array.isArray(commentResult) ? commentResult : commentResult?.data ?? [];
    const commentPagination: PaginationData | null = commentResult && !Array.isArray(commentResult) ? commentResult.pagination : null;
    const loading = postsQuery.isPending || (tab === 'comments' && selectedPostId !== null && commentsQuery.isPending);

    useEffect(() => {
        if (postsQuery.isError) toast.error(postsQuery.error instanceof Error ? postsQuery.error.message : 'Could not load posts');
    }, [postsQuery.isError, postsQuery.error]);
    useEffect(() => {
        if (commentsQuery.isError) toast.error(commentsQuery.error instanceof Error ? commentsQuery.error.message : 'Could not load comments');
    }, [commentsQuery.isError, commentsQuery.error]);

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
                queryClient.setQueryData<PostsResponse>(['dashboard-posts', user?.id, isAdmin, isEditor, postPage], (current) => current ? { ...current, data: current.data.filter((post) => post.id !== id) } : current);
                toast.success('Post deleted.');
            } else {
                await deleteComment(id);
                queryClient.setQueryData<Comment[] | CommentsResponse>(['dashboard-comments', selectedPostId, commentPage], (current) => Array.isArray(current) ? current.filter((comment) => comment.id !== id) : current ? { ...current, data: current.data.filter((comment) => comment.id !== id) } : current);
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
            <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Dashboard' }]} />
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
