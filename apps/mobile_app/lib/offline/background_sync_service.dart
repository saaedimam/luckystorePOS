import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'db.dart';

/// Service responsible for monitoring network connectivity and sequentially draining
/// the TransactionOutbox when online, handling retry strategy and Dead-Letter Queue (DLQ).
class BackgroundSyncService {
  final OfflineDatabase db;
  final SupabaseClient supabase;
  final StreamController<bool> _connectivityController;
  
  bool _isOnline = true;
  bool _isSyncing = false;
  Completer<void>? _syncCompleter;

  BackgroundSyncService(this.db, this.supabase)
      : _connectivityController = StreamController<bool>.broadcast();

  void start() {
    debugPrint('[BackgroundSyncService] Service started.');
    drainOutbox();
  }

  Stream<bool> get connectivityStream => _connectivityController.stream;
  bool get isOnline => _isOnline;
  bool get isSyncing => _isSyncing;

  /// Set the online status (used by the test suite to simulate connect/disconnect)
  void setOnlineStatus(bool online) {
    if (_isOnline != online) {
      _isOnline = online;
      _connectivityController.add(online);
      debugPrint('📶 Mobile Connectivity Status changed to: ${online ? "CONNECTED" : "DISCONNECTED"}');
      if (online) {
        drainOutbox();
      }
    }
  }

  /// Drains the outbox sequentially
  Future<void> drainOutbox() async {
    if (!_isOnline) {
      debugPrint('🔌 Cannot drain outbox: currently OFFLINE.');
      return;
    }

    if (_isSyncing) {
      return _syncCompleter?.future;
    }

    _isSyncing = true;
    _syncCompleter = Completer<void>();

    try {
      final pendingList = await db.getPendingTransactions();
      if (pendingList.isEmpty) {
        debugPrint('📦 Outbox is empty. No transactions to drain.');
        return;
      }

      debugPrint('⚡ Draining ${pendingList.length} transactions from outbox...');

      for (final tx in pendingList) {
        if (!_isOnline) {
          debugPrint('🔌 Network lost during drain operation. Halting outbox drain.');
          break;
        }
        await _syncTransaction(tx);
      }
    } catch (e) {
      debugPrint('❌ Error draining transaction outbox: $e');
    } finally {
      _isSyncing = false;
      _syncCompleter?.complete();
      _syncCompleter = null;
    }
  }

  Future<void> _syncTransaction(TransactionOutboxEntry tx) async {
    try {
      final payload = jsonDecode(tx.payload) as Map<String, dynamic>;

      String rpcName;
      if (tx.actionType == 'DEDUCT_STOCK') {
        rpcName = 'deduct_stock';
      } else if (tx.actionType == 'RESTOCK') {
        rpcName = 'increment_stock';
      } else {
        throw Exception('Unknown transaction action type: ${tx.actionType}');
      }

      debugPrint('🚀 Replaying remote RPC: $rpcName, payload: $payload');
      final response = await supabase.rpc(rpcName, params: payload);

      if (response != null && response is Map && response['error'] != null) {
        throw Exception(response['error']['message'] ?? 'RPC executed with errors');
      }

      // Success
      await db.updateTransactionStatus(tx.id, TransactionStatus.synced);
      await db.deleteTransaction(tx.id);
      debugPrint('✅ Synced outbox transaction: ${tx.id}');
    } catch (e) {
      debugPrint('⚠️ Outbox transaction sync failed: ${tx.id}. Error: $e');

      // Increment retry count
      await db.incrementTransactionRetryCount(tx.id);
      final updated = await (db.select(db.transactionOutboxes)..where((tbl) => tbl.id.equals(tx.id))).getSingleOrNull();

      if (updated != null && updated.retryCount >= 5) {
        // Move to DLQ (DeadLetterEvents) to protect battery and prevent infinite loops
        debugPrint('🚨 Transaction ${tx.id} reached retry threshold. Moving to DLQ.');
        await db.updateTransactionStatus(tx.id, TransactionStatus.failed);
        await db.into(db.deadLetterEvents).insert(DeadLetterEventsCompanion.insert(
          operationId: tx.id,
          eventType: tx.actionType,
          payload: tx.payload,
          failureReason: 'Deduction failed after 5 retries: $e',
        ));
        await db.deleteTransaction(tx.id);
      }
    }
  }

  void dispose() {
    _connectivityController.close();
  }
}
