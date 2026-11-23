import {useEffect, useRef, useState} from 'react';
import dayjs from 'dayjs';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { API_URL } from '../../config';
import { getJson } from '../../config/getJson.ts';
import { findPostBySlug } from '../../api/posts.ts';
import type { Post } from '../../types';
import './post.css';
import PostStats from "./component/PostStats/PostStats.tsx";
import {Comments} from "../../components";

const Post = () => {
    const { id: slugOrId } = useParams();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [reacting, setReacting] = useState(false);
    const { user, reactToPost } = useAuth();
    const reactingRef = useRef(false);

    const handleReaction = async (reaction: 'like' | 'dislike') => {
        if (!post || reactingRef.current) return;

        reactingRef.current = true;
        setReacting(true);

        try {
            const counts = await reactToPost(post.id, reaction);
            setPost(current => current ? { ...current, ...counts } : current);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : `Could not ${reaction} this post`
            );
        } finally {
            reactingRef.current = false;
            setReacting(false);
        }
    };

    useEffect(() => {
        if (!slugOrId) {
            setLoading(false);
            return;
        }
        let active = true;
        setLoading(true);
        const postRequest = /^\d+$/.test(slugOrId)
            ? getJson<Post>(`${API_URL}/posts/${slugOrId}`)
            : findPostBySlug(slugOrId).then((matchedPost) =>
                getJson<Post>(`${API_URL}/posts/${matchedPost.id}`),
            );
        postRequest
            .then((data) => { if (active) setPost(data); })
            .catch((error: unknown) => {
                if (active) toast.error(error instanceof Error ? error.message : 'Could not load this post');
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [slugOrId]);

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
                <PostStats
                    views={post.views}
                    likes={post.likes}
                    dislikes={post.dislikes}
                    commentsCount={post.commentsCount}
                    isAuthenticated={!!user}
                    reacting={reacting}
                    onReact={handleReaction}
                />
                <Comments postId={post.id} />
            </div>
        </article>
    );
};

export default Post;
