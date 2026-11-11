
import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import { API_ORIGIN } from '../config/api';
import {
    faEnvelope,
    faPhone,
    faShieldHalved,
    faClock,
    faCalendarDays,
    faRotate,
    faUser,
    faPenToSquare,
    faFloppyDisk,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';

import { useAuth } from '../providers/AuthProvider';
import './userPage.css';

const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleString() : '—';

const UserPage = () => {
    const { id } = useParams();
    const { user: currentUser, updateUser, uploadAvatar, refreshUser } = useAuth();
    const [profile, setProfile] = useState(currentUser?.id === Number(id) ? currentUser : null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const requestedUserId = useRef<number | null>(null);

    useEffect(() => {
        const userId = Number(id);
        if (!Number.isInteger(userId) || userId <= 0) {
            setLoading(false);
            return;
        }
        if (requestedUserId.current === userId) return;
        requestedUserId.current = userId;
        let active = true;
        setLoading(true);
        refreshUser(userId)
            .then((freshUser) => { if (active) setProfile(freshUser); })
            .catch((cause) => {
                if (active) toast.error(cause instanceof Error ? cause.message : 'Could not load profile');
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id, refreshUser]);

    useEffect(() => {
        if (currentUser && currentUser.id === Number(id)) setProfile(currentUser);
    }, [currentUser, id]);

    if (loading && !profile) return <section className="user-profile">Loading profile…</section>;
    if (!profile) return <Navigate to="/" replace />;
    const user = profile;

    return (
        <section className="user-profile" aria-labelledby="user-profile-title">
            <div className="user-profile__intro">
                <div className="user-profile__avatar-wrap">
                    {user.avatar ? (
                        <img className="user-profile__avatar" src={user.avatar.startsWith('http') ? user.avatar : `${API_ORIGIN}${user.avatar}`} alt={`${user.name}'s avatar`} />
                    ) : (
                        <div className="user-profile__avatar user-profile__avatar--empty" aria-hidden="true">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <label className="user-profile__avatar-button">
                        {uploadingAvatar ? 'Uploading…' : 'Change avatar'}
                        <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingAvatar}
                            onChange={async (event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;
                                
                                if (!file.type.startsWith('image/')) {
                                    toast.error('Please select an image.');
                                    event.target.value = '';
                                    return;
                                }
                                if (file.size > 5 * 1024 * 1024) {
                                    toast.error('Image size must not exceed 5 MB.');
                                    event.target.value = '';
                                    return;
                                }
                                setUploadingAvatar(true);
                                try {
                                    await uploadAvatar(file);
                                    toast.success('Avatar updated successfully.');
                                } catch (cause) {
                                    toast.error(cause instanceof Error ? cause.message : 'Image upload error');
                                } finally {
                                    setUploadingAvatar(false);
                                    event.target.value = '';
                                }
                            }}
                        />
                    </label>
                </div>

                <div>
                    <p className="user-profile__eyebrow">
                        <FontAwesomeIcon icon={faUser} />
                        {' '}User profile
                    </p>
                    <h1 id="user-profile-title">{user.name}</h1>
                    <p className="user-profile__username">@{user.username}</p>
                </div>
            </div>

            {user.bio && (
                <p className="user-profile__bio">{user.bio}</p>
            )}

            <button className={`user-profile__action ${editing ? 'user-profile__action--secondary' : 'user-profile__action--edit'}`} type="button" onClick={() => { setError(''); setEditing(!editing); }}>
                <FontAwesomeIcon icon={editing ? faXmark : faPenToSquare} />
                {editing ? 'Cancel editing' : 'Edit profile'}
            </button>
            {editing && (
                <form className="user-profile__edit" onSubmit={async (event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    setSaving(true);
                    setError('');
                    try {
                        await updateUser({
                            name: String(form.get('name')).trim(),
                            bio: String(form.get('bio')).trim(),
                            phone: String(form.get('phone')).trim() || null,
                        });
                        setEditing(false);
                    } catch (cause) {
                        setError(cause instanceof Error ? cause.message : 'Could not update profile');
                    } finally {
                        setSaving(false);
                    }
                }}>
                    <label>Name<input name="name" defaultValue={user.name} required maxLength={100} /></label>
                    <label>Bio<textarea name="bio" defaultValue={user.bio ?? ''} rows={4} maxLength={500} /></label>
                    <label>Phone<input name="phone" type="tel" defaultValue={user.phone ?? ''} maxLength={30} /></label>
                    {error && <p role="alert" className="user-profile__error">{error}</p>}
                    <button className="user-profile__action user-profile__action--save" type="submit" disabled={saving}>
                        <FontAwesomeIcon icon={faFloppyDisk} />
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                </form>
            )}

            <dl className="user-profile__details">
                <div>
                    <dt>
                        <FontAwesomeIcon icon={faEnvelope} />
                        Email
                    </dt>
                    <dd>{user.email}</dd>
                </div>

                <div>
                    <dt>
                        <FontAwesomeIcon icon={faPhone} />
                        Phone
                    </dt>
                    <dd>{user.phone || '—'}</dd>
                </div>

                <div>
                    <dt>
                        <FontAwesomeIcon icon={faShieldHalved} />
                        Roles
                    </dt>
                    <dd>{user.roles.length ? user.roles.join(', ') : '—'}</dd>
                </div>

                <div>
                    <dt>
                        <FontAwesomeIcon icon={faClock} />
                        Last login
                    </dt>
                    <dd>{formatDate(user.last_login)}</dd>
                </div>

                <div>
                    <dt>
                        <FontAwesomeIcon icon={faCalendarDays} />
                        Account created
                    </dt>
                    <dd>{formatDate(user.created_at)}</dd>
                </div>

                <div>
                    <dt>
                        <FontAwesomeIcon icon={faRotate} />
                        Updated
                    </dt>
                    <dd>{formatDate(user.updated_at)}</dd>
                </div>
            </dl>
        </section>
    );
};

export default UserPage;
