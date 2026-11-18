import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { API_URL } from '../../config/api.ts';
import { getJson } from '../../config/getJson.ts';
import type { Post } from '../../types';
import Comments from '../../components/Comments/Comments.tsx';
import './post.css';

const Post = () => {
    const { id } = useParams();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [reacting, setReacting] = useState(false);
    const { user, reactToPost } = useAuth();

    const handleReaction = async (reaction: 'like' | 'dislike') => {
        if (!post || reacting) return;
        setReacting(true);
        try {
            const counts = await reactToPost(post.id, reaction);
            setPost((current) => current ? { ...current, ...counts } : current);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Could not ${reaction} this post`);
        } finally {
            setReacting(false);
        }
    };

    useEffect(() => {
        const postId = Number(id);
        if (!Number.isInteger(postId) || postId < 1) {
            setLoading(false);
            return;
        }
        let active = true;
        setLoading(true);
        getJson<Post>(`${API_URL}/posts/${postId}`)
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
                        {dayjs(post.publishedAt ?? post.createdAt).format('DD.MM.YYYY')}
                    </time>
                </div>
                <h1>{post.title}</h1>
                {post.excerpt && <p className="post-page__excerpt">{post.excerpt}</p>}
                {!!post.tags.length && <ul className="blog-card__tags">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
                <div className="post-page__body">{post.content}</div>
                <div className="post-page__stats">
                    <span>{post.views.toLocaleString()} views</span>
                    {user ? (
                        <div className="post-page__reactions" aria-label="Post reactions">
                            <button type="button" onClick={() => handleReaction('like')} disabled={reacting} aria-label="Like post">
                                <FontAwesomeIcon icon={faThumbsUp} /> {post.likes}
                            </button>
                            <button type="button" onClick={() => handleReaction('dislike')} disabled={reacting} aria-label="Dislike post">
                                <FontAwesomeIcon icon={faThumbsDown} /> {post.dislikes}
                            </button>
                        </div>
                    ) : (
                        <><span>{post.likes} likes</span><span>{post.dislikes} dislikes</span></>
                    )}
                    <span>{post.commentsCount} comments</span>
                </div>
                <Comments postId={post.id} />
            </div>
        </article>
    );
};

export default Post;
