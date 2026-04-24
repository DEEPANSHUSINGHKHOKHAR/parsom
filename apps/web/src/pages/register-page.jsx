import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '../features/auth/components/auth-shell';
import FormField from '../components/ui/form-field';
import Button from '../components/ui/button';
import PasswordField from '../features/auth/components/password-field';
import { registerUser } from '../services/auth-service';
import { useAuthStore } from '../features/auth/auth-store';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [status, setStatus] = useState({
    loading: false,
    error: '',
  });

  const updateField = (field, value) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (values.password !== values.confirmPassword) {
      setStatus({
        loading: false,
        error: 'Passwords do not match.',
      });
      return;
    }

    setStatus({
      loading: true,
      error: '',
    });

    try {
      const session = await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
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

    setStatus({
      loading: false,
      error: '',
    });
  };

  return (
    <AuthShell
      eyebrow="Create Account"
      title="Register"
      description="Create your real customer account for orders, saved addresses, reviews, and notify requests."
      sideTitle="Your premium customer space starts here."
      sideDescription="Registration is now connected to your backend auth API."
      sideLinks={[
        { label: 'Already have an account? Login', href: '/login' },
        { label: 'Forgot password', href: '/forgot-password' },
        { label: 'Back to home', href: '/' },
      ]}
    >
      <form
        onSubmit={handleRegister}
        className="border border-border-soft bg-background-base p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="First Name" required>
            <input
              type="text"
              value={values.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              placeholder="Enter first name"
              className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none placeholder:text-foreground-muted focus:border-accent-primary"
            />
          </FormField>

          <FormField label="Last Name" required>
            <input
              type="text"
              value={values.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              placeholder="Enter last name"
              className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none placeholder:text-foreground-muted focus:border-accent-primary"
            />
          </FormField>

          <FormField label="Email Address" required>
            <input
              type="email"
              value={values.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="Enter email address"
              className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none placeholder:text-foreground-muted focus:border-accent-primary"
            />
          </FormField>

          <FormField label="Phone / WhatsApp" required>
            <input
              type="tel"
              value={values.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="Enter phone number"
              className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none placeholder:text-foreground-muted focus:border-accent-primary"
            />
          </FormField>

          <FormField label="Password" required>
            <PasswordField
              name="password"
              value={values.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Create password"
            />
          </FormField>

          <FormField label="Confirm Password" required>
            <PasswordField
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={(event) => updateField('confirmPassword', event.target.value)}
              placeholder="Confirm password"
            />
          </FormField>
        </div>

        {status.error ? (
          <p className="mt-5 text-sm text-[#f28b82]">{status.error}</p>
        ) : null}

        <div className="mt-6">
          <Button className="w-full" type="submit" disabled={status.loading}>
            {status.loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
