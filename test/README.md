# Lucky Store Month 2 - QA Test Suite

## Overview

Comprehensive QA test suite for Lucky Store Month 2 systems, covering:

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - Cross-component interaction testing  
3. **Load Tests** - Performance under large datasets
4. **Manual Checklist** - Human-verified scenarios

## Test Categories

### 1. Duplicate Submissions
- Idempotency key generation and uniqueness
- Offline queue duplicate detection
- RPC-level idempotency (record_sale, record_customer_payment, record_purchase_v2)
- Re-submission safety

### 2. Race Conditions & Concurrent Operations
- Concurrent payment processing
- Stock decrement race conditions
- Simultaneous offline sync attempts
- Session state consistency

### 3. Concurrent Payments
- Split payment handling (multiple methods)
- Overpayment handling
- Exact payment flow
- Change calculation accuracy

### 4. Overdue Calculations
- Days overdue accuracy
- Aging buckets (0-30, 31-60, 61-90, 90+)
- Balance due from ledger entries
- Promise to pay date handling

### 5. Wrong Cost Inputs
- Negative cost rejection
- Zero cost handling
- Large cost validation
- Cost precision (4 decimal places)

### 6. Negative Stock Attempts
- Sale exceeding stock
- Negative quantity handling
- Zero quantity rejection
- Stock validation before sale

### 7. Offline Queue Replay
- Queue persistence (save/load)
- Failed sync retry with exponential backoff
- Conflict detection and handling
- Queue state transitions
- Large queue replay (50+ items)

### 8. Statement Accuracy
- Ledger double-entry balance
- Running balance calculation
- Debit/credit column display
- Voided sale reversal

### 9. Large Dataset Performance
- Inventory search (1000+ items)
- Customer list (500+ customers)
- Ledger display (1000+ entries)
- Offline queue with 500 items

## File Structure

```
test/
├── unit/
│   ├── duplicate_submission_test.dart
│   ├── race_conditions_test.dart
│   ├── overdue_calculations_test.dart
│   ├── stock_validation_test.dart
│   ├── offline_queue_test.dart
│   └── statement_accuracy_test.dart
├── integration/
│   └── all_systems_integration_test.dart
├── load/
│   └── load_tests.dart
└── MANUAL_TEST_CHECKLIST.md
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
flutter test test/unit/

# Run specific test file
flutter test test/unit/duplicate_submission_test.dart
flutter test test/unit/race_conditions_test.dart
flutter test test/unit/overdue_calculations_test.dart
flutter test test/unit/stock_validation_test.dart
flutter test test/unit/offline_queue_test.dart
flutter test test/unit/statement_accuracy_test.dart
```

### Integration Tests
```bash
flutter test test/integration/all_systems_integration_test.dart
```

### Load Tests
```bash
flutter test test/load/load_tests.dart
```

### All Tests
```bash
flutter test
```

## Test Coverage

| Category | Unit Tests | Integration | Load | Manual |
|----------|------------|-------------|------|--------|
| Duplicate Submissions | ✅ | ✅ | - | ✅ |
| Race Conditions | ✅ | ✅ | - | ✅ |
| Concurrent Payments | ✅ | ✅ | - | ✅ |
| Overdue Calculations | ✅ | ✅ | ✅ | ✅ |
| Wrong Cost Inputs | ✅ | - | - | ✅ |
| Negative Stock | ✅ | - | - | ✅ |
| Offline Queue | ✅ | ✅ | ✅ | ✅ |
| Statement Accuracy | ✅ | ✅ | ✅ | ✅ |
| Large Dataset | - | - | ✅ | ✅ |

## Dependencies

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  mocktail: ^1.0.0
```

## Manual Testing

See `test/MANUAL_TEST_CHECKLIST.md` for the complete manual testing checklist with 60+ test scenarios.

## Notes

- Unit tests use mocked dependencies where needed
- Integration tests verify RPC behavior and cross-component flows
- Load tests focus on performance with large datasets
- Manual tests require human verification of UI/UX flows

Generated: Month 2 QA Test Suite
Date: 2026-04-27
