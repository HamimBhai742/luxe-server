export const getOrderSuccessTemplate = (
  name: string,
  order: any,
  invoiceNumber: string,
  paymentMethod: string,
  deliveryMethod: string,
  estimatedDelivery: string
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
        <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; text-align: right; color: #334155;">$${order.total.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; text-align: right; font-weight: bold; color: #1e293b;">$${order.total.toFixed(2)}</td>
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
          <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; text-align: right; color: #334155;">$${price.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eef2f6; font-size: 14px; text-align: right; font-weight: bold; color: #1e293b;">$${total.toFixed(2)}</td>
        </tr>
      `;
    });
  }

  // Calculating subtotal, tax, and delivery
  const subtotal = items.length > 0 
    ? items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0)
    : order.total;
  const tax = items.length > 0 ? subtotal * 0.08 : 0;
  const isExpress = order.total > (subtotal + tax);
  const delivery = isExpress ? (order.total - subtotal - tax) : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - LUXE</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f7f9fc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 650px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          border: 1px solid #eef2f6;
        }
        .header {
          background-color: #0052cc;
          padding: 40px 32px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: 2px;
        }
        .header p {
          color: rgba(255, 255, 255, 0.85);
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
          margin-bottom: 24px;
        }
        .meta-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 32px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13.5px;
        }
        .meta-row:last-child {
          margin-bottom: 0;
        }
        .meta-label {
          color: #64748b;
          font-weight: bold;
        }
        .meta-value {
          color: #0f172a;
          font-weight: bold;
          text-align: right;
        }
        .table-title {
          font-size: 16px;
          font-weight: bold;
          color: #0f172a;
          margin-bottom: 12px;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 8px;
        }
        .item-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 28px;
        }
        .summary-table {
          width: 250px;
          margin-left: auto;
          border-collapse: collapse;
          margin-bottom: 32px;
        }
        .summary-row td {
          padding: 6px 0;
          font-size: 13.5px;
        }
        .grand-total {
          border-top: 1px dashed #cbd5e1;
          font-weight: bold;
          font-size: 16px !important;
          color: #0052cc;
          padding-top: 12px !important;
        }
        .action-container {
          text-align: center;
          margin: 32px 0 16px 0;
        }
        .btn {
          display: inline-block;
          background-color: #0052cc;
          color: #ffffff !important;
          font-weight: bold;
          font-size: 14px;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 82, 204, 0.15);
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
          <p>Order Confirmed</p>
        </div>
        <div class="content">
          <p class="intro">Dear <strong>${name}</strong>,</p>
          <p>Thank you for choosing LUXE! We are thrilled to confirm that your order has been placed successfully. Your payment has been processed, and we have generated an invoice for this transaction. We are already preparing your package for shipment!</p>
          
          <div class="meta-box">
            <div class="meta-row">
              <span class="meta-label">Invoice Number:</span>
              <span class="meta-value">${invoiceNumber}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Order Reference:</span>
              <span class="meta-value">${order.orderId}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Order Date:</span>
              <span class="meta-value">${order.date}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Payment Method:</span>
              <span class="meta-value">${paymentMethod === "card" ? "Stripe (Card)" : paymentMethod === "bkash" ? "bKash" : paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Delivery Type:</span>
              <span class="meta-value">${deliveryMethod === "express" ? "Express Shipping" : "Standard Shipping"}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Estimated Delivery:</span>
              <span class="meta-value" style="color: #16a34a; font-weight: bold;">${estimatedDelivery}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Order Status:</span>
              <span class="meta-value" style="color: #0284c7; background-color: #f0f9ff; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">${order.fulfillmentStatus}</span>
            </div>
          </div>

          <div class="table-title">Ordered Items</div>
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
              <td style="text-align: right; font-weight: bold; color: #0f172a;">$${subtotal.toFixed(2)}</td>
            </tr>
            <tr class="summary-row">
              <td style="color: #64748b; font-weight: bold;">Tax (8%):</td>
              <td style="text-align: right; font-weight: bold; color: #0f172a;">$${tax.toFixed(2)}</td>
            </tr>
            ${delivery > 0 ? `
            <tr class="summary-row">
              <td style="color: #64748b; font-weight: bold;">Delivery Fee:</td>
              <td style="text-align: right; font-weight: bold; color: #0f172a;">$${delivery.toFixed(2)}</td>
            </tr>
            ` : ""}
            <tr class="summary-row">
              <td class="grand-total">Grand Total:</td>
              <td class="grand-total" style="text-align: right;">$${Number(order.total).toFixed(2)}</td>
            </tr>
          </table>

          <p>Please find the official PDF Invoice attached to this email for your records. If you have any questions or require custom support, please get in touch with us.</p>
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
