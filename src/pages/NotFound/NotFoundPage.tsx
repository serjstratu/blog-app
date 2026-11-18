import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <section>
            <h1>404 - Page not found</h1>
            <Link to="/">Go home</Link>
        </section>
    );
};

export default NotFoundPage;