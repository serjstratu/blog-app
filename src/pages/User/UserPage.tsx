import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import {
    faEnvelope,
    faPhone,
    faShieldHalved,
    faClock,
    faCalendarDays,
    faRotate,
    faPenToSquare,
    faFloppyDisk,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {UserAvatar, UserProfileForm} from "./components";
import { useAuth } from '../../providers/AuthProvider.tsx';
import {formatDate} from "../../utils";
import Loader from '../../components/loader/Loader.tsx';
import Pagination from '../../components/pagination/Pagination.tsx';
import { DEFAULT_PAGE_SIZE } from '../../config';
import type { Pagination as PaginationData, Post } from '../../types';
import './userPage.css';


const UserPage = () => {
    const { id } = useParams();
    const { user: currentUser, updateUser, uploadAvatar, refreshUser, getFavorites } = useAuth();
    const [profile, setProfile] = useState(currentUser?.id === Number(id) ? currentUser : null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [favoritePosts, setFavoritePosts] = useState<Post[]>([]);
    const [favoritesPagination, setFavoritesPagination] = useState<PaginationData | null>(null);
    const [favoritesPage, setFavoritesPage] = useState(1);
    const [favoritesLoading, setFavoritesLoading] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        const userId = Number(id);
        if (!Number.isInteger(userId) || userId <= 0) {
            setLoading(false);
            return;
        }
        let active = true;
        setLoading(true);
        refreshUser(userId)
            .then((freshUser) => { if (active) setProfile(freshUser); })
            .catch((cause) => {
                if (active) toast.error(cause instanceof Error ? cause.message : 'Could not load profile');
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id, refreshUser, currentUser?.id]);

    useEffect(() => {
        if (currentUser && currentUser.id === Number(id)) setProfile(currentUser);
    }, [currentUser, id]);

    useEffect(() => {
        if (!currentUser || currentUser.id !== Number(id)) {
            setFavoritePosts([]);
            setFavoritesPagination(null);
            return;
        }
        let active = true;
        setFavoritesLoading(true);
        getFavorites(favoritesPage, DEFAULT_PAGE_SIZE)
            .then((result) => {
                if (!active) return;
                setFavoritePosts(result.data);
                setFavoritesPagination(result.pagination);
            })
            .catch((cause) => {
                if (active) toast.error(cause instanceof Error ? cause.message : 'Could not load favorite posts');
            })
            .finally(() => { if (active) setFavoritesLoading(false); });
        return () => { active = false; };
    }, [currentUser?.id, id, favoritesPage, getFavorites]);

    if (!currentUser) return <Navigate to="/" replace />;
    if (loading) {
        return (
            <section className="user-profile" data-testid="user-profile">
                <Loader label="Loading profile" />
            </section>
        );
    }
    if (!profile) return <Navigate to="/" replace />;
    const user = profile;
    const isOwnProfile = currentUser.id === user.id;

    return (
        <section
            className="user-profile"
            aria-labelledby="user-profile-title"
            data-testid="user-profile"
        >
            <UserAvatar
                name={user.name}
                avatar={user.avatar}
                uploadAvatar={uploadAvatar}
            />

            {user.bio && (
                <p className="user-profile__bio" data-testid="user-bio">
                    {user.bio}
                </p>
            )}

            {currentUser?.roles.some((role) =>
                ['admin', 'editor'].includes(role.toLowerCase())
            ) && (
                <Link
                    className="user-profile__action user-profile__action--edit"
                    to="/add/"
                    data-testid="create-post-link"
                >
                    <FontAwesomeIcon icon={faFloppyDisk} />
                    Create post
                </Link>
            )}

            {isOwnProfile && <button
                data-testid="edit-profile-button"
                className={`user-profile__action ${
                    editing
                        ? 'user-profile__action--secondary'
                        : 'user-profile__action--edit'
                }`}
                type="button"
                onClick={() => setEditing((prev) => !prev)}
            >
                <FontAwesomeIcon icon={editing ? faXmark : faPenToSquare} />
                {editing ? 'Cancel editing' : 'Edit profile'}
            </button>}

            {isOwnProfile && editing && (
                <div data-testid="user-profile-form">
                    <UserProfileForm
                        user={user}
                        onSave={async (data) => {
                            await updateUser(data);
                            setEditing(false);
                        }}
                        onCancel={() => setEditing(false)}
                    />
                </div>
            )}

            <dl
                className="user-profile__details"
                data-testid="user-profile-details"
            >
                <div>
                    <dt><FontAwesomeIcon icon={faEnvelope} /> Email</dt>
                    <dd data-testid="user-email">{user.email}</dd>
                </div>

                <div>
                    <dt><FontAwesomeIcon icon={faPhone} /> Phone</dt>
                    <dd data-testid="user-phone">{user.phone || '—'}</dd>
                </div>

                <div>
                    <dt><FontAwesomeIcon icon={faShieldHalved} /> Roles</dt>
                    <dd data-testid="user-roles">
                        {user.roles.length ? user.roles.join(', ') : '—'}
                    </dd>
                </div>

                <div>
                    <dt><FontAwesomeIcon icon={faClock} /> Last login</dt>
                    <dd data-testid="user-last-login">
                        {formatDate(user.last_login)}
                    </dd>
                </div>

                <div>
                    <dt><FontAwesomeIcon icon={faCalendarDays} /> Account created</dt>
                    <dd data-testid="user-created-at">
                        {formatDate(user.created_at)}
                    </dd>
                </div>

                <div>
                    <dt><FontAwesomeIcon icon={faRotate} /> Updated</dt>
                    <dd data-testid="user-updated-at">
                        {formatDate(user.updated_at)}
                    </dd>
                </div>
            </dl>

            {isOwnProfile && (
                <section className="user-profile__favorites" aria-labelledby="user-favorites-title" data-testid="user-favorites">
                    <h2 id="user-favorites-title">Favorite posts</h2>
                    {favoritesLoading ? <Loader label="Loading favorite posts" /> : favoritePosts.length ? (
                        <ul className="user-profile__favorite-list">
                            {favoritePosts.map((post) => (
                                <li key={post.id} className="user-profile__favorite-item">
                                    <Link to={`/post/${post.slug || post.id}`} data-testid={`favorite-post-${post.id}`}>
                                        {post.title}
                                    </Link>
                                    {post.excerpt && <p>{post.excerpt}</p>}
                                </li>
                            ))}
                        </ul>
                    ) : <p data-testid="favorites-empty">No favorite posts yet.</p>}
                    {favoritesPagination && favoritesPagination.totalPages > 1 && (
                        <Pagination
                            currentPage={favoritesPagination.currentPage}
                            totalPages={favoritesPagination.totalPages}
                            hasNextPage={favoritesPagination.hasNextPage}
                            hasPreviousPage={favoritesPagination.hasPreviousPage}
                            onPageChange={setFavoritesPage}
                        />
                    )}
                </section>
            )}
        </section>
    );
};

export default UserPage;
