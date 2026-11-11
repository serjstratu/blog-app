import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AboutPage from './AboutPage';

describe('AboutPage', () => {
    it('should render the page', () => {
        render(<AboutPage />);

        expect(screen.getByTestId('aboutPageHeader')).toBeInTheDocument();
        expect(screen.getByTestId('aboutPageContent')).toBeInTheDocument();
    });
});
