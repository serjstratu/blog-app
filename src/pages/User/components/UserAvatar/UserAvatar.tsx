import { useState, type ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import {API_ORIGIN, MAX_FILE_SIZE} from "../../../../config";

interface UserAvatarProps {
    name: string;
    avatar?: string | null;
    uploadAvatar: (file: File) => Promise<void>;
}

const UserAvatar = ({name, avatar, uploadAvatar}: UserAvatarProps) => {
    const [uploading, setUploading] = useState(false);

    const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image.');
            event.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error('Image size must not exceed 5 MB.');
            event.target.value = '';
            return;
        }

        setUploading(true);

        try {
            await uploadAvatar(file);
            toast.success('Avatar updated successfully.');
        } catch (cause) {
            toast.error(
                cause instanceof Error
                    ? cause.message
                    : 'Image upload error'
            );
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const avatarUrl = avatar
        ? avatar.startsWith('http')
            ? avatar
            : `${API_ORIGIN}${avatar}`
        : null;

    return (
        <div className="user-profile__avatar-wrap">
            {avatarUrl ? (
                <img
                    data-testid="user-avatar-image"
                    className="user-profile__avatar"
                    src={avatarUrl}
                    alt={`${name}'s avatar`}
                />
            ) : (
                <div
                    data-testid="user-avatar-fallback"
                    className="user-profile__avatar user-profile__avatar--empty"
                    aria-hidden="true"
                >
                    {name.charAt(0).toUpperCase()}
                </div>
            )}

            <label className="user-profile__avatar-button">
                {uploading ? 'Uploading…' : 'Change avatar'}

                <input
                    type="file"
                    accept="image/*"
                    data-testid="user-avatar-input"
                    disabled={uploading}
                    onChange={handleChange}
                />
            </label>
        </div>
    );
};

export default UserAvatar;
