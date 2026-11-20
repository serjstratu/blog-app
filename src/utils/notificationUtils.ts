import type { AppNotification } from '../types';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (...values: unknown[]): string | undefined =>
    values.find((value): value is string => typeof value === 'string');

const getId = (...values: unknown[]): string | number | undefined =>
    values.find(
        (value): value is string | number =>
            typeof value === 'string' || typeof value === 'number'
    );

const normalizeRead = (value: unknown): boolean =>
    value === true || value === 'true' || value === 1;

export const normalizeNotification = (value: unknown): AppNotification | null => {
    if (!isRecord(value)) return null;

    const data = isRecord(value.data) ? value.data : undefined;

    const id = getId(value.id);
    if (id === undefined) return null;

    const postId = getId(
        value.postId,
        value.post_id,
        data?.postId,
        data?.post_id
    );

    const entityType = getString(
        value.entityType,
        value.entity_type,
        data?.entityType,
        data?.entity_type
    );

    const entityId = getId(
        value.entityId,
        value.entity_id,
        data?.entityId,
        data?.entity_id
    );

    const link = getString(value.link, value.url);
    const notificationLink = link ?? (
        entityType === 'post' && entityId !== undefined
            ? `/post/${entityId}`
            : entityType === 'comment' && postId !== undefined && entityId !== undefined
                ? `/post/${postId}#comment-${entityId}`
                : undefined
    );

    return {
        id,
        type: getString(value.type),
        title: getString(value.title),
        message: getString(
            value.message,
            value.body,
            value.content,
            value.description
        ) ?? 'You have a new notification',
        createdAt: getString(
            value.createdAt,
            value.created_at,
            value.timestamp
        ) ?? new Date().toISOString(),
        read: normalizeRead(value.read ?? value.isRead ?? value.is_read),
        link: notificationLink,
        postId,
        entityType,
        entityId,
        data,
    };
};
