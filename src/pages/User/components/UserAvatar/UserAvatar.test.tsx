import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserAvatar from "./UserAvatar.tsx";
import { toast } from 'react-toastify';
import { API_ORIGIN, MAX_FILE_SIZE } from '../../../../config';

vi.mock('react-toastify', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

describe('UserAvatar', () => {
    const defaultProps = {
        name: 'John Doe',
        avatar: null,
        uploadAvatar: vi.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render avatar image when avatar URL is provided', () => {
        render(
            <UserAvatar
                {...defaultProps}
                avatar="https://example.com/avatar.jpg"
            />
        );

        const avatar = screen.getByTestId('user-avatar-image');

        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveAttribute(
            'src',
            'https://example.com/avatar.jpg'
        );
        expect(avatar).toHaveAttribute('alt', "John Doe's avatar");
    });

    it('should prepend API_ORIGIN to relative avatar URL', () => {
        render(
            <UserAvatar
                {...defaultProps}
                avatar="/uploads/avatar.jpg"
            />
        );

        expect(screen.getByTestId('user-avatar-image')).toHaveAttribute(
            'src',
            `${API_ORIGIN}/uploads/avatar.jpg`
        );
    });

    it('should render first letter of name when avatar is not provided', () => {
        render(<UserAvatar {...defaultProps} />);

        expect(screen.getByTestId('user-avatar-fallback'))
            .toHaveTextContent('J');
    });

    it('should render uppercase first letter of name', () => {
        render(
            <UserAvatar
                {...defaultProps}
                name="john"
            />
        );

        expect(screen.getByTestId('user-avatar-fallback'))
            .toHaveTextContent('J');
    });

    it('should render change avatar label', () => {
        render(<UserAvatar {...defaultProps} />);

        expect(screen.getByText('Change avatar')).toBeInTheDocument();
    });

    it('should show error when selected file is not an image', () => {
        render(<UserAvatar {...defaultProps} />);

        const file = new File(['document'], 'document.pdf', {
            type: 'application/pdf',
        });

        const input = screen.getByTestId('user-avatar-input');

        fireEvent.change(input, {
            target: { files: [file] },
        });

        expect(toast.error).toHaveBeenCalledWith(
            'Please select an image.'
        );

        expect(defaultProps.uploadAvatar).not.toHaveBeenCalled();
        expect(input).toHaveValue('');
    });

    it('should show error when image exceeds maximum file size', () => {
        render(<UserAvatar {...defaultProps} />);

        const file = new File(
            [new Uint8Array(MAX_FILE_SIZE + 1)],
            'large-image.jpg',
            { type: 'image/jpeg' }
        );

        const input = screen.getByTestId('user-avatar-input');

        fireEvent.change(input, {
            target: { files: [file] },
        });

        expect(toast.error).toHaveBeenCalledWith(
            'Image size must not exceed 5 MB.'
        );

        expect(defaultProps.uploadAvatar).not.toHaveBeenCalled();
        expect(input).toHaveValue('');
    });

    it('should upload selected image successfully', async () => {
        const uploadAvatar = vi.fn().mockResolvedValue(undefined);

        render(
            <UserAvatar
                {...defaultProps}
                uploadAvatar={uploadAvatar}
            />
        );

        const file = new File(['image'], 'avatar.png', {
            type: 'image/png',
        });

        fireEvent.change(screen.getByTestId('user-avatar-input'), {
            target: { files: [file] },
        });

        await waitFor(() => {
            expect(uploadAvatar).toHaveBeenCalledWith(file);
        });

        expect(toast.success).toHaveBeenCalledWith(
            'Avatar updated successfully.'
        );
    });

    it('should show uploading state while image is being uploaded', async () => {
        let resolveUpload!: () => void;

        const uploadAvatar = vi.fn(
            () =>
                new Promise<void>((resolve) => {
                    resolveUpload = resolve;
                })
        );

        render(
            <UserAvatar
                {...defaultProps}
                uploadAvatar={uploadAvatar}
            />
        );

        fireEvent.change(screen.getByTestId('user-avatar-input'), {
            target: {
                files: [
                    new File(['image'], 'avatar.png', {
                        type: 'image/png',
                    }),
                ],
            },
        });

        expect(screen.getByText('Uploading…')).toBeInTheDocument();
        expect(screen.getByTestId('user-avatar-input')).toBeDisabled();

        resolveUpload();

        await waitFor(() => {
            expect(screen.getByText('Change avatar')).toBeInTheDocument();
        });

        expect(screen.getByTestId('user-avatar-input')).toBeEnabled();
    });

    it('should show error when upload fails with Error', async () => {
        const uploadAvatar = vi.fn().mockRejectedValue(
            new Error('Upload failed')
        );

        render(
            <UserAvatar
                {...defaultProps}
                uploadAvatar={uploadAvatar}
            />
        );

        fireEvent.change(screen.getByTestId('user-avatar-input'), {
            target: {
                files: [
                    new File(['image'], 'avatar.png', {
                        type: 'image/png',
                    }),
                ],
            },
        });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Upload failed');
        });
    });

    it('should show fallback error when upload fails with unknown cause', async () => {
        const uploadAvatar = vi.fn().mockRejectedValue('Unknown error');

        render(
            <UserAvatar
                {...defaultProps}
                uploadAvatar={uploadAvatar}
            />
        );

        fireEvent.change(screen.getByTestId('user-avatar-input'), {
            target: {
                files: [
                    new File(['image'], 'avatar.png', {
                        type: 'image/png',
                    }),
                ],
            },
        });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Image upload error');
        });
    });

    it('should reset input after successful upload', async () => {
        render(<UserAvatar {...defaultProps} />);

        const input = screen.getByTestId('user-avatar-input');

        fireEvent.change(input, {
            target: {
                files: [
                    new File(['image'], 'avatar.png', {
                        type: 'image/png',
                    }),
                ],
            },
        });

        await waitFor(() => {
            expect(input).toHaveValue('');
        });
    });

    it('should not upload when no file is selected', () => {
        render(<UserAvatar {...defaultProps} />);

        fireEvent.change(screen.getByTestId('user-avatar-input'), {
            target: { files: [] },
        });

        expect(defaultProps.uploadAvatar).not.toHaveBeenCalled();
    });
});
