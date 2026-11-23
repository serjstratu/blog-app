import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import NotFound from './NotFound';

describe('NotFound', () => {
    const renderComponent = () => {
        return render(
            <MemoryRouter>
                <NotFound />
            </MemoryRouter>
        );
    };

    describe('Rendering', () => {
        it('should render the NotFound component', () => {
            renderComponent();

            expect(screen.getByTestId('not-found')).toBeInTheDocument();
            expect(screen.getByTestId('not-found-content')).toBeInTheDocument();
        });

        it('should render the 404 error code', () => {
            renderComponent();

            expect(screen.getByTestId('not-found-code')).toHaveTextContent('404');
        });

        it('should render the page title', () => {
            renderComponent();

            expect(screen.getByTestId('not-found-title')).toHaveTextContent(
                'Lost your way?'
            );
        });

        it('should render the error description', () => {
            renderComponent();

            expect(screen.getByTestId('not-found-description')).toHaveTextContent(
                "The page you're looking for doesn't exist, may have been moved, or is temporarily unavailable."
            );
        });

        it('should render the compass icon container', () => {
            renderComponent();

            expect(screen.getByTestId('not-found-icon')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should render a link to the homepage', () => {
            renderComponent();

            const homeLink = screen.getByTestId('not-found-home-link');

            expect(homeLink).toBeInTheDocument();
            expect(homeLink).toHaveAttribute('href', '/');
            expect(homeLink).toHaveTextContent('Back to homepage');
        });
    });
});
