import { Outlet, Link, useLocation } from 'react-router-dom';

// layout admin
export default function AdminLayout() {
  const loc = useLocation();
  const isUsers = loc.pathname.startsWith('/admin/users');

  return (
    <div className="w-[92%] mx-auto py-6">
      <nav className="mb-4 flex gap-4 text-[#2727d1]">
        <Link to="/admin/users" className={isUsers ? 'underline' : ''}>usuarios</Link>
      </nav>
      <Outlet />
    </div>
  );
}