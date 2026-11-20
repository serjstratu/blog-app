import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'react-toastify';
import { fetchNotifications, fetchUnreadCount, markAllNotificationsRead, markNotificationRead, notificationStreamUrl } from '../api/notifications';
import { type AppNotification } from '../types';
import { useAuth } from '../providers/AuthProvider';
import {normalizeNotification} from "../utils/notificationUtils.ts";

interface NotificationContextValue {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    markRead: (notification: AppNotification) => Promise<void>;
    markAllRead: () => Promise<void>;
    refresh: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

const getStreamNotification = (payload: unknown) => {
    if (payload && typeof payload === 'object' && 'notification' in payload) {
        return normalizeNotification((payload as { notification: unknown }).notification);
    }
    return normalizeNotification(payload);
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { accessToken } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const seenIds = useRef(new Set<string | number>());

    const refresh = useCallback(async () => {
        if (!accessToken) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        setLoading(true);
        try {
            const [items, count] = await Promise.all([fetchNotifications(accessToken), fetchUnreadCount(accessToken)]);
            seenIds.current = new Set(items.map((item) => item.id));
            setNotifications(items);
            setUnreadCount(count);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not load notifications');
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => { void refresh(); }, [refresh]);

    useEffect(() => {
        if (!accessToken) return;
        let active = true;
        let controller: AbortController | null = null;
        let retryDelay = 1000;

        const connect = async () => {
            while (active) {
                controller = new AbortController();
                try {
                    const response = await fetch(notificationStreamUrl, {
                        headers: { Accept: 'text/event-stream', Authorization: `Bearer ${accessToken}` },
                        credentials: 'include',
                        signal: controller.signal,
                    });
                    if (!response.ok || !response.body) throw new Error(`Notification stream failed (${response.status})`);
                    retryDelay = 1000;
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    while (active) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const events = buffer.split(/\r?\n\r?\n/);
                        buffer = events.pop() ?? '';
                        for (const eventBlock of events) {
                            const data = eventBlock.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n');
                            if (!data) continue;
                            try {
                                const item = getStreamNotification(JSON.parse(data) as unknown);
                                if (!item) continue;
                                const isNew = !seenIds.current.has(item.id);
                                seenIds.current.add(item.id);
                                setNotifications((current) => [item, ...current.filter((existing) => existing.id !== item.id)].slice(0, 20));
                                if (isNew && !item.read) setUnreadCount((count) => count + 1);
                            } catch {
                                // Ignore malformed SSE messages and keep the stream alive.
                            }
                        }
                    }
                } catch (error) {
                    if (!active || (error instanceof DOMException && error.name === 'AbortError')) return;
                }
                if (active) {
                    await refresh();
                    if (!active) return;
                    await new Promise((resolve) => window.setTimeout(resolve, retryDelay));
                    retryDelay = Math.min(retryDelay * 2, 30_000);
                }
            }
        };

        void connect();
        return () => {
            active = false;
            controller?.abort();
        };
    }, [accessToken, refresh]);

    const markRead = useCallback(async (notification: AppNotification) => {
        if (!accessToken || notification.read) return;
        try {
            await markNotificationRead(accessToken, notification.id);
            setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
            setUnreadCount((count) => Math.max(0, count - 1));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not mark notification as read');
        }
    }, [accessToken]);

    const markAllRead = useCallback(async () => {
        if (!accessToken || unreadCount === 0) return;
        try {
            await markAllNotificationsRead(accessToken);
            setNotifications((current) => current.map((item) => ({ ...item, read: true })));
            setUnreadCount(0);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not mark notifications as read');
        }
    }, [accessToken, unreadCount]);

    return <NotificationContext.Provider value={{ notifications, unreadCount, loading, markRead, markAllRead, refresh }}>{children}</NotificationContext.Provider>;
};
