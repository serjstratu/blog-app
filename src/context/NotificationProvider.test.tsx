import { useContext } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useAuth } from '../providers/AuthProvider';
import {
    fetchNotifications,
    fetchUnreadCount,
    markAllNotificationsRead,
    markNotificationRead,
} from '../api/notifications';
import { toast } from 'react-toastify';
import type { AppNotification } from '../types';
import {NotificationContext, NotificationProvider} from './NotificationContext';

vi.mock('../providers/AuthProvider', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../api/notifications', () => ({
    fetchNotifications: vi.fn(),
    fetchUnreadCount: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    markNotificationRead: vi.fn(),
    notificationStreamUrl: '/api/notifications/stream',
}));

vi.mock('react-toastify', () => ({
    toast: {
        error: vi.fn(),
    },
}));

vi.mock('../utils', () => ({
    normalizeNotification: vi.fn((value) => value),
}));

const mockNotification = {
    id: 1,
    read: false,
} as AppNotification;

const mockNotifications = [
    mockNotification,
    { id: 2, read: true } as AppNotification,
];


const createSseStream = () => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;

    const body = new ReadableStream<Uint8Array>({
        start(streamController) {
            controller = streamController;
        },
    });

    return {
        body,
        push(data: string) {
            controller.enqueue(new TextEncoder().encode(data));
        },
        close() {
            controller.close();
        },
    };
};


const wrapper = ({ children }: { children: ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
);

const renderProvider = () =>
    renderHook(() => {
        const context = useContext(NotificationContext);

        if (!context) {
            throw new Error('NotificationContext is unavailable');
        }

        return context;
    }, { wrapper });

describe('NotificationProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAuth).mockReturnValue({
            accessToken: null,
        } as ReturnType<typeof useAuth>);

        vi.stubGlobal(
            'fetch',
            vi.fn(() => new Promise(() => {})),
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('Initial state', () => {
        it('should provide the initial state', () => {
            const { result } = renderProvider();

            expect(result.current.notifications).toEqual([]);
            expect(result.current.unreadCount).toBe(0);
            expect(result.current.loading).toBe(false);
            expect(result.current.markRead).toBeInstanceOf(Function);
            expect(result.current.markAllRead).toBeInstanceOf(Function);
            expect(result.current.refresh).toBeInstanceOf(Function);
        });

        it('should not fetch notifications without an access token', () => {
            renderProvider();

            expect(fetchNotifications).not.toHaveBeenCalled();
            expect(fetchUnreadCount).not.toHaveBeenCalled();
        });
    });

    describe('Loading notifications', () => {
        it('should fetch notifications and unread count on mount', async () => {
            vi.mocked(useAuth).mockReturnValue({
                accessToken: 'test-token',
            } as ReturnType<typeof useAuth>);

            vi.mocked(fetchNotifications).mockResolvedValue(mockNotifications);
            vi.mocked(fetchUnreadCount).mockResolvedValue(1);

            const { result } = renderProvider();

            await waitFor(() => {
                expect(result.current.notifications).toEqual(mockNotifications);
                expect(result.current.unreadCount).toBe(1);
                expect(result.current.loading).toBe(false);
            });

            expect(fetchNotifications).toHaveBeenCalledWith('test-token');
            expect(fetchUnreadCount).toHaveBeenCalledWith('test-token');
        });

        it('should set loading to true while fetching notifications', async () => {
            vi.mocked(useAuth).mockReturnValue({
                accessToken: 'test-token',
            } as ReturnType<typeof useAuth>);

            let resolveNotifications!: (value: AppNotification[]) => void;

            vi.mocked(fetchNotifications).mockImplementation(
                () => new Promise((resolve) => {
                    resolveNotifications = resolve;
                }),
            );

            vi.mocked(fetchUnreadCount).mockResolvedValue(1);

            const { result } = renderProvider();

            await waitFor(() => {
                expect(result.current.loading).toBe(true);
            });

            await act(async () => {
                resolveNotifications(mockNotifications);
            });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });

        it('should handle API errors', async () => {
            vi.mocked(useAuth).mockReturnValue({
                accessToken: 'test-token',
            } as ReturnType<typeof useAuth>);

            vi.mocked(fetchNotifications).mockRejectedValue(
                new Error('Could not load notifications'),
            );

            vi.mocked(fetchUnreadCount).mockResolvedValue(0);

            const { result } = renderProvider();

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith(
                    'Could not load notifications',
                );
                expect(result.current.loading).toBe(false);
            });
        });

        it('should clear notifications when the user logs out', async () => {
            vi.mocked(useAuth).mockReturnValue({
                accessToken: 'test-token',
            } as ReturnType<typeof useAuth>);

            vi.mocked(fetchNotifications).mockResolvedValue(mockNotifications);
            vi.mocked(fetchUnreadCount).mockResolvedValue(1);

            const { result, rerender } = renderProvider();

            await waitFor(() => {
                expect(result.current.notifications).toEqual(mockNotifications);
                expect(result.current.unreadCount).toBe(1);
            });

            vi.mocked(useAuth).mockReturnValue({
                accessToken: null,
            } as ReturnType<typeof useAuth>);

            rerender();

            await waitFor(() => {
                expect(result.current.notifications).toEqual([]);
                expect(result.current.unreadCount).toBe(0);
            });
        });
    });
});

