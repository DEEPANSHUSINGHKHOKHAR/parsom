const { google } = require('googleapis');
const env = require('../config/env');

function isConfigured() {
  return Boolean(
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
      env.GOOGLE_SHEETS_SPREADSHEET_ID
  );
}

function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function appendRow(range, values) {
  if (!isConfigured()) return;

  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });
}

async function appendOrderRow(orderPayload) {
  return appendRow(env.GOOGLE_SHEETS_ORDERS_RANGE, [
    orderPayload.orderNumber,
    orderPayload.customerFirstName,
    orderPayload.customerLastName,
    orderPayload.customerEmail,
    orderPayload.customerPhone,
    orderPayload.status,
    orderPayload.subtotal,
    orderPayload.discountAmount,
    orderPayload.totalAmount,
    orderPayload.placedAt,
  ]);
}

async function appendNotifyRow(notifyPayload) {
  return appendRow(env.GOOGLE_SHEETS_NOTIFY_RANGE, [
    notifyPayload.id,
    notifyPayload.productId,
    notifyPayload.productName,
    notifyPayload.size,
    notifyPayload.fullName,
    notifyPayload.email,
    notifyPayload.phone,
    notifyPayload.status,
    notifyPayload.createdAt,
  ]);
}

module.exports = {
  appendOrderRow,
  appendNotifyRow,
};