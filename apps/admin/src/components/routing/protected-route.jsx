import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../../features/auth/admin-auth-store';
import { fetchCurrentAdmin } from '../../services/auth-service';

export default function ProtectedRoute() {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const setActor = useAdminAuthStore((state) => state.setActor);
  const location = useLocation();
  const [checkingCookie, setCheckingCookie] = useState(!isAuthenticated);

  useEffect(() => {
    let ignore = false;

    async function restoreCookieSession() {
      if (isAuthenticated) {
        setCheckingCookie(false);
        return;
      }

      try {
        const currentAdmin = await fetchCurrentAdmin();
        if (!ignore) {
          setActor(currentAdmin);
        }
      } catch {
        if (!ignore) {
          setCheckingCookie(false);
        }
      }
    }

    restoreCookieSession();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, setActor]);

  if (checkingCookie && !isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f6f3ee] text-sm text-[#756c63]">
        Checking admin session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
