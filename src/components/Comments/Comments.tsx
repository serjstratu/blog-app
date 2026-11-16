import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'react-toastify';
import { API_ORIGIN, API_URL } from '../../config/api';
import { getJson } from '../../config/getJson';
import Pagination from '../Pagination/Pagination';
import { sortCommentsByCreatedAt } from "../../utils/utils.ts";
import type { Comment, CommentsResponse, Pagination as PaginationData } from '../../types';
import './comments.css';
const PAGE_SIZE = 20;

interface CommentsProps {
    postId: number;
}

const Comments = ({ postId }: CommentsProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        const offset = (page - 1) * PAGE_SIZE;
        getJson<Comment[] | CommentsResponse>(`${API_URL}/comments?postId=${postId}&limit=${PAGE_SIZE}&offset=${offset}`)
            .then((result) => {
                if (!active) return;
                if (Array.isArray(result)) {
                    setComments(result);
                    setPagination(null);
                } else {
                    setComments(result.data);
                    setPagination(result.pagination);
                }
            })
            .catch((error: unknown) => {
                if (active) toast.error(error instanceof Error ? error.message : 'Could not load comments');
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [postId, page]);

    const renderComment = (comment: Comment, depth = 0): ReactNode => {
        const author = comment.author ?? comment.user;
        const name = author?.name ?? author?.username ?? comment.author_name ?? `User ${comment.authorId}`;
        const avatar = author?.avatar;
        return (
            <li className={`comment ${depth ? 'comment--reply' : ''}`} key={comment.id}>
                <article className="comment__card">
                    <div className="comment__author">
                        {avatar ? <img src={avatar.startsWith('http') ? avatar : `${API_ORIGIN}${avatar}`} alt="" /> : <span className="comment__avatar-placeholder">{name.charAt(0).toUpperCase()}</span>}
                        <div><strong>{name}</strong><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time></div>
                    </div>
                    <p>{comment.deletedAt ? 'This comment was deleted.' : comment.content}</p>
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
            {loading ? <p className="comments__status">Loading comments…</p> : comments.length === 0 ? (
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
