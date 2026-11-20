import type { AppNotification } from '../../types';
import NotificationItem from './NotificationItem';
import './notifications.css';

interface NotificationListProps {
    notifications: AppNotification[];
    loading: boolean;
    onRead: (notification: AppNotification) => void;
    onNavigate: () => void;
}

const NotificationList = ({ notifications, loading, onRead, onNavigate }: NotificationListProps) => {
    if (loading && notifications.length === 0) return <p className="notification-list__state">Loading notifications…</p>;
    if (notifications.length === 0) return <p className="notification-list__state">You’re all caught up.</p>;
    return (
        <ul className="notification-list">
            {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} onRead={onRead} onNavigate={onNavigate} />
            ))}
        </ul>
    );
};

export default NotificationList;
