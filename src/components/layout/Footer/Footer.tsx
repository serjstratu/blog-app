import './footer.css';

import dayjs from 'dayjs';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <p>© {dayjs().year()} Blog App. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
