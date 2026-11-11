import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from "../components/layout/MainLayout/MainLayout.tsx";
import HomePage from "../pages/HomePage.tsx";
import NotFoundPage from "../pages/NotFoundPage.tsx";
import UserPage from "../pages/UserPage.tsx";
import BlogPage from "../pages/BlogPage.tsx";
import PostPage from "../pages/PostPage.tsx";
import { AboutPage } from "../pages";

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/post/:id" element={<PostPage />} />
                    <Route path="/user/:id" element={<UserPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
