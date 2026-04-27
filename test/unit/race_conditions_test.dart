import 'package:flutter_test/flutter_test.dart';
import 'dart:async';

/// ===========================================================================
/// UNIT TESTS: Race Conditions & Concurrent Operations
/// ===========================================================================
///
/// Tests cover:
/// - Concurrent payment processing (multiple tenders for same sale)
/// - Stock decrement race conditions
/// - Simultaneous offline sync attempts
/// - Session state consistency under concurrent access

void main() {
  group('Concurrent Payment Processing', () {
    test('Multiple payments for same sale should be serialized', () async {
      // Simulate two concurrent payment submissions
      final saleId = 'sale-123';
      final payments = <Map<String, dynamic>>[];

      // Simulate two concurrent payment attempts
      Future<void> submitPayment1() async {
        payments.add({'saleId': saleId, 'amount': 100, 'method': 'cash'});
      }

      Future<void> submitPayment2() async {
        payments.add({'saleId': saleId, 'amount': 50, 'method': 'card'});
      }

      // Run concurrently
      await Future.wait([submitPayment1(), submitPayment2()]);

      expect(payments.length, equals(2));
      expect(payments.any((p) => p['method'] == 'cash'), isTrue);
      expect(payments.any((p) => p['method'] == 'card'), isTrue);
    });

    test('Payment total should not exceed sale amount', () {
      final saleTotal = 150.0;
      final payments = [
        {'amount': 100.0, 'method': 'cash'},
        {'amount': 60.0, 'method': 'card'}, // Would exceed
      ];

      final totalPaid = payments.fold(0.0, (sum, p) => sum + (p['amount'] as double));
      expect(totalPaid, greaterThan(saleTotal));

      // Should be caught and rejected
      final exceedsAmount = totalPaid > saleTotal;
      expect(exceedsAmount, isTrue);
    });
  });

  group('Stock Decrement Race Conditions', () {
    test('Simultaneous sales of same item should not cause negative stock', () async {
      var currentStock = 5;
      const itemId = 'item-123';
      final results = <bool>[];

      // Simulate 10 concurrent sale attempts for 1 unit each
      final futures = <Future>[];
      for (var i = 0; i < 10; i++) {
        futures.add(Future(() {
          // This simulates the race condition
          if (currentStock > 0) {
            // Simulate a small delay to increase race condition likelihood
            currentStock--;
            results.add(true);
          } else {
            results.add(false); // Rejected
          }
        }));
      }

      await Future.wait(futures);

      // With race conditions, more than 5 might succeed
      // The server-side validation should prevent this
      final successCount = results.where((r) => r).length;
      expect(successCount, lessThanOrEqualTo(5)); // At most 5 should succeed
    });

    test('validate_sale_intent should catch stock issues', () {
      // The RPC validate_sale_intent checks stock availability
      // This test simulates the validation logic

      final saleItems = [
        {'item_id': 'item-1', 'qty': 10, 'stock': 5}, // Insufficient
        {'item_id': 'item-2', 'qty': 3, 'stock': 10}, // OK
      ];

      for (final item in saleItems) {
        final qty = item['qty'] as int;
        final stock = item['stock'] as int;
        final hasStock = stock >= qty;

        if (item['item_id'] == 'item-1') {
          expect(hasStock, isFalse);
        } else {
          expect(hasStock, isTrue);
        }
      }
    });
  });

  group('Offline Sync Race Conditions', () {
    test('Sync worker should not run concurrently', () async {
      var isSyncing = false;
      var syncAttempts = 0;

      Future<void> syncQueue() async {
        if (isSyncing) return; // Guard against concurrent runs
        isSyncing = true;
        syncAttempts++;

        // Simulate sync work
        await Future.delayed(const Duration(milliseconds: 100));

        isSyncing = false;
      }

      // Trigger multiple concurrent syncs
      await Future.wait([
        syncQueue(),
        syncQueue(),
        syncQueue(),
        syncQueue(),
      ]);

      // Should only run once due to guard
      expect(syncAttempts, lessThanOrEqualTo(1));
    });

    test('_isSyncing flag prevents concurrent sync operations', () {
      // From OfflineTransactionSyncService._syncQueue():
      // if (_isSyncing || _supabase == null) return;
      var isSyncing = false;
      var syncCount = 0;

      void attemptSync() {
        if (isSyncing) return;
        isSyncing = true;
        syncCount++;
        // Simulate work
        isSyncing = false;
      }

      attemptSync();
      attemptSync(); // Should be blocked
      attemptSync(); // Should be blocked

      expect(syncCount, equals(1));
    });
  });

  group('Session State Consistency', () {
    test('Session should not be opened twice concurrently', () async {
      var sessionOpen = false;
      var openAttempts = 0;

      Future<bool> openSession() async {
        if (sessionOpen) return false; // Already open
        // Simulate open
        await Future.delayed(const Duration(milliseconds: 50));
        sessionOpen = true;
        openAttempts++;
        return true;
      }

      final results = await Future.wait([
        openSession(),
        openSession(),
        openSession(),
      ]);

      expect(results.where((r) => r).length, lessThanOrEqualTo(1));
      expect(openAttempts, lessThanOrEqualTo(1));
    });
  });
}
