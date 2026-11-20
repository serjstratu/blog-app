import { useNotifications } from '../../hooks/useNotifications';
import NotificationList from './NotificationList';
import './notifications.css';

interface NotificationDropdownProps {
    onClose: () => void;
}

const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
    const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

    return (
        <section
            className="notification-dropdown"
            aria-label="Notification center"
            data-testid="notification-dropdown"
        >
            <header className="notification-dropdown__header">
                <div>
                    <h2>Notifications</h2>

                    {unreadCount > 0 && (
                        <span data-testid="notification-unread-count">
                            {unreadCount} new
                        </span>
                    )}
                </div>

                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={() => void markAllRead()}
                        data-testid="mark-all-read"
                    >
                        Mark all as read
                    </button>
                )}
            </header>

            <NotificationList
                notifications={notifications}
                loading={loading}
                onRead={(notification) => {
                    void markRead(notification);
                }}
                onNavigate={onClose}
            />

            <footer
                className="notification-dropdown__footer"
                data-testid="notification-footer"
            >
                {notifications.length}{' '}
                {notifications.length === 1 ? 'notification' : 'notifications'}
            </footer>
        </section>
    );
};

export default NotificationDropdown;
