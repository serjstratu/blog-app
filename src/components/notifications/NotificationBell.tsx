import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';
import './notifications.css';

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const { unreadCount } = useNotifications();

    return (
        <div className="notification-center" data-testid="notification-center">
            <button
                className="notification-bell"
                type="button"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={open}
                onClick={() => setOpen(value => !value)}
                data-testid="notification-bell"
            >
                <FontAwesomeIcon icon={faBell} />

                {unreadCount > 0 && (
                    <span data-testid="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <NotificationDropdown onClose={() => setOpen(false)} />
            )}
        </div>
    );
};

export default NotificationBell;
