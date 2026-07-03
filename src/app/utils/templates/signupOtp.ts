export const getSignupOtpTemplate = (name: string, otp: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your LUXE Account</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f7f9fc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #eef2f6;
        }
        .header {
          background-color: #0052cc;
          padding: 32px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 2px;
        }
        .content {
          padding: 40px 32px;
          color: #334155;
          line-height: 1.6;
        }
        .content h2 {
          font-size: 20px;
          margin-top: 0;
          color: #0f172a;
          font-weight: 700;
        }
        .content p {
          font-size: 15px;
          margin-bottom: 24px;
        }
        .otp-container {
          background-color: #f1f5f9;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          margin: 32px 0;
          border: 1px dashed #cbd5e1;
        }
        .otp-code {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #0052cc;
          margin: 0;
        }
        .expiry-text {
          font-size: 13px;
          color: #64748b;
          margin-top: 8px;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px 32px;
          text-align: center;
          border-top: 1px solid #f1f5f9;
        }
        .footer p {
          font-size: 12px;
          color: #94a3b8;
          margin: 0 0 8px 0;
        }
        .footer a {
          color: #0052cc;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>LUXE</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Welcome to LUXE! To activate your account and access the Aura Marketplace, please verify your email address using the 6-digit security code below.</p>
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
            <div class="expiry-text">This security code is valid for 3 minutes.</div>
          </div>
          <p>If you did not request this, you can safely ignore this email. Your account security is our top priority.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} LUXE / Aura Marketplace. All rights reserved.</p>
          <p>Need help? <a href="#">Contact Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};
