import { useState } from 'react';
import AuthShell from '../features/auth/components/auth-shell';
import FormField from '../components/ui/form-field';
import Button from '../components/ui/button';
import PasswordField from '../features/auth/components/password-field';
import {
  requestPasswordResetOtp,
  resetPasswordWithOtp,
} from '../services/auth-service';

export default function ForgotPasswordPage() {
  const [values, setValues] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
  });

  const updateField = (field, value) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRequestOtp = async () => {
    setStatus({ loading: true, error: '', success: '' });

    try {
      await requestPasswordResetOtp({ email: values.email });
      setStatus({
        loading: false,
        error: '',
        success: 'If the email exists, an OTP has been sent.',
      });
    } catch (error) {
      setStatus({
        loading: false,
        error: error?.response?.data?.message || 'Unable to send OTP.',
        success: '',
      });
    }
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
      await resetPasswordWithOtp({
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword,
      });

      setStatus({
        loading: false,
        error: '',
        success: 'Password reset successfully. You can now log in.',
      });
    } catch (error) {
      setStatus({
        loading: false,
        error: error?.response?.data?.message || 'Unable to reset password.',
        success: '',
      });
    }
  };

  return (
    <AuthShell
      eyebrow="Password Recovery"
      title="Reset Password"
      description="Request OTP by email, verify it, and set your new password."
      sideTitle="Secure password reset flow."
      sideDescription="This is now connected to your backend email OTP reset endpoints."
      sideLinks={[
        { label: 'Back to login', href: '/login' },
        { label: 'Create account', href: '/register' },
        { label: 'Return home', href: '/' },
      ]}
    >
      <form
        onSubmit={handleReset}
        className="border border-border-soft bg-background-base p-5"
      >
        <div className="space-y-4">
          <FormField label="Email Address" required>
            <input
              type="email"
              value={values.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="Enter email address"
              className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none placeholder:text-foreground-muted focus:border-accent-primary"
            />
          </FormField>

          <Button
            variant="secondary"
            className="w-full"
            type="button"
            onClick={handleRequestOtp}
            disabled={status.loading}
          >
            Send OTP
          </Button>

          <FormField label="OTP Code" required>
            <input
              type="text"
              value={values.otp}
              onChange={(event) => updateField('otp', event.target.value)}
              placeholder="Enter OTP code"
              className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none placeholder:text-foreground-muted focus:border-accent-primary"
            />
          </FormField>

          <FormField label="New Password" required>
            <PasswordField
              name="newPassword"
              value={values.newPassword}
              onChange={(event) => updateField('newPassword', event.target.value)}
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

          {status.error ? (
            <p className="text-sm text-[#f28b82]">{status.error}</p>
          ) : null}

          {status.success ? (
            <p className="text-sm text-[#8fae8b]">{status.success}</p>
          ) : null}

          <Button className="w-full" type="submit" disabled={status.loading}>
            {status.loading ? 'Processing...' : 'Verify OTP & Reset Password'}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
