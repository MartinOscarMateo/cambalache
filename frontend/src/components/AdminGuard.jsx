import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../lib/api.js';

export default function AdminGuard({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getMe();
        if (!mounted) return;
        setState({ loading: false, ok: me?.role === 'admin' });
      } catch {
        if (!mounted) return;
        setState({ loading: false, ok: false });
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (state.loading) return null;
  if (!state.ok) return <Navigate to="/login" replace />;
  return children;
}