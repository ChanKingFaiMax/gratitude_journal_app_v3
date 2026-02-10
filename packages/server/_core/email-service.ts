import nodemailer from 'nodemailer';

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('[Email] Email credentials not configured. Emails will be logged to console only.');
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  return transporter;
}

/**
 * Send verification code email
 */
export async function sendVerificationCodeEmail(
  to: string,
  code: string,
  language: 'zh' | 'en' = 'zh'
): Promise<boolean> {
  const subject = language === 'zh' ? '您的验证码' : 'Your Verification Code';
  
  const htmlContent = language === 'zh' ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0a7ea4; }
        .content { padding: 30px 0; }
        .code-box { background: #f5f5f5; border: 2px dashed #0a7ea4; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; color: #0a7ea4; letter-spacing: 8px; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #0a7ea4; margin: 0;">感恩日记</h1>
        </div>
        <div class="content">
          <p>您好，</p>
          <p>您正在登录感恩日记应用，您的验证码是：</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p>验证码有效期为 <strong>10分钟</strong>，请尽快使用。</p>
          <p>如果这不是您的操作，请忽略此邮件。</p>
        </div>
        <div class="footer">
          <p>此邮件由系统自动发送，请勿回复。</p>
          <p>© 2026 感恩日记 Gratitude Journal</p>
        </div>
      </div>
    </body>
    </html>
  ` : `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0a7ea4; }
        .content { padding: 30px 0; }
        .code-box { background: #f5f5f5; border: 2px dashed #0a7ea4; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; color: #0a7ea4; letter-spacing: 8px; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #0a7ea4; margin: 0;">Gratitude Journal</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You are logging into Gratitude Journal. Your verification code is:</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>. Please use it soon.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>© 2026 Gratitude Journal</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = language === 'zh' 
    ? `您的验证码是：${code}\n\n验证码有效期为10分钟，请尽快使用。\n\n如果这不是您的操作，请忽略此邮件。`
    : `Your verification code is: ${code}\n\nThis code will expire in 10 minutes. Please use it soon.\n\nIf you didn't request this, please ignore this email.`;

  const transport = getTransporter();

  // If no transporter configured, log to console
  if (!transport) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL (Console Mode - No SMTP configured)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Verification Code: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  }

  // Send actual email
  try {
    const info = await transport.sendMail({
      from: `"感恩日记 Gratitude Journal" <${EMAIL_FROM}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[Email] Verification code sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send verification code:', error);
    // Fallback to console logging
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL (Fallback - SMTP failed)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Verification Code: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  }
}
