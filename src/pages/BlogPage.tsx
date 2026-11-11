import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { API_URL } from '../config/api';
import './blogPage.css';
import type {Post} from "../types";

let postsRequest: Promise<Post[]> | null = null;

const fetchPosts = () => {
    if (!postsRequest) {
        postsRequest = fetch(`${API_URL}/posts?limit=20&offset=0`, { headers: { accept: '*/*' } })
            .then(async (response): Promise<Post[]> => {
                if (!response.ok) throw new Error('Could not load blog posts');
                return await response.json() as Promise<Post[]>;
            })
            .catch((error) => {
                postsRequest = null;
                throw error;
            });
    }
    return postsRequest;
};

const BlogPage = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts()
            .then((data: Post[]) => setPosts(data))
            .catch((error: unknown) => {
                toast.error(error instanceof Error ? error.message : 'Could not load blog posts');
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="blog-page">
            <header className="blog-page__heading">
                <p className="blog-page__eyebrow">Discover</p>
                <h1>Latest articles</h1>
                <p>Ideas, guides, and stories from our community.</p>
            </header>
            {loading ? <p>Loading posts…</p> : posts.length === 0 ? <p>No posts found.</p> : (
                <div className="blog-grid">
                    {posts.map((post) => (
                        <article className="blog-card" key={post.id}>
                            {post.image && <img className="blog-card__image" src={post.image} alt="" loading="lazy" />}
                            <div className="blog-card__body">
                                <div className="blog-card__meta">
                                    {post.isFeatured && <span className="blog-card__featured">Featured</span>}
                                    <time dateTime={post.publishedAt ?? post.createdAt}>
                                        {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}
                                    </time>
                                </div>
                                <h2>
                                    <Link key={post.id} to={`/post/${post.id}`}>
                                        {post.title}
                                    </Link>
                                </h2>
                                <p>{post.excerpt || post.content}</p>
                                {!!post.tags.length && <ul className="blog-card__tags">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
                                <div className="blog-card__stats">
                                    <span>{post.views.toLocaleString()} views</span>
                                    <span>{post.likes} likes</span>
                                    <span>{post.commentsCount} comments</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
};

export default BlogPage;
