import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';

export function renderWithQueryClient(ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    return render(ui, {
        ...options,
        wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });
}
