import { createBrowserRouter, RouterProvider, redirect, Outlet } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import PostsList from './pages/PostList.jsx'
import PostDetail from './pages/PostDetail.jsx'
import PostCreate from './pages/PostCreate.jsx'
import PostEdit from './pages/PostEdit.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Profile from './pages/Profile.jsx'
import NotFound from './pages/NotFound.jsx'
import './App.css'

function requireAuthLoader() {
  const token = localStorage.getItem('token');
  if (!token) throw redirect('/login');
  return null;
}

function RootLayout() {
  return (
    <>
      <NavBar />
      <Outlet />
      <Footer />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/posts', element: <PostsList /> },
      { path: '/posts/create', element: <PostCreate /> },
      { path: '/posts/:id', element: <PostDetail /> },
      { path: '/posts/:id/edit', element: <PostEdit /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/profile', element: <Profile />, loader: requireAuthLoader },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
