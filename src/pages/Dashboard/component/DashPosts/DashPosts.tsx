import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { Pagination } from '../../../../components';
import type { Pagination as PaginationData, Post } from '../../../../types';

interface DashPostsProps {
    posts: Post[];
    pagination: PaginationData | null;
    loading: boolean;
    deleting: string | null;
    onPageChange: (page: number) => void;
    onDelete: (postId: number) => void;
    onEdit: (post: Post) => void;
}

export default function DashPosts({ posts, pagination, loading, deleting, onPageChange, onDelete, onEdit }: DashPostsProps) {
    return (
        <>
            <div className="dashboard__table-wrap"><table className="dashboard__table">
                <thead><tr><th>Post</th><th>Status</th><th>Created</th><th>Comments</th><th>Actions</th></tr></thead>
                <tbody>{posts.map((post) => <tr key={post.id}>
                    <td><Link to={`/post/${post.slug}`}>{post.title}</Link><small>/{post.slug}</small></td>
                    <td><span className={`dashboard__status dashboard__status--${post.status}`}>{post.status}</span></td>
                    <td>{dayjs(post.createdAt).format('DD.MM.YYYY')}</td>
                    <td>{post.commentsCount}</td>
                    <td className="dashboard__actions">
                        <button className="dashboard__action dashboard__action--edit" type="button" onClick={() => onEdit(post)} aria-label={`Edit ${post.title}`} title="Edit post">
                            <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button className="dashboard__action dashboard__action--delete" type="button" onClick={() => onDelete(post.id)} disabled={deleting === `posts-${post.id}`} aria-busy={deleting === `posts-${post.id}`} aria-label={`Remove ${post.title}`} title={deleting === `posts-${post.id}` ? 'Removing post' : 'Remove post'}>
                            <FontAwesomeIcon icon={faTrashCan} />
                        </button>
                    </td>
                </tr>)}</tbody>
            </table></div>
            {!posts.length && <p className="dashboard__empty">No posts found.</p>}
            {pagination && pagination.totalPages > 1 && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} hasNextPage={pagination.hasNextPage} hasPreviousPage={pagination.hasPreviousPage} disabled={loading} onPageChange={onPageChange} />}
        </>
    );
}
