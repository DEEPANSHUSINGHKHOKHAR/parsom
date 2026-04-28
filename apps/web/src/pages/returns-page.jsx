import LegalPage from './legal-page';

const sections = [
  {
    title: 'Return Window',
    points: [
      'Return or exchange requests must be raised within 2 to 3 days after delivery.',
      'After this delivery window, PARSOM ATTIRES will not accept return or exchange requests.',
      'Returns or exchanges are accepted only when the product received is damaged, defective, incorrect, or has a clear manufacturing issue.',
      'Change of mind, wrong size selection, wrong color expectation, or personal preference after delivery will not qualify for return or exchange.',
    ],
  },
  {
    title: 'Size And Product Check Before Ordering',
    points: [
      'Customers must check the size chart, product measurements, fabric details, and product images before placing an order.',
      'If a customer orders the wrong size or does not check the size guide before ordering, the product will not be eligible for return or exchange after delivery.',
      'Minor color differences may occur due to screen brightness, lighting, photography, and fabric behavior. Such differences will not be treated as product defects.',
    ],
  },
  {
    title: 'Unboxing Video Requirement',
    points: [
      'Customers must record a clear full unboxing video from the moment the sealed package is opened.',
      'The video should clearly show the package, shipping label, product condition, tags, and any visible defect or damage.',
      'If the customer does not provide a proper unboxing video, PARSOM ATTIRES may reject the return, exchange, or damage claim.',
      'Edited, paused, unclear, or incomplete videos may not be accepted as valid proof.',
    ],
  },
  {
    title: 'Condition Requirements',
    points: [
      'Returned products must be unused, unworn, unwashed, unaltered, and returned with original tags, packaging, and accessories where applicable.',
      'Products with stains, perfume, makeup marks, damage caused after delivery, washing, stretching, or signs of use will not be accepted.',
      'Custom, altered, stitched-to-measure, final-sale, clearance, or hygiene-sensitive items are non-returnable unless they arrive damaged, defective, or incorrect.',
    ],
  },
  {
    title: 'Refunds And Exchanges',
    points: [
      'Approved returns may be resolved through replacement, exchange, store credit, or refund depending on the case and stock availability.',
      'Refunds, where approved, will be processed to the original payment source where applicable.',
      'Original shipping charges, convenience fees, payment gateway charges, duties, or similar charges are generally non-refundable unless the issue was caused by PARSOM ATTIRES.',
      'Exchange requests are subject to stock availability when the returned item is received and approved.',
    ],
  },
  {
    title: 'Damaged Or Incorrect Orders',
    points: [
      'Customers should report damaged, defective, missing, or incorrect items within 2 to 3 days after delivery.',
      'The customer must share the order number, full unboxing video, clear photos, and a short issue description.',
      'If the claim is approved, PARSOM ATTIRES may offer a replacement, exchange, refund, or another suitable resolution based on stock status and the nature of the issue.',
    ],
  },
  {
    title: 'Support And Disputes',
    points: [
      'Customers should contact support@parsomattire.com or the official WhatsApp support channel before raising any payment dispute or chargeback.',
      'Our team will review return and payment issues using order records, Razorpay transaction references, customer communication history, photos, and unboxing video proof.',
      'Clear return, refund, and support communication helps reduce failed deliveries, false claims, payment disputes, and unnecessary gateway review risk.',
    ],
  },
];

export default function ReturnsPage() {
  return (
    <LegalPage
      eyebrow="Support"
      title="Return Policy"
      intro="This return policy explains how PARSOM ATTIRES handles return requests, exchanges, damaged products, defective items, and customer support after delivery."
      sections={sections}
    />
  );
}
