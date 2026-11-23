import { useState, type MouseEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

import LoginModal from '../../../features/auth/components/LoginModal';
import NotificationBell from '../../notifications/NotificationBell';
import { useAuth } from '../../../providers/AuthProvider';
import './header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const closeMenu = () => setIsMenuOpen(false);

    const handleLogout = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        closeMenu();

        try {
            await logout();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not log out');
        } finally {
            navigate('/', { replace: true });
        }
    };

    return (
        <>
            <header className="header" data-testid="header">
                <div className="container header__content">
                    <NavLink to="/" className="header__logo" onClick={closeMenu}>
                        <FontAwesomeIcon icon={faCode} />
                        <span>Blog App</span>
                    </NavLink>

                    <button
                        className="header__menu-toggle"
                        type="button"
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={isMenuOpen}
                        aria-controls="header-navigation"
                    >
                        <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} />
                    </button>

                    <nav
                        id="header-navigation"
                        className={`header__nav ${isMenuOpen ? 'header__nav--open' : ''}`}
                    >
                        <NavLink to="/" end onClick={closeMenu}>
                            Home
                        </NavLink>
                        <NavLink to="/blog" onClick={closeMenu}>
                            Blog
                        </NavLink>
                        <NavLink to="/about" onClick={closeMenu}>
                            About
                        </NavLink>
                    </nav>

                    <div className="header__auth">
                        {user ? (
                            <>
                                {user.roles?.some((role) => role.toLowerCase() === 'admin') && (
                                    <Link to="/dashboard" className="header__user" onClick={closeMenu}>Dashboard</Link>
                                )}
                                <Link
                                    to={`/user/${user.id}`}
                                    className="header__user"
                                    onClick={closeMenu}
                                >
                                    {user.name}
                                </Link>

                                <NotificationBell />

                                <button
                                    className="header__button header__button--secondary"
                                    type="button"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button
                                className="header__button"
                                type="button"
                                onClick={() => setIsLoginOpen(true)}
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {isLoginOpen && (
                <LoginModal onClose={() => setIsLoginOpen(false)} />
            )}
        </>
    );
};

export default Header;
