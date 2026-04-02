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

const shellTemplate = (title, body, meta = {}) => {
  const cta = meta?.ctaUrl
    ? `<a href="${meta.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF6154 0%,#FF8A65 100%);color:#ffffff;text-decoration:none;padding:11px 16px;border-radius:10px;font-weight:700;">${meta.ctaLabel || 'Open Kyro Social'}</a>`
    : '';

  return `
    <div style="background:#f6f8fc;padding:20px 10px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e6e9f0;border-radius:16px;overflow:hidden;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
        <div style="padding:18px 22px;background:linear-gradient(135deg,#0f1f3a 0%, #1f2f4f 100%);">
          <div style="font-size:22px;font-weight:800;color:#FF7A66;">${APP_NAME}</div>
          <div style="font-size:12px;color:#c5d0e6;margin-top:2px;">Professional creator network</div>
        </div>
        <div style="padding:22px;">
          <h2 style="margin:0 0 10px;font-size:21px;line-height:1.3;">${title}</h2>
          <div style="font-size:14px;line-height:1.65;color:#1e293b;">${body}</div>
          ${cta ? `<div style="margin-top:18px;">${cta}</div>` : ''}
          <div style="margin-top:18px;padding:12px;border-radius:10px;background:#f8fafc;border:1px solid #e6edf7;font-size:12px;color:#475569;">
            ${meta?.footnote || 'Security tip: if this action was not performed by you, change your password immediately from Settings.'}
          </div>
        </div>
        <div style="padding:12px 22px;font-size:12px;color:#64748b;border-top:1px solid #e6e9f0;background:#f8fafc;">
          This is an automated email from ${APP_NAME}.
        </div>
      </div>
    </div>
  `;
};

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
  const html = shellTemplate(
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
  const html = shellTemplate(
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
  const html = shellTemplate(
    'Welcome to Kyro Social',
    `<p>Hi ${name},</p>
     <p>Your account is ready. Start posting, connecting, and growing your creator network on Kyro.</p>`,
    {
      ctaLabel: 'Open Kyro',
      ctaUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
      footnote: 'Tip: complete your profile headline and bio to get discovered faster.',
    }
  );

  return sendMail({
    to,
    subject: `Welcome to ${APP_NAME}`,
    html,
  });
};

const sendActivityEmail = async (to, name, { title, message, ctaUrl = '' }) => {
  const html = shellTemplate(
    title || 'New activity on Kyro Social',
    `<p>Hi ${name || 'there'},</p>
     <p>${message || 'You have a new notification on Kyro Social.'}</p>`,
    {
      ctaUrl,
      ctaLabel: 'View Activity',
    }
  );

  return sendMail({
    to,
    subject: `${APP_NAME} activity update`,
    html,
  });
};

const sendLoginAlertEmail = async (to, name, { device = 'Unknown device', ip = 'Unknown IP', when = new Date() } = {}) => {
  const html = shellTemplate(
    'New Login Detected',
    `<p>Hi ${name || 'there'},</p>
     <p>We noticed a successful login to your ${APP_NAME} account.</p>
     <ul style="padding-left:18px;margin:8px 0;">
       <li><strong>Time:</strong> ${new Date(when).toLocaleString()}</li>
       <li><strong>Device:</strong> ${device}</li>
       <li><strong>IP:</strong> ${ip}</li>
     </ul>`
  );

  return sendMail({
    to,
    subject: `${APP_NAME}: New login alert`,
    html,
  });
};

const sendPasswordChangedEmail = async (to, name) => {
  const html = shellTemplate(
    'Password Changed Successfully',
    `<p>Hi ${name || 'there'},</p>
     <p>Your account password was changed successfully.</p>
     <p>If this was not you, reset your password immediately and review your account activity.</p>`
  );

  return sendMail({
    to,
    subject: `${APP_NAME}: Password changed`,
    html,
  });
};

const sendProfileUpdatedEmail = async (to, name, { changedFields = [] } = {}) => {
  const details = changedFields.length
    ? `<p><strong>Updated fields:</strong> ${changedFields.join(', ')}</p>`
    : '<p>Your profile information was updated.</p>';

  const html = shellTemplate(
    'Profile Updated',
    `<p>Hi ${name || 'there'},</p>
     ${details}
     <p>Your professional profile is now live with the latest changes.</p>`
  );

  return sendMail({
    to,
    subject: `${APP_NAME}: Profile updated`,
    html,
  });
};

const sendFirstMessageEmail = async (to, name) => {
  const html = shellTemplate(
    'Nice Start: You Sent Your First Message',
    `<p>Hi ${name || 'there'},</p>
     <p>You just sent your first direct message on Kyro Social. Great start building your network.</p>
     <p>Keep the conversation going and collaborate with more creators.</p>`,
    {
      ctaLabel: 'Open Messages',
      ctaUrl: `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/messages`,
      footnote: 'Pro tip: add a clear headline in your profile to get faster replies.',
    }
  );

  return sendMail({
    to,
    subject: `${APP_NAME}: First message sent`,
    html,
  });
};

module.exports = {
  sendOTPEmail,
  sendResetEmail,
  sendWelcomeEmail,
  sendActivityEmail,
  sendLoginAlertEmail,
  sendPasswordChangedEmail,
  sendProfileUpdatedEmail,
  sendFirstMessageEmail,
};
