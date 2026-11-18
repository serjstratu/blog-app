const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const API_URL = configuredApiUrl.replace(/\/$/, '');
export const API_ORIGIN = new URL(API_URL).origin;
