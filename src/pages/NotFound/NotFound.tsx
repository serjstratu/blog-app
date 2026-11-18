import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faHouse } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

import './NotFound.css';

const NotFound = () => {
    return (
        <main className="not-found">
            <div className="not-found__content">
                <div className="not-found__icon">
                    <FontAwesomeIcon icon={faCompass} />
                </div>

                <span className="not-found__code">404</span>

                <h1>Lost your way?</h1>

                <p>
                    The page you're looking for doesn't exist,
                    may have been moved, or is temporarily unavailable.
                </p>

                <Link to="/" className="not-found__link">
                    <FontAwesomeIcon icon={faHouse} />
                    Back to homepage
                </Link>
            </div>
        </main>
    );
};

export default NotFound;
