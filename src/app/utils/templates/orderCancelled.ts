export const getOrderCancelledTemplate = (
  name: string,
  order: any,
  isAdmin: boolean
): string => {
  const items = (order.items as any[]) || [];
  
  // Dynamic table rows for items
  let itemsHtml = "";
  if (items.length === 0) {
    itemsHtml = `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eef2f6; width: 60px;">
          <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=150" alt="LUXE Purchase" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; display: block;" />
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; font-weight: bold; color: #1e293b;">
          Order Package / Aura Premium Purchase
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; text-align: center; color: #334155;">1</td>
        <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; text-align: right; color: #334155;">৳${order.total.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; text-align: right; font-weight: bold; color: #1e293b;">৳${order.total.toFixed(2)}</td>
      </tr>
    `;
  } else {
    items.forEach((item: any) => {
      const price = Number(item.price || 0);
      const qty = Number(item.quantity || 1);
      const total = price * qty;
      const specs = item.specsText ? `<div style="font-size: 11px; color: #64748b; margin-top: 3px;">${item.specsText}</div>` : "";
      
      itemsHtml += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eef2f6; width: 60px;">
            <img src="${item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=150'}" alt="${item.name || 'Item'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; display: block;" />
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; color: #1e293b;">
            <div style="font-weight: bold;">${item.name || "Product Item"}</div>
            ${specs}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; text-align: center; color: #334155;">${qty}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; text-align: right; color: #334155;">৳${price.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; text-align: right; font-weight: bold; color: #1e293b;">৳${total.toFixed(2)}</td>
        </tr>
      `;
    });
  }

  const subtotal = items.length > 0 
    ? items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0)
    : order.total;
  const tax = items.length > 0 ? subtotal * 0.08 : 0;
  const isExpress = order.total > (subtotal + tax);
  const delivery = isExpress ? (order.total - subtotal - tax) : 0;

  const paymentDisplay = order.paymentMethod === "card" 
    ? "Stripe (Card)" 
    : order.paymentMethod === "bkash" 
      ? "bKash" 
      : "Cash on Delivery";

  const titleText = isAdmin ? "Notification: Order Cancelled" : "Order Cancellation Confirmation";
  const introText = isAdmin 
    ? `An order has been cancelled by the customer. Details are listed below.`
    : `Dear <strong>${name}</strong>,<br/><br/>This email confirms that your order has been successfully cancelled. If you have already paid, a refund will be processed to your original payment method within 3-5 business days.`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${titleText}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #ef4444;
          padding: 32px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.025em;
          text-transform: uppercase;
        }
        .header p {
          margin: 8px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
          font-weight: 500;
        }
        .content {
          padding: 32px;
        }
        .intro {
          font-size: 15px;
          color: #334155;
          line-height: 1.6;
          margin-top: 0;
          margin-bottom: 24px;
        }
        .meta-box {
          background-color: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid #f1f5f9;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eef2f6;
        }
        .meta-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .meta-row:first-child {
          padding-top: 0;
        }
        .meta-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }
        .meta-value {
          font-size: 13px;
          color: #0f172a;
          font-weight: 700;
        }
        .table-title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .item-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .item-table th {
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: bold;
          color: #64748b;
        }
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
          border-top: 2px solid #f1f5f9;
          padding-top: 16px;
        }
        .summary-row {
          font-size: 14px;
        }
        .summary-row td {
          padding: 8px 12px;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
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
          <p>Order Cancelled</p>
        </div>
        <div class="content">
          <p class="intro">${introText}</p>
          
          <div class="meta-box">
            <div class="meta-row">
              <span class="meta-label">Order Reference:</span>
              <span class="meta-value">${order.orderId}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Date Placed:</span>
              <span class="meta-value">${order.date}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Payment Method:</span>
              <span class="meta-value">${paymentDisplay}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Order Status:</span>
              <span class="meta-value" style="color: #ef4444; background-color: #fef2f2; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">Cancelled</span>
            </div>
          </div>

          <div class="table-title">Cancelled Items</div>
          <table class="item-table">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #64748b; width: 60px;">Image</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #64748b;">Item Description</th>
                <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: bold; color: #64748b; width: 50px;">Qty</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #64748b; width: 90px;">Unit Price</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #64748b; width: 90px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="summary-table">
            <tr class="summary-row">
              <td style="color: #64748b; font-weight: bold;">Subtotal:</td>
              <td style="text-align: right; font-weight: bold; color: #0f172a;">৳${subtotal.toFixed(2)}</td>
            </tr>
            <tr class="summary-row">
              <td style="color: #64748b; font-weight: bold;">Tax (8%):</td>
              <td style="text-align: right; font-weight: bold; color: #0f172a;">৳${tax.toFixed(2)}</td>
            </tr>
            ${delivery > 0 ? `
            <tr class="summary-row">
              <td style="color: #64748b; font-weight: bold;">Delivery Fee:</td>
              <td style="text-align: right; font-weight: bold; color: #0f172a;">৳${delivery.toFixed(2)}</td>
            </tr>
            ` : ""}
            <tr class="summary-row" style="font-size: 16px; border-top: 1px solid #cbd5e1;">
              <td style="color: #0f172a; font-weight: 800; padding-top: 12px;">Total Refund Amount:</td>
              <td style="text-align: right; font-weight: 900; color: #ef4444; padding-top: 12px;">৳${order.total.toFixed(2)}</td>
            </tr>
          </table>

        </div>
        <div class="footer">
          <p>Need support? Contact us at <a href="mailto:support@luxe.com">support@luxe.com</a></p>
          <p>&copy; 2026 LUXE Premium Brand. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
