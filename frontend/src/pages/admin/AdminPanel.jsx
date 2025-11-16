// frontend\src\pages\admin\AdminUsersList.jsx
import { Link } from 'react-router-dom';

export default function AdminPanel() {
  return (
    <main
      className="min-h-screen px-4 py-8"
      style={{ background: 'var(--c-text)' }}
    >
      <div className="max-w-6xl mx-auto">
        <section className="rounded-2xl bg-white p-5 sm:p-6 border border-[color:var(--c-mid-blue)]/60 shadow-[0_20px_60px_rgba(0,0,0,.25)]">
          <header className="mb-5">
            <h1
              className="text-2xl! md:text-3xl! font-bold"
              style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
            >
              Panel de Administración
            </h1>
              <div className='flex flex-col md:grid md:grid-cols-2 gap-3'>
                <div className='border border-[color:var(--c-mid-blue)]/60 rounded-2xl hover:bg-gray-100'>
                  <Link to={'/admin/users'} className='py-17 flex items-center justify-center h-full'>
                      <p>Usuario</p>
                  </Link>
                </div>
                <div className='border border-[color:var(--c-mid-blue)]/60 rounded-2xl hover:bg-gray-100'>
                  <Link to={'/admin/users'} className='py-17 flex items-center justify-center h-full'>
                      <p>Usuario</p>
                  </Link>
                </div>
                <div className='border border-[color:var(--c-mid-blue)]/60 rounded-2xl hover:bg-gray-100'>
                  <Link to={'/admin/users'} className='py-17 flex items-center justify-center h-full'>
                      <p>Usuario</p>
                  </Link>
                </div>
                <div className='border border-[color:var(--c-mid-blue)]/60 rounded-2xl hover:bg-gray-100'>
                  <Link to={'/admin/users'} className='py-17 flex items-center justify-center h-full'>
                      <p>Usuario</p>
                  </Link>
                </div>
              </div>
          </header>
        </section>
      </div>
    </main>
  );
}