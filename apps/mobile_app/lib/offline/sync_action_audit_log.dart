import 'dart:convert';
import 'package:uuid/uuid.dart';
import 'db.dart';

/// Client-side SyncActionAuditLog that ensures all local POS mutations
/// are safely logged in the Drift SQLite database before attempting network calls.
class SyncActionAuditLog {
  final OfflineDatabase db;

  SyncActionAuditLog(this.db);

  /// Records a transaction into the outbox as PENDING before trying to execute it online.
  Future<TransactionOutboxEntry> recordPendingAction({
    required String actionType,
    required Map<String, dynamic> payload,
    required String idempotencyKey,
  }) async {
    final entry = TransactionOutboxEntry(
      id: const Uuid().v4(),
      actionType: actionType,
      payload: jsonEncode(payload),
      status: TransactionStatus.pending,
      idempotencyKey: idempotencyKey,
      retryCount: 0,
    );
    await db.insertTransaction(entry);
    return entry;
  }

  /// Marks a transaction outbox entry as successfully SYNCED.
  Future<void> markActionSynced(String id) async {
    await db.updateTransactionStatus(id, TransactionStatus.synced);
  }

  /// Marks a transaction outbox entry as FAILED.
  Future<void> markActionFailed(String id) async {
    await db.updateTransactionStatus(id, TransactionStatus.failed);
  }
}
