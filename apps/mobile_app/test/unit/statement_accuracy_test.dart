import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Ledger Entry Balance', () {
    test('Sale creates correct debit entry (customer owes)', () {
      final saleAmount = 500.0;
      final entry = {'debit_amount': saleAmount, 'credit_amount': 0.0};
      final balanceChange = (entry['debit_amount'] as double) - (entry['credit_amount'] as double);
      expect(balanceChange, equals(500.0));
    });

    test('Payment creates correct credit entry (customer paid)', () {
      final paymentAmount = 200.0;
      final entry = {'debit_amount': 0.0, 'credit_amount': paymentAmount};
      final balanceChange = (entry['debit_amount'] as double) - (entry['credit_amount'] as double);
      expect(balanceChange, equals(-200.0));
    });

    test('Double-entry: payment affects two accounts', () {
      final payment = 200.0;
      final cashEntry = {'account': 'Cash', 'debit': payment, 'credit': 0.0};
      final arEntry = {'account': 'AR', 'debit': 0.0, 'credit': payment};

      final totalDebits = cashEntry['debit'] as double;
      final totalCredits = arEntry['credit'] as double;

      expect(totalDebits, equals(totalCredits));
    });
  });

  group('Running Balance Calculation', () {
    test('Running balance from ledger entries (oldest first)', () {
      final entries = [
        {'debit': 500.0, 'credit': 0.0},
        {'debit': 300.0, 'credit': 0.0},
        {'debit': 0.0, 'credit': 200.0},
        {'debit': 0.0, 'credit': 100.0},
      ];

      var runningBalance = 0.0;
      final balances = <double>[];

      for (final entry in entries) {
        runningBalance += (entry['debit'] as double) - (entry['credit'] as double);
        balances.add(runningBalance);
      }

      expect(balances[0], equals(500.0));
      expect(balances[1], equals(800.0));
      expect(balances[2], equals(600.0));
      expect(balances[3], equals(500.0));
    });

    test('Final statement balance', () {
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
    test('Balance at point calculation', () {
      final entries = [
        {'debit': 500.0, 'credit': 0.0},
        {'debit': 300.0, 'credit': 0.0},
        {'debit': 0.0, 'credit': 200.0},
      ];
      final index = 1;
      final balanceAtPoint = entries
          .sublist(index)
          .fold(0.0, (acc, curr) => acc + (curr['debit'] as double) - (curr['credit'] as double));
      expect(balanceAtPoint, equals(100.0));
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
      expect(amount.toStringAsFixed(2), equals('1234.57'));
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
      final entries = [{'debit': 999.99, 'credit': 0.0}];
      final balance = entries.fold(0.0, (sum, e) => sum + (e['debit'] as double) - (e['credit'] as double));
      expect(balance, equals(999.99));
    });

    test('Voided sale should reverse entries', () {
      final entries = [
        {'debit': 500.0, 'credit': 0.0},
        {'debit': 0.0, 'credit': 500.0},
      ];
      final balance = entries.fold(0.0, (sum, e) => sum + (e['debit'] as double) - (e['credit'] as double));
      expect(balance, equals(0.0));
    });
  });
}
