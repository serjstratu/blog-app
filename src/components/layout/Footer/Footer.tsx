import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faCode } from '@fortawesome/free-solid-svg-icons';
import './footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__content">
                    <div className="footer__brand">
                        <div className="footer__logo" data-testid="footer-logo">
                            <FontAwesomeIcon icon={faCode} />
                            <span>Blog App</span>
                        </div>

                        <p className="footer__description">
                            A place to share ideas, explore technology
                            and connect with developers.
                        </p>
                    </div>

                    <div className="footer__links">
                        <a
                            href="https://github.com/serjstratu"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub"
                        >
                            <FontAwesomeIcon icon={faGithub} />
                        </a>

                        <a
                            href="https://www.linkedin.com/in/serghei-s-10390677/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                        >
                            <FontAwesomeIcon icon={faLinkedin} />
                        </a>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p>
                        © {dayjs().year()} Blog App. All rights reserved.
                    </p>

                    <span>Built with React & FastAPI</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
