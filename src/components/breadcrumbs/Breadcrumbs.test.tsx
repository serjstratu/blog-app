import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Breadcrumbs from './Breadcrumbs';

describe('Breadcrumbs', () => {
    it('renders linked ancestors and a non-linked current page', () => {
        render(
            <MemoryRouter>
                <Breadcrumbs items={[
                    { label: 'Home', to: '/' },
                    { label: 'Blog', to: '/blog' },
                    { label: 'React article' },
                ]} />
            </MemoryRouter>,
        );

        expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
        expect(screen.getByTestId('breadcrumb-current')).toHaveTextContent('React article');
        expect(screen.getByTestId('breadcrumb-current')).toHaveAttribute('aria-current', 'page');
        expect(screen.queryByRole('link', { name: 'React article' })).not.toBeInTheDocument();
    });

    it('treats the last item as current even when it has a destination', () => {
        render(<MemoryRouter><Breadcrumbs items={[{ label: 'Dashboard', to: '/dashboard' }]} /></MemoryRouter>);
        expect(screen.getByTestId('breadcrumb-current')).toHaveTextContent('Dashboard');
        expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    });
});
