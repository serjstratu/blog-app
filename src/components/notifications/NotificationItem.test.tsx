import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AppNotification } from '../../types';
import NotificationItem from './NotificationItem';

const mockNotification: AppNotification = {
    id: 20,
    type: 'reply',
    entityType: 'comment',
    entityId: 59,
    postId: 91,
    message: 'Someone replied to your comment.',
    read: false,
    createdAt: '2026-11-20T22:02:10.636594+02:00',
};

const renderComponent = (
    overrides: Partial<AppNotification> = {}
) => {
    const notification = { ...mockNotification, ...overrides };
    const onRead = vi.fn();
    const onNavigate = vi.fn();

    render(
        <MemoryRouter>
            <NotificationItem
                notification={notification}
                onRead={onRead}
                onNavigate={onNavigate}
            />
        </MemoryRouter>
    );

    return { notification, onRead, onNavigate };
};

describe('NotificationItem', () => {
    it('should render notification message', () => {
        renderComponent();

        expect(screen.getByTestId('notification-message'))
            .toHaveTextContent('Someone replied to your comment.');
    });

    it('should render title when provided', () => {
        renderComponent({ title: 'New reply' });

        expect(screen.getByTestId('notification-title'))
            .toHaveTextContent('New reply');
    });

    it('should not render title when not provided', () => {
        renderComponent();

        expect(screen.queryByTestId('notification-title')).not.toBeInTheDocument();
    });

    it('should render unread indicator for unread notification', () => {
        renderComponent({ read: false });

        expect(screen.getByTestId('notification-new')).toHaveTextContent('New');
        expect(screen.getByTestId('notification-item'))
            .toHaveClass('notification-item--unread');
    });

    it('should not render unread indicator for read notification', () => {
        renderComponent({ read: true });

        expect(screen.queryByTestId('notification-new')).not.toBeInTheDocument();
        expect(screen.getByTestId('notification-item'))
            .not.toHaveClass('notification-item--unread');
    });

    it('should render relative creation date', () => {
        renderComponent();

        const time = screen.getByTestId('notification-time');

        expect(time).toHaveAttribute('dateTime', mockNotification.createdAt);
        expect(time).toHaveTextContent(/\d+\s+(second|minute|hour|day|month|year)/i);
    });

    it('should navigate to comment inside post', () => {
        renderComponent();

        expect(screen.getByTestId('notification-link'))
            .toHaveAttribute('href', '/post/91#comment-59');
    });

    it('should navigate to post', () => {
        renderComponent({
            entityType: 'post',
            entityId: 42,
            postId: undefined,
        });

        expect(screen.getByTestId('notification-link'))
            .toHaveAttribute('href', '/post/42');
    });

    it('should prioritize explicit link over generated destination', () => {
        renderComponent({
            link: '/custom/destination',
        });

        expect(screen.getByTestId('notification-link'))
            .toHaveAttribute('href', '/custom/destination');
    });

    it('should call onRead and onNavigate when clicked', () => {
        const { notification, onRead, onNavigate } = renderComponent();

        fireEvent.click(screen.getByTestId('notification-link'));

        expect(onRead).toHaveBeenCalledOnce();
        expect(onRead).toHaveBeenCalledWith(notification);
        expect(onNavigate).toHaveBeenCalledOnce();
    });
});
