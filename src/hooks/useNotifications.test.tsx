import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useNotifications } from './useNotifications';
import { NotificationContext } from '../context/NotificationContext';

describe('useNotifications', () => {
    it('should return notification context', () => {
        const contextValue = {
            notifications: [],
            unreadCount: 0,
            loading: false,
            refresh: vi.fn(),
            markRead: vi.fn().mockResolvedValue(undefined),
            markAllRead: vi.fn().mockResolvedValue(undefined),
        };

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <NotificationContext.Provider value={contextValue}>
                {children}
            </NotificationContext.Provider>
        );

        const { result } = renderHook(() => useNotifications(), { wrapper });

        expect(result.current).toBe(contextValue);
    });

    it('should throw an error when used outside NotificationProvider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            expect(() => renderHook(() => useNotifications())).toThrow(
                'useNotifications must be used within NotificationProvider'
            );
        } finally {
            consoleError.mockRestore();
        }
    });
});
