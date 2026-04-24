const env = require('../config/env');
const AppError = require('./app-error');

function ensureConfigured() {
  if (!env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_ACCESS_TOKEN) {
    throw new AppError(500, 'WhatsApp Cloud API is not configured.');
  }
}

async function postWhatsAppMessage(payload) {
  ensureConfigured();

  const response = await fetch(
    `https://graph.facebook.com/${env.WHATSAPP_CLOUD_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AppError(502, data?.error?.message || 'WhatsApp message failed.');
  }

  return data;
}

async function sendWhatsappOtp(to, otp) {
  if (env.WHATSAPP_OTP_TEMPLATE_NAME) {
    return postWhatsAppMessage({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: env.WHATSAPP_OTP_TEMPLATE_NAME,
        language: {
          code: env.WHATSAPP_OTP_TEMPLATE_LANGUAGE,
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: otp,
              },
            ],
          },
        ],
      },
    });
  }

  return postWhatsAppMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      preview_url: false,
      body: `Your Parsom Brand login OTP is ${otp}. It expires in 10 minutes.`,
    },
  });
}

module.exports = {
  sendWhatsappOtp,
};
