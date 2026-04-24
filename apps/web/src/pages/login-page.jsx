import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../features/auth/components/auth-shell';
import FormField from '../components/ui/form-field';
import Button from '../components/ui/button';
import PasswordField from '../features/auth/components/password-field';
import {
  loginUser,
  requestWhatsappLoginOtp,
  verifyWhatsappLoginOtp,
} from '../services/auth-service';
import { useAuthStore } from '../features/auth/auth-store';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);

  const [emailPasswordValues, setEmailPasswordValues] = useState({
    email: '',
    password: '',
  });

  const [otpValues, setOtpValues] = useState({
    phone: '',
    otp: '',
  });

  const [status, setStatus] = useState({
    loading: false,
    error: '',
  });

  const [otpStatus, setOtpStatus] = useState({
    loading: false,
    error: '',
    success: '',
  });

  const redirectTo = location.state?.from || '/account';

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '' });

    try {
      const session = await loginUser(emailPasswordValues);
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

  const handleSendOtp = async () => {
    setOtpStatus({ loading: true, error: '', success: '' });

    try {
      await requestWhatsappLoginOtp({ phone: otpValues.phone });
      setOtpStatus({
        loading: false,
        error: '',
        success: 'WhatsApp OTP sent successfully.',
      });
    } catch (error) {
      setOtpStatus({
        loading: false,
        error: error?.response?.data?.message || 'Unable to send OTP.',
        success: '',
      });
    }
  };

  const handleVerifyOtp = async () => {
    setOtpStatus({ loading: true, error: '', success: '' });

    try {
      const session = await verifyWhatsappLoginOtp({
        phone: otpValues.phone,
        otp: otpValues.otp,
      });

      setSession(session);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setOtpStatus({
        loading: false,
        error: error?.response?.data?.message || 'Unable to verify OTP.',
        success: '',
      });
    }
  };

  return (
    <AuthShell
      eyebrow="Account Access"
      title="Login"
      description="Sign in with your real account. Email/password login is connected to the backend."
      sideTitle="Secure access for customers and account holders."
      sideDescription="Email/password and WhatsApp OTP login are connected to the backend."
      sideLinks={[
        { label: 'Create account', href: '/register' },
        { label: 'Forgot password', href: '/forgot-password' },
        { label: 'Back to collection', href: '/collection' },
      ]}
    >
      <form
        onSubmit={handleLogin}
        className="border border-border-soft bg-background-base p-5"
      >
        <h2 className="text-display-3 text-foreground-primary">Email / Password</h2>

        <div className="mt-5 space-y-4">
          <FormField label="Email Address" required>
            <input
              type="email"
              value={emailPasswordValues.email}
              onChange={(event) =>
                setEmailPasswordValues((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              placeholder="Enter email address"
            className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none placeholder:text-foreground-muted focus:border-accent-primary"
            />
          </FormField>

          <FormField label="Password" required>
            <PasswordField
              name="password"
              value={emailPasswordValues.password}
              onChange={(event) =>
                setEmailPasswordValues((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              placeholder="Enter password"
            />
          </FormField>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground-secondary">
              <input type="checkbox" className="rounded border-border-strong bg-transparent" />
              Remember me
            </label>

            <Link
              to="/forgot-password"
              className="text-sm text-foreground-secondary transition hover:text-foreground-primary"
            >
              Forgot password?
            </Link>
          </div>

          {status.error ? (
            <p className="text-sm text-[#f28b82]">{status.error}</p>
          ) : null}

          <Button className="w-full" type="submit" disabled={status.loading}>
            {status.loading ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      </form>

      <div className="border border-border-soft bg-background-base p-5">
        <h2 className="text-display-3 text-foreground-primary">Login With WhatsApp OTP</h2>

        <div className="mt-5 space-y-4">
          <FormField label="Phone / WhatsApp Number" required>
            <input
              type="tel"
              value={otpValues.phone}
              onChange={(event) =>
                setOtpValues((prev) => ({
                  ...prev,
                  phone: event.target.value,
                }))
              }
              placeholder="Enter phone number"
              className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none placeholder:text-foreground-muted focus:border-accent-primary"
            />
          </FormField>

          <Button
            variant="secondary"
            className="w-full"
            type="button"
            onClick={handleSendOtp}
            disabled={otpStatus.loading}
          >
            Send OTP
          </Button>

          <FormField label="OTP Code">
            <input
              type="text"
              value={otpValues.otp}
              onChange={(event) =>
                setOtpValues((prev) => ({
                  ...prev,
                  otp: event.target.value,
                }))
              }
              placeholder="Enter OTP"
              className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none placeholder:text-foreground-muted focus:border-accent-primary"
            />
          </FormField>

          {otpStatus.error ? (
            <p className="text-sm text-[#f28b82]">{otpStatus.error}</p>
          ) : null}

          {otpStatus.success ? (
            <p className="text-sm text-[#8fae8b]">{otpStatus.success}</p>
          ) : null}

          <Button
            className="w-full"
            type="button"
            onClick={handleVerifyOtp}
            disabled={otpStatus.loading}
          >
            Verify & Login
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
