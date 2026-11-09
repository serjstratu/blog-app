import './footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <p>© {new Date().getFullYear()} Blog App. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;