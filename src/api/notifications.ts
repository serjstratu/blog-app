import { API_URL, DEFAULT_PAGE_SIZE } from '../config';
import { type AppNotification, type NotificationsPage } from '../types';
import { normalizeNotification } from "../utils";

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, accept: '*/*' });

const parseError = async (response: Response, fallback: string) => {
    const body = await response.json().catch(() => null);
    return new Error(body?.detail || fallback);
};

const fetchJson = async <T,>(url: string, headers: HeadersInit): Promise<T> => {
    const response = await fetch(url, { headers });
    if (!response.ok) throw await parseError(response, `Request failed (${response.status})`);
    return response.json() as Promise<T>;
};

export const fetchNotifications = async (token: string, limit = DEFAULT_PAGE_SIZE, offset = 0): Promise<AppNotification[]> => {
    const result = await fetchJson<unknown[] | NotificationsPage>(`${API_URL}/notifications?limit=${limit}&offset=${offset}`, authHeaders(token));
    const values = Array.isArray(result) ? result : result.data;
    return values.map(normalizeNotification).filter((item): item is AppNotification => item !== null);
};

export const fetchUnreadCount = async (token: string): Promise<number> => {
    const result = await fetchJson<Record<string, unknown> | number>(`${API_URL}/notifications/unread-count`, authHeaders(token));
    if (typeof result === 'number') return result;
    const count = result.unreadCount ?? result.unread_count ?? result.count;
    return typeof count === 'number' ? count : 0;
};

export const markNotificationRead = async (token: string, id: string | number) => {
    const response = await fetch(`${API_URL}/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH', headers: authHeaders(token),
    });
    if (!response.ok) throw await parseError(response, 'Could not mark notification as read');
};

export const markAllNotificationsRead = async (token: string) => {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH', headers: authHeaders(token),
    });
    if (!response.ok) throw await parseError(response, 'Could not mark notifications as read');
};

export const notificationStreamUrl = `${API_URL}/notifications/stream`;
