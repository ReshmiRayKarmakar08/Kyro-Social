const nodemailer = require('nodemailer');

const APP_NAME = 'Kyro Social';
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.NODEMAILER_AUTH_PASS || process.env.EMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const baseTemplate = (title, content) => `
  <div style="max-width:560px;margin:24px auto;padding:24px;border:1px solid #e5e7eb;border-radius:14px;font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#111827;">
    <h2 style="margin-top:0;color:#ff6154;">${APP_NAME}</h2>
    <h3 style="margin:0 0 12px;">${title}</h3>
    ${content}
    <p style="margin-top:20px;color:#6b7280;font-size:12px;">This is an automated email from ${APP_NAME}.</p>
  </div>
`;

const sendMail = async ({ to, subject, html }) => {
  if (EMAIL_USER && EMAIL_PASS) {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { sent: true, provider: 'smtp' };
  }

  if (APPS_SCRIPT_URL) {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        to,
        subject,
        htmlBody: html,
        name: APP_NAME,
      }),
    });

    if (!response.ok) {
      throw new Error(`Apps Script email failed with status ${response.status}`);
    }

    return { sent: true, provider: 'apps_script' };
  }

  throw new Error('No email provider configured (SMTP or APPS_SCRIPT_URL)');
};

const sendOTPEmail = async (to, name, otp) => {
  const html = baseTemplate(
    'Verify Your Account',
    `<p>Hi ${name},</p>
     <p>Your verification OTP is:</p>
     <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p>
     <p>This code expires in 10 minutes.</p>`
  );

  return sendMail({
    to,
    subject: `${otp} is your ${APP_NAME} verification code`,
    html,
  });
};

const sendResetEmail = async (to, name, otp) => {
  const html = baseTemplate(
    'Reset Your Password',
    `<p>Hi ${name},</p>
     <p>Your password reset OTP is:</p>
     <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p>
     <p>This code expires in 10 minutes.</p>`
  );

  return sendMail({
    to,
    subject: `Reset your ${APP_NAME} password`,
    html,
  });
};

const sendWelcomeEmail = async (to, name) => {
  const html = baseTemplate(
    'Welcome to Kyro Social',
    `<p>Hi ${name},</p>
     <p>Your account is ready to use. Start posting, liking, and commenting.</p>`
  );

  return sendMail({
    to,
    subject: `Welcome to ${APP_NAME}`,
    html,
  });
};

module.exports = {
  sendOTPEmail,
  sendResetEmail,
  sendWelcomeEmail,
};
