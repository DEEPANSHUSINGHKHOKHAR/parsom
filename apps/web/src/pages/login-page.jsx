import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/page-shell';
import FormField from '../components/ui/form-field';
import Button from '../components/ui/button';
import PasswordField from '../features/auth/components/password-field';
import {
  loginWithGoogle,
  loginUserWithPhone,
  registerUser,
} from '../services/auth-service';
import { useAuthStore } from '../features/auth/auth-store';

const initialRegisterValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const passwordRequirementMessage =
  'Password must be at least 8 characters and include uppercase, lowercase, and a number.';

function isStrongPassword(value) {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

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

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const prefilledPhone = location.state?.phone || '';
  const googleInitializedRef = useRef(false);
  const googleButtonRef = useRef(null);
  const googleButtonRenderedRef = useRef(false);
  const [mode, setMode] = useState(
    location.pathname === '/register' ? 'register' : 'login'
  );
  const [loginStep, setLoginStep] = useState(prefilledPhone ? 'password' : 'phone');
  const [phone, setPhone] = useState(prefilledPhone);
  const [password, setPassword] = useState('');
  const [registerValues, setRegisterValues] = useState(initialRegisterValues);
  const [status, setStatus] = useState({
    loading: false,
    error: '',
  });

  const redirectTo = location.state?.from || '/account';

  const normalizedPhone = phone.trim();

  useEffect(() => {
    if (!prefilledPhone) return;

    setPhone(prefilledPhone);

    if (location.pathname === '/register') {
      setRegisterValues((prev) => ({
        ...prev,
        phone: prefilledPhone,
      }));
      setMode('register');
      setLoginStep('phone');
      return;
    }

    setLoginStep('password');
  }, [location.pathname, prefilledPhone]);

  const updateRegisterField = (field, value) => {
    setRegisterValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setStatus({ loading: false, error: '' });
    setLoginStep('phone');
  };

  const handlePhoneContinue = async (event) => {
    event.preventDefault();

    if (!normalizedPhone) {
      setStatus({ loading: false, error: 'Enter your phone number.' });
      return;
    }

    setStatus({ loading: true, error: '' });

    setRegisterValues((prev) => ({
      ...prev,
      phone: normalizedPhone,
    }));
    setLoginStep('password');
    setStatus({ loading: false, error: '' });
  };

  const handlePhoneLogin = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '' });

    try {
      const session = await loginUserWithPhone({
        phone: normalizedPhone,
        password,
      });
      setSession(session);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setStatus({
        loading: false,
        error: error?.response?.data?.message || 'Login failed.',
      });
      return;
    }

    setStatus({ loading: false, error: '' });
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const firstName = registerValues.firstName.trim();
    const lastName = registerValues.lastName.trim();
    const email = registerValues.email.trim();
    const phoneNumber = registerValues.phone.trim();

    if (!firstName || !lastName || !email || !phoneNumber) {
      setStatus({
        loading: false,
        error: 'First name, last name, email, and phone are required.',
      });
      return;
    }

    if (registerValues.password !== registerValues.confirmPassword) {
      setStatus({
        loading: false,
        error: 'Passwords do not match.',
      });
      return;
    }

    if (!isStrongPassword(registerValues.password)) {
      setStatus({
        loading: false,
        error: passwordRequirementMessage,
      });
      return;
    }

    setStatus({ loading: true, error: '' });

    try {
      const session = await registerUser({
        firstName,
        lastName,
        email,
        phone: phoneNumber,
        password: registerValues.password,
      });

      setSession(session);
      navigate('/account', { replace: true });
    } catch (error) {
      setStatus({
        loading: false,
        error: error?.response?.data?.message || 'Registration failed.',
      });
      return;
    }

    setStatus({ loading: false, error: '' });
  };

  const handleGoogleLogin = async () => {
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
    if (!googleClientId || googleButtonRenderedRef.current) return;
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
              navigate(redirectTo, { replace: true });
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

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_white',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left',
          width: Math.min(320, googleButtonRef.current.offsetWidth || 320),
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
  }, [navigate, redirectTo, setSession]);

  useEffect(() => {
    const resizeGoogleButton = () => {
      if (!googleButtonRef.current) return;
      if (!window.google?.accounts?.id || !googleInitializedRef.current) return;

      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'filled_white',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left',
        width: Math.min(320, googleButtonRef.current.offsetWidth || 320),
      });
    };

    window.addEventListener('resize', resizeGoogleButton);

    return () => window.removeEventListener('resize', resizeGoogleButton);
  }, []);

  return (
    <PageShell>
      <section className="relative min-h-[calc(100vh-7rem)] overflow-hidden bg-[#050505] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_46%,rgba(168,113,88,0.48),transparent_34%),radial-gradient(circle_at_28%_68%,rgba(89,72,86,0.28),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.96),rgba(0,0,0,0.45),rgba(0,0,0,0.96))]" />

        <div className="relative mx-auto flex min-h-[calc(100vh-14rem)] max-w-6xl flex-col justify-center">
          <div className="mb-12 flex items-center justify-between gap-6">
            <Link
              to="/"
              className="font-display text-4xl font-semibold text-[#ff4a4a]"
            >
              parsom
            </Link>
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="border-b border-white pb-2 text-sm font-semibold uppercase tracking-[0.08em] text-white"
            >
              {mode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </div>

          <div className="w-full max-w-4xl overflow-hidden">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-white/86">
              {mode === 'login' ? 'Login' : 'Sign Up'}
            </p>

            {mode === 'login' ? (
              loginStep === 'phone' ? (
                <form onSubmit={handlePhoneContinue} className="mt-8 space-y-8">
                  <label className="block">
                    <span className="sr-only">Phone number</span>
                    <div className="grid w-full max-w-[calc(100vw-2rem)] grid-cols-[auto_minmax(0,1fr)] items-end gap-1 overflow-hidden sm:max-w-full sm:gap-5">
                      <span className="shrink-0 font-mono font-bold leading-none tracking-tight text-white [font-size:clamp(1.9rem,8vw,5.8rem)]">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="0000000000"
                        maxLength={10}
                        className="min-w-0 w-[10ch] max-w-full bg-transparent font-mono font-bold leading-none tracking-[-0.08em] text-white outline-none placeholder:text-[#84828d] [font-size:clamp(1.9rem,8vw,5.8rem)]"
                      />
                    </div>
                  </label>

                  {status.error ? (
                    <p className="max-w-xl text-sm text-[#ffb5aa]">
                      {status.error}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="submit"
                      disabled={status.loading}
                      className="min-w-[180px] rounded-full bg-white/78 px-10 py-4 text-sm font-bold uppercase tracking-[0.04em] text-[#171412] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {status.loading ? 'Checking...' : 'Continue'}
                    </button>
                    <div className="min-h-[52px] w-full max-w-80 overflow-hidden rounded-full sm:w-80">
                      <div ref={googleButtonRef} className="w-full" />
                      {!googleClientId ? (
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          className="inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-[0.02em] text-[#171412]"
                        >
                          Continue With Gmail
                        </button>
                      ) : null}
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePhoneLogin} className="mt-8 max-w-xl space-y-6">
                  <div>
                    <p className="text-sm text-white/64">Phone number</p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      +91 {normalizedPhone}
                    </p>
                    <p className="mt-2 text-sm text-white/64">
                      Enter your password to continue. New here? Switch to sign up.
                    </p>
                  </div>

                  <FormField label="Password" required>
                    <PasswordField
                      name="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter password"
                    />
                  </FormField>

                  {status.error ? (
                    <p className="text-sm text-[#ffb5aa]">{status.error}</p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-4">
                    <Button type="submit" disabled={status.loading}>
                      {status.loading ? 'Logging in...' : 'Login'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('phone');
                        setPassword('');
                        setStatus({ loading: false, error: '' });
                      }}
                      className="text-sm font-semibold text-white/70 transition hover:text-white"
                    >
                      Change number
                    </button>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-semibold text-white/70 transition hover:text-white"
                    >
                      Set password with Google
                    </Link>
                  </div>
                </form>
              )
            ) : (
              <form
                onSubmit={handleRegister}
                className="mt-8 max-w-3xl border border-white/12 bg-black/34 p-5 backdrop-blur-xl"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="First Name" required>
                    <input
                      type="text"
                      required
                      value={registerValues.firstName}
                      onChange={(event) =>
                        updateRegisterField('firstName', event.target.value)
                      }
                      placeholder="Enter first name"
                      className="w-full border-b border-white/18 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-white/38 focus:border-white"
                    />
                  </FormField>

                  <FormField label="Last Name" required>
                    <input
                      type="text"
                      required
                      value={registerValues.lastName}
                      onChange={(event) =>
                        updateRegisterField('lastName', event.target.value)
                      }
                      placeholder="Enter last name"
                      className="w-full border-b border-white/18 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-white/38 focus:border-white"
                    />
                  </FormField>

                  <FormField label="Email Address" required>
                    <input
                      type="email"
                      required
                      value={registerValues.email}
                      onChange={(event) =>
                        updateRegisterField('email', event.target.value)
                      }
                      placeholder="Enter email address"
                      className="w-full border-b border-white/18 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-white/38 focus:border-white"
                    />
                  </FormField>

                  <FormField label="Phone Number" required>
                    <input
                      type="tel"
                      required
                      value={registerValues.phone}
                      onChange={(event) =>
                        updateRegisterField('phone', event.target.value)
                      }
                      placeholder="Enter phone number"
                      className="w-full border-b border-white/18 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-white/38 focus:border-white"
                    />
                  </FormField>

                  <FormField label="Password" required>
                    <PasswordField
                      name="password"
                      required
                      minLength={8}
                      value={registerValues.password}
                      onChange={(event) =>
                        updateRegisterField('password', event.target.value)
                      }
                      placeholder="Create password"
                    />
                  </FormField>

                  <FormField label="Confirm Password" required>
                    <PasswordField
                      name="confirmPassword"
                      required
                      minLength={8}
                      value={registerValues.confirmPassword}
                      onChange={(event) =>
                        updateRegisterField('confirmPassword', event.target.value)
                      }
                      placeholder="Confirm password"
                    />
                  </FormField>
                </div>

                {status.error ? (
                  <p className="mt-5 text-sm text-[#ffb5aa]">{status.error}</p>
                ) : null}
                <p className="mt-4 text-xs leading-5 text-white/56">
                  Password needs 8+ characters with uppercase, lowercase, and a number.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Button type="submit" disabled={status.loading}>
                    {status.loading ? 'Creating account...' : 'Register'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-sm font-semibold text-white/70 transition hover:text-white"
                  >
                    Already have an account?
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
