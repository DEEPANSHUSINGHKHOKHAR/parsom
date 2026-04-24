import LegalPage from './legal-page';

const sections = [
  {
    title: 'Return Window',
    points: [
      'Returns may be requested within a clearly defined number of days from delivery, based on your brand policy.',
      'Items should be unworn, unwashed, unused, and returned with original tags and packaging where possible.',
      'Final-sale, custom, altered, or hygiene-sensitive products may be excluded from return eligibility.',
    ],
  },
  {
    title: 'Condition Requirements',
    points: [
      'Returned garments should be free from marks, scent, damage, or signs of wear.',
      'If a returned product does not meet the required condition, it may be rejected or sent back.',
      'We recommend customers try on garments carefully before removing tags or disposing packaging.',
    ],
  },
  {
    title: 'Refunds And Exchanges',
    points: [
      'Approved returns may be refunded to the original payment method or handled as store credit, depending on your final policy.',
      'Shipping fees, duties, and handling charges may or may not be refundable according to your decision.',
      'Exchange requests are subject to stock availability at the time the returned item is received and approved.',
    ],
  },
  {
    title: 'Damaged Or Incorrect Orders',
    points: [
      'Customers should report incorrect, damaged, or defective items within a short support window after delivery.',
      'Photos and order details may be requested to review and resolve the issue quickly.',
      'You can later add your exact process for repair, replacement, refund, or store credit outcomes.',
    ],
  },
];

export default function ReturnsPage() {
  return (
    <LegalPage
      eyebrow="Support"
      title="Return Policy"
      intro="This starter return policy is written specifically for a clothing brand. You can refine timelines, exclusions, and refund logic whenever you want."
      sections={sections}
    />
  );
}
