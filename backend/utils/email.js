const brandColor = '#FF6154';
const brandName = 'Kyro Social';

// Your Google Apps Script Web App URL from .env
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

const sendViaGoogleScript = async (to, subject, htmlBody) => {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Prevents preflight request issues
      },
      body: JSON.stringify({
        to,
        subject,
        htmlBody,
        name: brandName,
      }),
    });
    
    if (!response.ok) {
      console.error('Email send failed with status:', response.status);
    }
  } catch (error) {
    console.error('Failed to send email via Google Apps Script:', error.message);
  }
};

const baseTemplate = (title, body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:${brandColor};padding:28px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">${brandName}</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1a1a1a;margin:0 0 16px;font-size:20px;font-weight:600;">${title}</h2>
      ${body}
    </div>
    <div style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send OTP Verification Email
 */
const sendOTPEmail = async (email, name, otp) => {
  const body = `
    <p style="color:#444;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
    <p style="color:#444;font-size:15px;line-height:1.6;">Welcome to ${brandName}! Use the code below to verify your email address:</p>
    <div style="background:#f8f8f8;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:${brandColor};">${otp}</span>
    </div>
    <p style="color:#888;font-size:13px;">This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
  `;

  await sendViaGoogleScript(
    email,
    `${otp} is your ${brandName} verification code`,
    baseTemplate('Verify Your Email', body)
  );
};

/**
 * Send Welcome Email
 */
const sendWelcomeEmail = async (email, name) => {
  const body = `
    <p style="color:#444;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
    <p style="color:#444;font-size:15px;line-height:1.6;">Your account has been verified successfully! You're now part of the ${brandName} community.</p>
    <div style="margin:24px 0;">
      <p style="color:#444;font-size:15px;line-height:1.6;">Here's what you can do:</p>
      <ul style="color:#555;font-size:14px;line-height:2;">
        <li>Share your thoughts and photos with the community</li>
        <li>Follow interesting people and stay updated</li>
        <li>Like and comment on posts you enjoy</li>
        <li>Customize your profile with a bio and cover photo</li>
      </ul>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background:${brandColor};color:#fff;padding:14px 40px;border-radius:50px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">Start Exploring</a>
    </div>
  `;

  await sendViaGoogleScript(
    email,
    `Welcome to ${brandName}!`,
    baseTemplate('Welcome Aboard!', body)
  );
};

/**
 * Send Password Reset Email
 */
const sendResetEmail = async (email, name, otp) => {
  const body = `
    <p style="color:#444;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
    <p style="color:#444;font-size:15px;line-height:1.6;">We received a request to reset your password. Use the code below:</p>
    <div style="background:#f8f8f8;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:${brandColor};">${otp}</span>
    </div>
    <p style="color:#888;font-size:13px;">This code expires in <strong>10 minutes</strong>. If you didn't request a password reset, your account is safe — you can ignore this email.</p>
  `;

  await sendViaGoogleScript(
    email,
    `Reset your ${brandName} password`,
    baseTemplate('Password Reset', body)
  );
};

/**
 * Send Security Alert Email
 */
const sendSecurityAlert = async (email, name, alertType, details = {}) => {
  let alertTitle, alertBody;

  switch (alertType) {
    case 'new_login':
      alertTitle = 'New Login Detected';
      alertBody = `
        <p style="color:#444;font-size:15px;line-height:1.6;">We detected a new login to your account:</p>
        <div style="background:#fff8f7;border:1px solid #ffe0dd;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0;color:#555;font-size:14px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          ${details.ip ? `<p style="margin:4px 0;color:#555;font-size:14px;"><strong>IP:</strong> ${details.ip}</p>` : ''}
          ${details.userAgent ? `<p style="margin:4px 0;color:#555;font-size:14px;"><strong>Device:</strong> ${details.userAgent.slice(0, 60)}...</p>` : ''}
        </div>
        <p style="color:#888;font-size:13px;">If this wasn't you, please change your password immediately.</p>
      `;
      break;
    case 'password_changed':
      alertTitle = 'Password Changed';
      alertBody = `
        <p style="color:#444;font-size:15px;line-height:1.6;">Your ${brandName} password was successfully changed.</p>
        <p style="color:#444;font-size:15px;line-height:1.6;">If you did not make this change, please contact us immediately or reset your password.</p>
      `;
      break;
    default:
      alertTitle = 'Security Notice';
      alertBody = `<p style="color:#444;font-size:15px;">There was recent activity on your account.</p>`;
  }

  await sendViaGoogleScript(
    email,
    `Security Alert: ${alertTitle}`,
    baseTemplate(alertTitle, `<p style="color:#444;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>${alertBody}`)
  );
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendResetEmail,
  sendSecurityAlert,
};
