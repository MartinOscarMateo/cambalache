import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/posts" element={<PostsList />} />
        <Route path="/posts/create" element={<PostCreate />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/posts/:id/edit" element={<PostEdit />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
