import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import type { Post } from '../../../../types';

interface BlogItemProps {
    post: Post;
}

const BlogItem = ({ post }: BlogItemProps) => (
    <article className="blog-card" data-testid="blog-post-card">
        {post.image && (
            <img
                className="blog-card__image"
                src={post.image}
                alt=""
                loading="lazy"
                data-testid="blog-post-image"
            />
        )}

        <div className="blog-card__body">
            <div className="blog-card__meta" data-testid="blog-post-meta">
                {post.isFeatured && (
                    <span className="blog-card__featured" data-testid="blog-post-featured">
                        Featured
                    </span>
                )}
                <time
                    dateTime={post.publishedAt ?? post.createdAt}
                    data-testid="blog-post-date"
                >
                    {dayjs(post.publishedAt ?? post.createdAt).format('DD.MM.YYYY')}
                </time>
            </div>

            <h2>
                <Link to={`/post/${post.slug}`} data-testid="blog-post-title">
                    {post.title}
                </Link>
            </h2>

            <p data-testid="blog-post-excerpt">{post.excerpt || post.content}</p>

            {!!post.tags.length && (
                <ul className="blog-card__tags" data-testid="blog-post-tags">
                    {post.tags.map((tag) => (
                        <li key={tag}>
                            <Link
                                to={`/blog?tag=${encodeURIComponent(tag)}`}
                                aria-label={`Search posts tagged ${tag}`}
                                data-testid="blog-post-tag"
                            >
                                {tag}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <div className="blog-card__stats" data-testid="blog-post-stats">
                <span>{post.views.toLocaleString()} views</span>
                <span>{post.likes} likes</span>
                <span>{post.commentsCount} comments</span>
            </div>
        </div>
    </article>
);

export default BlogItem;
