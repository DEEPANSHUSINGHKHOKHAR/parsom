import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/page-shell';
import AccountSidebar from '../features/account/components/account-sidebar';
import AccountPanel from '../features/account/components/account-panel';
import Button from '../components/ui/button';
import { useAuthStore } from '../features/auth/auth-store';
import { fetchCurrentActor } from '../services/auth-service';

export default function AccountPage() {
  const navigate = useNavigate();
  const actor = useAuthStore((state) => state.actor);
  const setActor = useAuthStore((state) => state.setActor);
  const clearSession = useAuthStore((state) => state.clearSession);

  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState({ loading: false, error: '' });

  useEffect(() => {
    let ignore = false;
    const loadActor = async () => {
      if (actor) return;
      setStatus({ loading: true, error: '' });
      try {
        const currentActor = await fetchCurrentActor();
        if (!ignore) {
          setActor(currentActor);
          setStatus({ loading: false, error: '' });
        }
      } catch (error) {
        if (!ignore) {
          setStatus({
            loading: false,
            error: error?.response?.data?.message || 'Unable to load account.',
          });
        }
      }
    };
    loadActor();
    return () => {
      ignore = true;
    };
  }, [actor, setActor]);

  return (
    <PageShell>
      <section className="min-h-screen bg-background-base pb-16 pt-8 md:pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-5 border-b border-border-soft pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-3 block text-label text-accent-primary">Welcome Back</span>
              <h1 className="text-display-3 text-foreground-primary sm:text-display-2">
                {actor?.firstName ? `${actor.firstName} ${actor.lastName || ''}`.trim() : 'Customer Account'}
              </h1>
              <p className="mt-3 max-w-2xl text-body-sm text-foreground-secondary sm:text-body">
                Orders, addresses, wishlist items, reviews, and invoices all live here.
              </p>
              {status.error ? <p className="mt-4 text-sm text-[#f28b82]">{status.error}</p> : null}
            </div>

            <Button variant="secondary" onClick={() => { clearSession(); navigate('/login'); }}>
              Logout
            </Button>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[260px_1fr]">
            <AccountSidebar activeTab={activeTab} onChange={setActiveTab} />
            <AccountPanel activeTab={activeTab} actor={actor} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
