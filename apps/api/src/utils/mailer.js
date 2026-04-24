const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const brevo = require('@getbrevo/brevo');
const env = require('../config/env');
const AppError = require('./app-error');

function createNodemailerTransporter() {
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: Number(env.SMTP_PORT) === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

async function sendWithNodemailer({ to, subject, html }) {
  const transporter = createNodemailerTransporter();

  return transporter.sendMail({
    from: env.MAIL_FROM || env.SMTP_FROM || 'USE YOUR DATA HERE',
    to,
    subject,
    html,
  });
}

async function sendWithResend({ to, subject, html }) {
  if (!env.RESEND_API_KEY) {
    throw new AppError(500, 'Resend is not configured.');
  }

  const resend = new Resend(env.RESEND_API_KEY);
  return resend.emails.send({
    from: env.MAIL_FROM,
    to,
    subject,
    html,
  });
}

async function sendWithBrevo({ to, subject, html }) {
  if (!env.BREVO_API_KEY) {
    throw new AppError(500, 'Brevo is not configured.');
  }

  const api = new brevo.TransactionalEmailsApi();
  api.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY);

  const email = new brevo.SendSmtpEmail();
  email.sender = { email: env.MAIL_FROM };
  email.to = Array.isArray(to)
    ? to.map((emailAddress) => ({ email: emailAddress }))
    : [{ email: to }];
  email.subject = subject;
  email.htmlContent = html;

  return api.sendTransacEmail(email);
}

async function sendMail(payload) {
  switch (env.MAIL_PROVIDER.toLowerCase()) {
    case 'resend':
      return sendWithResend(payload);

    case 'brevo':
      return sendWithBrevo(payload);

    case 'nodemailer':
    case 'smtp':
    default:
      return sendWithNodemailer(payload);
  }
}

module.exports = {
  sendMail,
};
