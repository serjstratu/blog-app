import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faThumbsUp,
    faThumbsDown,
    faEye,
    faComment,
} from '@fortawesome/free-solid-svg-icons';
import './post-stats.css';

interface PostStatsProps {
    views: number;
    likes: number;
    dislikes: number;
    commentsCount: number;
    isAuthenticated: boolean;
    reacting: boolean;
    onReact: (reaction: 'like' | 'dislike') => void;
}

const PostStats = ({views, likes, dislikes, commentsCount, isAuthenticated, reacting, onReact}: PostStatsProps) => {
    return (
        <div className="post-page__stats" data-testid="post-stats">
            <span className="post-stat" data-testid="post-views">
                <FontAwesomeIcon icon={faEye} />
                {views.toLocaleString()}
            </span>

            {isAuthenticated ? (
                <div className="post-page__reactions">
                    <button
                        type="button"
                        data-testid="post-like-button"
                        className="post-reaction post-reaction--like"
                        onClick={() => onReact('like')}
                        disabled={reacting}
                        aria-label="Like post"
                    >
                        <FontAwesomeIcon icon={faThumbsUp} />
                        <span data-testid="post-likes">{likes}</span>
                    </button>

                    <button
                        type="button"
                        data-testid="post-dislike-button"
                        className="post-reaction post-reaction--dislike"
                        onClick={() => onReact('dislike')}
                        disabled={reacting}
                        aria-label="Dislike post"
                    >
                        <FontAwesomeIcon icon={faThumbsDown} />
                        <span data-testid="post-dislikes">{dislikes}</span>
                    </button>
                </div>
            ) : (
                <>
                    <span className="post-stat" data-testid="post-likes">
                        <FontAwesomeIcon icon={faThumbsUp} />
                        {likes}
                    </span>
                    <span className="post-stat" data-testid="post-dislikes">
                        <FontAwesomeIcon icon={faThumbsDown} />
                        {dislikes}
                    </span>
                </>
            )}

            <span className="post-stat" data-testid="post-comments-count">
                <FontAwesomeIcon icon={faComment} />
                {commentsCount}
            </span>
        </div>
    );
};

export default PostStats;