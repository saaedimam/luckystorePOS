import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/network/network_config.dart';
import '../../core/utils/result.dart';
import '../../core/utils/sync_constants.dart';
import '../../core/utils/app_utils.dart';
import '../../core/errors/exceptions.dart';
import '../../core/db/database_config.dart';
import '../db/drift_database.dart';
import '../db/tables.dart';
import '../../models/sale_transaction_snapshot.dart';

/// Sync engine for managing offline-to-online synchronization
class SyncEngine {
  final DatabaseHelper _dbHelper;
  final http.Client _client;
  final StreamController<SyncStatusEvent> _statusController;
  
  bool _isSyncing = false;
  int? _syncOperationId;

  SyncEngine({
    required DatabaseHelper dbHelper,
    http.Client? client,
  })  : _dbHelper = dbHelper,
        _client = client ?? http.Client(),
        _statusController = StreamController<SyncStatusEvent>.broadcast();

  // Stream of sync status events
  Stream<SyncStatusEvent> get statusStream => _statusController.stream;

  bool get isSyncing => _isSyncing;

  /// Start the sync engine
  Future<void> initialize() async {
    Logger.info('SyncEngine starting');
    
    // Check network connectivity and trigger sync if online
    final isConnected = await checkConnectivity();
    if (isConnected) {
      final pendingCount = await _dbHelper.getPendingCount();
      if (pendingCount.isSuccess && pendingCount.data > 0) {
        scheduleSync();
      }
    }
  }

  /// Check network connectivity
  Future<bool> checkConnectivity() async {
    try {
      final response = await _client
          .get(Uri.parse(NetworkConfig.supabaseUrl))
          .timeout(Duration(seconds: NetworkConfig.connectionTimeout));
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      Logger.warning('Connectivity check failed: $e');
      return false;
    }
  }

  /// Trigger immediate sync
  void sync() {
    if (_isSyncing) {
      Logger.warning('Sync already in progress');
      return;
    }
    
    scheduleSync();
  }

  /// Schedule sync with retry logic
  void scheduleSync({Duration delay = const Duration(seconds: 30)}) {
    Timer(delay, () {
      if (!_isSyncing) {
        sync();
      }
    });
  }

  /// Perform full sync cycle
  Future<Result<void>> syncAll() async {
    if (_isSyncing) {
      return Failure<void>('Sync already in progress');
    }

    try {
      _isSyncing = true;
      _broadcastStatus(SyncStatusEvent(SyncStatus.inProgress));

      // Clear failed retry counts
      await clearRetryCounts();

      // Sync pending sales first (highest priority)
      final saleResult = await syncPendingSales();
      if (saleResult.isFailure) {
        Logger.error('SyncEngine: Failed to sync sales', saleResult.data);
      }

      // Sync other queue items
      final queueResult = await syncSyncQueue();
      if (queueResult.isFailure) {
        Logger.error('SyncEngine: Failed to sync queue', queueResult.data);
      }

      _broadcastStatus(SyncStatusEvent(SyncStatus.completed));
      return Success<void>(null);
    } catch (e, stackTrace) {
      Logger.error('SyncEngine.syncAll failed', e, stackTrace);
      _broadcastStatus(SyncStatusEvent(SyncStatus.error, error: e.toString()));
      return Failure<void>('Sync failed: $e');
    } finally {
      _isSyncing = false;
    }
  }

  /// Sync pending sales from local database
  Future<Result<void>> syncPendingSales() async {
    try {
      Logger.info('SyncEngine: Starting sale sync');

      // Get pending sales for sync
      final salesResult = await _dbHelper.getSalesForSync(QueryLimits.syncQueueBatchSize);
      
      if (salesResult.isFailure) {
        return Failure<void>('Failed to get pending sales: ${salesResult.data}');
      }

      final sales = salesResult.data;
      
      if (sales.isEmpty) {
        Logger.info('SyncEngine: No pending sales to sync');
        return Success<void>(null);
      }

      for (final sale in sales) {
        try {
          // Update status to retrying
          await _dbHelper.updateSaleSyncStatus(
            sale.id,
            'retrying',
            error: sale.error,
          );

          // Prepare sale for API
          final saleData = await prepareSaleForSync(sale);

          // Try to sync
          final syncResult = await _uploadSaleToServer(saleData);

          if (syncResult.isSuccess) {
            // Mark as synced
            await _dbHelper.updateSaleSyncStatus(sale.id, 'synced');
            
            // Add to sync queue for item sync
            for (final item in saleData.items) {
              await registerSyncItem(
                sale.id,
                item.productId,
                item.quantity,
                OperationType.update,
              );
            }
          } else {
            // Log error and retry later
            final retryCount = sale.retryCount + 1;
            await _dbHelper.updateSaleSyncStatus(
              sale.id,
              retryCount >= SyncConstants.maxRetryAttempts ? 'failed' : 'retrying',
              error: syncResult.data,
            );

            if (retryCount >= SyncConstants.maxRetryAttempts) {
              Logger.warning(
                'SyncEngine: Sale ${sale.id} failed after $retryCount attempts',
              );
            } else {
              // Schedule retry with exponential backoff
              scheduleRetrySync(
                sale.id,
                sale.error ?? 'Sync failed',
                retryCount,
              );
            }
          }
        } catch (e, stackTrace) {
          Logger.error(
            'SyncEngine: Sync sale failed',
            e,
            stackTrace,
          );
        }
      }

      // Cleanup synced sales
      await _dbHelper.cleanUpSyncedSales();

      return Success<void>(null);
    } catch (e, stackTrace) {
      Logger.error('SyncEngine.syncPendingSales failed', e, stackTrace);
      return Failure<void>('Failed to sync sales: $e');
    }
  }

