import 'dart:convert';
import 'package:http/http.dart' as http;

/// SSLCommerz Payment Aggregator Service
/// Handles credit/debit cards, Nagad, Rocket, and 30+ channels via the "Easy Checkout" flow.
/// Reference: https://developer.sslcommerz.com/doc/v4/
class SSLCommerzService {
  /// This endpoint must be called from your BACKEND server to avoid exposing store credentials.
  /// The mobile app calls your backend, which calls SSLCommerz, and returns the GatewayPageURL.
  static const String _backendInitUrl = 'https://your-luckystore-backend.com/sslcommerz/init';
  static const String _backendValidateUrl = 'https://your-luckystore-backend.com/sslcommerz/validate';

  /// Step 1: Initiate a session to get the GatewayPageURL.
  /// The app should open this URL in an in-app WebView.
  Future<SSLCommerzSession?> initiateSession({
    required String orderId,
    required double amount,
    required String customerName,
    required String customerPhone,
    required String customerAddress,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(_backendInitUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'order_id': orderId,
          'amount': amount,
          'currency': 'BDT',
          'customer_name': customerName,
          'customer_phone': customerPhone,
          'customer_address': customerAddress,
          // Backend will embed STORE_ID, STORE_PASSWD, success_url, fail_url, cancel_url
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['status'] == 'SUCCESS') {
          return SSLCommerzSession(
            sessionKey: data['sessionkey'] as String,
            gatewayPageUrl: data['GatewayPageURL'] as String,
          );
        }
      }
    } catch (e) {
      // Log error
    }
    return null;
  }

  /// Step 2: Validate the transaction after SSLCommerz IPN fires.
  /// Called by the BACKEND webhook receiver; exposed here for mobile-side order confirmation polling.
  Future<bool> validateTransaction(String valId, double expectedAmount) async {
    try {
      final response = await http.post(
        Uri.parse(_backendValidateUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'val_id': valId,
          'expected_amount': expectedAmount,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        // Backend returns VALID or INVALID after checking with SSLCommerz API
        return data['result'] == 'VALID';
      }
    } catch (e) {
      // Log error
    }
    return false;
  }
}

class SSLCommerzSession {
  final String sessionKey;
  final String gatewayPageUrl;

  const SSLCommerzSession({
    required this.sessionKey,
    required this.gatewayPageUrl,
  });
}
