import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './mainLayout.css';

const MainLayout = () => {
    return (
        <div className="main-layout">
            <Header />

            <main className="main-layout__content container">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
};

export default MainLayout;