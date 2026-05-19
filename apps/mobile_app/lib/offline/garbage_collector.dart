import 'package:drift/drift.dart';
import '../telemetry/telemetry_service.dart';
import 'db.dart';

class SyncLogGarbageCollector {
  final OfflineDatabase _db;
  final TelemetryService _telemetry;

  SyncLogGarbageCollector({required OfflineDatabase db, required TelemetryService telemetry})
      : _db = db, _telemetry = telemetry;

  /// Performs a high-performance single-transaction cleanup of sync events older than 30 days.
  Future<int> collectGarbage() async {
    final stopwatch = Stopwatch()..start();
    final cutoffDate = DateTime.now().subtract(const Duration(days: 30));

    try {
      // Execute as a single high-performance indexed DELETE transaction
      final deletedCount = await _db.transaction<int>(() async {
        final query = _db.delete(_db.offlineEvents)
          ..where((t) => t.createdAt.isSmallerThanValue(cutoffDate));
        return query.go();
      });

      stopwatch.stop();

      // Log success using the authoritative sync health metrics stream
      _telemetry.updateSyncHealth(true);

      return deletedCount;
    } catch (e) {
      stopwatch.stop();
      // Record failure state in the sync health stream
      _telemetry.updateSyncHealth(false, error: e.toString());
      rethrow;
    }
  }
}
