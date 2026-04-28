import FormField from '../../../components/ui/form-field';

export default function CheckoutForm({ values, onChange }) {
  const updateField = (field, value) => {
    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const inputClass =
    'w-full border-b border-[#cfc5b8] bg-transparent px-0 py-3 text-sm text-[#171412] outline-none placeholder:text-[#8b847b] focus:border-[#8f3d2f]';

  return (
    <div className="space-y-10 rounded-[8px] border border-[#ded5ca] bg-[#fffaf4] p-6 shadow-[0_16px_34px_rgba(23,20,18,0.06)] md:p-8">
      <div>
        <p className="text-label text-[#8f3d2f]">Checkout</p>
        <h1 className="mt-3 text-display-2 text-[#171412]">Customer Details</h1>
        <p className="mt-4 max-w-2xl text-body text-[#756c63]">
          Fill your contact and delivery details for a clean, editorial checkout experience.
        </p>
      </div>

      <section className="space-y-5">
        <h2 className="text-label text-[#171412]">Contact</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="First Name" required>
            <input
              type="text"
              value={values.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              placeholder="Enter first name"
              className={inputClass}
            />
          </FormField>

          <FormField label="Last Name" required>
            <input
              type="text"
              value={values.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              placeholder="Enter last name"
              className={inputClass}
            />
          </FormField>

          <FormField label="Email Address" required>
            <input
              type="email"
              value={values.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="Enter email address"
              className={inputClass}
            />
          </FormField>

          <FormField label="Phone / WhatsApp" required>
            <input
              type="tel"
              value={values.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="Enter phone number"
              className={inputClass}
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-label text-[#171412]">Delivery Address</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Address Line 1" required>
            <input
              type="text"
              value={values.addressLine1}
              onChange={(event) => updateField('addressLine1', event.target.value)}
              placeholder="House / building / street"
              className={inputClass}
            />
          </FormField>

          <FormField label="Address Line 2">
            <input
              type="text"
              value={values.addressLine2}
              onChange={(event) => updateField('addressLine2', event.target.value)}
              placeholder="Landmark / area"
              className={inputClass}
            />
          </FormField>

          <FormField label="City" required>
            <input
              type="text"
              value={values.city}
              onChange={(event) => updateField('city', event.target.value)}
              placeholder="Enter city"
              className={inputClass}
            />
          </FormField>

          <FormField label="State" required>
            <input
              type="text"
              value={values.state}
              onChange={(event) => updateField('state', event.target.value)}
              placeholder="Enter state"
              className={inputClass}
            />
          </FormField>

          <FormField label="Postal Code" required>
            <input
              type="text"
              value={values.postalCode}
              onChange={(event) => updateField('postalCode', event.target.value)}
              placeholder="Enter postal code"
              className={inputClass}
            />
          </FormField>

          <FormField label="Address Label">
            <select
              value={values.addressLabel}
              onChange={(event) => updateField('addressLabel', event.target.value)}
              className="w-full border-b border-[#cfc5b8] bg-[#fffaf4] px-0 py-3 text-sm text-[#171412] outline-none focus:border-[#8f3d2f]"
            >
              <option value="">Select label</option>
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
          </FormField>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-label text-[#171412]">Order Notes</h2>
        <FormField label="Notes">
          <textarea
            rows={5}
            value={values.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="Any delivery note or special request"
            className={inputClass}
          />
        </FormField>
      </section>
    </div>
  );
}
