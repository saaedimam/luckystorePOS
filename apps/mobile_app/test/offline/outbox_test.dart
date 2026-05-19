import 'dart:io';
import 'dart:async';
import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:path_provider_platform_interface/path_provider_platform_interface.dart';
import 'package:plugin_platform_interface/plugin_platform_interface.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'package:lucky_store/offline/db.dart';
import 'package:lucky_store/offline/sync_action_audit_log.dart';
import 'package:lucky_store/offline/background_sync_service.dart';
import 'package:lucky_store/features/inventory/inventory_service.dart';

class MockSupabaseClient extends Mock implements SupabaseClient {}

class MockPathProvider extends Mock
    with MockPlatformInterfaceMixin
    implements PathProviderPlatform {
  final String tempPath;
  MockPathProvider(this.tempPath);

  @override
  Future<String?> getApplicationDocumentsPath() async => tempPath;
  @override
  Future<String?> getApplicationSupportPath() async => tempPath;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    registerFallbackValue(Uri.parse('https://example.com'));
    await dotenv.load(fileName: 'assets/app.env');
  });

  late String tempDirPath;
  late OfflineDatabase database;
  late MockSupabaseClient mockSupabase;
  late SyncActionAuditLog auditLog;
  late BackgroundSyncService syncService;

  setUp(() async {
    tempDirPath = Directory.systemTemp.createTempSync('p10_outbox_').path;
    PathProviderPlatform.instance = MockPathProvider(tempDirPath);

    // Initial database boot
    database = OfflineDatabase();
    mockSupabase = MockSupabaseClient();
    auditLog = SyncActionAuditLog(database);
    syncService = BackgroundSyncService(database, mockSupabase);

    // Make sure we start with a clean slate
    await database.clearAllTransactions();
  });

  tearDown(() async {
    await database.close();
    if (Directory(tempDirPath).existsSync()) {
      Directory(tempDirPath).deleteSync(recursive: true);
    }
  });

  group('Offline Transaction Outbox & Stitch Alerting Bridge Tests', () {
    test('Scenario S1: Record Pending stock deduction offline', () async {
      // 1. Configure SyncService to be offline
      syncService.setOnlineStatus(false);
      expect(syncService.isOnline, false);

      // 2. Queue transaction via SyncActionAuditLog
      final payload = {
        'store_id': 'store-123',
        'product_id': 'prod-456',
        'quantity': 10,
      };

      await auditLog.recordPendingAction(
        actionType: 'DEDUCT_STOCK',
        payload: payload,
        idempotencyKey: 'idemp-key-1',
      );

      // 3. Verify it is recorded as PENDING in database
      final pending = await database.getPendingTransactions();
      expect(pending.length, 1);
      expect(pending.first.actionType, 'DEDUCT_STOCK');
      expect(pending.first.status, TransactionStatus.pending);
      expect(pending.first.retryCount, 0);
    });

    test('Scenario S2: Offline drain does not execute remote calls', () async {
      syncService.setOnlineStatus(false);

      final payload = {
        'store_id': 'store-123',
        'product_id': 'prod-456',
        'quantity': 10,
      };

      await auditLog.recordPendingAction(
        actionType: 'DEDUCT_STOCK',
        payload: payload,
        idempotencyKey: 'idemp-key-2',
      );

      // Try draining outbox
      await syncService.drainOutbox();

      // Verify no RPC called and status is still pending
      verifyNever(() => mockSupabase.rpc(any(), params: any(named: 'params')));
      final pending = await database.getPendingTransactions();
      expect(pending.length, 1);
      expect(pending.first.status, TransactionStatus.pending);
    });

    test('Scenario S3: Online transition triggers outbox drain & RPC execution', () async {
      final payload = {
        'store_id': 'store-123',
        'product_id': 'prod-456',
        'quantity': 10,
      };

      await auditLog.recordPendingAction(
        actionType: 'DEDUCT_STOCK',
        payload: payload,
        idempotencyKey: 'idemp-key-3',
      );

      // Mock successful remote RPC call
      when(() => mockSupabase.rpc('deduct_stock', params: any(named: 'params')))
          .thenAnswer((_) => FakePostgrestFilterBuilder(value: {'success': true}));

      // Transition online
      syncService.setOnlineStatus(true);
      expect(syncService.isOnline, true);

      // Trigger drain outbox synchronously for test verification
      await syncService.drainOutbox();

      // Verify RPC was triggered with correct params
      verify(() => mockSupabase.rpc('deduct_stock', params: any(named: 'params'))).called(1);

      // Verify transaction outbox is now empty (synced successfully)
      final pending = await database.getPendingTransactions();
      expect(pending.isEmpty, true);
    });

    test('Scenario S4: Retry limit of 5 moves transaction to Dead-Letter Queue (DLQ)', () async {
      final payload = {
        'store_id': 'store-123',
        'product_id': 'prod-456',
        'quantity': 10,
      };

      await auditLog.recordPendingAction(
        actionType: 'DEDUCT_STOCK',
        payload: payload,
        idempotencyKey: 'idemp-key-4',
      );

      // Reset mock to clean any previous stubs
      reset(mockSupabase);

      // Mock RPC to fail
      when(() => mockSupabase.rpc('deduct_stock', params: any(named: 'params')))
          .thenAnswer((_) => FakePostgrestFilterBuilder(error: Exception('Simulated network jitter')));

      // Set online and drain outbox manually to control the retry loop
      syncService.setOnlineStatus(true);

      for (int i = 0; i < 5; i++) {
        await syncService.drainOutbox();
      }

      // Verify outbox is now empty of active transactions
      final pending = await database.getPendingTransactions();
      expect(pending.isEmpty, true);

      // Verify item moved cleanly to Dead Letter Queue (DLQ)
      final dlq = await database.getDeadLetters();
      expect(dlq.length, 1);
      expect(dlq.first.eventType, 'DEDUCT_STOCK');
      expect(dlq.first.failureReason.contains('Deduction failed after 5 retries'), true);
    });
   group('InventoryService Integrated Loop', () {
      test('InventoryService records action to outbox automatically on execution', () async {
        final mockClient = MockHttpClient();
        final inventoryService = InventoryService(client: mockClient, auditLog: auditLog);

        when(() => mockClient.post(
          any(),
          headers: any(named: 'headers'),
          body: any(named: 'body'),
        )).thenAnswer((_) async => http.Response(jsonEncode({'success': true}), 200));

        final result = await inventoryService.deductStock(
          storeId: 'store-abc',
          productId: 'prod-xyz',
          quantity: 2,
        );

        expect(result.isSuccess, true);
        
        // Verify no pending transaction is left because it synced successfully right away
        final pending = await database.getPendingTransactions();
        expect(pending.isEmpty, true);
      });
    });
  });
}

class MockHttpClient extends Mock implements http.Client {}

class FakePostgrestFilterBuilder extends Fake implements PostgrestFilterBuilder<dynamic> {
  final dynamic value;
  final Object? error;

  FakePostgrestFilterBuilder({this.value, this.error});

  @override
  Future<U> then<U>(FutureOr<U> Function(dynamic) onValue, {Function? onError}) async {
    if (error != null) {
      if (onError != null) {
        try {
          return (onError as dynamic)(error!, StackTrace.empty) as FutureOr<U>;
        } catch (_) {
          return (onError as dynamic)(error!) as FutureOr<U>;
        }
      }
      throw error!;
    }
    return onValue(value);
  }
}
