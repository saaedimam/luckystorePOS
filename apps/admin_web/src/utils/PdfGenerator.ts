import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CartItem } from '../lib/api/types';

interface PdfInvoiceData {
  saleNumber: string;
  cart: CartItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  storeName: string;
}

export const generateInvoicePdfBlob = (data: PdfInvoiceData): Blob => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(44, 62, 80);
  doc.text(data.storeName, 20, 20);

  doc.setFontSize(10);
  doc.setTextColor(127, 140, 141);
  doc.text('Your Neighborhood Store', 20, 26);

  doc.setFontSize(18);
  doc.setTextColor(44, 62, 80);
  doc.text('INVOICE', pageWidth - 20, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(52, 73, 94);
  doc.text(`Invoice No: ${data.saleNumber}`, pageWidth - 20, 26, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleString()}`, pageWidth - 20, 31, { align: 'right' });

  doc.setDrawColor(189, 195, 199);
  doc.line(20, 40, pageWidth - 20, 40);

  // Items Table
  autoTable(doc, {
    startY: 50,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: data.cart.map((item) => [
      item.product.name,
      item.qty.toString(),
      `৳${item.unitPrice.toFixed(2)}`,
      `৳${item.lineTotal.toFixed(2)}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: 20, right: 20 },
  });

  // Totals
  const finalY = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  const rightColumnX = pageWidth - 20;

  doc.setFontSize(10);
  doc.setTextColor(52, 73, 94);

  const drawTotalRow = (label: string, value: string, y: number, isBold = false) => {
    if (isBold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    doc.text(label, rightColumnX - 40, y);
    doc.text(value, rightColumnX, y, { align: 'right' });
  };

  drawTotalRow('Subtotal:', `৳${data.subtotal.toFixed(2)}`, finalY);
  if (data.discount > 0) {
    drawTotalRow('Discount:', `-৳${data.discount.toFixed(2)}`, finalY + 5);
  }
  drawTotalRow('Total:', `৳${data.totalAmount.toFixed(2)}`, finalY + 12, true);
  drawTotalRow('Tendered:', `৳${data.paidAmount.toFixed(2)}`, finalY + 17);
  drawTotalRow('Change:', `৳${data.changeAmount.toFixed(2)}`, finalY + 22);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(149, 165, 166);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for shopping with us!', pageWidth / 2, doc.internal.pageSize.height - 20, { align: 'center' });

  return doc.output('blob');
};
