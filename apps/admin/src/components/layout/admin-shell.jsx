import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Search } from 'lucide-react';
import AdminSidebar from './admin-sidebar';
import { useAdminAuthStore } from '../../features/auth/admin-auth-store';
import { fetchCurrentAdmin } from '../../services/auth-service';

export default function AdminShell() {
  const navigate = useNavigate();
  const actor = useAdminAuthStore((state) => state.actor);
  const setActor = useAdminAuthStore((state) => state.setActor);
  const clearSession = useAdminAuthStore((state) => state.clearSession);

  const [status, setStatus] = useState({ loading: false, error: '' });

  useEffect(() => {
    let ignore = false;
    const loadActor = async () => {
      if (actor) return;
      setStatus({ loading: true, error: '' });
      try {
        const currentAdmin = await fetchCurrentAdmin();
        if (!ignore) {
          setActor(currentAdmin);
          setStatus({ loading: false, error: '' });
        }
      } catch {
        if (!ignore) {
          clearSession();
          navigate('/login', { replace: true });
        }
      }
    };
    loadActor();
    return () => {
      ignore = true;
    };
  }, [actor, clearSession, navigate, setActor]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#f5f2ed]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(10,10,11,0.72)] backdrop-blur-[24px]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e7ded2]">
              Parsom Brand
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white">Admin Shell</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-[#b9b2a9] md:flex">
              <Search size={16} />
              <span className="text-sm">Search admin</span>
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-sm text-white">{actor?.name || actor?.email || 'Admin'}</p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#8b847b]">
                {actor?.role || 'manager'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                clearSession();
                navigate('/login');
              }}
              className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-sm text-[#b9b2a9] transition hover:bg-white hover:text-[#0a0a0b]"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminSidebar />

        <div className="space-y-4">
          {status.loading ? (
            <div className="border border-white/10 bg-[#111214] p-8 text-[#b9b2a9]">
              Loading admin session...
            </div>
          ) : null}

          {status.error ? (
            <div className="border border-[#f28b82]/30 bg-[#f28b82]/10 px-4 py-4 text-sm text-[#f28b82]">
              {status.error}
            </div>
          ) : null}

          <Outlet />
        </div>
      </main>
    </div>
  );
}
