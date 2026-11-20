import { useState } from 'react';
import {Link, NavLink} from 'react-router-dom';
import LoginModal from '../../../features/auth/components/LoginModal';
import {useAuth} from "../../../providers/AuthProvider.tsx";
import { toast } from 'react-toastify';
import NotificationBell from '../../notifications/NotificationBell';
import './header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const handleLogout = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        try {
            await logout();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not log out');
        }
    };

    return (
        <>
            <header className="header">
                <div className="container header__content">
                    <NavLink to="/" className="header__logo">
                        Blog App
                    </NavLink>

                    <nav className="header__nav">
                        <NavLink to="/">Home</NavLink>
                        <NavLink to="/blog">Blog</NavLink>
                        <NavLink to="/about">About</NavLink>
                    </nav>

                    <div className="header__auth">
                        {user ? (
                            <>
                                <Link to={`/user/${user.id}`}>
                                <span>{user.name}</span>
                                </Link>
                                <NotificationBell />
                                <button onClick={handleLogout}>Logout</button>
                            </>
                        ) : (
                            <button onClick={() => setIsLoginOpen(true)}>
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
