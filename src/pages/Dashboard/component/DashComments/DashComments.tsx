import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Pagination } from '../../../../components';
import type { Comment, Pagination as PaginationData, Post } from '../../../../types';

interface DashCommentsProps {
    posts: Post[];
    comments: Comment[];
    selectedPostId: number | null;
    postPagination: PaginationData | null;
    commentPagination: PaginationData | null;
    loading: boolean;
    deleting: string | null;
    onSelectPost: (postId: number | null) => void;
    onPostPageChange: (page: number) => void;
    onCommentPageChange: (page: number) => void;
    onDelete: (commentId: number) => void;
}

export default function DashComments({
    posts, comments, selectedPostId, postPagination, commentPagination, loading, deleting,
    onSelectPost, onPostPageChange, onCommentPageChange, onDelete,
}: DashCommentsProps) {
    return (
        <>
            <div className="dashboard__comment-filter">
                <label htmlFor="dashboard-post-filter">Comments for post</label>
                <select id="dashboard-post-filter" value={selectedPostId ?? ''} onChange={(event) => onSelectPost(event.target.value ? Number(event.target.value) : null)}>
                    <option value="">Select a post…</option>
                    {posts.map((post) => <option value={post.id} key={post.id}>{post.title} (#{post.id})</option>)}
                </select>
                {postPagination && postPagination.totalPages > 1 && <Pagination currentPage={postPagination.currentPage} totalPages={postPagination.totalPages} hasNextPage={postPagination.hasNextPage} hasPreviousPage={postPagination.hasPreviousPage} disabled={loading} onPageChange={onPostPageChange} />}
            </div>
            {selectedPostId === null ? <p className="dashboard__empty">Select a post to view its comments.</p> : <>
                <div className="dashboard__table-wrap"><table className="dashboard__table">
                    <thead><tr><th>Comment</th><th>Author</th><th>Post</th><th>Created</th><th>Actions</th></tr></thead>
                    <tbody>{comments.map((comment) => <tr key={comment.id}>
                        <td className="dashboard__comment">{comment.deletedAt ? 'This comment was deleted.' : comment.content}</td>
                        <td>{comment.author?.name ?? comment.author?.username ?? comment.author_name ?? `User ${comment.authorId}`}</td>
                        <td><Link to={`/post/${comment.postId}#comment-${comment.id}`}>Post {comment.postId}</Link></td>
                        <td>{dayjs(comment.createdAt).format('DD.MM.YYYY HH:mm')}</td>
                        <td><button className="dashboard__delete" type="button" onClick={() => onDelete(comment.id)} disabled={deleting === `comments-${comment.id}`}>{deleting === `comments-${comment.id}` ? 'Deleting…' : 'Delete'}</button></td>
                    </tr>)}</tbody>
                </table></div>
                {!comments.length && !loading && <p className="dashboard__empty">No comments found for this post.</p>}
                {commentPagination && commentPagination.totalPages > 1 && <Pagination currentPage={commentPagination.currentPage} totalPages={commentPagination.totalPages} hasNextPage={commentPagination.hasNextPage} hasPreviousPage={commentPagination.hasPreviousPage} disabled={loading} onPageChange={onCommentPageChange} />}
            </>}
        </>
    );
}
