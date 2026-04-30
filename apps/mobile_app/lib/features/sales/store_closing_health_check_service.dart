import './offline_transaction_sync_service.dart';

enum StoreCloseStatus { green, yellow, red }

class StoreClosingHealthCheck {
  final int queuedPendingCount;
  final int failedNeedingReview;
  final int conflictsUnacknowledged;
  final bool lastSyncIsRecent;
  final bool hasInventoryMismatchWarnings;
  final bool pendingQueueHardStop;
  final bool staleSyncHardStop;
  final bool criticalConflictHardStop;
  final int criticalConflictCount;
  final bool dualApprovalRequired;
  final bool hardStop;
  final StoreCloseStatus status;

  const StoreClosingHealthCheck({
    required this.queuedPendingCount,
    required this.failedNeedingReview,
    required this.conflictsUnacknowledged,
    required this.lastSyncIsRecent,
    required this.hasInventoryMismatchWarnings,
    required this.pendingQueueHardStop,
    required this.staleSyncHardStop,
    required this.criticalConflictHardStop,
    required this.criticalConflictCount,
    required this.dualApprovalRequired,
    required this.hardStop,
    required this.status,
  });
}

class StoreClosingHealthCheckService {
  const StoreClosingHealthCheckService();

  StoreClosingHealthCheck evaluate({
    required List<QueuedOfflineTransaction> queue,
    required OfflineSyncWorkerTelemetry telemetry,
    required bool hasInventoryMismatchWarnings,
  }) {
    final queuedPendingCount = queue
        .where(
          (tx) =>
              tx.state == OfflineSyncState.pending ||
              tx.state == OfflineSyncState.syncing,
        )
        .length;
    final failedNeedingReview = queue
        .where(
          (tx) =>
              tx.state == OfflineSyncState.failed && tx.reviewedAt == null,
        )
        .length;
    final conflictsUnacknowledged = queue
        .where(
          (tx) =>
              tx.state == OfflineSyncState.conflict &&
              tx.conflictAcknowledgedAt == null,
        )
        .length;
    final criticalConflictCount = queue
        .where(
          (tx) =>
              tx.state == OfflineSyncState.conflict &&
              tx.conflictAcknowledgedAt == null &&
              tx.requiresManagerReview &&
              (tx.conflictType ?? 'unknown') != 'duplicate_sale',
        )
        .length;
    final lastSyncIsRecent = telemetry.lastSuccessAt != null &&
        DateTime.now().difference(telemetry.lastSuccessAt!) <
            const Duration(minutes: 30);
    final pendingQueueHardStop = queuedPendingCount > 50;
    final staleSyncHardStop = telemetry.lastSuccessAt == null ||
        DateTime.now().difference(telemetry.lastSuccessAt!) >=
            const Duration(hours: 12);
    final criticalConflictHardStop = queue.any(
      (tx) =>
          tx.state == OfflineSyncState.conflict &&
          tx.conflictAcknowledgedAt == null &&
          tx.requiresManagerReview &&
          (tx.conflictType ?? 'unknown') != 'duplicate_sale',
    );
    final dualApprovalRequired = queuedPendingCount > 100 ||
        telemetry.lastSuccessAt == null ||
        DateTime.now().difference(telemetry.lastSuccessAt!) >=
            const Duration(hours: 24) ||
        criticalConflictCount >= 2;
    final hardStop =
        pendingQueueHardStop || staleSyncHardStop || criticalConflictHardStop;

    final red = queuedPendingCount > 25 ||
        failedNeedingReview > 10 ||
        conflictsUnacknowledged > 5 ||
        !lastSyncIsRecent ||
        hardStop;
    final yellow = queuedPendingCount > 0 ||
        failedNeedingReview > 0 ||
        conflictsUnacknowledged > 0 ||
        hasInventoryMismatchWarnings;

    return StoreClosingHealthCheck(
      queuedPendingCount: queuedPendingCount,
      failedNeedingReview: failedNeedingReview,
      conflictsUnacknowledged: conflictsUnacknowledged,
      lastSyncIsRecent: lastSyncIsRecent,
      hasInventoryMismatchWarnings: hasInventoryMismatchWarnings,
      pendingQueueHardStop: pendingQueueHardStop,
      staleSyncHardStop: staleSyncHardStop,
      criticalConflictHardStop: criticalConflictHardStop,
      criticalConflictCount: criticalConflictCount,
      dualApprovalRequired: dualApprovalRequired,
      hardStop: hardStop,
      status: red
          ? StoreCloseStatus.red
          : yellow
              ? StoreCloseStatus.yellow
              : StoreCloseStatus.green,
    );
  }
}
