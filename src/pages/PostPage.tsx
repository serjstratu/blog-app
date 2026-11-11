import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_URL } from '../config/api';
import type { Post } from '../types';
import './postPage.css';

const PostPage = () => {
    const { id } = useParams();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const postId = Number(id);
        if (!Number.isInteger(postId) || postId < 1) {
            setLoading(false);
            return;
        }
        let active = true;
        setLoading(true);
        fetch(`${API_URL}/posts/${postId}`, { headers: { accept: '*/*' } })
            .then(async (response) => {
                if (!response.ok) throw new Error('Could not load this post');
                return await response.json() as Post;
            })
            .then((data) => { if (active) setPost(data); })
            .catch((error: unknown) => {
                if (active) toast.error(error instanceof Error ? error.message : 'Could not load this post');
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id]);

    if (loading) return <section className="post-page"><p>Loading post…</p></section>;
    if (!post) return <section className="post-page"><h1>Post not found</h1><Link to="/blog">Back to blog</Link></section>;

    return (
        <article className="post-page">
            <Link className="post-page__back" to="/blog">← Back to blog</Link>
            {post.image && <img className="post-page__cover" src={post.image} alt="" />}
            <div className="post-page__content">
                <div className="post-page__meta">
                    {post.isFeatured && <span className="blog-card__featured">Featured</span>}
                    <time dateTime={post.publishedAt ?? post.createdAt}>
                        {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}
                    </time>
                </div>
                <h1>{post.title}</h1>
                {post.excerpt && <p className="post-page__excerpt">{post.excerpt}</p>}
                {!!post.tags.length && <ul className="blog-card__tags">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
                <div className="post-page__body">{post.content}</div>
                <div className="post-page__stats">
                    <span>{post.views.toLocaleString()} views</span>
                    <span>{post.likes} likes</span>
                    <span>{post.dislikes} dislikes</span>
                    <span>{post.commentsCount} comments</span>
                </div>
            </div>
        </article>
    );
};

export default PostPage;
