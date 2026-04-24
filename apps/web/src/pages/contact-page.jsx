import { useState } from 'react';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
import PageShell from '../components/layout/page-shell';
import Button from '../components/ui/button';
import { siteConfig } from '../config/site-config';
import { createContactSubmission } from '../services/contact-service';

export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    category: 'query',
    message: '',
    attachmentUrl: '',
  });

  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
  });

  const handleField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    try {
      await createContactSubmission(form);
      setForm({
        fullName: '',
        email: '',
        phone: '',
        category: 'query',
        message: '',
        attachmentUrl: '',
      });
      setStatus({
        loading: false,
        error: '',
        success: 'Contact request submitted successfully.',
      });
    } catch (error) {
      setStatus({
        loading: false,
        error: error?.response?.data?.message || 'Unable to submit form.',
        success: '',
      });
    }
  };

  return (
    <PageShell>
      <section className="min-h-screen bg-background-base pb-24 pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-16 text-center text-display-1 text-foreground-primary">Get in Touch</h1>

          <div className="grid grid-cols-1 gap-20 lg:grid-cols-2">
            <div>
              <h2 className="text-display-3 text-foreground-primary">Client Services</h2>
              <p className="mb-12 mt-8 text-body text-foreground-secondary">
                Our team is available for styling advice, order assistance, and archive inquiries.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="rounded-full border border-border-soft bg-background-elevated p-4 text-accent-primary">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="mb-1 text-label text-foreground-primary">Email</h4>
                    <p className="text-body-sm text-foreground-muted underline">
                      support@parsomattire.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="rounded-full border border-border-soft bg-background-elevated p-4 text-[#25D366]">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h4 className="mb-1 text-label text-foreground-primary">WhatsApp</h4>
                    <p className="text-body-sm text-foreground-muted">{siteConfig.whatsappNumber}</p>
                    <a
                      href={siteConfig.socialLinks.whatsapp}
                      className="mt-2 inline-block text-[10px] font-bold uppercase tracking-widest text-accent-primary"
                    >
                      Start Chat
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="rounded-full border border-border-soft bg-background-elevated p-4 text-accent-primary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="mb-1 text-label text-foreground-primary">Studio</h4>
                    <p className="text-body-sm text-foreground-muted">India / Online showroom</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border-soft bg-background-elevated p-8 md:p-10">
              <h3 className="text-display-3 text-foreground-primary">Send a Message</h3>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-label text-foreground-muted">Name</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(event) => handleField('fullName', event.target.value)}
                      className="w-full border-b border-border-strong bg-transparent py-3 text-foreground-primary outline-none transition-colors focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-label text-foreground-muted">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => handleField('email', event.target.value)}
                      className="w-full border-b border-border-strong bg-transparent py-3 text-foreground-primary outline-none transition-colors focus:border-accent-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-label text-foreground-muted">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(event) => handleField('phone', event.target.value)}
                      className="w-full border-b border-border-strong bg-transparent py-3 text-foreground-primary outline-none transition-colors focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-label text-foreground-muted">Category</label>
                    <select
                      value={form.category}
                      onChange={(event) => handleField('category', event.target.value)}
                      className="w-full border-b border-border-strong bg-background-elevated py-3 text-foreground-primary outline-none transition-colors focus:border-accent-primary"
                    >
                      <option value="order">Order</option>
                      <option value="collaboration">Collaboration</option>
                      <option value="query">Query</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-label text-foreground-muted">Attachment Url</label>
                  <input
                    type="text"
                    value={form.attachmentUrl}
                    onChange={(event) => handleField('attachmentUrl', event.target.value)}
                    className="w-full border-b border-border-strong bg-transparent py-3 text-foreground-primary outline-none transition-colors focus:border-accent-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-label text-foreground-muted">Message</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(event) => handleField('message', event.target.value)}
                    className="w-full resize-none border-b border-border-strong bg-transparent py-3 text-foreground-primary outline-none transition-colors focus:border-accent-primary"
                  />
                </div>

                {status.error ? <p className="text-body-sm text-[#f28b82]">{status.error}</p> : null}
                {status.success ? (
                  <p className="text-body-sm text-[#8fae8b]">{status.success}</p>
                ) : null}

                <Button type="submit" disabled={status.loading} className="w-full justify-center">
                  {status.loading ? 'Submitting...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
