import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Link } from 'react-router-dom';
import type { AppNotification } from '../../types';
import './notifications.css';

dayjs.extend(relativeTime);

interface NotificationItemProps {
    notification: AppNotification;
    onRead: (notification: AppNotification) => void;
    onNavigate: () => void;
}

const NotificationItem = ({ notification, onRead, onNavigate }: NotificationItemProps) => {
    const href = notification.link ?? (
        notification.entityType === 'comment' && notification.postId !== undefined && notification.entityId !== undefined
            ? `/post/${notification.postId}#comment-${notification.entityId}`
            : notification.entityType === 'post' && notification.entityId !== undefined
                ? `/post/${notification.entityId}`
                : '#'
    );

    return (
        <li
            className={`notification-item ${notification.read ? '' : 'notification-item--unread'}`}
            data-testid="notification-item"
        >
            <Link
                to={href}
                onClick={() => {
                    void onRead(notification);
                    onNavigate();
                }}
                data-testid="notification-link"
            >
                <span className="notification-item__dot" aria-hidden="true" />

                <span className="notification-item__content">
                    {notification.title && (
                        <strong data-testid="notification-title">{notification.title}</strong>
                    )}

                    <span data-testid="notification-message">{notification.message}</span>

                    <time
                        dateTime={notification.createdAt}
                        data-testid="notification-time"
                    >
                        {dayjs(notification.createdAt).fromNow()}
                    </time>
                </span>

                {!notification.read && (
                    <span className="notification-item__new" data-testid="notification-new">
                        New
                    </span>
                )}
            </Link>
        </li>
    );
};

export default NotificationItem;
