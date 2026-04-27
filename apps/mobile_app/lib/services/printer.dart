/// ESC/POS thermal printer service for receipt printing.
/// Supports Bluetooth and network printers using the ESC/POS protocol.
/// Uses flutter_blue_plus for Bluetooth and http for network printers.

import 'dart:async';
import 'dart:convert';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:esc_pos_utils/esc_pos_utils.dart';
import 'package:http/http.dart' as http;
import 'package:logging/logging.dart';

/// Receipt data model for printing
class ReceiptData {
  final String storeName;
  final String receiptNumber;
  final String date;
  final List<ReceiptItem> items;
  final double subtotal;
  final double tax;
  final double total;
  final String paymentMethod;

  ReceiptData({
    required this.storeName,
    required this.receiptNumber,
    required this.date,
    required this.items,
    required this.subtotal,
    required this.tax,
    required this.total,
    required this.paymentMethod,
  });
}

class ReceiptItem {
  final String name;
  final double price;
  final int quantity;
  final double lineTotal;

  ReceiptItem({
    required this.name,
    required this.price,
    required this.quantity,
    required this.lineTotal,
  });
}

/// ESC/POS command constants
extension ESCPosCommands on String {
  static const String ESC = '\x1B';
  static const String GS = '\x1D';
  static const String HT = '\x09';
  static const String LF = '\n';
  static const String FS = '\x1C';
  
  void alignCenter() {
    printText('$ESC $a2');
  }
  
  void bold(bool enable) {
    if (enable) {
      printText('$ESC $e1');
    } else {
      printText('$ESC $e0');
    }
  }
  
  void printLine(int width) {
    printText('=' * width + LF);
  }
}

/// Thermal printer service
class ThermalPrinterService {
  static final ThermalPrinterService _instance = ThermalPrinterService._internal();
  factory ThermalPrinterService() => _instance;

  final _log = Logger('ThermalPrinter');
  
  BluetoothDevice? _bluetoothDevice;
  CharacterSet _charset = CharacterSet.iso88591;
  Generator _generator = Generator(PaperSize.pos58);
  
  // Network printer URL (optional)
  String? _networkPrinterUrl;

  ThermalPrinterService._internal();

  /// Initialize Bluetooth connection
  Future<void> initBluetooth() async {
    await FlutterBluePlus.startScan(timeout: const Duration(seconds: 5));
    
    // Scan for ESC/POS compatible printers
    FlutterBluePlus.scanResults.listen((results) {
      for (var result in results) {
        final device = result.device;
        final name = device.name ?? '';
        
        if (name.contains('POS') || name.contains('PRN') || name.contains('TSP')) {
          _log.info('Found printer: $name');
          _bluetoothDevice = device;
        }
      }
    });
  }

  /// Connect to Bluetooth printer
  Future<void> connectToPrinter(BluetoothDevice device) async {
    _bluetoothDevice = device;
    await device.connect();
    _log.info('Connected to printer');
  }

  /// Disconnect from printer
  Future<void> disconnectFromPrinter() async {
    await _bluetoothDevice?.disconnect();
    _bluetoothDevice = null;
  }

  /// Print receipt data to connected printer
  Future<bool> printReceipt(ReceiptData receipt) async {
    try {
      if (_bluetoothDevice == null) {
        _log.warning('No printer connected');
        return false;
      }

      final connection = await _bluetoothDevice?.value;
      if (connection == null) {
        _log.severe('No connection available');
        return false;
      }

      // Generate ESC/POS commands
      final commands = _generateReceiptCommand(receipt);
      
      // Send to printer
      await connection.write(commands);
      
      _log.info('Receipt printed: ${receipt.receiptNumber}');
      return true;
    } catch (e) {
      _log.severe('Print failed: $e');
      return false;
    }
  }

  /// Generate ESC/POS command stream
  List<List<int>> _generateReceiptCommand(ReceiptData receipt) {
    final commands = <List<int>>[];
    final writer = ByteWriter(encoding: _charset);

    // Store name - bold
    writer.text(receipt.storeName, style: const PosStyle(bold: true));
    writer.text(' ');
    
    // Print line separator
    for (var i = 0; i < 40; i++) {
      writer.text('=');
    }
    writer.text('\n\n');

    // Receipt info
    writer.text('Receipt: ${receipt.receiptNumber}\n');
    writer.text('${receipt.date}\n');
    writer.text('Method: ${receipt.paymentMethod}\n\n');

    // Items
    for (var item in receipt.items) {
      writer.leftRight(
        '${item.name} x${item.quantity}',
        '\$${item.lineTotal.toStringAsFixed(2)}',
      );
    }

    writer.text('\n');

    // Totals
    writer.leftRight('Subtotal: ', '\$${receipt.subtotal.toStringAsFixed(2)}');
    writer.leftRight('Tax: ', '\$${receipt.tax.toStringAsFixed(2)}');
    
    writer.text('\n');
    writer.text('Total: ', style: const PosStyle(bold: true));
    writer.right('\$${receipt.total.toStringAsFixed(2)}');
    writer.text('\n');

    // Thank you message
    writer.text('\n\n');
    writer.leftRight('Thank you!', 'Visit again!');

    commands.add(writer.toBytes());
    
    // Feed and cut
    commands.add([0x0A, 0x0A]); // Feed lines
    commands.add([0x1D, 0x56, 0x42, 0x00]); // Cut paper

    return commands;
  }

  /// Print label (inventory sticker)
  Future<bool> printLabel(String content) async {
    try {
      if (_bluetoothDevice == null) {
        _log.warning('No printer connected');
        return false;
      }

      final writer = ByteWriter(encoding: _charset);
      writer.text(content, style: const PosStyle(bold: true, size: PosSize.big));
      writer.text('\n\n');
      
      final connection = await _bluetoothDevice?.value;
      await connection?.write(writer.toBytes());
      
      // Feed and cut
      await connection?.write([0x0A, 0x0A]);
      await connection?.write([0x1D, 0x56, 0x42, 0x00]);
      
      _log.info('Label printed: $content');
      return true;
    } catch (e) {
      _log.severe('Label print failed: $e');
      return false;
    }
  }

  /// Print to network printer (HTTP endpoint)
  Future<bool> printToNetwork(ReceiptData receipt, String printerUrl) async {
    try {
      final commands = _generateReceiptCommand(receipt);
      for (var cmd in commands) {
        await http.post(
          Uri.parse(printerUrl),
          body: cmd,
        );
      }
      return true;
    } catch (e) {
      _log.severe('Network print failed: $e');
      return false;
    }
  }
}
