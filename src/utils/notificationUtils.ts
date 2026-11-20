import type {AppNotification} from "../types";

export const normalizeNotification = (value: unknown): AppNotification | null => {
    if (!value || typeof value !== 'object') return null;
    const item = value as Record<string, unknown>;
    const nestedData = item.data && typeof item.data === 'object' ? item.data as Record<string, unknown> : undefined;
    const id = item.id;
    if (typeof id !== 'string' && typeof id !== 'number') return null;

    const rawMessage = item.message ?? item.body ?? item.content ?? item.description;
    const rawTitle = item.title;
    const createdAt = item.createdAt ?? item.created_at ?? item.timestamp;
    const read = item.read ?? item.isRead ?? item.is_read;
    const rawEntityType = item.entityType ?? item.entity_type ?? nestedData?.entityType ?? nestedData?.entity_type;
    const entityType = typeof rawEntityType === 'string' ? rawEntityType : undefined;
    const rawEntityId = item.entityId ?? item.entity_id ?? nestedData?.entityId ?? nestedData?.entity_id;
    const entityId = typeof rawEntityId === 'string' || typeof rawEntityId === 'number'
        ? rawEntityId
        : undefined;
    const explicitLink = typeof item.link === 'string' ? item.link : typeof item.url === 'string' ? item.url : undefined;

    return {
        id,
        type: typeof item.type === 'string' ? item.type : undefined,
        title: typeof rawTitle === 'string' ? rawTitle : undefined,
        message: typeof rawMessage === 'string' ? rawMessage : 'You have a new notification',
        createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
        read: read === true || read === 'true' || read === 1,
        link: explicitLink ?? (entityType === 'post' && entityId !== undefined ? `/post/${entityId}` : undefined),
        entityType,
        entityId,
        data: nestedData,
    };
};
