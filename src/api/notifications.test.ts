import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    fetchNotifications,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    notificationStreamUrl,
} from './notifications';

import { getJson } from '../config/getJson';
import { normalizeNotification } from '../utils';

vi.mock('../config/getJson', () => ({
    getJson: vi.fn(),
}));

vi.mock('../utils', () => ({
    normalizeNotification: vi.fn(),
}));

vi.mock('../config', () => ({
    API_URL: 'http://localhost:8000/api',
    DEFAULT_PAGE_SIZE: 10,
}));

const mockGetJson = vi.mocked(getJson);
const mockNormalizeNotification = vi.mocked(normalizeNotification);

const mockNotification = {
    id: 1,
    title: 'New comment',
    message: 'Someone commented on your post',
};

const normalizedNotification = {
    id: 1,
    title: 'New comment',
    message: 'Someone commented on your post',
    isRead: false,
} as any;

describe('notificationsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    describe('fetchNotifications', () => {
        it('should fetch notifications with custom pagination', async () => {
            mockGetJson.mockResolvedValue([mockNotification]);
            mockNormalizeNotification.mockReturnValue(normalizedNotification);

            await fetchNotifications('test-token', 20, 10);

            expect(mockGetJson).toHaveBeenCalledWith(
                'http://localhost:8000/api/notifications?limit=20&offset=10',
                expect.any(Object),
            );
        });

        it('should handle paginated API response', async () => {
            mockGetJson.mockResolvedValue({
                data: [mockNotification],
                total: 1,
            });

            mockNormalizeNotification.mockReturnValue(normalizedNotification);

            const result = await fetchNotifications('test-token');

            expect(result).toEqual([normalizedNotification]);
        });

        it('should filter out notifications that cannot be normalized', async () => {
            mockGetJson.mockResolvedValue([
                mockNotification,
                { id: 2 },
                { id: 3 },
            ]);

            mockNormalizeNotification
                .mockReturnValueOnce(normalizedNotification)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(null);

            const result = await fetchNotifications('test-token');

            expect(result).toEqual([normalizedNotification]);
            expect(mockNormalizeNotification).toHaveBeenCalledTimes(3);
        });

        it('should return an empty array when API returns no notifications', async () => {
            mockGetJson.mockResolvedValue([]);

            const result = await fetchNotifications('test-token');

            expect(result).toEqual([]);
            expect(mockNormalizeNotification).not.toHaveBeenCalled();
        });

        it('should propagate API errors', async () => {
            const error = new Error('Network error');

            mockGetJson.mockRejectedValue(error);

            await expect(fetchNotifications('test-token')).rejects.toThrow(
                'Network error',
            );
        });
    });

    describe('fetchUnreadCount', () => {
        it('should return count when API returns a number', async () => {
            mockGetJson.mockResolvedValue(5);

            const result = await fetchUnreadCount('test-token');

            expect(result).toBe(5);
        });

        it('should return unreadCount from API response', async () => {
            mockGetJson.mockResolvedValue({ unreadCount: 7 });

            const result = await fetchUnreadCount('test-token');

            expect(result).toBe(7);
        });

        it('should support snake_case unread_count', async () => {
            mockGetJson.mockResolvedValue({ unread_count: 3 });

            const result = await fetchUnreadCount('test-token');

            expect(result).toBe(3);
        });

        it('should support count property', async () => {
            mockGetJson.mockResolvedValue({ count: 4 });

            const result = await fetchUnreadCount('test-token');

            expect(result).toBe(4);
        });

        it('should return zero when count is missing', async () => {
            mockGetJson.mockResolvedValue({});

            const result = await fetchUnreadCount('test-token');

            expect(result).toBe(0);
        });

        it('should return zero when count is not a number', async () => {
            mockGetJson.mockResolvedValue({ unreadCount: '5' });

            const result = await fetchUnreadCount('test-token');

            expect(result).toBe(0);
        });

        it('should prioritize unreadCount over other properties', async () => {
            mockGetJson.mockResolvedValue({
                unreadCount: 7,
                unread_count: 3,
                count: 1,
            });

            const result = await fetchUnreadCount('test-token');

            expect(result).toBe(7);
        });

        it('should propagate API errors', async () => {
            mockGetJson.mockRejectedValue(new Error('Request failed'));

            await expect(fetchUnreadCount('test-token')).rejects.toThrow(
                'Request failed',
            );
        });
    });

    describe('markNotificationRead', () => {
        it('should mark notification as read', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
            });

            vi.stubGlobal('fetch', fetchMock);

            await markNotificationRead('test-token', 123);

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:8000/api/notifications/123/read',
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: 'Bearer test-token',
                        accept: '*/*',
                    },
                },
            );
        });

        it('should encode notification ID in URL', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
            });

            vi.stubGlobal('fetch', fetchMock);

            await markNotificationRead('test-token', 'notification/123');

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:8000/api/notifications/notification%2F123/read',
                expect.any(Object),
            );
        });

        it('should throw API error when response is not ok', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                json: vi.fn().mockResolvedValue({
                    detail: 'Notification not found',
                }),
            });

            vi.stubGlobal('fetch', fetchMock);

            await expect(
                markNotificationRead('test-token', 123),
            ).rejects.toThrow('Notification not found');
        });

        it('should use fallback error when response has no detail', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                json: vi.fn().mockResolvedValue({}),
            });

            vi.stubGlobal('fetch', fetchMock);

            await expect(
                markNotificationRead('test-token', 123),
            ).rejects.toThrow('Could not mark notification as read');
        });

        it('should use fallback error when response JSON parsing fails', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            });

            vi.stubGlobal('fetch', fetchMock);

            await expect(
                markNotificationRead('test-token', 123),
            ).rejects.toThrow('Could not mark notification as read');
        });
    });

    describe('markAllNotificationsRead', () => {
        it('should mark all notifications as read', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
            });

            vi.stubGlobal('fetch', fetchMock);

            await markAllNotificationsRead('test-token');

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:8000/api/notifications/read-all',
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: 'Bearer test-token',
                        accept: '*/*',
                    },
                },
            );
        });

        it('should throw API error when response is not ok', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                json: vi.fn().mockResolvedValue({
                    detail: 'Something went wrong',
                }),
            });

            vi.stubGlobal('fetch', fetchMock);

            await expect(
                markAllNotificationsRead('test-token'),
            ).rejects.toThrow('Something went wrong');
        });

        it('should use fallback error when response has no detail', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                json: vi.fn().mockResolvedValue(null),
            });

            vi.stubGlobal('fetch', fetchMock);

            await expect(
                markAllNotificationsRead('test-token'),
            ).rejects.toThrow('Could not mark notifications as read');
        });

        it('should use fallback error when response JSON parsing fails', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            });

            vi.stubGlobal('fetch', fetchMock);

            await expect(
                markAllNotificationsRead('test-token'),
            ).rejects.toThrow('Could not mark notifications as read');
        });
    });

    describe('notificationStreamUrl', () => {
        it('should expose the notifications stream URL', () => {
            expect(notificationStreamUrl).toBe(
                'http://localhost:8000/api/notifications/stream',
            );
        });
    });
});
