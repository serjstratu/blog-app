import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Pagination } from '../../../../components';
import type { Pagination as PaginationData, Post } from '../../../../types';

interface DashPostsProps {
    posts: Post[];
    pagination: PaginationData | null;
    loading: boolean;
    deleting: string | null;
    onPageChange: (page: number) => void;
    onDelete: (postId: number) => void;
}

export default function DashPosts({ posts, pagination, loading, deleting, onPageChange, onDelete }: DashPostsProps) {
    return (
        <>
            <div className="dashboard__table-wrap"><table className="dashboard__table">
                <thead><tr><th>Post</th><th>Status</th><th>Created</th><th>Comments</th><th>Actions</th></tr></thead>
                <tbody>{posts.map((post) => <tr key={post.id}>
                    <td><Link to={`/post/${post.slug}`}>{post.title}</Link><small>/{post.slug}</small></td>
                    <td><span className={`dashboard__status dashboard__status--${post.status}`}>{post.status}</span></td>
                    <td>{dayjs(post.createdAt).format('DD.MM.YYYY')}</td>
                    <td>{post.commentsCount}</td>
                    <td><button className="dashboard__delete" type="button" onClick={() => onDelete(post.id)} disabled={deleting === `posts-${post.id}`}>{deleting === `posts-${post.id}` ? 'Deleting…' : 'Delete'}</button></td>
                </tr>)}</tbody>
            </table></div>
            {!posts.length && <p className="dashboard__empty">No posts found.</p>}
            {pagination && pagination.totalPages > 1 && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} hasNextPage={pagination.hasNextPage} hasPreviousPage={pagination.hasPreviousPage} disabled={loading} onPageChange={onPageChange} />}
        </>
    );
}
