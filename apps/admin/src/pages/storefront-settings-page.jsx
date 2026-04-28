import { useEffect, useState } from 'react';
import {
  fetchAdminStorefrontSettings,
  updateAdminStorefrontSettings,
} from '../services/admin-storefront-service';

export default function StorefrontSettingsPage() {
  const [entriesText, setEntriesText] = useState('');
  const [state, setState] = useState({
    loading: true,
    error: '',
    saving: false,
    success: '',
  });

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const data = await fetchAdminStorefrontSettings();
        if (ignore) return;
        setEntriesText((data?.velocityBanner?.entries || []).join('\n'));
        setState((prev) => ({ ...prev, loading: false, error: '' }));
      } catch (error) {
        if (ignore) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error?.response?.data?.message || 'Unable to load storefront settings.',
        }));
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, saving: true, error: '', success: '' }));

    try {
      const entries = entriesText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      await updateAdminStorefrontSettings({
        velocityBanner: {
          entries,
        },
      });

      setState((prev) => ({
        ...prev,
        saving: false,
        success: 'Storefront settings updated successfully.',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error?.response?.data?.message || 'Unable to update storefront settings.',
      }));
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <p className="text-xs uppercase text-[#756c63]">Storefront</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Storefront Settings
        </h2>
      </div>

      {state.error ? (
        <div className="rounded-[8px] border border-red-500/20 bg-red-50 px-4 py-4 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div className="rounded-[8px] border border-emerald-500/20 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
          {state.success}
        </div>
      ) : null}

      {state.loading ? (
        <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
          Loading storefront settings...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6"
        >
          <label className="block text-sm font-medium text-[#171412]">
            Velocity Banner Entries
          </label>
          <p className="text-sm text-[#756c63]">
            Add one line per banner message. The same banner will appear on home and collection.
          </p>
          <textarea
            rows={8}
            value={entriesText}
            onChange={(event) => setEntriesText(event.target.value)}
            placeholder="Archive Drop 001&#10;Early Access Open&#10;5% Discount For Members"
            className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
          />

          <button
            type="submit"
            disabled={state.saving}
            className="rounded-full bg-[#171412] px-6 py-3 text-sm font-medium text-[#fffaf4] transition hover:bg-[#8f3d2f] disabled:opacity-60"
          >
            {state.saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      )}
    </section>
  );
}
