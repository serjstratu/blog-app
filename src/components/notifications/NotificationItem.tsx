import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
import { Link } from 'react-router-dom';
import type { AppNotification } from '../../types';
import './notifications.css';

interface NotificationItemProps {
    notification: AppNotification;
    onRead: (notification: AppNotification) => void;
    onNavigate: () => void;
}

const NotificationItem = ({ notification, onRead, onNavigate }: NotificationItemProps) => {
    const href = notification.link ?? (
        notification.entityType === 'post' && notification.entityId !== undefined
            ? `/post/${notification.entityId}`
            : '#'
    );

    return (
    <li className={`notification-item ${notification.read ? '' : 'notification-item--unread'}`}>
        <Link to={href} onClick={() => { void onRead(notification); onNavigate(); }}>
            <span className="notification-item__dot" aria-hidden="true" />
            <span className="notification-item__content">
                {notification.title && <strong>{notification.title}</strong>}
                <span>{notification.message}</span>
                <time dateTime={notification.createdAt}>{dayjs(notification.createdAt).fromNow()}</time>
            </span>
            {!notification.read && <span className="notification-item__new">New</span>}
        </Link>
    </li>
    );
};

export default NotificationItem;
