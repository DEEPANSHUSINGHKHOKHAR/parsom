import LegalPage from './legal-page';

const sections = [
  {
    title: 'Information We Collect',
    points: [
      'We collect customer information needed to run the store, including name, email address, phone number, delivery address, billing details, and order details.',
      'We may also collect account data, saved addresses, wishlist activity, product reviews, cart activity, and messages submitted through support or contact forms.',
      'Basic technical data such as browser, device, IP-related session signals, and site activity may be collected for security, fraud prevention, order verification, and service performance.',
    ],
  },
  {
    title: 'How We Use It',
    points: [
      'We use customer data to process orders, verify payments, support deliveries, manage accounts, respond to customer service requests, and handle return or exchange claims.',
      'Contact details may be used for order updates, delivery coordination, payment-related communication, return handling, and important service notifications.',
      'Marketing communication should be limited to customers who have subscribed, requested updates, or otherwise provided valid consent where required.',
    ],
  },
  {
    title: 'Return And Claim Verification',
    points: [
      'For damaged, defective, incorrect, or missing product claims, PARSOM ATTIRES may request order details, product photos, delivery proof, and a full unboxing video.',
      'Unboxing videos and photos may be used only to verify the claim, review product condition, prevent false claims, and resolve the customer issue.',
      'If a customer does not provide required proof, the return, exchange, or refund request may be rejected according to our return policy.',
    ],
  },
  {
    title: 'Data Sharing',
    points: [
      'We may share necessary customer and order information with service providers such as Razorpay for payment processing, shipping partners for delivery, and support or infrastructure tools used to operate the store.',
      'PARSOM ATTIRES does not sell customer personal data as part of normal business operations.',
      'Information may be disclosed where required by law, fraud prevention, payment disputes, chargeback review, security protection, or business operations.',
    ],
  },
  {
    title: 'Payment Privacy',
    points: [
      'Online payments may be processed through Razorpay checkout.',
      'PARSOM ATTIRES should not store full card details on its own website when payment is handled through the hosted Razorpay payment flow.',
      'Payment verification references, order IDs, transaction IDs, refund references, and payment status may be stored with the related order for transaction tracking, refund handling, and support.',
    ],
  },
  {
    title: 'Your Choices',
    points: [
      'Customers can request updates to account details, saved addresses, and communication preferences through the platform or support.',
      'You may request access, correction, or deletion of personal information, subject to legal, tax, fraud-prevention, payment dispute, and order record requirements.',
    ],
  },
  {
    title: 'Data Security',
    points: [
      'We aim to protect customer information using reasonable technical and operational safeguards.',
      'Customers are responsible for keeping account login details private and must not share passwords or OTPs with anyone.',
      'If suspicious account activity or payment misuse is detected, PARSOM ATTIRES may restrict access, hold orders, or request verification.',
    ],
  },
  {
    title: 'Contact',
    points: [
      'Email: support@parsomattire.com',
      'Website: parsomattire.com',
      'Support: Official WhatsApp support channel listed on the website',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains what customer information PARSOM ATTIRES collects, how it is used to operate the online store, and how payment-related data is handled during checkout."
      sections={sections}
    />
  );
}
