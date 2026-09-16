import nodemailer from 'nodemailer';

// Email configuration
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

let transporter = null;

// Initialize or get transporter
export async function getTransporter() {
  if (!transporter) {
    // In development/testing, if no valid credentials, use ethereal test account
    if (process.env.NODE_ENV !== 'production' && (!process.env.SMTP_USER || process.env.SMTP_USER.includes('example') || process.env.SMTP_USER.includes('mock'))) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('Using Ethereal test email account:', testAccount.user);
      } catch (err) {
        // Fallback to JSON transport for testing without internet
        transporter = nodemailer.createTransport({
          jsonTransport: true
        });
      }
    } else {
      transporter = nodemailer.createTransport(smtpConfig);
    }
  }
  return transporter;
}

/**
 * Send check-in reminder email to user
 */
export async function sendCheckinReminder({ to, name, checkinUrl, deadlineDate }) {
  const mailClient = await getTransporter();
  const from = process.env.EMAIL_FROM || 'GhostVault <noreply@ghostvault.com>';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1a1a1a;">GhostVault Check-In Reminder</h2>
      <p>Hello ${name || 'User'},</p>
      <p>This is your scheduled GhostVault check-in reminder. To confirm that you are active and keep your vault secure, please click the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${checkinUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Check In Now
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        Deadline: <strong>${new Date(deadlineDate).toLocaleDateString()}</strong>
      </p>
      <p style="color: #666; font-size: 14px;">
        If you do not check in, your configured emergency releases will be triggered according to your tier settings.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">GhostVault — Encrypted Digital Legacy Manager</p>
    </div>
  `;

  const info = await mailClient.sendMail({
    from,
    to,
    subject: '⚠️ Action Required: GhostVault Check-In Reminder',
    html,
    text: `Hello ${name},\n\nPlease check in to your GhostVault to confirm you are active:\n${checkinUrl}\n\nDeadline: ${deadlineDate}`
  });

  if (process.env.NODE_ENV !== 'production' && nodemailer.getTestMessageUrl) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('✉️ Email preview URL:', previewUrl);
    }
  }

  return info;
}

/**
 * Send emergency release notification to a trusted contact
 */
export async function sendEmergencyReleaseEmail({
  to,
  contactName,
  ownerName,
  vaultItemTitle,
  vaultItemType,
  accessUrl,
  encryptedPayload,
  iv
}) {
  const mailClient = await getTransporter();
  const from = process.env.EMAIL_FROM || 'GhostVault Emergency Access <emergency@ghostvault.com>';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin-bottom: 20px;">
        <h3 style="color: #991b1b; margin: 0;">GhostVault Emergency Release Notice</h3>
      </div>
      <p>Dear ${contactName},</p>
      <p>You have been designated as a trusted contact by <strong>${ownerName}</strong>.</p>
      <p>Because ${ownerName} has been inactive past their configured safety period, the following vault item has been released to you:</p>

      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Item Title:</strong> ${vaultItemTitle}</p>
        <p style="margin: 0;"><strong>Item Type:</strong> ${vaultItemType.toUpperCase()}</p>
      </div>

      <p>To securely access and decrypt this item, please visit your emergency access portal:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${accessUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Access Released Vault Item
        </a>
      </div>

      <p style="color: #666; font-size: 13px;">
        Direct link: <a href="${accessUrl}">${accessUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">This is an automated message sent securely by GhostVault.</p>
    </div>
  `;

  const info = await mailClient.sendMail({
    from,
    to,
    subject: `🚨 Emergency Access Release: ${ownerName}'s Vault Item "${vaultItemTitle}"`,
    html,
    text: `Dear ${contactName},\n\nYou have been designated as a trusted contact by ${ownerName}. A vault item "${vaultItemTitle}" has been released to you.\n\nAccess link: ${accessUrl}`
  });

  return info;
}
