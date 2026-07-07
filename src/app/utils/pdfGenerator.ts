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

      // Header Section
      // Brand Title
      doc.fillColor("#0052cc")
         .fontSize(28)
         .font("Helvetica-Bold")
         .text("LUXE", 50, 45);
      
      doc.fillColor("#64748b")
         .fontSize(9)
         .font("Helvetica-Oblique")
         .text("Aura Marketplace & Luxury Goods", 50, 75);

      // Invoice metadata (Right aligned)
      doc.fillColor("#0f172a")
         .fontSize(18)
         .font("Helvetica-Bold")
         .text("INVOICE", 400, 45, { align: "right" });

      doc.fillColor("#475569")
         .fontSize(9)
         .font("Helvetica");
      
      doc.text(`Invoice No: ${invoiceNumber}`, 400, 68, { align: "right" });
      doc.text(`Order No: ${order.orderId}`, 400, 82, { align: "right" });
      doc.text(`Date: ${order.date}`, 400, 96, { align: "right" });

      // Horizontal separator line
      doc.moveTo(50, 115)
         .lineTo(545, 115)
         .strokeColor("#e2e8f0")
         .lineWidth(1)
         .stroke();

      // Customer Info Section
      doc.fillColor("#0f172a")
         .fontSize(11)
         .font("Helvetica-Bold")
         .text("Billed To:", 50, 135);

      doc.fillColor("#334155")
         .fontSize(9.5)
         .font("Helvetica");
      
      doc.text(`Name: ${order.customerName}`, 50, 153);
      doc.text(`Email: ${order.customerEmail}`, 50, 167);

      // Payment Details Section
      doc.fillColor("#0f172a")
         .fontSize(11)
         .font("Helvetica-Bold")
         .text("Payment Info:", 350, 135);

      doc.fillColor("#334155")
         .fontSize(9.5)
         .font("Helvetica");
      
      const pMethod = order.paymentStatus === "Paid" ? (order.method || "Stripe (Card)") : "N/A";
      doc.text(`Payment Status: ${order.paymentStatus}`, 350, 153);
      doc.text(`Method: ${pMethod}`, 350, 167);

      // Horizontal separator line
      doc.moveTo(50, 195)
         .lineTo(545, 195)
         .strokeColor("#e2e8f0")
         .lineWidth(1)
         .stroke();

      // Line items table
      const tableTop = 215;
      
      // Table Header
      doc.fillColor("#0f172a")
         .fontSize(9.5)
         .font("Helvetica-Bold");
      
      doc.text("Item Details", 50, tableTop);
      doc.text("Qty", 350, tableTop, { width: 40, align: "right" });
      doc.text("Unit Price", 400, tableTop, { width: 70, align: "right" });
      doc.text("Total Price", 480, tableTop, { width: 65, align: "right" });

      // Table Header line
      doc.moveTo(50, tableTop + 15)
         .lineTo(545, tableTop + 15)
         .strokeColor("#cbd5e1")
         .lineWidth(1)
         .stroke();

      let y = tableTop + 25;
      const items = (order.items as any[]) || [];

      if (items.length === 0) {
        // Fallback row if no items are recorded
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
            y += 13;
            doc.fillColor("#64748b")
               .fontSize(8)
               .font("Helvetica")
               .text(item.specsText, 50, y, { width: 280 });
            specsHeight = 10;
          }

          // Reset y alignment for qty, price, total column values
          const valY = item.specsText ? y - 13 : y;

          doc.fillColor("#334155")
             .fontSize(9.5)
             .font("Helvetica");

          doc.text(String(item.quantity || 1), 350, valY, { width: 40, align: "right" });
          doc.text(`$${Number(item.price || 0).toFixed(2)}`, 400, valY, { width: 70, align: "right" });
          
          const rowTotal = Number(item.price || 0) * Number(item.quantity || 1);
          doc.text(`$${rowTotal.toFixed(2)}`, 480, valY, { width: 65, align: "right" });

          y += 28 + specsHeight;
        });
      }

      // Drawing total calculation fields
      doc.moveTo(50, y)
         .lineTo(545, y)
         .strokeColor("#e2e8f0")
         .lineWidth(0.75)
         .stroke();

      y += 15;

      // Subtotal calculation
      const calculatedSubtotal = items.length > 0 
        ? items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0)
        : order.total;

      const taxAmount = items.length > 0 ? (calculatedSubtotal * 0.08) : 0;
      const isExpress = order.total > (calculatedSubtotal + taxAmount);
      const deliveryFee = isExpress ? (order.total - calculatedSubtotal - taxAmount) : 0;

      // Right align calculations
      doc.fontSize(9.5).fillColor("#475569");
      doc.text("Subtotal:", 350, y);
      doc.text(`$${calculatedSubtotal.toFixed(2)}`, 480, y, { width: 65, align: "right" });
      
      y += 16;
      doc.text("Tax (8%):", 350, y);
      doc.text(`$${taxAmount.toFixed(2)}`, 480, y, { width: 65, align: "right" });
      
      if (deliveryFee > 0) {
        y += 16;
        doc.text("Delivery Fee:", 350, y);
        doc.text(`$${deliveryFee.toFixed(2)}`, 480, y, { width: 65, align: "right" });
      }

      y += 20;
      // Grand Total
      doc.fillColor("#0f172a")
         .fontSize(12)
         .font("Helvetica-Bold");
      doc.text("Grand Total:", 350, y);
      doc.text(`$${Number(order.total).toFixed(2)}`, 470, y, { width: 75, align: "right" });

      // Footer disclaimer & contact
      doc.fontSize(8)
         .font("Helvetica-Oblique")
         .fillColor("#94a3b8")
         .text("Thank you for your purchase with LUXE! Please verify all items on delivery.", 50, 710, { align: "center" });

      doc.text("For any support queries, contact us at mdhamim5088@gmail.com", 50, 725, { align: "center" });

      // Page boundary visual borders (Very elegant)
      doc.lineWidth(1)
         .strokeColor("#3b82f6")
         .rect(20, 20, 555, 802)
         .stroke();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
