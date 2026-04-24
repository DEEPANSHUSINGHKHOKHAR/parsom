import LegalPage from './legal-page';

const sections = [
  {
    title: 'Information We Collect',
    points: [
      'We may collect your name, email, phone number, shipping address, and order details.',
      'We may also collect account preferences, reviews, wishlist activity, and customer support messages.',
      'Basic usage information such as browser, device, and session activity may be collected for analytics and security.',
    ],
  },
  {
    title: 'How We Use It',
    points: [
      'We use your data to process orders, provide customer support, manage accounts, and improve the shopping experience.',
      'Contact details may be used for order updates, delivery communication, and important service notifications.',
      'Marketing communication should only be sent in line with your subscription or consent choices.',
    ],
  },
  {
    title: 'Data Sharing',
    points: [
      'We may share necessary information with payment processors, delivery partners, analytics providers, and support tools.',
      'We do not sell customer personal data as part of normal clothing-brand operations.',
      'Data may be disclosed if required by law, fraud prevention, or protection of our business and customers.',
    ],
  },
  {
    title: 'Your Choices',
    points: [
      'You can request updates to account details, saved addresses, and communication preferences.',
      'You may request deletion or review of your personal information subject to legal or operational obligations.',
      'You can update these privacy terms later to reflect your exact operational process and compliance region.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This is a practical starter privacy policy for your brand site and account system. You can tailor it to your actual tools and compliance needs."
      sections={sections}
    />
  );
}
