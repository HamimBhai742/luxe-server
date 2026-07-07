import PDFDocument from "pdfkit";

export const createInvoicePDF = (order: any, invoiceNumber: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // 1. Header Section
      // Brand Title
      doc.fillColor("#0f172a")
         .fontSize(28)
         .font("Helvetica-Bold")
         .text("LUXE", 50, 45);
      
      doc.fillColor("#64748b")
         .fontSize(8.5)
         .font("Helvetica-Oblique")
         .text("Aura Marketplace & Luxury Goods", 50, 75);

      doc.fillColor("#94a3b8")
         .fontSize(8)
         .font("Helvetica")
         .text("Aura Plaza, Suite 101, Dhaka, BD | support@luxe.com", 50, 88);

      // Invoice metadata (Right aligned)
      doc.fillColor("#2563eb")
         .fontSize(20)
         .font("Helvetica-Bold")
         .text("INVOICE", 400, 45, { align: "right" });

      doc.fillColor("#475569")
         .fontSize(9)
         .font("Helvetica");
      
      doc.text(`Invoice No: ${invoiceNumber}`, 400, 68, { align: "right" });
      doc.text(`Order Ref: ${order.orderId}`, 400, 82, { align: "right" });
      doc.text(`Date Placed: ${order.date}`, 400, 96, { align: "right" });

      // Horizontal separator line
      doc.moveTo(50, 115)
         .lineTo(545, 115)
         .strokeColor("#e2e8f0")
         .lineWidth(1)
         .stroke();

      // 2. Billing & Shipping Info Columns
      // Billed To Column (Left)
      doc.fillColor("#0f172a")
         .fontSize(11)
         .font("Helvetica-Bold")
         .text("Billed To:", 50, 132);

      doc.fillColor("#334155")
         .fontSize(9)
         .font("Helvetica");
      
      doc.text(`Name: ${order.customerName}`, 50, 150);
      doc.text(`Email: ${order.customerEmail}`, 50, 164);
      if (order.phone) {
        doc.text(`Phone: ${order.phone}`, 50, 178);
      }

      // Delivery Address Column (Right)
      doc.fillColor("#0f172a")
         .fontSize(11)
         .font("Helvetica-Bold")
         .text("Delivery Address:", 320, 132);

      doc.fillColor("#334155")
         .fontSize(9)
         .font("Helvetica");

      if (order.addressLine1) {
        doc.text(order.addressLine1, 320, 150);
        let nextY = 164;
        if (order.addressLine2) {
          doc.text(order.addressLine2, 320, nextY);
          nextY += 14;
        }
        const cityStateZip = [order.city, order.state, order.zipCode].filter(Boolean).join(", ");
        doc.text(cityStateZip || "N/A", 320, nextY);
      } else {
        doc.text("Standard Home Delivery", 320, 150);
        doc.text("Address records on dispatch request", 320, 164);
      }

      // Horizontal separator line
      doc.moveTo(50, 205)
         .lineTo(545, 205)
         .strokeColor("#e2e8f0")
         .lineWidth(1)
         .stroke();

      // 3. Payment & Transaction Info block
      doc.fillColor("#0f172a")
         .fontSize(10.5)
         .font("Helvetica-Bold")
         .text("Payment & Transaction Details:", 50, 218);

      // Sub titles
      doc.fillColor("#64748b")
         .fontSize(7.5)
         .font("Helvetica-Bold")
         .text("PAYMENT METHOD", 50, 236);

      doc.text("PAYMENT STATUS", 220, 236);
      doc.text("TRANSACTION REFERENCE ID", 355, 236);

      // Method value
      const displayMethod = order.paymentMethod === "card" 
        ? "Stripe (Card)" 
        : order.paymentMethod === "bkash" 
          ? "bKash" 
          : "Cash on Delivery";

      doc.fillColor("#1e293b")
         .fontSize(9)
         .font("Helvetica")
         .text(displayMethod, 50, 248);

      // Status value (Color Coded)
      const pStatus = order.paymentStatus || "Pending";
      const statusColor = pStatus === "Paid" 
        ? "#16a34a" 
        : pStatus === "Refunded" 
          ? "#dc2626" 
          : "#d97706";

      doc.fillColor(statusColor)
         .fontSize(9)
         .font("Helvetica-Bold")
         .text(pStatus.toUpperCase(), 220, 248);

      // Transaction ID value
      const txnId = pStatus === "Paid" 
        ? (order.paymentMethod === "card" 
          ? "pi_stripe_" + order.orderId.replace("#", "") + "_" + Math.floor(1000 + Math.random() * 9000)
          : "bkash_trx_" + Math.floor(100000 + Math.random() * 900000))
        : "Pending COD Settlement";

      doc.fillColor("#1e293b")
         .fontSize(8.5)
         .font("Helvetica")
         .text(txnId, 355, 248);

      // Horizontal separator line
      doc.moveTo(50, 272)
         .lineTo(545, 272)
         .strokeColor("#e2e8f0")
         .lineWidth(1)
         .stroke();

      // 4. Line items table
      const tableTop = 290;
      
      // Table Header
      doc.fillColor("#0f172a")
         .fontSize(9.5)
         .font("Helvetica-Bold");
      
      doc.text("Item Details", 50, tableTop);
      doc.text("Qty", 350, tableTop, { width: 40, align: "right" });
      doc.text("Unit Price", 400, tableTop, { width: 70, align: "right" });
      doc.text("Total Price", 480, tableTop, { width: 65, align: "right" });

      // Table Header line
      doc.moveTo(50, tableTop + 14)
         .lineTo(545, tableTop + 14)
         .strokeColor("#cbd5e1")
         .lineWidth(1)
         .stroke();

      let y = tableTop + 24;
      const items = (order.items as any[]) || [];

      if (items.length === 0) {
        doc.fillColor("#64748b")
           .fontSize(9.5)
           .font("Helvetica-Oblique")
           .text("Order Package / Aura Premium Purchase", 50, y);
        
        doc.font("Helvetica")
           .text("1", 350, y, { width: 40, align: "right" });
        doc.text(`$${order.total.toFixed(2)}`, 400, y, { width: 70, align: "right" });
        doc.text(`$${order.total.toFixed(2)}`, 480, y, { width: 65, align: "right" });
        y += 30;
      } else {
        items.forEach((item: any) => {
          doc.fillColor("#1e293b")
             .fontSize(9.5)
             .font("Helvetica-Bold");
          
          doc.text(item.name || "Product Item", 50, y, { width: 280 });
          
          let specsHeight = 0;
          if (item.specsText) {
            y += 12;
            doc.fillColor("#64748b")
               .fontSize(8)
               .font("Helvetica")
               .text(item.specsText, 50, y, { width: 280 });
            specsHeight = 10;
          }

          const valY = item.specsText ? y - 12 : y;

          doc.fillColor("#334155")
             .fontSize(9.5)
             .font("Helvetica");

          doc.text(String(item.quantity || item.qty || 1), 350, valY, { width: 40, align: "right" });
          doc.text(`$${Number(item.price || 0).toFixed(2)}`, 400, valY, { width: 70, align: "right" });
          
          const rowTotal = Number(item.price || 0) * Number(item.quantity || item.qty || 1);
          doc.text(`$${rowTotal.toFixed(2)}`, 480, valY, { width: 65, align: "right" });

          y += 26 + specsHeight;
        });
      }

      // Drawing total calculation fields
      doc.moveTo(50, y)
         .lineTo(545, y)
         .strokeColor("#e2e8f0")
         .lineWidth(0.75)
         .stroke();

      y += 12;

      // Subtotal calculation
      const calculatedSubtotal = items.length > 0 
        ? items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || item.qty || 1)), 0)
        : order.total;

      const taxAmount = items.length > 0 ? (calculatedSubtotal * 0.08) : 0;
      const isExpress = order.total > (calculatedSubtotal + taxAmount);
      const deliveryFee = isExpress ? (order.total - calculatedSubtotal - taxAmount) : 0;

      // Right align calculations
      doc.fontSize(9.5).fillColor("#475569");
      doc.text("Subtotal:", 350, y);
      doc.text(`$${calculatedSubtotal.toFixed(2)}`, 480, y, { width: 65, align: "right" });
      
      y += 15;
      doc.text("Tax (8%):", 350, y);
      doc.text(`$${taxAmount.toFixed(2)}`, 480, y, { width: 65, align: "right" });
      
      if (deliveryFee > 0) {
        y += 15;
        doc.text("Delivery Fee:", 350, y);
        doc.text(`$${deliveryFee.toFixed(2)}`, 480, y, { width: 65, align: "right" });
      }

      y += 18;
      // Grand Total
      doc.fillColor("#0f172a")
         .fontSize(12)
         .font("Helvetica-Bold");
      doc.text("Grand Total:", 350, y);
      doc.text(`$${Number(order.total).toFixed(2)}`, 470, y, { width: 75, align: "right" });

      // 5. Footer Section
      doc.fontSize(8)
         .font("Helvetica-Oblique")
         .fillColor("#94a3b8")
         .text("Thank you for your purchase with LUXE! Please verify all items on delivery.", 50, 720, { align: "center" });

      doc.text("For any support queries, contact us at support@luxe.com", 50, 734, { align: "center" });

      // Elegant minimalist outer border
      doc.lineWidth(0.5)
         .strokeColor("#cbd5e1")
         .rect(20, 20, 555, 802)
         .stroke();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
