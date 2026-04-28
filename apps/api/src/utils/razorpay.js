const crypto = require('crypto');
const https = require('https');

const env = require('../config/env');
const AppError = require('./app-error');

function ensureConfigured() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(500, 'Razorpay is not configured.');
  }
}

function requestJson(pathname, payload) {
  ensureConfigured();

  const body = JSON.stringify(payload);
  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.razorpay.com',
        path: pathname,
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed = null;

          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = null;
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
            return;
          }

          reject(
            new AppError(
              502,
              parsed?.error?.description ||
                parsed?.error?.reason ||
                parsed?.message ||
                'Unable to create Razorpay payment order.',
              parsed?.error || null
            )
          );
        });
      }
    );

    req.on('error', () => {
      reject(new AppError(502, 'Unable to reach Razorpay.'));
    });

    req.write(body);
    req.end();
  });
}

async function createRazorpayOrder({ orderNumber, amount }) {
  const amountInPaise = Math.round(Number(amount) * 100);

  if (!Number.isInteger(amountInPaise) || amountInPaise < 100) {
    throw new AppError(422, 'Payment amount is invalid.');
  }

  return requestJson('/v1/orders', {
    amount: amountInPaise,
    currency: 'INR',
    receipt: orderNumber,
    notes: {
      orderNumber,
    },
  });
}

async function refundRazorpayPayment({
  razorpayPaymentId,
  amount,
  notes = {},
}) {
  const amountInPaise = Math.round(Number(amount) * 100);

  if (!razorpayPaymentId) {
    throw new AppError(422, 'Razorpay payment reference is missing.');
  }

  if (!Number.isInteger(amountInPaise) || amountInPaise < 1) {
    throw new AppError(422, 'Refund amount is invalid.');
  }

  return requestJson(`/v1/payments/${razorpayPaymentId}/refund`, {
    amount: amountInPaise,
    speed: 'normal',
    notes,
  });
}

function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  ensureConfigured();

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(String(razorpaySignature || ''));

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

module.exports = {
  createRazorpayOrder,
  refundRazorpayPayment,
  verifyRazorpaySignature,
};
