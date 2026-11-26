import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faSort, faSortDown, faSortUp, faTrashCan } from '@fortawesome/free-solid-svg-icons';
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

type SortField = 'title' | 'status' | 'createdAt' | 'commentsCount';
type SortDirection = 'asc' | 'desc';

export default function DashPosts({ posts, pagination, loading, deleting, onPageChange, onDelete, onEdit }: DashPostsProps) {
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const sortedPosts = useMemo(() => {
        if (!sortField) return posts;
        return [...posts].sort((left, right) => {
        let comparison: number;
        switch (sortField) {
            case 'title':
                comparison = left.title.localeCompare(right.title, undefined, { sensitivity: 'base' });
                break;
            case 'status':
                comparison = left.status.localeCompare(right.status, undefined, { sensitivity: 'base' });
                break;
            case 'createdAt':
                comparison = Date.parse(left.createdAt) - Date.parse(right.createdAt);
                break;
            case 'commentsCount':
                comparison = left.commentsCount - right.commentsCount;
                break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [posts, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField !== field) {
            setSortField(field);
            setSortDirection('asc');
            return;
        }
        if (sortDirection === 'asc') {
            setSortDirection('desc');
        } else {
            setSortField(null);
            setSortDirection('asc');
        }
    };

    const renderSortButton = (field: SortField, label: string) => (
        <button
            className="dashboard__sort"
            type="button"
            onClick={() => handleSort(field)}
            aria-label={`Sort by ${label.toLowerCase()}${sortField === field ? `, currently ${sortDirection}` : ''}`}
        >
            {label}
        <FontAwesomeIcon icon={sortField !== field ? faSort : sortDirection === 'asc' ? faSortUp : faSortDown} aria-hidden="true" />
        </button>
    );

    return (
        <>
            <div className="dashboard__table-wrap"><table className="dashboard__table">
                <thead><tr>
                    <th aria-sort={sortField === 'title' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}>{renderSortButton('title', 'Post')}</th>
                    <th aria-sort={sortField === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}>{renderSortButton('status', 'Status')}</th>
                    <th aria-sort={sortField === 'createdAt' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}>{renderSortButton('createdAt', 'Created')}</th>
                    <th aria-sort={sortField === 'commentsCount' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}>{renderSortButton('commentsCount', 'Comments')}</th>
                    <th>Actions</th>
                </tr></thead>
                <tbody>{sortedPosts.map((post) => <tr key={post.id}>
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
