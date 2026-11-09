import { NavLink } from 'react-router-dom';
import './header.css';

const Header = () => {
    return (
        <header className="header">
            <div className="container header__content">
                <NavLink to="/" className="header__logo">
                    Blog App
                </NavLink>

                <nav className="header__nav">
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/about">About</NavLink>
                </nav>
            </div>
        </header>
    );
};

export default Header;