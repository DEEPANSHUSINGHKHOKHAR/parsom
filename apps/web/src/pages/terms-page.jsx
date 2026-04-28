import LegalPage from './legal-page';

const sections = [
  {
    title: 'Overview',
    points: [
      'These terms apply to the PARSOM ATTIRES website, customer account area, product pages, checkout flow, support forms, and order communication.',
      'By placing an order, you confirm that all details submitted by you, including name, phone number, email, address, size, and payment information, are accurate and complete.',
      'PARSOM ATTIRES may update these terms when business operations, platform features, payment rules, or legal requirements change.',
    ],
  },
  {
    title: 'Orders And Pricing',
    points: [
      'All product listings, pricing, offers, discounts, and availability are subject to change before an order is confirmed.',
      'An order may be cancelled, held, or rejected if payment is not completed, stock is unavailable, pricing is incorrect, delivery details are incomplete, or verification is required.',
      'PARSOM ATTIRES reserves the right to refuse, limit, or cancel orders that appear fraudulent, abusive, unauthorized, or intended for misuse.',
    ],
  },
  {
    title: 'Payments',
    points: [
      'Online payments on this website may be processed through Razorpay checkout for supported transactions in INR.',
      'An order is treated as payment-confirmed only after successful authorization and server-side verification of the payment response.',
      'If a payment is declined, interrupted, cancelled, or not verified successfully, the related order may remain pending, fail, or be cancelled.',
      'Payment gateway charges, convenience fees, or bank-side charges may not be refundable unless required by applicable rules or unless the issue was caused by PARSOM ATTIRES.',
    ],
  },
  {
    title: 'Products And Presentation',
    points: [
      'We aim to present colors, textures, measurements, and garment details as accurately as possible, but screen display, lighting, photography, and device settings may vary.',
      'Fabric behavior, dye tone, placement, finish, and embroidery or print details may differ slightly between batches or production runs.',
      'Customers should read the product description, size chart, measurement details, and care instructions carefully before placing an order.',
      'Images used for campaigns, styling, or editorial presentation are for visual reference and do not override the written product details.',
    ],
  },
  {
    title: 'Size Responsibility',
    points: [
      'Customers are responsible for checking the size chart and measurements before ordering.',
      'If a wrong size is selected by the customer, PARSOM ATTIRES may not accept return or exchange after delivery.',
      'If support is needed before purchase, customers should contact us before placing the order.',
    ],
  },
  {
    title: 'Returns, Exchanges, And Defective Products',
    points: [
      'Return or exchange requests are accepted only within 2 to 3 days after delivery.',
      'Returns or exchanges are allowed only in case of damaged, defective, incorrect, or manufacturing-fault products.',
      'No return or exchange will be accepted for wrong size selection, change of mind, color expectation, personal preference, or failure to check product details before ordering.',
      'A full unboxing video is required for damage, defect, missing item, or incorrect product claims.',
      'If no valid unboxing video is provided, PARSOM ATTIRES may reject the return, exchange, or refund request.',
      'Products must be unused, unworn, unwashed, unaltered, and returned with original tags and packaging where applicable.',
    ],
  },
  {
    title: 'Use Of The Website',
    points: [
      'You may not misuse the website, interfere with security, scrape content, test payment abuse patterns, disrupt checkout systems, or attempt unauthorized access to accounts or admin areas.',
      'All website content, product media, branding, design assets, written content, and layout remain the property of PARSOM ATTIRES unless otherwise stated.',
      'We may suspend or restrict access to accounts, orders, or services where misuse, fraud risk, chargeback abuse, false claims, or harmful behavior is detected.',
    ],
  },
  {
    title: 'Support',
    points: [
      'Customers can contact PARSOM ATTIRES through the official support email, contact form, or WhatsApp channel listed on the website.',
      'Support requests must include accurate order details, issue description, and proof where required.',
      'For return or damage claims, photos and a full unboxing video may be required.',
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="These terms explain how PARSOM ATTIRES handles website use, orders, payments, product details, returns, exchanges, and customer account activity."
      sections={sections}
    />
  );
}
