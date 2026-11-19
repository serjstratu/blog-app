import { useState, type FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import type {User} from "../../../../types";

interface UserProfileFormProps {
    user: User;
    onSave: (data: {
        name: string;
        bio: string;
        phone: string | null;
    }) => Promise<void>;
    onCancel: () => void;
}

const UserProfileForm = ({user, onSave, onCancel }: UserProfileFormProps) => {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        setSaving(true);
        setError('');

        try {
            await onSave({
                name: String(form.get('name')).trim(),
                bio: String(form.get('bio')).trim(),
                phone: String(form.get('phone')).trim() || null,
            });
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : 'Could not update profile'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="user-profile__edit" onSubmit={handleSubmit}>
            <label>
                Name
                <input
                    name="name"
                    data-testid="user-profile-name"
                    defaultValue={user.name}
                    required
                    maxLength={100}
                />
            </label>

            <label>
                Bio
                <textarea
                    name="bio"
                    data-testid="user-profile-bio"
                    defaultValue={user.bio ?? ''}
                    rows={4}
                    maxLength={500}
                />
            </label>

            <label>
                Phone
                <input
                    name="phone"
                    type="tel"
                    data-testid="user-profile-phone"
                    defaultValue={user.phone ?? ''}
                    maxLength={30}
                />
            </label>

            {error && (
                <p role="alert" className="user-profile__error">
                    {error}
                </p>
            )}

            <button
                className="user-profile__action user-profile__action--save"
                type="submit"
                disabled={saving}
            >
                <FontAwesomeIcon icon={faFloppyDisk} />
                {saving ? 'Saving…' : 'Save changes'}
            </button>

            <button
                type="button"
                className="user-profile__action user-profile__action--secondary"
                onClick={onCancel}
                disabled={saving}
            >
                Cancel
            </button>
        </form>
    );
};

export default UserProfileForm;