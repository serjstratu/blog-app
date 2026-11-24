import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './HomePage';

describe('HomePage', () => {
    it('renders the welcome heading and introduction', () => {
        render(<HomePage />);

        expect(screen.getByRole('heading', { name: 'Latest articles' })).toBeInTheDocument();
        expect(screen.getByText('Welcome to Blog App.')).toBeInTheDocument();
    });
});
