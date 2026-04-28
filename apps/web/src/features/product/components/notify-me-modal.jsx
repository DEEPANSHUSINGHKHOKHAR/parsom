import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../../../components/ui/button';
import { createNotifyRequest } from '../../../services/notify-service';
import { useAuthStore } from '../../auth/auth-store';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
};

export default function NotifyMeModal({
  open,
  onClose,
  productId,
  productName,
  size,
}) {
  const actor = useAuthStore((state) => state.actor);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({
    loading: false,
    success: '',
    error: '',
  });

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setStatus({ loading: false, success: '', error: '' });
      return;
    }

    setForm({
      fullName:
        actor?.firstName || actor?.lastName
          ? `${actor?.firstName || ''} ${actor?.lastName || ''}`.trim()
          : actor?.name || '',
      email: actor?.email || '',
      phone: actor?.phone || '',
    });
    setStatus({ loading: false, success: '', error: '' });
  }, [actor, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, success: '', error: '' });

    try {
      await createNotifyRequest({
        productId,
        requestedSize: size,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
      });

      setStatus({
        loading: false,
        success: 'Notify request submitted successfully.',
        error: '',
      });
    } catch (error) {
      setStatus({
        loading: false,
        success: '',
        error:
          error?.response?.data?.message ||
          'Unable to submit notify request right now.',
      });
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="w-full max-w-lg rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase  text-[#756c63]">
                  Notify Me
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#171412]">
                  {productName || 'USE YOUR DATA HERE'}
                </h3>
                <p className="mt-2 text-sm text-[#756c63]">
                  Selected size: <span className="text-[#171412]">{size}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[#171412]/10 px-3 py-2 text-sm text-[#574f48] transition hover:bg-[#171412]/5 hover:text-[#171412]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(event) => handleChange('fullName', event.target.value)}
                placeholder="Full name"
                className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60 focus:border-[#171412]/25"
              />

              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="Email address"
                className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60 focus:border-[#171412]/25"
              />

              <input
                type="tel"
                required
                value={form.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
                placeholder="Phone / WhatsApp number"
                className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60 focus:border-[#171412]/25"
              />

              {status.error ? (
                <p className="text-sm text-red-400">{status.error}</p>
              ) : null}

              {status.success ? (
                <p className="text-sm text-emerald-400">{status.success}</p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={status.loading}
              >
                {status.loading ? 'Submitting...' : 'Submit Notify Request'}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
