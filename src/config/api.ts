const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const API_URL = configuredApiUrl.replace(/\/$/, '');
export const API_ORIGIN = new URL(API_URL).origin;
