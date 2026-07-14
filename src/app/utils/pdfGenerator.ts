import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createInvoicePDF = (order: any, invoiceNumber: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
      });

      const fontPathRegular = path.join(__dirname, "fonts", "NotoSansBengali-Regular.ttf");
      const fontPathBold = path.join(__dirname, "fonts", "NotoSansBengali-Bold.ttf");

      doc.registerFont("NotoSans", fontPathRegular);
      doc.registerFont("NotoSans-Bold", fontPathBold);

      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // 1. Top Decorative Bars
      doc.rect(20, 20, 555, 12).fill("#0f172a"); // Premium Slate Top Bar
      doc.rect(20, 32, 555, 3).fill("#4f46e5");  // Indigo Accent Bar

      // 2. Header Section
      // Brand Title
      doc.fillColor("#0f172a")
         .fontSize(28)
         .font("NotoSans-Bold")
         .text("LUXE", 50, 55);
      
      doc.fillColor("#64748b")
         .fontSize(8.5)
         .font("NotoSans")
         .text("Aura Marketplace & Luxury Goods", 50, 85);

      doc.fillColor("#94a3b8")
         .fontSize(8)
         .font("NotoSans")
         .text("Aura Plaza, Suite 101, Dhaka, BD | support@luxe.com", 50, 98);

      // Invoice metadata (Right aligned)
      doc.fillColor("#4f46e5")
         .fontSize(22)
         .font("NotoSans-Bold")
         .text("INVOICE", 350, 55, { align: "right", width: 195 });

      doc.fillColor("#475569")
         .fontSize(9)
         .font("NotoSans");
      
      doc.text(`Invoice No: ${invoiceNumber}`, 350, 81, { align: "right", width: 195 });
      doc.text(`Order Ref: ${order.orderId}`, 350, 95, { align: "right", width: 195 });
      doc.text(`Date Placed: ${order.date}`, 350, 109, { align: "right", width: 195 });

      // Horizontal separator line
      doc.moveTo(50, 128)
         .lineTo(545, 128)
         .strokeColor("#e2e8f0")
         .lineWidth(1)
         .stroke();

      // 3. Billing & Shipping Info Columns
      // Billing Card
      doc.fillColor("#f8fafc")
         .roundedRect(50, 142, 235, 85, 6)
         .fill();
      doc.strokeColor("#e2e8f0")
         .lineWidth(0.75)
         .roundedRect(50, 142, 235, 85, 6)
         .stroke();

      // Shipping Card
      doc.fillColor("#f8fafc")
         .roundedRect(310, 142, 235, 85, 6)
         .fill();
      doc.strokeColor("#e2e8f0")
         .lineWidth(0.75)
         .roundedRect(310, 142, 235, 85, 6)
         .stroke();

      // Billed To Text
      doc.fillColor("#0f172a")
         .fontSize(9.5)
         .font("NotoSans-Bold")
         .text("Billed To:", 62, 150);

      doc.fillColor("#475569")
         .fontSize(8.5)
         .font("NotoSans")
         .text(`Name: ${order.customerName}`, 62, 166, { width: 211, ellipsis: true })
         .text(`Email: ${order.customerEmail}`, 62, 180, { width: 211, ellipsis: true });
      if (order.phone) {
        doc.text(`Phone: ${order.phone}`, 62, 194, { width: 211 });
      }

      // Delivery Address Text
      doc.fillColor("#0f172a")
         .fontSize(9.5)
         .font("NotoSans-Bold")
         .text("Delivery Address:", 322, 150);

      doc.fillColor("#475569")
         .fontSize(8.5)
         .font("NotoSans");

      if (order.addressLine1) {
        doc.text(order.addressLine1, 322, 166, { width: 211, ellipsis: true });
        let nextY = 180;
        if (order.addressLine2) {
          doc.text(order.addressLine2, 322, nextY, { width: 211, ellipsis: true });
          nextY += 14;
        }
        const cityStateZip = [order.city, order.state, order.zipCode].filter(Boolean).join(", ");
        doc.text(cityStateZip || "N/A", 322, nextY, { width: 211, ellipsis: true });
      } else {
        doc.text("Standard Home Delivery", 322, 166, { width: 211 });
        doc.text("Address records on dispatch request", 322, 180, { width: 211 });
      }

      // 4. Payment & Transaction Info block
      doc.fillColor("#f8fafc")
         .roundedRect(50, 242, 495, 48, 6)
         .fill();
      doc.strokeColor("#e2e8f0")
         .lineWidth(0.75)
         .roundedRect(50, 242, 495, 48, 6)
         .stroke();

      // Titles
      doc.fillColor("#64748b")
         .fontSize(7.5)
         .font("NotoSans-Bold")
         .text("PAYMENT METHOD", 62, 250)
         .text("PAYMENT STATUS", 220, 250)
         .text("TRANSACTION REFERENCE ID", 350, 250);

      // Method value
      const displayMethod = order.paymentMethod === "card" 
        ? "Stripe (Card)" 
        : order.paymentMethod === "bkash" 
          ? "bKash" 
          : "Cash on Delivery";

      doc.fillColor("#1e293b")
         .fontSize(8.5)
         .font("NotoSans")
         .text(displayMethod, 62, 264);

      // Status value (Color Coded Badge)
      const pStatus = order.paymentStatus || "Pending";
      const isPaid = pStatus.toLowerCase() === "paid";
      const isRefunded = pStatus.toLowerCase() === "refunded";
      
      const badgeBg = isPaid ? "#e6f4ea" : isRefunded ? "#fce8e6" : "#fef3c7";
      const badgeText = isPaid ? "#137333" : isRefunded ? "#c5221f" : "#b06000";

      doc.fillColor(badgeBg)
         .roundedRect(220, 260, 60, 14, 3)
         .fill();

      doc.fillColor(badgeText)
         .fontSize(7.5)
         .font("NotoSans-Bold")
         .text(pStatus.toUpperCase(), 220, 263, { width: 60, align: "center" });

      // Transaction ID value
      const txnId = pStatus === "Paid" 
        ? (order.paymentMethod === "card" 
          ? "pi_stripe_" + order.orderId.replace("#", "") + "_" + Math.floor(1000 + Math.random() * 9000)
          : "bkash_trx_" + Math.floor(100000 + Math.random() * 900000))
        : "Pending COD Settlement";

      doc.fillColor("#1e293b")
         .fontSize(8)
         .font("NotoSans")
         .text(txnId, 350, 264, { width: 183, ellipsis: true });

      // 5. Line items table
      const tableTop = 305;
      
      // Table Header Background
      doc.fillColor("#0f172a")
         .roundedRect(50, tableTop, 495, 22, 4)
         .fill();
      
      // Table Header Text
      doc.fillColor("#ffffff")
         .fontSize(8.5)
         .font("NotoSans-Bold");
      
      doc.text("Item Details", 62, tableTop + 7);
      doc.text("Qty", 335, tableTop + 7, { width: 35, align: "right" });
      doc.text("Unit Price", 385, tableTop + 7, { width: 75, align: "right" });
      doc.text("Total Price", 465, tableTop + 7, { width: 70, align: "right" });

      let y = tableTop + 32;
      const items = (order.items as any[]) || [];

      const formatCurrency = (val: number) => {
        return `৳${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      if (items.length === 0) {
        doc.fillColor("#1e293b")
           .fontSize(9)
           .font("NotoSans")
           .text("Order Package / Aura Premium Purchase", 62, y, { width: 260 });
        
        doc.text("1", 335, y, { width: 35, align: "right" });
        doc.text(formatCurrency(order.total), 385, y, { width: 75, align: "right" });
        doc.text(formatCurrency(order.total), 465, y, { width: 70, align: "right" });
        
        y += 24;
        doc.moveTo(50, y - 6)
           .lineTo(545, y - 6)
           .strokeColor("#f1f5f9")
           .lineWidth(1)
           .stroke();
      } else {
        items.forEach((item: any) => {
          doc.fillColor("#1e293b")
             .fontSize(9)
             .font("NotoSans-Bold");
          
          doc.text(item.name || "Product Item", 62, y, { width: 260 });
          
          let specsHeight = 0;
          if (item.specsText) {
            y += 12;
            doc.fillColor("#64748b")
               .fontSize(8)
               .font("NotoSans")
               .text(item.specsText, 62, y, { width: 260 });
            specsHeight = 10;
          }

          const valY = item.specsText ? y - 12 : y;

          doc.fillColor("#334155")
             .fontSize(9)
             .font("NotoSans");

          doc.text(String(item.quantity || item.qty || 1), 335, valY, { width: 35, align: "right" });
          doc.text(formatCurrency(Number(item.price || 0)), 385, valY, { width: 75, align: "right" });
          
          const rowTotal = Number(item.price || 0) * Number(item.quantity || item.qty || 1);
          doc.fillColor("#0f172a")
             .font("NotoSans-Bold")
             .text(formatCurrency(rowTotal), 465, valY, { width: 70, align: "right" });

          y += 24 + specsHeight;

          doc.moveTo(50, y - 6)
             .lineTo(545, y - 6)
             .strokeColor("#f1f5f9")
             .lineWidth(1)
             .stroke();
        });
      }

      y += 10;

      // 6. Subtotal & Grand Total Section
      const calculatedSubtotal = items.length > 0 
        ? items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || item.qty || 1)), 0)
        : order.total;

      const taxAmount = items.length > 0 ? (calculatedSubtotal * 0.08) : 0;
      const isExpress = order.total > (calculatedSubtotal + taxAmount);
      const deliveryFee = isExpress ? (order.total - calculatedSubtotal - taxAmount) : 0;

      // Pricing labels and values
      doc.fontSize(9)
         .fillColor("#475569")
         .font("NotoSans");
      
      doc.text("Subtotal:", 335, y);
      doc.text(formatCurrency(calculatedSubtotal), 465, y, { width: 70, align: "right" });
      
      y += 16;
      doc.text("Tax (8%):", 335, y);
      doc.text(formatCurrency(taxAmount), 465, y, { width: 70, align: "right" });
      
      if (deliveryFee > 0) {
        y += 16;
        doc.text("Delivery Fee:", 335, y);
        doc.text(formatCurrency(deliveryFee), 465, y, { width: 70, align: "right" });
      }

      y += 20;
      
      // Grand Total Highlight Card
      doc.fillColor("#f0f7ff")
         .roundedRect(325, y - 6, 220, 28, 4)
         .fill();
      doc.strokeColor("#bfdbfe")
         .lineWidth(1)
         .roundedRect(325, y - 6, 220, 28, 4)
         .stroke();

      doc.fillColor("#1e3a8a")
         .fontSize(11)
         .font("NotoSans-Bold")
         .text("Grand Total:", 335, y);
      doc.text(formatCurrency(Number(order.total)), 455, y, { width: 80, align: "right" });

      // 7. Footer Section
      doc.moveTo(50, 715)
         .lineTo(545, 715)
         .strokeColor("#e2e8f0")
         .lineWidth(0.75)
         .stroke();

      doc.fontSize(8)
         .font("NotoSans")
         .fillColor("#94a3b8")
         .text("Thank you for your purchase with LUXE! Please verify all items on delivery.", 50, 730, { align: "center", width: 495 });

      doc.text("For any support queries, contact us at support@luxe.com", 50, 744, { align: "center", width: 495 });

      // Clean elegant frame border around page
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
