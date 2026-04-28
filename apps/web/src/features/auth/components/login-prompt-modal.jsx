import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { loginWithGoogle } from '../../../services/auth-service';
import { useAuthStore } from '../auth-store';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function LoginPromptModal({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const googleInitializedRef = useRef(false);
  const googleButtonRef = useRef(null);
  const googleButtonRenderedRef = useRef(false);
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState({
    loading: false,
    error: '',
  });

  useEffect(() => {
    if (!open) {
      setPhone('');
      setStatus({ loading: false, error: '' });
      googleButtonRenderedRef.current = false;
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedPhone = phone.trim();

    if (!normalizedPhone) {
      setStatus({ loading: false, error: 'Enter your mobile number.' });
      return;
    }

    setStatus({ loading: true, error: '' });

    onClose();
    navigate('/login', {
      state: {
        from: location.pathname,
        phone: normalizedPhone,
      },
    });
  };

  const handleGoogleFallback = async () => {
    if (!googleClientId) {
      setStatus({
        loading: false,
        error: 'Google login is not configured.',
      });
      return;
    }

    setStatus({ loading: true, error: '' });

    try {
      await loadGoogleIdentityScript();
      setStatus({ loading: false, error: '' });
    } catch {
      setStatus({
        loading: false,
        error: 'Unable to load Google sign-in right now.',
      });
    }
  };

  useEffect(() => {
    if (!open || !googleClientId || googleButtonRenderedRef.current) return;
    if (!googleButtonRef.current) return;

    let isMounted = true;

    const renderGoogleButton = async () => {
      try {
        await loadGoogleIdentityScript();

        if (!isMounted || googleButtonRenderedRef.current) return;

        if (!googleInitializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              try {
                const session = await loginWithGoogle({
                  credential: response.credential,
                });
                setSession(session);
                onClose();
                navigate(location.pathname, { replace: true });
              } catch (error) {
                setStatus({
                  loading: false,
                  error:
                    error?.response?.data?.message ||
                    'Google login could not be completed.',
                });
              }
            },
            cancel_on_tap_outside: true,
          });
          googleInitializedRef.current = true;
        }

        googleButtonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'left',
          width: Math.min(360, googleButtonRef.current.offsetWidth || 360),
        });

        googleButtonRenderedRef.current = true;
      } catch {
        if (!isMounted) return;
        setStatus({
          loading: false,
          error:
            'Unable to load Google sign-in. Check the OAuth client ID and allowed origins.',
        });
      }
    };

    renderGoogleButton();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate, onClose, open, setSession]);

  useEffect(() => {
    if (!open) return undefined;

    const resizeGoogleButton = () => {
      if (!googleButtonRef.current) return;
      if (!window.google?.accounts?.id || !googleInitializedRef.current) return;

      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'left',
        width: Math.min(360, googleButtonRef.current.offsetWidth || 360),
      });
    };

    window.addEventListener('resize', resizeGoogleButton);

    return () => window.removeEventListener('resize', resizeGoogleButton);
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 px-3 py-0 sm:items-center sm:px-4 sm:py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="w-full max-w-[320px] overflow-hidden bg-white text-[#171412] shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:max-w-[360px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#ece6df] px-3 py-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center text-[#4b4b4b] transition hover:text-[#171412]"
                aria-label="Close login popup"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="text-center">
                <p className="font-display text-xl leading-none text-[#c0195d]">
                  Parsom
                </p>
                <p className="mt-1 text-[10px] text-[#7f7f7f]">Fashion starts here</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center text-[#4b4b4b] transition hover:text-[#171412]"
                aria-label="Dismiss login popup"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-4 pb-6 pt-7">
              <h2 className="text-[1.75rem] font-semibold leading-none text-[#171412]">
                Login
                <span className="ml-1 text-base font-normal text-[#555]">or Signup</span>
              </h2>

              <p className="mt-3 text-[12px] leading-5 text-[#7b746c]">
                Continue with your mobile number or Gmail to access your account.
              </p>

              <form onSubmit={handleSubmit} className="mt-6">
                <label className="block">
                  <span className="sr-only">Mobile Number</span>
                  <div className="flex overflow-hidden border border-[#ded7d0] bg-white">
                    <span className="flex items-center border-r border-[#ded7d0] px-3 text-sm text-[#756c63]">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
                      placeholder="Mobile Number*"
                      className="w-full px-3 py-3 text-sm text-[#171412] outline-none placeholder:text-[#a19a92]"
                    />
                  </div>
                </label>

                <div className="mt-4 min-h-[44px] overflow-hidden">
                  <div ref={googleButtonRef} className="w-full" />
                  {!googleClientId ? (
                    <button
                      type="button"
                      onClick={handleGoogleFallback}
                      className="inline-flex min-h-[44px] w-full items-center justify-center border border-[#ded7d0] bg-white px-4 py-3 text-sm font-semibold text-[#171412] transition hover:bg-[#f7f3ee]"
                    >
                      Continue with Gmail
                    </button>
                  ) : null}
                </div>

                <label className="mt-5 flex items-start gap-2.5 text-[12px] leading-5 text-[#5f5a55]">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-1 h-3.5 w-3.5 rounded-none border border-[#c9c1b9] text-[#944978] focus:ring-0"
                  />
                  <span>
                    By continuing, I agree to the{' '}
                    <Link to="/terms" className="text-[#ff3f6c]">
                      Terms of Use
                    </Link>{' '}
                    &{' '}
                    <Link to="/privacy" className="text-[#ff3f6c]">
                      Privacy Policy
                    </Link>{' '}
                    and I am above 18 years old.
                  </span>
                </label>

                {status.error ? (
                  <p className="mt-4 text-sm text-[#cc3d51]">{status.error}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={status.loading}
                  className="mt-5 w-full bg-[#a7a8b0] px-4 py-3 text-sm font-extrabold uppercase tracking-[0.04em] text-white transition hover:bg-[#8f919a] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status.loading ? 'Checking...' : 'Continue'}
                </button>
              </form>

              <p className="mt-6 text-[11px] text-[#8a8278]">
                Have trouble logging in?{' '}
                <Link to="/contact" className="font-semibold text-[#ff3f6c]">
                  Get help
                </Link>
              </p>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
