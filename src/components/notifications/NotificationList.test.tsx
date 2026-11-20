import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppNotification } from '../../types';
import NotificationList from './NotificationList';

vi.mock('./NotificationItem', () => ({
    default: ({
                  notification,
                  onRead,
                  onNavigate,
              }: {
        notification: AppNotification;
        onRead: (notification: AppNotification) => void;
        onNavigate: () => void;
    }) => (
        <li data-testid={`notification-${notification.id}`}>
            <span>{notification.message}</span>
            <button
                type="button"
                data-testid={`read-${notification.id}`}
                onClick={() => onRead(notification)}
            >
                Mark read
            </button>
            <button
                type="button"
                data-testid={`navigate-${notification.id}`}
                onClick={onNavigate}
            >
                Navigate
            </button>
        </li>
    ),
}));

const mockNotifications: AppNotification[] = [
    {
        id: 1,
        type: 'reply',
        message: 'Someone replied to your comment.',
        createdAt: '2026-11-20T22:02:10.636594+02:00',
        read: false,
    },
    {
        id: 2,
        type: 'like',
        message: 'Someone liked your post.',
        createdAt: '2026-11-20T22:05:10.636594+02:00',
        read: true,
    },
];

const renderComponent = ({notifications = mockNotifications, loading = false}: {
    notifications?: AppNotification[];
    loading?: boolean;
} = {}) => {
    const onRead = vi.fn();
    const onNavigate = vi.fn();

    render(
        <NotificationList
            notifications={notifications}
            loading={loading}
            onRead={onRead}
            onNavigate={onNavigate}
        />
    );

    return { onRead, onNavigate };
};

describe('NotificationList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render loading state when loading and notifications are empty', () => {
            renderComponent({
                notifications: [],
                loading: true,
            });

            expect(screen.getByTestId('notification-loading')).toHaveTextContent('Loading notifications…');
        });

        it('should render empty state when notifications are empty', () => {
            renderComponent({
                notifications: [],
            });

            expect(screen.getByTestId('notification-empty')).toHaveTextContent('You’re all caught up.');
        });

        it('should render notification list', () => {
            renderComponent();

            expect(screen.getByTestId('notification-list')).toBeInTheDocument();
        });

        it('should render all notifications', () => {
            renderComponent();

            expect(screen.getByTestId('notification-1')).toHaveTextContent('Someone replied to your comment.');

            expect(screen.getByTestId('notification-2')).toHaveTextContent('Someone liked your post.');
        });

        it('should render notification list when loading with existing notifications', () => {
            renderComponent({
                loading: true,
            });

            expect(screen.getByTestId('notification-list')).toBeInTheDocument();
            expect(screen.queryByTestId('notification-loading')).not.toBeInTheDocument();
        });

        it('should render the correct number of notifications', () => {
            renderComponent();

            expect(screen.getByTestId('notification-list').children).toHaveLength(2);
        });
    });

    describe('callbacks', () => {
        it('should call onRead with the selected notification', () => {
            const { onRead } = renderComponent();

            fireEvent.click(screen.getByTestId('read-1'));

            expect(onRead).toHaveBeenCalledOnce();
            expect(onRead).toHaveBeenCalledWith(mockNotifications[0]);
        });

        it('should call onNavigate when notification navigation occurs', () => {
            const { onNavigate } = renderComponent();

            fireEvent.click(screen.getByTestId('navigate-1'));
            expect(onNavigate).toHaveBeenCalledOnce();
        });
    });
});
