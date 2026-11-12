import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Pagination from './Pagination';

describe('Pagination', () => {
    const defaultProps = {
        currentPage: 2,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
        onPageChange: vi.fn(),
    };

    it('should render pagination', () => {
        render(<Pagination {...defaultProps} />);

        expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('should render all page buttons', () => {
        render(<Pagination {...defaultProps} />);

        for (let page = 1; page <= 5; page++) {
            expect(screen.getByTestId(`pagination-page-${page}`)).toBeInTheDocument();
        }
    });

    it('should mark the current page as active', () => {
        render(<Pagination {...defaultProps} />);

        const activePage = screen.getByTestId('pagination-page-2');

        expect(activePage).toHaveClass('is-active');
        expect(activePage).toHaveAttribute('aria-current', 'page');
    });

    it('should navigate to the previous page', () => {
        const onPageChange = vi.fn();

        render(<Pagination {...defaultProps} onPageChange={onPageChange} />);

        fireEvent.click(screen.getByTestId('pagination-previous'));

        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('should navigate to the next page', () => {
        const onPageChange = vi.fn();

        render(<Pagination {...defaultProps} onPageChange={onPageChange} />);

        fireEvent.click(screen.getByTestId('pagination-next'));

        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('should navigate to the selected page', () => {
        const onPageChange = vi.fn();

        render(<Pagination {...defaultProps} onPageChange={onPageChange} />);

        fireEvent.click(screen.getByTestId('pagination-page-4'));

        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('should disable previous button when there is no previous page', () => {
        render(
            <Pagination {...defaultProps} hasPreviousPage={false} />
        );

        expect(screen.getByTestId('pagination-previous')).toBeDisabled();
    });

    it('should disable next button when there is no next page', () => {
        render(
            <Pagination {...defaultProps} hasNextPage={false} />
        );

        expect(screen.getByTestId('pagination-next')).toBeDisabled();
    });

    it('should disable all buttons when disabled is true', () => {
        render(<Pagination {...defaultProps} disabled />);

        const buttons = screen.getAllByRole('button');

        buttons.forEach((button) => {
            expect(button).toBeDisabled();
        });
    });
});
