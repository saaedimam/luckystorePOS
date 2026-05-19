import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:intl/intl.dart';
import '../../models/pos_models.dart';

class PdfInvoiceService {
  static final DateFormat _dateFormatter = DateFormat('dd MMM yyyy, hh:mm a');
  static final NumberFormat _currencyFormatter = NumberFormat.currency(symbol: '৳', decimalDigits: 2);

  /// Generates a PDF invoice and returns the file path.
  static Future<File> generateInvoicePdf({
    required SaleResult sale,
    required String storeName,
    String? storeAddress,
    String? storePhone,
  }) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(storeName, style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
                      if (storeAddress != null) pw.Text(storeAddress),
                      if (storePhone != null) pw.Text('Phone: $storePhone'),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text('INVOICE', style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold)),
                      pw.Text('No: ${sale.saleNumber}'),
                      pw.Text('Date: ${_dateFormatter.format(DateTime.now())}'),
                    ],
                  ),
                ],
              ),
              pw.SizedBox(height: 30),

              // Items Table
              pw.TableHelper.fromTextArray(
                headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                headers: ['Item', 'Qty', 'Price', 'Discount', 'Total'],
                data: (sale.items ?? []).map((item) {
                  return [
                    item.item.name,
                    item.qty.toString(),
                    _currencyFormatter.format(item.item.price),
                    _currencyFormatter.format(item.discount),
                    _currencyFormatter.format(item.lineTotal),
                  ];
                }).toList(),
              ),
              pw.SizedBox(height: 20),

              // Summary
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      _summaryRow('Subtotal', sale.subtotal),
                      if (sale.discount > 0) _summaryRow('Sale Discount', -sale.discount),
                      pw.Divider(),
                      _summaryRow('Total Amount', sale.totalAmount, isBold: true),
                      _summaryRow('Tendered', sale.tendered),
                      _summaryRow('Change Due', sale.changeDue),
                    ],
                  ),
                ],
              ),

              pw.Spacer(),
              pw.Center(
                child: pw.Text('Thank you for shopping at $storeName!', style: pw.TextStyle(fontStyle: pw.FontStyle.italic)),
              ),
            ],
          );
        },
      ),
    );

    final output = await getTemporaryDirectory();
    final file = File('${output.path}/invoice_${sale.saleNumber}.pdf');
    await file.writeAsBytes(await pdf.save());
    return file;
  }

  static pw.Widget _summaryRow(String label, double amount, {bool isBold = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 2),
      child: pw.Row(
        mainAxisSize: pw.MainAxisSize.min,
        children: [
          pw.Text('$label: ', style: isBold ? pw.TextStyle(fontWeight: pw.FontWeight.bold) : null),
          pw.SizedBox(width: 20),
          pw.Text(_currencyFormatter.format(amount), style: isBold ? pw.TextStyle(fontWeight: pw.FontWeight.bold) : null),
        ],
      ),
    );
  }
}
