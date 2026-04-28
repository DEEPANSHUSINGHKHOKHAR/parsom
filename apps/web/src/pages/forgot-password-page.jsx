import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '../features/auth/components/auth-shell';
import FormField from '../components/ui/form-field';
import Button from '../components/ui/button';
import PasswordField from '../features/auth/components/password-field';
import { changePassword, loginWithGoogle } from '../services/auth-service';
import { useAuthStore } from '../features/auth/auth-store';

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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const actor = useAuthStore((state) => state.actor);
  const setSession = useAuthStore((state) => state.setSession);
  const googleInitializedRef = useRef(false);
  const googleButtonRef = useRef(null);
  const googleButtonRenderedRef = useRef(false);

  const [isVerified, setIsVerified] = useState(
    Boolean(token && actor?.authProvider === 'google')
  );
  const [values, setValues] = useState({
    newPassword: '',
    confirmNewPassword: '',
  });
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
  });

  useEffect(() => {
    if (token && actor?.authProvider === 'google') {
      setIsVerified(true);
    }
  }, [actor?.authProvider, token]);

  useEffect(() => {
    if (isVerified || !googleClientId) return;
    if (!googleButtonRef.current || googleButtonRenderedRef.current) return;

    let isMounted = true;

    const renderGoogleButton = async () => {
      try {
        await loadGoogleIdentityScript();

        if (!isMounted || googleButtonRenderedRef.current) return;

        if (!googleInitializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              setStatus({ loading: true, error: '', success: '' });
              try {
                const session = await loginWithGoogle({
                  credential: response.credential,
                });
                setSession(session);
                setIsVerified(true);
                setStatus({
                  loading: false,
                  error: '',
                  success: 'Google sign-in verified. You can set a password below.',
                });
              } catch (error) {
                setStatus({
                  loading: false,
                  error:
                    error?.response?.data?.message ||
                    'Google login could not be completed.',
                  success: '',
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
          success: '',
        });
      }
    };

    renderGoogleButton();

    return () => {
      isMounted = false;
    };
  }, [isVerified, setSession]);

  const updateField = (field, value) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = async (event) => {
    event.preventDefault();

    if (values.newPassword !== values.confirmNewPassword) {
      setStatus({
        loading: false,
        error: 'Passwords do not match.',
        success: '',
      });
      return;
    }

    setStatus({ loading: true, error: '', success: '' });

    try {
      await changePassword({
        newPassword: values.newPassword,
        skipCurrentPassword: true,
      });

      setStatus({
        loading: false,
        error: '',
        success: 'Password updated. You can continue to your account.',
      });
    } catch (error) {
      setStatus({
        loading: false,
        error: error?.response?.data?.message || 'Unable to update password.',
        success: '',
      });
    }
  };

  return (
    <AuthShell
      eyebrow="Google Password Setup"
      title="Set Your Password"
      description="Sign in with Google for this account, then create a password you can use later."
      sideTitle="Verify with Google first."
      sideDescription="This page is for accounts you can confirm through Google sign-in before setting a password."
      sideLinks={[
        { label: 'Back to login', href: '/login' },
        { label: 'Create account', href: '/register' },
        { label: 'Return home', href: '/' },
      ]}
    >
      <div className="border border-border-soft bg-background-base p-5">
        <div className="space-y-4">
          {!googleClientId ? (
            <p className="text-sm text-[#f28b82]">
              Google login is not configured for password setup.
            </p>
          ) : null}

          {!isVerified ? (
            <div className="space-y-3">
              <p className="text-sm text-foreground-secondary">
                Continue with Google to verify this account before setting a password.
              </p>
              <div ref={googleButtonRef} />
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <FormField label="New Password" required>
                <PasswordField
                  name="newPassword"
                  value={values.newPassword}
                  onChange={(event) =>
                    updateField('newPassword', event.target.value)
                  }
                  placeholder="Create new password"
                />
              </FormField>

              <FormField label="Confirm New Password" required>
                <PasswordField
                  name="confirmNewPassword"
                  value={values.confirmNewPassword}
                  onChange={(event) =>
                    updateField('confirmNewPassword', event.target.value)
                  }
                  placeholder="Confirm new password"
                />
              </FormField>

              <Button className="w-full" type="submit" disabled={status.loading}>
                {status.loading ? 'Updating...' : 'Set New Password'}
              </Button>
            </form>
          )}

          {status.error ? (
            <p className="text-sm text-[#f28b82]">{status.error}</p>
          ) : null}

          {status.success ? (
            <div className="space-y-3">
              <p className="text-sm text-[#8fae8b]">{status.success}</p>
              <Button type="button" onClick={() => navigate('/account')}>
                Go to account
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </AuthShell>
  );
}
