import { useEffect, useState, type FormEvent, type ReactNode, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { API_ORIGIN, API_URL, DEFAULT_PAGE_SIZE } from '../../config';
import {Loader, Pagination} from "../index.ts";
import { sortCommentsByCreatedAt } from "../../utils";
import { useAuth } from '../../providers/AuthProvider';
import type { Comment, CommentsResponse, Pagination as PaginationData } from '../../types';
import './comments.css';
interface CommentsProps {
    postId: number;
}

const Comments = ({ postId }: CommentsProps) => {
    const [page, setPage] = useState(1);
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const { user, createComment, deleteComment } = useAuth();
    const queryClient = useQueryClient();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    const commentsQuery = useQuery({
        queryKey: ['comments', postId, page],
        queryFn: async () => {
        const offset = (page - 1) * DEFAULT_PAGE_SIZE;
        const response = await fetch(`${API_URL}/comments?postId=${postId}&limit=${DEFAULT_PAGE_SIZE}&offset=${offset}`, { headers: { accept: '*/*' } });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json() as Promise<Comment[] | CommentsResponse>;
        },
    });
    const loading = commentsQuery.isPending;
    const result = commentsQuery.data;
    const comments = Array.isArray(result) ? result : result?.data ?? [];
    const pagination: PaginationData | null = result && !Array.isArray(result) ? result.pagination : null;

    useEffect(() => {
        if (commentsQuery.isError) {
            toast.error(commentsQuery.error instanceof Error ? commentsQuery.error.message : 'Could not load comments');
        }
    }, [commentsQuery.isError, commentsQuery.error]);

    useEffect(() => {
        if (loading || !window.location.hash.startsWith('#comment-')) return;
        const target = document.getElementById(window.location.hash.slice(1));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('comment--targeted');
            const timeout = window.setTimeout(() => target.classList.remove('comment--targeted'), 3000);
            return () => window.clearTimeout(timeout);
        }
        if (pagination && page < pagination.totalPages) setPage((current) => current + 1);
    }, [comments, loading, pagination, page]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedContent = content.trim();
        if (!trimmedContent) return;
        setSending(true);
        try {
            await createComment(postId, trimmedContent, replyingTo?.id ?? null);
            setContent('');
            if (!replyingTo) setPage(1);
            setReplyingTo(null);
            await queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            toast.success(replyingTo ? 'Reply added.' : 'Comment added.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not add comment');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (commentId: number) => {
        const result = await Swal.fire({
            title: 'Delete comment?',
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

        setDeletingId(commentId);

        try {
            await deleteComment(commentId);
            await queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            toast.success('Comment deleted.');
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Could not delete comment.',
            );
        } finally {
            setDeletingId(null);
        }
    };

    const renderComment = (comment: Comment, depth = 0): ReactNode => {
        const author = comment.author ?? comment.user;
        const name = author?.name ?? author?.username ?? comment.author_name ?? `User ${comment.authorId}`;
        const avatar = author?.avatar;
        return (
            <li className={`comment ${depth ? 'comment--reply' : ''}`} id={`comment-${comment.id}`} key={comment.id}>
                <article className="comment__card">
                    <div className="comment__author">
                        {avatar ? <img src={avatar.startsWith('http') ? avatar : `${API_ORIGIN}${avatar}`} alt="" /> : <span className="comment__avatar-placeholder">{name.charAt(0).toUpperCase()}</span>}
                        <div><strong>{name}</strong><time dateTime={comment.createdAt}>{dayjs(comment.createdAt).format('DD.MM.YYYY HH:mm')}</time></div>
                        {user?.roles.includes('admin') && (
                            <button
                                className="comment__delete"
                                type="button"
                                onClick={() => handleDelete(comment.id)}
                                disabled={deletingId === comment.id}
                                aria-label={`Delete comment ${comment.id}`}
                            >
                                {deletingId === comment.id ? 'Deleting…' : 'Delete'}
                            </button>
                        )}
                    </div>
                    <p>{comment.deletedAt ? 'This comment was deleted.' : comment.content}</p>
                    {user && !comment.deletedAt && (
                        <button
                            className="comment__reply"
                            type="button"
                            onClick={() => {
                                setReplyingTo(comment);
                                commentInputRef.current?.focus();
                            }}
                        >
                            Reply
                        </button>
                    )}
                </article>
                {!!comment.replies?.length && (
                    <ul className="comments__replies">
                        {sortCommentsByCreatedAt(comment.replies).map((reply) => renderComment(reply, depth + 1))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <section className="comments" aria-labelledby="comments-title">
            <h2 id="comments-title">Comments{pagination ? ` (${pagination.totalItems})` : ''}</h2>
            {user ? (
                <form className="comments__form" onSubmit={handleSubmit}>
                    {replyingTo && (
                        <div className="comments__replying">
                            <span>Replying to comment by User {replyingTo.authorId}</span>
                            <button type="button" onClick={() => setReplyingTo(null)}>Cancel reply</button>
                        </div>
                    )}
                    <label htmlFor="new-comment">{replyingTo ? 'Write a reply' : 'Write a comment'}</label>
                    <textarea
                        id="new-comment"
                        ref={commentInputRef}
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder={replyingTo ? 'Write your reply…' : 'Share your thoughts…'}
                        rows={4}
                        maxLength={5000}
                        required
                    />
                    <button type="submit" disabled={sending || !content.trim()}>
                        {sending ? 'Posting…' : replyingTo ? 'Post reply' : 'Post comment'}
                    </button>
                </form>
            ) : <p className="comments__status">Log in to leave a comment.</p>}
            {loading ? <Loader label="Loading comments" /> : comments.length === 0 ? (
                <p className="comments__status">No comments yet.</p>
            ) : <ul className="comments__list">{sortCommentsByCreatedAt(comments).map((comment) => renderComment(comment))}</ul>}
            {pagination && pagination.totalPages > 1 && (
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    hasNextPage={pagination.hasNextPage}
                    hasPreviousPage={pagination.hasPreviousPage}
                    disabled={loading}
                    onPageChange={setPage}
                />
            )}
        </section>
    );
};

export default Comments;
