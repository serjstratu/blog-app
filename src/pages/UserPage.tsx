import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import './userPage.css';

const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleString() : '—';

const UserPage = () => {
    const { id } = useParams();
    const { user } = useAuth();

    if (!user) return <Navigate to="/" replace />;
    if (id !== String(user.id)) return <Navigate to={`/user/${user.id}`} replace />;

    return (
        <section className="user-profile" aria-labelledby="user-profile-title">
            <div className="user-profile__intro">
                {user.avatar ? (
                    <img className="user-profile__avatar" src={user.avatar} alt={`${user.name}'s avatar`} />
                ) : (
                    <div className="user-profile__avatar user-profile__avatar--empty" aria-hidden="true">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <p className="user-profile__eyebrow">User profile</p>
                    <h1 id="user-profile-title">{user.name}</h1>
                    <p className="user-profile__username">@{user.username}</p>
                </div>
            </div>

            {user.bio && <p className="user-profile__bio">{user.bio}</p>}

            <dl className="user-profile__details">
                <div><dt>Email</dt><dd>{user.email}</dd></div>
                <div><dt>Phone</dt><dd>{user.phone || '—'}</dd></div>
                <div><dt>Roles</dt><dd>{user.roles.length ? user.roles.join(', ') : '—'}</dd></div>
                <div><dt>Last login</dt><dd>{formatDate(user.last_login)}</dd></div>
                <div><dt>Account created</dt><dd>{formatDate(user.created_at)}</dd></div>
                <div><dt>Updated</dt><dd>{formatDate(user.updated_at)}</dd></div>
            </dl>
        </section>
    );
};

export default UserPage;
