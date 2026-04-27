# Lucky Store QA Test Suite - Month 2

## Overview

Comprehensive Quality Assurance test suite for the Lucky Store Month 2 systems, covering all critical transaction processing flows.

## Test Structure

```
apps/mobile_app/test/
├── unit/                       # Unit tests (6 files)
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
├── MANUAL_TEST_CHECKLIST.md   # Manual testing checklist
└── README.md                  # This file
```

## Running Tests

```bash
# Navigate to mobile app directory
cd apps/mobile_app

# Run all unit tests
flutter test test/unit/

# Run specific unit test
flutter test test/unit/duplicate_submission_test.dart

# Run integration tests
flutter test test/integration/

# Run load tests
flutter test test/load/

# Run the default widget test
flutter test test/widget_test.dart

# Run all tests
flutter test
```

## Test Categories

### 1. Duplicate Submissions
- Idempotency key generation and uniqueness
- Offline queue duplicate detection
- RPC-level idempotency
- Invoice duplicate protection

### 2. Race Conditions
- Concurrent sales of same item
- Simultaneous payment processing
- Offline sync guard clauses
- Session state consistency

### 3. Concurrent Payments
- Split payments across methods
- Overpayment handling
- Exact payment flow
- Change calculation

### 4. Overdue Calculations
- Days overdue accuracy
- Aging buckets (0-30, 31-60, 61-90, 90+)
- Balance from ledger entries
- Promise to pay handling

### 5. Wrong Cost Inputs
- Negative cost rejection
- Zero cost handling
- Large cost validation
- Decimal precision (4 places)

### 6. Negative Stock
- Sales exceeding stock
- Negative quantity handling
- Stock validation before sale

### 7. Offline Queue Replay
- Queue persistence (JSON save/load)
- Exponential backoff retry
- Conflict detection
- State transitions

### 8. Statement Accuracy
- Double-entry bookkeeping
- Running balance
- Debit/credit display
- Void reversals

### 9. Performance & Load
- Large inventory search (1000+ items)
- Customer reports (500+ customers)
- Ledger display (1000+ entries)
- Offline queue (500+ transactions)

### 10. Manual Testing
See `MANUAL_TEST_CHECKLIST.md` for 60+ manual scenarios.

## Dependencies

The tests use only built-in Dart test libraries. No external mock libraries are currently required.

## Notes

- **Unit tests**: Pure Dart logic, no Flutter widget dependencies
- **Integration tests**: Cross-component flows, mock Supabase where needed
- **Load tests**: Performance benchmarks with Stopwatch timing
- **Manual tests**: Human-verified UI flows

## Expected Output

```bash
00:00 +1: loading test/widget_test.dart
00:01 +1: All tests passed!
```

Each test file should output its timing metrics (load tests) for monitoring performance regressions.
