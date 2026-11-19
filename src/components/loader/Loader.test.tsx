import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {Loader} from "../index.ts";


describe('Loader', () => {
    it('should render loader', () => {
        render(<Loader />);

        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should use medium size by default', () => {
        render(<Loader />);

        expect(screen.getByRole('status')).toHaveAttribute(
            'data-size',
            'medium',
        );
    });

    it.each(['small', 'medium', 'large'] as const)(
        'should render with %s size',
        (size) => {
            render(<Loader size={size} />);

            expect(screen.getByRole('status')).toHaveAttribute(
                'data-size',
                size,
            );
        },
    );

    it('should render custom label', () => {
        render(<Loader label="Loading posts..." />);

        expect(screen.getByText('Loading posts...')).toBeInTheDocument();
    });

    it('should not render label when it is not provided', () => {
        render(<Loader />);

        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    it('should use default accessible label when label is not provided', () => {
        render(<Loader />);

        expect(screen.getByRole('status')).toHaveAttribute(
            'aria-label',
            'Loading',
        );
    });

    it('should use custom accessible label', () => {
        render(<Loader label="Loading posts..." />);

        expect(screen.getByRole('status')).toHaveAttribute(
            'aria-label',
            'Loading posts...',
        );
    });
});