describe('markRead', () => {
    beforeEach(() => {
        vi.mocked(useAuth).mockReturnValue({
            accessToken: 'test-token',
        } as ReturnType<typeof useAuth>);

        vi.mocked(fetchNotifications).mockResolvedValue(mockNotifications);
        vi.mocked(fetchUnreadCount).mockResolvedValue(1);
        vi.mocked(markNotificationRead).mockResolvedValue(undefined);
    });

    it('should mark notification as read', async () => {
        const { result } = renderProvider();

        await waitFor(() => {
            expect(result.current.notifications).toEqual(mockNotifications);
        });

        await act(async () => {
            await result.current.markRead(mockNotification);
        });

        expect(markNotificationRead).toHaveBeenCalledWith('test-token', 1);
        expect(result.current.notifications[0].read).toBe(true);
        expect(result.current.unreadCount).toBe(0);
    });

    it('should not mark an already read notification', async () => {
        const { result } = renderProvider();

        await waitFor(() => {
            expect(result.current.notifications).toEqual(mockNotifications);
        });

        await act(async () => {
            await result.current.markRead(mockNotifications[1]);
        });

        expect(markNotificationRead).not.toHaveBeenCalled();
        expect(result.current.unreadCount).toBe(1);
    });

    it('should not mark notification without access token', async () => {
        vi.mocked(useAuth).mockReturnValue({
            accessToken: null,
        } as ReturnType<typeof useAuth>);

        const { result } = renderProvider();

        await act(async () => {
            await result.current.markRead(mockNotification);
        });

        expect(markNotificationRead).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
        vi.mocked(markNotificationRead).mockRejectedValue(
            new Error('Could not mark notification as read'),
        );

        const { result } = renderProvider();

        await waitFor(() => {
            expect(result.current.notifications).toEqual(mockNotifications);
        });

        await act(async () => {
            await result.current.markRead(mockNotification);
        });

        expect(toast.error).toHaveBeenCalledWith(
            'Could not mark notification as read',
        );

        expect(result.current.notifications[0].read).toBe(false);
        expect(result.current.unreadCount).toBe(1);
    });

    it('should not decrease unread count below zero', async () => {
        vi.mocked(fetchUnreadCount).mockResolvedValue(0);

        const { result } = renderProvider();

        await waitFor(() => {
            expect(result.current.notifications).toEqual(mockNotifications);
        });

        await act(async () => {
            await result.current.markRead(mockNotification);
        });

        expect(result.current.unreadCount).toBe(0);
    });
});

describe('markAllRead', () => {
    beforeEach(() => {
        vi.mocked(useAuth).mockReturnValue({
            accessToken: 'test-token',
        } as ReturnType<typeof useAuth>);

        vi.mocked(fetchNotifications).mockResolvedValue(mockNotifications);
        vi.mocked(fetchUnreadCount).mockResolvedValue(1);
        vi.mocked(markAllNotificationsRead).mockResolvedValue(undefined);
    });

    it('should mark all notifications as read', async () => {
        const { result } = renderProvider();

        await waitFor(() => {
            expect(result.current.unreadCount).toBe(1);
        });

        await act(async () => {
            await result.current.markAllRead();
        });

        expect(markAllNotificationsRead).toHaveBeenCalledWith('test-token');
        expect(result.current.notifications.every((item) => item.read)).toBe(true);
        expect(result.current.unreadCount).toBe(0);
    });

    it('should not call API when there are no unread notifications', async () => {
        vi.mocked(fetchUnreadCount).mockResolvedValue(0);

        const { result } = renderProvider();

        await waitFor(() => {
            expect(result.current.notifications).toEqual(mockNotifications);
        });

        await act(async () => {
            await result.current.markAllRead();
        });

        expect(markAllNotificationsRead).not.toHaveBeenCalled();
    });

    it('should not call API without access token', async () => {
        vi.mocked(useAuth).mockReturnValue({
            accessToken: null,
        } as ReturnType<typeof useAuth>);

        const { result } = renderProvider();

        await act(async () => {
            await result.current.markAllRead();
        });

        expect(markAllNotificationsRead).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
        vi.mocked(markAllNotificationsRead).mockRejectedValue(
            new Error('Could not mark all notifications as read'),
        );

        const { result } = renderProvider();

        await waitFor(() => {
            expect(result.current.unreadCount).toBe(1);
        });

        await act(async () => {
            await result.current.markAllRead();
        });

        expect(toast.error).toHaveBeenCalledWith(
            'Could not mark all notifications as read',
        );

        expect(result.current.unreadCount).toBe(1);
        expect(result.current.notifications[0].read).toBe(false);
    });
});

