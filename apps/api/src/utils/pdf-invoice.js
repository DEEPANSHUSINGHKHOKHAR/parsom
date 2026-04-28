const PDFDocument = require('pdfkit');

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

async function buildInvoicePdfBuffer(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
    });

    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Invoice', { align: 'left' });
    doc.moveDown(0.5);

    doc.fontSize(11);
    doc.text(`Order Number: ${order.orderNumber}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.text(`Razorpay Order ID: ${order.razorpayOrderId || 'Not available'}`);
    doc.text(`Razorpay Transaction ID: ${order.razorpayPaymentId || 'Pending'}`);
    doc.text(`Paid At: ${order.paidAt || 'Not available'}`);
    doc.text(`Placed At: ${order.placedAt}`);
    doc.moveDown();

    doc.fontSize(13).text('Customer');
    doc.fontSize(11);
    doc.text(`${order.customerFirstName} ${order.customerLastName}`);
    doc.text(order.customerEmail);
    doc.text(order.customerPhone);
    doc.text(order.addressLine1);
    if (order.addressLine2) doc.text(order.addressLine2);
    doc.text(`${order.city}, ${order.state} ${order.postalCode}`);
    doc.moveDown();

    doc.fontSize(13).text('Items');
    doc.moveDown(0.5);

    const startY = doc.y;
    doc.fontSize(10).text('Product', 50, startY);
    doc.text('Size', 270, startY);
    doc.text('Qty', 330, startY);
    doc.text('Unit Price', 380, startY);
    doc.text('Line Total', 470, startY);

    let currentY = startY + 20;

    order.items.forEach((item) => {
      doc.text(item.productName, 50, currentY, { width: 200 });
      doc.text(item.size, 270, currentY);
      doc.text(String(item.quantity), 330, currentY);
      doc.text(formatMoney(item.unitPrice), 380, currentY);
      doc.text(formatMoney(item.lineTotal), 470, currentY);
      currentY += 22;
    });

    doc.moveTo(50, currentY + 8).lineTo(545, currentY + 8).stroke();
    currentY += 20;

    doc.fontSize(11);
    doc.text(`Subtotal: ${formatMoney(order.subtotal)}`, 380, currentY);
    currentY += 18;
    doc.text(`Discount: ${formatMoney(order.discountAmount)}`, 380, currentY);
    currentY += 18;
    doc.fontSize(12).text(`Total: ${formatMoney(order.totalAmount)}`, 380, currentY);

    doc.end();
  });
}

module.exports = {
  buildInvoicePdfBuffer,
};
