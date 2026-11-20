import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeNotification } from "./notificationUtils.ts";

const validNotification = {
    id: 20,
    actorId: 11,
    recipientId: 1,
    type: 'reply',
    entityType: 'comment',
    entityId: 59,
    postId: 91,
    message: 'Someone replied to your comment.',
    isRead: false,
    createdAt: '2026-11-20T22:02:10.636594+02:00',
};

describe('normalizeNotification', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    describe('input validation', () => {
        it.each([
            null,
            undefined,
            '',
            0,
            123,
            true,
            [],
        ])('should return null for invalid input: %s', (value) => {
            expect(normalizeNotification(value)).toBeNull();
        });

        it('should return null when id is missing', () => {
            const { id, ...notification } = validNotification;

            expect(normalizeNotification(notification)).toBeNull();
        });

        it.each([null, undefined, {}, [], true])(
            'should return null when id is invalid: %s',
            (id) => {
                expect(normalizeNotification({ ...validNotification, id })).toBeNull();
            }
        );

        it('should accept string id', () => {
            const result = normalizeNotification({
                ...validNotification,
                id: 'notification-20',
            });

            expect(result?.id).toBe('notification-20');
        });
    });

    describe('field normalization', () => {
        it('should normalize notification fields', () => {
            expect(normalizeNotification(validNotification)).toMatchObject({
                id: 20,
                type: 'reply',
                entityType: 'comment',
                entityId: 59,
                postId: 91,
                message: 'Someone replied to your comment.',
                read: false,
                createdAt: validNotification.createdAt,
                link: '/post/91#comment-59',
            });
        });

        it('should support snake_case field names', () => {
            const result = normalizeNotification({
                id: 20,
                entity_type: 'comment',
                entity_id: 59,
                post_id: 91,
                created_at: validNotification.createdAt,
                is_read: true,
            });

            expect(result).toMatchObject({
                entityType: 'comment',
                entityId: 59,
                postId: 91,
                createdAt: validNotification.createdAt,
                read: true,
                link: '/post/91#comment-59',
            });
        });

        it('should extract fields from nested data', () => {
            const result = normalizeNotification({
                id: 20,
                data: {
                    entityType: 'comment',
                    entityId: 59,
                    postId: 91,
                },
            });

            expect(result).toMatchObject({
                entityType: 'comment',
                entityId: 59,
                postId: 91,
                link: '/post/91#comment-59',
            });
        });

        it('should prioritize top-level fields over nested data', () => {
            const result = normalizeNotification({
                id: 20,
                entityType: 'post',
                entityId: 42,
                postId: 42,
                data: {
                    entityType: 'comment',
                    entityId: 59,
                    postId: 91,
                },
            });

            expect(result).toMatchObject({
                entityType: 'post',
                entityId: 42,
                postId: 42,
                link: '/post/42',
            });
        });

        it('should ignore invalid nested data', () => {
            const result = normalizeNotification({
                id: 20,
                data: [],
            });

            expect(result?.data).toBeUndefined();
        });

        it('should ignore fields with invalid types', () => {
            const result = normalizeNotification({
                id: 20,
                type: 123,
                title: false,
                message: 123,
                entityType: 123,
                entityId: {},
                postId: [],
            });

            expect(result).toMatchObject({
                id: 20,
                type: undefined,
                title: undefined,
                message: 'You have a new notification',
                entityType: undefined,
                entityId: undefined,
                postId: undefined,
            });
        });
    });

    describe('message normalization', () => {
        it.each([
            ['message', 'Message'],
            ['body', 'Body'],
            ['content', 'Content'],
            ['description', 'Description'],
        ])('should extract message from %s', (field, expected) => {
            const result = normalizeNotification({
                id: 20,
                [field]: expected,
            });

            expect(result?.message).toBe(expected);
        });

        it('should prioritize message fields', () => {
            const result = normalizeNotification({
                id: 20,
                message: 'Message',
                body: 'Body',
                content: 'Content',
            });

            expect(result?.message).toBe('Message');
        });

        it('should use default message when no valid message exists', () => {
            const result = normalizeNotification({
                id: 20,
                message: 123,
            });

            expect(result?.message).toBe('You have a new notification');
        });
    });

    describe('read state normalization', () => {
        it.each([
            [true, true],
            ['true', true],
            [1, true],
            [false, false],
            ['false', false],
            [0, false],
            [undefined, false],
            [null, false],
        ])('should normalize read value %s to %s', (value, expected) => {
            const result = normalizeNotification({
                id: 20,
                read: value,
            });

            expect(result?.read).toBe(expected);
        });

        it('should support isRead and is_read aliases', () => {
            expect(normalizeNotification({
                id: 20,
                isRead: true,
            })?.read).toBe(true);

            expect(normalizeNotification({
                id: 20,
                is_read: 1,
            })?.read).toBe(true);
        });

        it('should prioritize read field over aliases', () => {
            const result = normalizeNotification({
                id: 20,
                read: false,
                isRead: true,
            });

            expect(result?.read).toBe(false);
        });
    });

    describe('date normalization', () => {
        it('should preserve createdAt', () => {
            const result = normalizeNotification(validNotification);

            expect(result?.createdAt).toBe(validNotification.createdAt);
        });

        it('should support created_at and timestamp aliases', () => {
            expect(normalizeNotification({
                id: 20,
                created_at: validNotification.createdAt,
            })?.createdAt).toBe(validNotification.createdAt);

            expect(normalizeNotification({
                id: 20,
                timestamp: validNotification.createdAt,
            })?.createdAt).toBe(validNotification.createdAt);
        });

        it('should use current date when createdAt is missing', () => {
            const now = new Date('2026-11-20T22:00:00.000Z');
            vi.useFakeTimers();
            vi.setSystemTime(now);

            const result = normalizeNotification({ id: 20 });

            expect(result?.createdAt).toBe(now.toISOString());
        });
    });

    describe('link generation', () => {
        it('should generate post link', () => {
            const result = normalizeNotification({
                id: 20,
                entityType: 'post',
                entityId: 42,
            });

            expect(result?.link).toBe('/post/42');
        });

        it('should generate comment link with post and comment ids', () => {
            const result = normalizeNotification({
                id: 20,
                entityType: 'comment',
                entityId: 59,
                postId: 91,
            });

            expect(result?.link).toBe('/post/91#comment-59');
        });

        it('should not generate comment link without postId', () => {
            const result = normalizeNotification({
                id: 20,
                entityType: 'comment',
                entityId: 59,
            });

            expect(result?.link).toBeUndefined();
        });

        it('should not generate comment link without entityId', () => {
            const result = normalizeNotification({
                id: 20,
                entityType: 'comment',
                postId: 91,
            });

            expect(result?.link).toBeUndefined();
        });

        it('should not generate link for unsupported entity type', () => {
            const result = normalizeNotification({
                id: 20,
                entityType: 'user',
                entityId: 11,
            });

            expect(result?.link).toBeUndefined();
        });

        it('should prioritize explicit link', () => {
            const result = normalizeNotification({
                ...validNotification,
                link: '/custom/link',
            });

            expect(result?.link).toBe('/custom/link');
        });

        it('should support url as explicit link alias', () => {
            const result = normalizeNotification({
                ...validNotification,
                url: '/custom/url',
            });

            expect(result?.link).toBe('/custom/url');
        });
    });
});
