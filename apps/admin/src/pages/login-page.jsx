import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/auth-service';
import { useAdminAuthStore } from '../features/auth/admin-auth-store';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAdminAuthStore((state) => state.setSession);

  const [values, setValues] = useState({
    email: '',
    password: '',
  });

  const [status, setStatus] = useState({
    loading: false,
    error: '',
  });

  const redirectTo = location.state?.from || '/';

  useEffect(() => {
    localStorage.removeItem('parsom-admin-auth');
  }, []);

  const handleField = (field, value) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '' });

    try {
      const session = await adminLogin(values);
      setSession(session);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setStatus({
        loading: false,
        error: error?.response?.data?.message || 'Admin login failed.',
      });
      return;
    }

    setStatus({ loading: false, error: '' });
  };

  return (
    <div className="grid min-h-screen bg-[#f6f3ee] px-4 text-[#171412] lg:grid-cols-[1fr_480px]">
      <section className="hidden items-end overflow-hidden bg-[#171412] p-12 text-[#fffaf4] lg:flex">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase text-[#c97051]">
            Parsom command center
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">
            Manage drops, orders, and customer signals in one focused space.
          </h1>
          <p className="mt-5 text-sm leading-7 text-[#756c63]">
            A quieter admin surface for daily retail operations.
          </p>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="m-auto w-full max-w-md rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-8 shadow-[0_24px_60px_rgba(23,20,18,0.08)]"
      >
        <p className="text-xs font-semibold uppercase text-[#8f3d2f]">
          Parsom Brand
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#171412]">
          Admin Login
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#756c63]">
          Sign in with your admin credentials.
        </p>

        <div className="mt-8 space-y-4">
          <input
            type="email"
            value={values.email}
            onChange={(event) => handleField('email', event.target.value)}
            placeholder="Admin email"
            className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60 focus:border-[#8f3d2f]"
          />

          <input
            type="password"
            value={values.password}
            onChange={(event) => handleField('password', event.target.value)}
            placeholder="Password"
            className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60 focus:border-[#8f3d2f]"
          />

          {status.error ? (
            <p className="text-sm text-red-700">{status.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={status.loading}
            className="w-full rounded-[8px] bg-[#171412] px-6 py-3 text-sm font-medium text-[#fffaf4] transition hover:bg-[#8f3d2f] disabled:opacity-60"
          >
            {status.loading ? 'Signing In...' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}
