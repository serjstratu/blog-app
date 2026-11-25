import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import PostStats from './PostStats';

const defaultProps = {
    views: 1245,
    likes: 128,
    dislikes: 42,
    commentsCount: 24,
    isAuthenticated: true,
    reacting: false,
    onReact: vi.fn(),
    isFavorite: false,
    favoriting: false,
    onToggleFavorite: vi.fn(),
};

describe('PostStats', () => {
    it('should render post statistics', () => {
        render(<PostStats {...defaultProps} />);

        expect(screen.getByTestId('post-stats')).toBeInTheDocument();
        expect(screen.getByTestId('post-views')).toHaveTextContent('1,245');
        expect(screen.getByTestId('post-likes')).toHaveTextContent('128');
        expect(screen.getByTestId('post-dislikes')).toHaveTextContent('42');
        expect(screen.getByTestId('post-comments-count')).toHaveTextContent('24');
    });

    it('should render reaction buttons for authenticated users', () => {
        render(<PostStats {...defaultProps} />);

        expect(screen.getByTestId('post-like-button')).toBeInTheDocument();
        expect(screen.getByTestId('post-dislike-button')).toBeInTheDocument();
        expect(screen.getByTestId('post-favorite-button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('toggles favorite state through the callback', async () => {
        const onToggleFavorite = vi.fn();
        const user = userEvent.setup();
        render(<PostStats {...defaultProps} onToggleFavorite={onToggleFavorite} isFavorite />);

        const button = screen.getByTestId('post-favorite-button');
        expect(button).toHaveAttribute('aria-label', 'Remove from favorites');
        expect(button).toHaveAttribute('aria-pressed', 'true');
        await user.click(button);
        expect(onToggleFavorite).toHaveBeenCalledOnce();
    });

    it('should render static reaction counts for unauthenticated users', () => {
        render(
            <PostStats
                {...defaultProps}
                isAuthenticated={false}
            />
        );

        expect(screen.queryByTestId('post-like-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('post-dislike-button')).not.toBeInTheDocument();

        expect(screen.getByTestId('post-likes')).toHaveTextContent('128');
        expect(screen.getByTestId('post-dislikes')).toHaveTextContent('42');
    });

    it('should call onReact with like when like button is clicked', async () => {
        const user = userEvent.setup();
        const onReact = vi.fn();

        render(
            <PostStats
                {...defaultProps}
                onReact={onReact}
            />
        );

        await user.click(screen.getByTestId('post-like-button'));

        expect(onReact).toHaveBeenCalledOnce();
        expect(onReact).toHaveBeenCalledWith('like');
    });

    it('should call onReact with dislike when dislike button is clicked', async () => {
        const user = userEvent.setup();
        const onReact = vi.fn();

        render(
            <PostStats
                {...defaultProps}
                onReact={onReact}
            />
        );

        await user.click(screen.getByTestId('post-dislike-button'));

        expect(onReact).toHaveBeenCalledOnce();
        expect(onReact).toHaveBeenCalledWith('dislike');
    });

    it('should disable reaction buttons while reacting', () => {
        render(
            <PostStats
                {...defaultProps}
                reacting
            />
        );

        expect(screen.getByTestId('post-like-button')).toBeDisabled();
        expect(screen.getByTestId('post-dislike-button')).toBeDisabled();
    });
});