  /// Prepare sale for sync
  Future<Map<String, dynamic>> prepareSaleForSync(OfflineSale sale) async {
    try {
      // Get sale items
      final itemsResult = await _dbHelper.getSaleItems(sale.id);
      
      if (itemsResult.isFailure) {
        throw Exception('Failed to get sale items');
      }

      final items = itemsResult.data;

      // Build sale data
      final saleData = {
        'store_id': sale.storeId,
        'order_id': sale.orderId,
        'cashier_id': sale.cashierId,
        'customer_id': sale.customerId,
        'total_amount': sale.totalAmount,
        'payment_amount': sale.paymentAmount,
        'change_amount': sale.changeAmount,
        'payment_mode': sale.paymentMode,
        'payment_reference': sale.paymentReference,
        'sale_time': sale.saleTime.toIso8601String(),
        'item_count': sale.itemCount,
        'idempotency_key': sale.id, // Prevent duplicate uploads
        'items': items.map((item) => {
          'product_id': item.productId,
          'product_name': item.productName,
          'quantity': item.quantity,
          'price': item.price,
          'discount': item.discount,
          'total': item.total,
          'barcode': item.barcode,
        }).toList(),
      };

      return saleData;
    } catch (e) {
      Logger.error('SyncEngine.prepareSaleForSync failed', e);
      rethrow;
    }
  }

