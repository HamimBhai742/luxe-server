export const getOrderFailedTemplate = (
  name: string,
  amount: number,
  errorMessage: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed - LUXE</title>
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
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          border: 1px solid #eef2f6;
        }
        .header {
          background-color: #dc2626;
          padding: 40px 32px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }
        .header p {
          color: rgba(255, 255, 255, 0.9);
          margin: 8px 0 0 0;
          font-size: 14px;
          font-weight: bold;
        }
        .content {
          padding: 40px 32px;
          color: #334155;
          line-height: 1.6;
        }
        .intro {
          font-size: 16px;
          margin-top: 0;
          margin-bottom: 20px;
        }
        .error-box {
          background-color: #fef2f2;
          border: 1px solid #fee2e2;
          border-radius: 8px;
          padding: 20px;
          margin: 28px 0;
        }
        .error-title {
          font-weight: bold;
          color: #991b1b;
          font-size: 14px;
          margin-bottom: 6px;
        }
        .error-msg {
          color: #b91c1c;
          font-size: 13.5px;
          font-family: monospace;
        }
        .action-container {
          text-align: center;
          margin: 32px 0 16px 0;
        }
        .btn {
          display: inline-block;
          background-color: #dc2626;
          color: #ffffff !important;
          font-weight: bold;
          font-size: 14px;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(220, 38, 38, 0.15);
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
          <p>Payment Transaction Failed</p>
        </div>
        <div class="content">
          <p class="intro">Dear <strong>${name}</strong>,</p>
          <p>We wanted to let you know that your recent payment attempt on LUXE could not be authorized. As a result, your order checkout was unsuccessful, and no items have been billed.</p>
          
          <div class="error-box">
            <div class="error-title">Decline Reason / Error Details:</div>
            <div class="error-msg">${errorMessage}</div>
            <div style="margin-top: 12px; font-size: 13px; color: #7f1d1d;">
              <strong>Attempted Amount:</strong> ৳${amount.toFixed(2)}
            </div>
          </div>

          <p>Please double-check your billing details, card details, or try an alternative payment method (e.g. bKash or Cash on Delivery) to place your order.</p>

          <div class="action-container">
            <a href="http://localhost:3000/cart" class="btn">Return to Cart & Retry</a>
          </div>

          <p>If your card was charged, please contact us immediately, and we will issue a full investigation/refund. We apologize for the inconvenience.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} LUXE / Aura Marketplace. All rights reserved.</p>
          <p>Need help? <a href="mailto:mdhamim5088@gmail.com">Contact Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};
