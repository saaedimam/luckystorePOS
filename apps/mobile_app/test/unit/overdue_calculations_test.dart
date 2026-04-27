import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Days Overdue Calculation', () {
    test('Calculate days overdue from last credit sale date', () {
      final lastCreditSale = DateTime(2026, 3, 1);
      final currentDate = DateTime(2026, 4, 27);
      final daysOverdue = currentDate.difference(lastCreditSale).inDays;
      expect(daysOverdue, equals(57));
    });

    test('Future credit sale date should return 0 days overdue', () {
      final lastCreditSale = DateTime(2026, 5, 1);
      final currentDate = DateTime(2026, 4, 27);
      final daysOverdue = currentDate.difference(lastCreditSale).inDays;
      final effectiveDays = daysOverdue > 0 ? daysOverdue : 0;
      expect(effectiveDays, equals(0));
    });

    test('Null last credit sale date returns 0 days', () {
      final lastCreditSale = null;
      final daysOverdue = lastCreditSale != null
          ? DateTime.now().difference(lastCreditSale).inDays
          : 0;
      expect(daysOverdue, equals(0));
    });
  });

  group('Aging Bucket Classification', () {
    test('0-30 days bucket', () { expect(_getAgingBucket(15), equals('0-30')); });
    test('31-60 days bucket', () { expect(_getAgingBucket(45), equals('31-60')); });
    test('61-90 days bucket', () { expect(_getAgingBucket(75), equals('61-90')); });
    test('90+ days bucket', () { expect(_getAgingBucket(120), equals('90+')); });

    test('Edge cases at bucket boundaries', () {
      expect(_getAgingBucket(0), equals('Current'));
      expect(_getAgingBucket(30), equals('0-30'));
      expect(_getAgingBucket(31), equals('31-60'));
      expect(_getAgingBucket(60), equals('31-60'));
      expect(_getAgingBucket(61), equals('61-90'));
      expect(_getAgingBucket(90), equals('61-90'));
      expect(_getAgingBucket(91), equals('90+'));
    });
  });

  group('Balance Due Calculation', () {
    test('Balance from debit/credit ledger entries', () {
      final entries = [
        {'debit': 500.0, 'credit': 0.0},
        {'debit': 300.0, 'credit': 0.0},
        {'debit': 0.0, 'credit': 200.0},
      ];
      final balance = entries.fold(0.0, (sum, e) => sum + (e['debit'] as double) - (e['credit'] as double));
      expect(balance, equals(600.0));
    });

    test('Zero balance when fully paid', () {
      final entries = [
        {'debit': 500.0, 'credit': 0.0},
        {'debit': 0.0, 'credit': 500.0},
      ];
      final balance = entries.fold(0.0, (sum, e) => sum + (e['debit'] as double) - (e['credit'] as double));
      expect(balance, equals(0.0));
    });

    test('Negative balance (overpaid) should not appear in receivables', () {
      final balance = -50.0;
      final isOverdue = balance > 0;
      expect(isOverdue, isFalse);
    });
  });

  group('Promise to Pay Date Handling', () {
    test('Promise date in future is valid', () {
      final promiseDate = DateTime(2026, 5, 15);
      final now = DateTime(2026, 4, 27);
      expect(promiseDate.isAfter(now), isTrue);
    });

    test('Promise date in past indicates broken promise', () {
      final promiseDate = DateTime(2026, 3, 1);
      final now = DateTime(2026, 4, 27);
      expect(promiseDate.isBefore(now), isTrue);
      expect(now.difference(promiseDate).inDays, greaterThan(0));
    });

    test('Null promise date is handled', () {
      final promiseDate = null;
      final isPromiseActive = promiseDate != null && promiseDate.isAfter(DateTime.now());
      expect(isPromiseActive, isFalse);
    });
  });
}

String _getAgingBucket(int days) {
  if (days <= 0) return 'Current';
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}
