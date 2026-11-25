import {useEffect, useRef, useState} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { API_URL } from '../../config';
import { findPostBySlug } from '../../api';
import type { Post } from '../../types';
import './post.css';
import PostStats from "./component/PostStats/PostStats.tsx";
import { Breadcrumbs, Comments } from '../../components';

const Post = () => {
    const { id: slugOrId } = useParams();
    const location = useLocation();
    const createdPost = (location.state as { createdPost?: Post } | null)?.createdPost;
    const [reacting, setReacting] = useState(false);
    const { user, reactToPost, getFavorites, addFavorite, removeFavorite } = useAuth();
    const reactingRef = useRef(false);
    const queryClient = useQueryClient();
    const hasCreatedPost = Boolean(createdPost && slugOrId && (createdPost.slug === slugOrId || String(createdPost.id) === slugOrId));
    const postQuery = useQuery({
        queryKey: ['post', slugOrId],
        enabled: Boolean(slugOrId && !hasCreatedPost),
        initialData: hasCreatedPost ? createdPost : undefined,
        queryFn: async () => {
            let postId = slugOrId!;
            if (!/^\d+$/.test(postId)) {
                const matchedPost = await findPostBySlug(postId);
                postId = String(matchedPost.id);
            }
            const response = await fetch(`${API_URL}/posts/${postId}`, { headers: { accept: '*/*' } });
            if (!response.ok) throw new Error(`Request failed (${response.status})`);
            return response.json() as Promise<Post>;
        },
    });
    const post = hasCreatedPost ? createdPost! : postQuery.data ?? null;
    const loading = Boolean(slugOrId && !post && postQuery.isPending);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriting, setFavoriting] = useState(false);

    const handleReaction = async (reaction: 'like' | 'dislike') => {
        if (!post || reactingRef.current) return;

        reactingRef.current = true;
        setReacting(true);

        try {
            const counts = await reactToPost(post.id, reaction);
            queryClient.setQueryData<Post>(['post', slugOrId], (current) => current ? { ...current, ...counts } : current);
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
        if (!user || !post || post.status !== 'published') {
            setIsFavorite(false);
            return;
        }
        let active = true;
        getFavorites(1).then((favorites) => {
            if (active) setIsFavorite(favorites.postIds.includes(post.id));
        }).catch((e: unknown) => {
            console.error(e);
            toast.error('Error while fetching favorites');
        });
        return () => { active = false; };
    }, [user?.id, post?.id, post?.status, getFavorites]);

    const handleToggleFavorite = async () => {
        if (!post || favoriting) return;
        setFavoriting(true);
        try {
            if (isFavorite) {
                await removeFavorite(post.id);
                setIsFavorite(false);
                toast.success('Post removed from favorites');
            } else {
                await addFavorite(post.id);
                setIsFavorite(true);
                toast.success('Post added to favorites');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not update favorites');
        } finally {
            setFavoriting(false);
        }
    };

    useEffect(() => {
        if (postQuery.isError) toast.error(postQuery.error instanceof Error ? postQuery.error.message : 'Could not load this post');
    }, [postQuery.isError, postQuery.error]);

    if (loading) return <section className="post-page"><p>Loading post…</p></section>;
    if (!post) return <section className="post-page"><Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Blog', to: '/blog' }, { label: 'Post not found' }]} /><h1>Post not found</h1></section>;

    return (
        <>
            <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Blog', to: '/blog' }, { label: post.title }]} />
            <article className="post-page">
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
                        isFavorite={isFavorite}
                        favoriting={favoriting}
                        onToggleFavorite={handleToggleFavorite}
                    />
                    {post.status === 'published' ? <Comments postId={post.id} /> : (
                        <p className="post-page__draft-comments" role="status">
                            Comments will be available when this post is published.
                        </p>
                    )}
                </div>
            </article>
        </>
    );
};

export default Post;
