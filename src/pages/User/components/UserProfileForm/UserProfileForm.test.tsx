import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {UserProfileForm} from "../index.ts";
import type { User } from '../../../../types';

describe('UserProfileForm', () => {
    const user = {
        id: 1,
        name: 'John Doe',
        bio: 'Software developer',
        phone: '+37312345678',
    } as User;

    const defaultProps = {
        user,
        onSave: vi.fn().mockResolvedValue(undefined),
        onCancel: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render form with user data', () => {
        render(<UserProfileForm {...defaultProps} />);

        expect(screen.getByTestId('user-profile-name'))
            .toHaveValue('John Doe');

        expect(screen.getByTestId('user-profile-bio'))
            .toHaveValue('Software developer');

        expect(screen.getByTestId('user-profile-phone'))
            .toHaveValue('+37312345678');
    });

    it('should render empty values when bio and phone are null', () => {
        render(
            <UserProfileForm
                {...defaultProps}
                user={{
                    ...user,
                    bio: null,
                    phone: null,
                }}
            />
        );

        expect(screen.getByTestId('user-profile-bio')).toHaveValue('');
        expect(screen.getByTestId('user-profile-phone')).toHaveValue('');
    });

    it('should render save and cancel buttons', () => {
        render(<UserProfileForm {...defaultProps} />);

        expect(
            screen.getByRole('button', { name: /save changes/i })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', { name: /cancel/i })
        ).toBeInTheDocument();
    });

    it('should call onSave with form data', async () => {
        render(<UserProfileForm {...defaultProps} />);

        fireEvent.change(screen.getByTestId('user-profile-name'), {
            target: { value: 'Jane Doe' },
        });

        fireEvent.change(screen.getByTestId('user-profile-bio'), {
            target: { value: 'Frontend developer' },
        });

        fireEvent.change(screen.getByTestId('user-profile-phone'), {
            target: { value: '+40712345678' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: /save changes/i })
        );

        await waitFor(() => {
            expect(defaultProps.onSave).toHaveBeenCalledWith({
                name: 'Jane Doe',
                bio: 'Frontend developer',
                phone: '+40712345678',
            });
        });
    });

    it('should trim whitespace from form values', async () => {
        render(<UserProfileForm {...defaultProps} />);

        fireEvent.change(screen.getByTestId('user-profile-name'), {
            target: { value: '  Jane Doe  ' },
        });

        fireEvent.change(screen.getByTestId('user-profile-bio'), {
            target: { value: '  Frontend developer  ' },
        });

        fireEvent.change(screen.getByTestId('user-profile-phone'), {
            target: { value: '  +40712345678  ' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: /save changes/i })
        );

        await waitFor(() => {
            expect(defaultProps.onSave).toHaveBeenCalledWith({
                name: 'Jane Doe',
                bio: 'Frontend developer',
                phone: '+40712345678',
            });
        });
    });

    it('should convert empty phone to null', async () => {
        render(<UserProfileForm {...defaultProps} />);

        fireEvent.change(screen.getByTestId('user-profile-phone'), {
            target: { value: '   ' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: /save changes/i })
        );

        await waitFor(() => {
            expect(defaultProps.onSave).toHaveBeenCalledWith({
                name: 'John Doe',
                bio: 'Software developer',
                phone: null,
            });
        });
    });

    it('should convert empty bio to empty string', async () => {
        render(<UserProfileForm {...defaultProps} />);

        fireEvent.change(screen.getByTestId('user-profile-bio'), {
            target: { value: '   ' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: /save changes/i })
        );

        await waitFor(() => {
            expect(defaultProps.onSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    bio: '',
                })
            );
        });
    });

    it('should show saving state while onSave is pending', async () => {
        let resolveSave!: () => void;

        const onSave = vi.fn(
            () => new Promise<void>((resolve) => {
                resolveSave = resolve;
            })
        );

        render(
            <UserProfileForm
                {...defaultProps}
                onSave={onSave}
            />
        );

        fireEvent.click(
            screen.getByRole('button', { name: /save changes/i })
        );

        expect(screen.getByText('Saving…')).toBeInTheDocument();

        expect(
            screen.getByRole('button', { name: /saving/i })
        ).toBeDisabled();

        expect(
            screen.getByRole('button', { name: /cancel/i })
        ).toBeDisabled();

        resolveSave();

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: /save changes/i })
            ).toBeEnabled();
        });
    });

    it('should display error when onSave fails with Error', async () => {
        const onSave = vi.fn().mockRejectedValue(
            new Error('Failed to update profile')
        );

        render(
            <UserProfileForm
                {...defaultProps}
                onSave={onSave}
            />
        );

        fireEvent.click(
            screen.getByRole('button', { name: /save changes/i })
        );

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Failed to update profile');
    });

    it('should display fallback error when onSave fails with unknown cause', async () => {
        const onSave = vi.fn().mockRejectedValue('Unknown error');

        render(
            <UserProfileForm
                {...defaultProps}
                onSave={onSave}
            />
        );

        fireEvent.click(
            screen.getByRole('button', { name: /save changes/i })
        );

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Could not update profile');
    });

    it('should clear previous error when submitting again', async () => {
        const onSave = vi.fn()
            .mockRejectedValueOnce(new Error('First error'))
            .mockResolvedValueOnce(undefined);

        render(
            <UserProfileForm
                {...defaultProps}
                onSave={onSave}
            />
        );

        const saveButton = screen.getByRole('button', {
            name: /save changes/i,
        });

        fireEvent.click(saveButton);

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('First error');

        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledTimes(2);
        });
    });

    it('should call onCancel when cancel button is clicked', () => {
        render(<UserProfileForm {...defaultProps} />);

        fireEvent.click(
            screen.getByRole('button', { name: /cancel/i })
        );

        expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not submit when name is empty', () => {
        render(<UserProfileForm {...defaultProps} />);

        const nameInput = screen.getByTestId('user-profile-name');

        fireEvent.change(nameInput, {
            target: { value: '' },
        });

        expect(nameInput).toBeRequired();
        expect(defaultProps.onSave).not.toHaveBeenCalled();
    });
});
