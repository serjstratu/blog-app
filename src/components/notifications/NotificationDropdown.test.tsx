import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';
import type { AppNotification } from '../../types';

vi.mock('../../hooks/useNotifications', () => ({
    useNotifications: vi.fn(),
}));

vi.mock('./NotificationList', () => ({
    default: ({ notifications, loading, onRead, onNavigate }: {
        notifications: AppNotification[];
        loading: boolean;
        onRead: (notification: AppNotification) => void;
        onNavigate: () => void;
    }) => (
        <div
            data-testid="notification-list"
            data-loading={String(loading)}
        >
            {notifications.map(notification => (
                <div key={notification.id}>
                    <span>{notification.message}</span>
                    <button
                        type="button"
                        data-testid="mark-notification-read"
                        onClick={() => onRead(notification)}
                    >
                        Mark read
                    </button>
                </div>
            ))}

            <button
                type="button"
                data-testid="notification-navigate"
                onClick={onNavigate}
            >
                Navigate
            </button>
        </div>
    ),
}));

const mockUseNotifications = vi.mocked(useNotifications);

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

const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();
const mockRefresh = vi.fn();

const renderComponent = ({notifications = [mockNotification], unreadCount = 1, loading = false}: {
    notifications?: AppNotification[];
    unreadCount?: number;
    loading?: boolean;
} = {}) => {
    const onClose = vi.fn();

    mockUseNotifications.mockReturnValue({
        notifications,
        unreadCount,
        loading,
        markRead: mockMarkRead,
        markAllRead: mockMarkAllRead,
        read: mockMarkAllRead,
        refresh: mockRefresh,
    } as ReturnType<typeof useNotifications>);

    render(<NotificationDropdown onClose={onClose} />);

    return { onClose };
};

describe('NotificationDropdown', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render notification dropdown', () => {
            renderComponent();

            expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
        });

        it('should display unread notification count', () => {
            renderComponent({ unreadCount: 5 });

            expect(screen.getByTestId('notification-unread-count')).toHaveTextContent('5 new');
        });

        it('should not display unread count when there are no unread notifications', () => {
            renderComponent({ unreadCount: 0 });

            expect(screen.queryByTestId('notification-unread-count')).not.toBeInTheDocument();
        });

        it('should render Mark all as read button when unread notifications exist', () => {
            renderComponent({ unreadCount: 3 });

            expect(screen.getByTestId('mark-all-read')).toBeInTheDocument();
        });

        it('should not render Mark all as read button when unread count is zero', () => {
            renderComponent({ unreadCount: 0 });

            expect(screen.queryByTestId('mark-all-read')).not.toBeInTheDocument();
        });

        it('should pass notifications to NotificationList', () => {
            renderComponent();

            expect(screen.getByTestId('notification-list')).toHaveTextContent(mockNotification.message);
        });

        it('should pass loading state to NotificationList', () => {
            renderComponent({ loading: true });

            expect(screen.getByTestId('notification-list')).toHaveAttribute('data-loading', 'true');
        });

        it('should display notification count in footer', () => {
            renderComponent({ notifications: [mockNotification] });

            expect(screen.getByTestId('notification-footer')).toHaveTextContent('1 notification');
        });

        it('should use plural form for multiple notifications', () => {
            renderComponent({
                notifications: [
                    mockNotification,
                    { ...mockNotification, id: 21 },
                ],
            });

            expect(screen.getByTestId('notification-footer'))
                .toHaveTextContent('2 notifications');
        });

        it('should display zero notifications when list is empty', () => {
            renderComponent({ notifications: [] });

            expect(screen.getByTestId('notification-footer')).toHaveTextContent('0 notifications');
        });
    });

    describe('interactions', () => {
        it('should call markAllRead when button is clicked', () => {
            renderComponent();

            fireEvent.click(screen.getByTestId('mark-all-read'));
            expect(mockMarkAllRead).toHaveBeenCalledOnce();
        });

        it('should call markRead with selected notification', () => {
            renderComponent();

            fireEvent.click(screen.getByTestId('mark-notification-read'));

            expect(mockMarkRead).toHaveBeenCalledOnce();
            expect(mockMarkRead).toHaveBeenCalledWith(mockNotification);
        });

        it('should call onClose when notification navigation occurs', () => {
            const { onClose } = renderComponent();

            fireEvent.click(screen.getByTestId('notification-navigate'));
            expect(onClose).toHaveBeenCalledOnce();
        });
    });
});
