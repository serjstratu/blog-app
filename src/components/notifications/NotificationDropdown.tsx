import { useNotifications } from '../../hooks/useNotifications';
import NotificationList from './NotificationList';
import './notifications.css';

interface NotificationDropdownProps {
    onClose: () => void;
}

const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
    const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

    return (
        <section className="notification-dropdown" aria-label="Notification center">
            <header className="notification-dropdown__header">
                <div>
                    <h2>Notifications</h2>
                    {unreadCount > 0 && <span>{unreadCount} new</span>}
                </div>
                {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()}>Mark all as read</button>}
            </header>
            <NotificationList
                notifications={notifications}
                loading={loading}
                onRead={(notification) => { void markRead(notification); }}
                onNavigate={onClose}
            />
            <footer className="notification-dropdown__footer">
                {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
            </footer>
        </section>
    );
};

export default NotificationDropdown;