  /// Upload sale to server
  Future<Result<void>> _uploadSaleToServer(Map<String, dynamic> saleData) async {
    try {
      final url = Uri.parse(
        '${NetworkConfig.supabaseUrl}/functions/v1/create-sale',
      );

      final headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${NetworkConfig.supabaseAnonKey}',
        'apikey': NetworkConfig.supabaseAnonKey,
      };

      final response = await _client
          .post(url, headers: headers, body: jsonEncode(saleData))
          .timeout(Duration(seconds: NetworkConfig.requestTimeout));

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final serverSaleId = data['success']['sale_id'];
        Logger.info('SyncEngine: Sale synced successfully to server: $serverSaleId');
        return Success<void>(null);
      } else {
        final error = jsonDecode(response.body);
        return Failure<void>(error['error'] ?? 'Server rejected sale');
      }
    } catch (e) {
      return Failure<void>('Network error: ${e.toString()}');
    }
  }

  /// Sync sync queue entries
  Future<Result<void>> syncSyncQueue() async {
    try {
      // Get pending sync queue entries
      final entriesResult = await _dbHelper.getPendingEntries(QueryLimits.syncQueueBatchSize);
      
      if (entriesResult.isFailure) {
        return Failure<void>('Failed to get sync queue entries: ${entriesResult.data}');
      }

      final entries = entriesResult.data;
      
      for (final entry in entries) {
        // Update status to retrying
        await _dbHelper.markEntryAsSynced(entry.id, error: null);

        // Process based on operation type
        switch (entry.operationType) {
          case OperationType.create:
            await _syncCreate(entry);
            break;
          case OperationType.update:
            await _syncUpdate(entry);
            break;
          case OperationType.delete:
            await _syncDelete(entry);
            break;
        }
      }

      return Success<void>(null);
    } catch (e) {
      return Failure<void>('Failed to sync queue: $e');
    }
  }

  /// Sync create operation
  Future<void> _syncCreate(SyncQueueEntry entry) async {
    try {
      final data = jsonDecode(utf8.decode(entry.rawData));
      final tableName = entry.tableName;
      
      // TODO: Implement table-specific create logic
      Logger.info('SyncEngine: Create operation for $tableName');
      
      await _dbHelper.markEntryAsSynced(entry.id);
    } catch (e) {
      Logger.error('SyncEngine._syncCreate failed', e);
      await _dbHelper.markEntryAsSynced(entry.id, error: e.toString());
    }
  }

  /// Sync update operation
  Future<void> _syncUpdate(SyncQueueEntry entry) async {
    try {
      final data = jsonDecode(utf8.decode(entry.rawData));
      final tableName = entry.tableName;
      
      // TODO: Implement table-specific update logic
      Logger.info('SyncEngine: Update operation for $tableName');
      
      await _dbHelper.markEntryAsSynced(entry.id);
    } catch (e) {
      Logger.error('SyncEngine._syncUpdate failed', e);
      await _dbHelper.markEntryAsSynced(entry.id, error: e.toString());
    }
  }

  /// Sync delete operation
  Future<void> _syncDelete(SyncQueueEntry entry) async {
    try {
      final data = jsonDecode(utf8.decode(entry.rawData));
      final tableName = entry.tableName;
      
      // TODO: Implement table-specific delete logic
      Logger.info('SyncEngine: Delete operation for $tableName');
      
      await _dbHelper.markEntryAsSynced(entry.id);
    } catch (e) {
      Logger.error('SyncEngine._syncDelete failed', e);
      await _dbHelper.markEntryAsSynced(entry.id, error: e.toString());
    }
  }

  /// Register a sync item after sale is synced
  Future<void> registerSyncItem(
    String saleId,
    String productId,
    int quantity,
    OperationType operationType,
  ) async {
    // TODO: Implement sync item registration
    Logger.info('Register sync item: $productId, qty: $quantity, type: $operationType');
  }

  /// Clear retry counts for all entries
  Future<void> clearRetryCounts() async {
    try {
      await db.transaction(() async {
        await db.update(db.offlineSales).map((table) {
          table.retryCount = 0;
        }).where((t) => t.id.equalsAll(
          db.offlineSales.select(db.offlineSales.id)
              .where((t) => t.retryCount.isNotNull()),
        )).go();
      });
    } catch (e) {
      Logger.warning('Clear retry counts failed: $e');
    }
  }

  /// Schedule retry sync for a sale
  void scheduleRetrySync(String saleId, String error, int retryCount) {
    final delay = Duration(
      seconds: (retryCount * SyncConstants.initialRetryDelay).toInt(),
    ).clamp(
      Duration.zero,
      Duration(seconds: SyncConstants.maxRetryDelay),
    );
    
    _scheduleDelay(() {
      _isSyncing = false; // Allow next sync attempt
      scheduleSync(delay: delay);
    }, delay.inMilliseconds);
  }

  /// Schedule delayed operation
  void _scheduleDelay(Function callback, int delayMs) {
    Timer(Duration(milliseconds: delayMs), callback);
  }

  /// Broadcast status update
  void _broadcastStatus(SyncStatusEvent event) {
    if (!_statusController.isClosed) {
      _statusController.add(event);
    }
  }

  /// Listen to status stream
  StreamSubscription<SyncStatusEvent>? listenToStatus(
    void Function(SyncStatusEvent event) onData, {
    Function? onError,
    VoidCallback? onDone,
    bool? listenImmediately,
  }) {
    return _statusController.stream.listen(
      onData,
      onError: onError,
      onDone: onDone,
      listenImmediately: listenImmediately ?? true,
    );
  }

  /// Dispose resources
  void dispose() {
    _syncOperationId = null;
    _statusController.close();
    _client.close();
  }
}

/// Operation types for sync queue
enum OperationType {
  create,
  update,
  delete,
}

extension OperationTypeExtensions on OperationType {
  int get value {
    switch (this) {
      case OperationType.create:
        return 1;
      case OperationType.update:
        return 2;
      case OperationType.delete:
        return 3;
    }
  }
}

/// Sync status
enum SyncStatus {
  idle,
  inProgress,
  completed,
  error,
}

/// Sync status event
class SyncStatusEvent {
  final SyncStatus status;
  final String? error;
  final int? progress; // 0-100 progress indication

  const SyncStatusEvent(
    this.status, {
    this.error,
    this.progress,
  });

  bool get isSyncing => status == SyncStatus.inProgress;
  bool get isComplete => status == SyncStatus.completed;
  bool get hasError => status == SyncStatus.error;
}

/// Check connection utility
class ConnectivityChecker {
  final http.Client _client;

  ConnectivityChecker({http.Client? client}) 
      : _client = client ?? http.Client();

  Future<bool> checkOnline() async {
    try {
      final response = await _client
          .get(Uri.parse(NetworkConfig.supabaseUrl))
          .timeout(Duration(seconds: NetworkConfig.connectionTimeout));
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      Logger.debug('Online check failed: $e');
      return false;
    }
  }

  void dispose() {
    _client.close();
  }
}
