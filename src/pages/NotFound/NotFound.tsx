import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faHouse } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

import './NotFound.css';

const NotFound = () => {
    return (
        <main className="not-found" data-testid="not-found">
            <div className="not-found__content" data-testid="not-found-content">
                <div className="not-found__icon" data-testid="not-found-icon">
                    <FontAwesomeIcon icon={faCompass} />
                </div>

                <span className="not-found__code" data-testid="not-found-code">
                    404
                </span>

                <h1 data-testid="not-found-title">Lost your way?</h1>

                <p data-testid="not-found-description">
                    The page you're looking for doesn't exist,
                    may have been moved, or is temporarily unavailable.
                </p>

                <Link
                    to="/"
                    className="not-found__link"
                    data-testid="not-found-home-link"
                >
                    <FontAwesomeIcon icon={faHouse} />
                    Back to homepage
                </Link>
            </div>
        </main>
    );
};

export default NotFound;
