const path = require('path');
const dotenv = require('dotenv');

const envFile =
  process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), '.env.production')
    : path.join(process.cwd(), '.env.development');

dotenv.config({ path: envFile });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ADMIN_FRONTEND_URL: process.env.ADMIN_FRONTEND_URL || 'http://localhost:5174',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  APP_URL: process.env.APP_URL || 'http://localhost:5000',

  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'parsom_brand',

  JWT_SECRET: process.env.JWT_SECRET || 'USE_YOUR_LONG_RANDOM_SECRET_HERE',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 12),

  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://127.0.0.1:5672',
  RABBITMQ_NOTIFICATION_QUEUE:
    process.env.RABBITMQ_NOTIFICATION_QUEUE || 'notification-jobs',
  RABBITMQ_MAX_ATTEMPTS: Number(process.env.RABBITMQ_MAX_ATTEMPTS || 5),
  RABBITMQ_RETRY_DELAY_MS: Number(process.env.RABBITMQ_RETRY_DELAY_MS || 5000),

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  TRUST_PROXY_HOPS: Number(process.env.TRUST_PROXY_HOPS || 0),

  MAIL_PROVIDER: process.env.MAIL_PROVIDER || 'nodemailer',
  MAIL_FROM: process.env.MAIL_FROM || process.env.SMTP_FROM || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',

  WHATSAPP_CLOUD_API_VERSION:
    process.env.WHATSAPP_CLOUD_API_VERSION || 'v23.0',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  WHATSAPP_OTP_TEMPLATE_NAME:
    process.env.WHATSAPP_OTP_TEMPLATE_NAME || '',
  WHATSAPP_OTP_TEMPLATE_LANGUAGE:
    process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || 'en_US',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:
    (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
  GOOGLE_SHEETS_ORDERS_RANGE: process.env.GOOGLE_SHEETS_ORDERS_RANGE || 'Orders!A:Z',
  GOOGLE_SHEETS_NOTIFY_RANGE:
    process.env.GOOGLE_SHEETS_NOTIFY_RANGE || 'NotifyRequests!A:Z',
};

module.exports = env;
