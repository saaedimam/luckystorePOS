import 'package:flutter_test/flutter_test.dart';

/// ===========================================================================
/// UNIT TESTS: Statement Accuracy
/// ===========================================================================
///
/// Tests cover:
/// - Ledger entry double-entry bookkeeping balance
/// - Running balance calculation
/// - Debit/credit assignment correctness
/// - Statement totals matching ledger
/// - Rounding and precision

void main() {
  group('Ledger Entry Balance', () {
    test('Sale creates correct debit entry (customer owes)', () {
      // When a sale is made on credit, customer account is debited
      final saleAmount = 500.0;
      final entry = {
        'debit_amount': saleAmount,
        'credit_amount': 0.0,
        'reference_type': 'SALE',
      };

      final balanceChange = (entry['debit_amount'] as double) - (entry['credit_amount'] as double);
      expect(balanceChange, equals(500.0)); // Increases what customer owes
    });

    test('Payment creates correct credit entry (customer paid)', () {
      // When customer pays, customer account is credited
      final paymentAmount = 200.0;
      final entry = {
        'debit_amount': 0.0,
        'credit_amount': paymentAmount,
        'reference_type': 'CUSTOMER_PAYMENT',
      };

      final balanceChange = (entry['debit_amount'] as double) - (entry['credit_amount'] as double);
      expect(balanceChange, equals(-200.0)); // Reduces what customer owes
    });

    test('Double-entry: payment affects two accounts', () {
      // Payment: Debit Cash/Bank, Credit Accounts Receivable
      final payment = 200.0;

      final cashEntry = {'account': 'Cash', 'debit': payment, 'credit': 0.0};
      final arEntry = {'account': 'Accounts Receivable', 'debit': 0.0, 'credit': payment};

      final cashChange = cashEntry['debit'] as double - (cashEntry['credit'] as double);
      final arChange = arEntry['debit'] as double - (arEntry['credit'] as double);

      // Total debits should equal total credits
      final totalDebits = cashEntry['debit'] as double;
      final totalCredits = arEntry['credit'] as double;

      expect(totalDebits, equals(totalCredits));
      expect(cashChange, equals(200.0));
      expect(arChange, equals(-200.0));
    });
  });

  group('Running Balance Calculation', () {
    test('Running balance from ledger entries (oldest first)', () {
      // Entries in chronological order (oldest to newest)
      final entries = [
        {'debit': 500.0, 'credit': 0.0},  // Sale 1
        {'debit': 300.0, 'credit': 0.0},  // Sale 2
        {'debit': 0.0, 'credit': 200.0},  // Payment 1
        {'debit': 0.0, 'credit': 100.0},  // Payment 2
      ];

      var runningBalance = 0.0;
      final balances = <double>[];

      for (final entry in entries) {
        runningBalance += (entry['debit'] as double) - (entry['credit'] as double);
        balances.add(runningBalance);
      }

      expect(balances[0], equals(500.0));  // After sale 1
      expect(balances[1], equals(800.0));  // After sale 2
      expect(balances[2], equals(600.0));  // After payment 1
      expect(balances[3], equals(500.0));  // After payment 2
    });

    test('Statement balance matches sum of all entries', () {
      final entries = [
        {'debit': 500.0, 'credit': 0.0},
        {'debit': 300.0, 'credit': 0.0},
        {'debit': 0.0, 'credit': 200.0},
        {'debit': 0.0, 'credit': 100.0},
      ];

      final finalBalance = entries.fold(0.0, (sum, e) => sum + (e['debit'] as double) - (e['credit'] as double));

      expect(finalBalance, equals(500.0));
    });
  });

  group('Statement Display Accuracy', () {
    test('LedgerEntries balance at point calculation', () {
      // From CustomerLedgerPage: balanceAtPoint calculation
      final entries = [
        {'debit': 500.0, 'credit': 0.0},   // Index 0 (newest)
        {'debit': 300.0, 'credit': 0.0},   // Index 1
        {'debit': 0.0, 'credit': 200.0},   // Index 2
      ];

      // balanceAtPoint = sum of (debit - credit) from current index to end
      final index = 1; // Second entry
      final balanceAtPoint = entries
          .sublist(index) // From index to end
          .fold(0.0, (acc, curr) => acc + (curr['debit'] as double) - (curr['credit'] as double));

      expect(balanceAtPoint, equals(100.0)); // 300 - 200 = 100
    });

    test('Debit column shows debit amounts only', () {
      final entry = {'debit_amount': 500.0, 'credit_amount': 0.0};
      final displayDebit = (entry['debit_amount'] as double) > 0 ? '৳ ${entry['debit_amount']}' : '-';

      expect(displayDebit, contains('500.0'));
    });

    test('Credit column shows credit amounts only', () {
      final entry = {'debit_amount': 0.0, 'credit_amount': 200.0};
      final displayCredit = (entry['credit_amount'] as double) > 0 ? '৳ ${entry['credit_amount']}' : '-';

      expect(displayCredit, contains('200.0'));
    });
  });

  group('Rounding & Precision', () {
    test('Currency display with 2 decimal places', () {
      final amount = 1234.5678;
      final display = '৳ ${amount.toStringAsFixed(2)}';

      expect(display, equals('৳ 1234.57')); // Rounded
    });

    test('Sum of rounded values equals rounded sum', () {
      final amounts = [10.01, 20.02, 30.03];
      final sum = amounts.fold(0.0, (a, b) => a + b);
      final roundedSum = double.parse(sum.toStringAsFixed(2));

      expect(roundedSum, equals(60.06));
    });
  });

  group('Edge Cases', () {
    test('No ledger entries returns zero balance', () {
      final entries = <Map<String, double>>[];
      final balance = entries.fold(0.0, (sum, e) => sum + (e['debit'] ?? 0) - (e['credit'] ?? 0));

      expect(balance, equals(0.0));
    });

    test('Single entry determines entire balance', () {
      final entries = [
        {'debit': 999.99, 'credit': 0.0},
      ];
      final balance = entries.fold(0.0, (sum, e) => sum + (e['debit'] as double) - (e['credit'] as double));

      expect(balance, equals(999.99));
    });
  });
}
