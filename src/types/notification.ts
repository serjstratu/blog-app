export interface AppNotification {
    id: string | number;
    type?: string;
    title?: string;
    message: string;
    createdAt: string;
    read: boolean;
    link?: string;
    entityType?: string;
    entityId?: string | number;
    data?: Record<string, unknown>;
}

export interface NotificationsPage {
    data: unknown[];
    pagination?: {
        currentPage?: number;
        perPage?: number;
        totalItems?: number;
        totalPages?: number;
        hasNextPage?: boolean;
        hasPreviousPage?: boolean;
    };
}

