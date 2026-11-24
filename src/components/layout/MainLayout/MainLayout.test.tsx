import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MainLayout from './MainLayout';

vi.mock('../Header/Header', () => ({ default: () => <header data-testid="layout-header">Header</header> }));
vi.mock('../Footer/Footer', () => ({ default: () => <footer data-testid="layout-footer">Footer</footer> }));

describe('MainLayout', () => {
    it('renders the header, nested route content, and footer in the main layout', () => {
        render(
            <MemoryRouter initialEntries={['/blog']}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path="/blog" element={<h1>Blog page content</h1>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        const layout = screen.getByTestId('layout-header').parentElement;
        expect(layout).toHaveClass('main-layout');
        expect(screen.getByTestId('layout-header')).toBeInTheDocument();
        expect(screen.getByRole('main')).toHaveClass('main-layout__content', 'container');
        expect(screen.getByRole('heading', { name: 'Blog page content' })).toBeInTheDocument();
        expect(screen.getByTestId('layout-footer')).toBeInTheDocument();
        expect(layout).toContainElement(screen.getByRole('main'));
    });
});
