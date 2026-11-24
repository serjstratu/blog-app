import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from "../components/layout/MainLayout/MainLayout.tsx";
import {AboutPage, AddPost, Blog, Dashboard, EditPost, NotFound, Post, UserPage} from "../pages";
import HomePage from "../pages/Home/HomePage.tsx";

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/post/:id" element={<Post />} />
                    <Route path="/post/edit/:id" element={<EditPost />} />
                    <Route path="/user/:id" element={<UserPage />} />
                    <Route path="/add/" element={<AddPost />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
