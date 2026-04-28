const path = require('path');
const dotenv = require('dotenv');

const apiRoot = path.resolve(__dirname, '..', '..');
const envFile =
  process.env.NODE_ENV === 'production'
    ? path.join(apiRoot, '.env.production')
    : path.join(apiRoot, '.env.development');

dotenv.config({ path: envFile });

function requireProductionEnv(name) {
  const value = process.env[name];

  if (process.env.NODE_ENV === 'production' && !value) {
    throw new Error(`${name} is required in production.`);
  }

  return value;
}

function validateProductionSecret(name, value, placeholder) {
  if (
    process.env.NODE_ENV === 'production' &&
    (!value || value === placeholder || value.length < 32)
  ) {
    throw new Error(`${name} must be a strong production secret.`);
  }
}

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
  DB_PASSWORD: requireProductionEnv('DB_PASSWORD') || '',
  DB_NAME: process.env.DB_NAME || 'parsom_brand',

  JWT_SECRET: process.env.JWT_SECRET || 'USE_YOUR_LONG_RANDOM_SECRET_HERE',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 12),

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  TRUST_PROXY_HOPS: Number(process.env.TRUST_PROXY_HOPS || 0),

  GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:
    (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
  GOOGLE_SHEETS_ORDERS_RANGE: process.env.GOOGLE_SHEETS_ORDERS_RANGE || 'Orders!A:Z',
  GOOGLE_SHEETS_NOTIFY_RANGE:
    process.env.GOOGLE_SHEETS_NOTIFY_RANGE || 'NotifyRequests!A:Z',
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || '',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
};

validateProductionSecret(
  'JWT_SECRET',
  env.JWT_SECRET,
  'USE_YOUR_LONG_RANDOM_SECRET_HERE'
);

module.exports = env;
