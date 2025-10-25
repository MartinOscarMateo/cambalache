import { createBrowserRouter, RouterProvider, redirect, Outlet } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import PostsList from './pages/PostList.jsx';
import PostDetail from './pages/PostDetail.jsx';
import PostCreate from './pages/PostCreate.jsx';
import PostEdit from './pages/PostEdit.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Profile from './pages/Profile.jsx';
import FollowersList from './pages/FollowersList.jsx';
import FollowingList from './pages/FollowingList.jsx';
import Trades from './pages/Trades.jsx';
import ProfileEdit from './pages/ProfileEdit.jsx';
import Chat from './pages/Chat.jsx';
import ChatsList from './pages/ChatsList.jsx';
import MyPosts from './pages/MyPosts.jsx';
import NotFound from './pages/NotFound.jsx';

// admin:
import AdminGuard from './components/AdminGuard.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import AdminUsersList from './pages/admin/AdminUsersList.jsx';
import AdminUserEdit from './pages/admin/AdminUserEdit.jsx';

import './App.css';

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
      { path: '/posts/create', element: <PostCreate />, loader: requireAuthLoader },
      { path: '/posts/:id', element: <PostDetail /> },
      { path: '/posts/:id/edit', element: <PostEdit />, loader: requireAuthLoader },
      { path: '/posts/manage', element: <MyPosts />, loader: requireAuthLoader },
      { path: '/trades', element: <Trades />, loader: requireAuthLoader },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/chat', element: <Chat />, loader: requireAuthLoader },

      // Chat
      { path: '/chats', element: <ChatsList />, loader: requireAuthLoader }, // lista de chats
      { path: '/chat/:otherUserId', element: <Chat />, loader: requireAuthLoader }, // chat individual

      // Perfil
      { path: '/profile', element: <Profile />, loader: requireAuthLoader },
      { path: '/profile/edit', element: <ProfileEdit />, loader: requireAuthLoader },
      { path: '/profile/:id', element: <Profile />, loader: requireAuthLoader },

      // Seguidores / seguidos
      { path: '/users/:id/followers', element: <FollowersList />, loader: requireAuthLoader },
      { path: '/users/:id/following', element: <FollowingList />, loader: requireAuthLoader },

      // admin:
      {
        path: '/admin',
        element: (
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        ),
        children: [
          { path: 'users', element: <AdminUsersList /> },
          { path: 'users/:id', element: <AdminUserEdit /> }
        ]
      },

      { path: '*', element: <NotFound /> }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}