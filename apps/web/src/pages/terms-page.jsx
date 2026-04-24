import LegalPage from './legal-page';

const sections = [
  {
    title: 'Overview',
    points: [
      'These terms govern use of the Parsom website, account area, and purchase flow.',
      'By placing an order, you confirm that the information you provide is accurate and complete.',
      'We may update these terms as the brand, operations, or legal requirements evolve.',
    ],
  },
  {
    title: 'Orders And Pricing',
    points: [
      'All product listings, prices, and availability are subject to change without prior notice.',
      'Orders may be cancelled if payment fails, stock is unavailable, or verification is required.',
      'We reserve the right to refuse or limit orders that appear fraudulent, abusive, or reseller-driven.',
    ],
  },
  {
    title: 'Products And Presentation',
    points: [
      'We aim to display colors, textures, and fits as accurately as possible, but screens may differ.',
      'Measurements, fabric behavior, and garment finish can vary slightly between batches.',
      'Campaign, editorial, and lookbook images are for styling direction and visual presentation.',
    ],
  },
  {
    title: 'Use Of The Website',
    points: [
      'You may not misuse the website, interfere with security, scrape content, or abuse checkout systems.',
      'Any content, branding, and design assets on the site remain the property of the Parsom brand.',
      'We may suspend access to accounts or services if misuse or harmful behavior is detected.',
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="These starter terms are written for a clothing brand storefront. You can edit, remove, or expand any point later."
      sections={sections}
    />
  );
}