describe('SSE connection', () => {
    beforeEach(() => {
        vi.mocked(useAuth).mockReturnValue({
            accessToken: 'test-token',
        } as ReturnType<typeof useAuth>);

        vi.mocked(fetchNotifications).mockResolvedValue([]);
        vi.mocked(fetchUnreadCount).mockResolvedValue(0);
    });

    it('should establish SSE connection with authorization headers', async () => {
        const stream = createSseStream();

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                body: stream.body,
            }),
        );

        const { unmount } = renderProvider();

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                '/api/notifications/stream',
                expect.objectContaining({
                    headers: {
                        Accept: 'text/event-stream',
                        Authorization: 'Bearer test-token',
                    },
                    credentials: 'include',
                }),
            );
        });

        unmount();
        stream.close();
    });

    it('should add a new notification from SSE', async () => {
        const stream = createSseStream();

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                body: stream.body,
            }),
        );

        const { result, unmount } = renderProvider();

        await waitFor(() => {
            expect(fetch).toHaveBeenCalled();
            expect(fetchNotifications).toHaveBeenCalled();
        });

        await act(async () => {
            stream.push(
                `data: ${JSON.stringify({ id: 3, read: false })}\n\n`,
            );
        });

        await waitFor(() => {
            expect(result.current.notifications[0]).toEqual({
                id: 3,
                read: false,
            });
            expect(result.current.unreadCount).toBe(1);
        });

        unmount();
        stream.close();
    });

    it('should support notification payload wrapped in notification property', async () => {
        const stream = createSseStream();

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                body: stream.body,
            }),
        );

        const { result, unmount } = renderProvider();

        await waitFor(() => expect(fetch).toHaveBeenCalled());

        await act(async () => {
            stream.push(
                `data: ${JSON.stringify({
                    notification: { id: 4, read: false },
                })}\n\n`,
            );
        });

        await waitFor(() => {
            expect(result.current.notifications[0]).toEqual({
                id: 4,
                read: false,
            });
            expect(result.current.unreadCount).toBe(1);
        });

        unmount();
        stream.close();
    });

    it('should ignore duplicate notifications when updating unread count', async () => {
        const stream = createSseStream();

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                body: stream.body,
            }),
        );

        const { result, unmount } = renderProvider();

        await waitFor(() => expect(fetch).toHaveBeenCalled());

        const notification = { id: 5, read: false };

        await act(async () => {
            stream.push(`data: ${JSON.stringify(notification)}\n\n`);
            stream.push(`data: ${JSON.stringify(notification)}\n\n`);
        });

        await waitFor(() => {
            expect(result.current.notifications).toHaveLength(1);
            expect(result.current.unreadCount).toBe(1);
        });

        unmount();
        stream.close();
    });

    it('should not increase unread count for read notifications', async () => {
        const stream = createSseStream();

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                body: stream.body,
            }),
        );

        const { result, unmount } = renderProvider();

        await waitFor(() => expect(fetch).toHaveBeenCalled());

        await act(async () => {
            stream.push(
                `data: ${JSON.stringify({ id: 6, read: true })}\n\n`,
            );
        });

        await waitFor(() => {
            expect(result.current.notifications[0].id).toBe(6);
        });

        expect(result.current.unreadCount).toBe(0);

        unmount();
        stream.close();
    });

    it('should ignore malformed JSON events', async () => {
        const stream = createSseStream();
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                body: stream.body,
            }),
        );

        const { result, unmount } = renderProvider();

        await waitFor(() => expect(fetch).toHaveBeenCalled());

        await act(async () => {
            stream.push('data: invalid-json\n\n');
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });

        expect(result.current.notifications).toEqual([]);

        consoleSpy.mockRestore();
        unmount();
        stream.close();
    });
});

