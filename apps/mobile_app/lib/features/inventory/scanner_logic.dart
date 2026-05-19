import 'dart:collection';

class ScanEvent {
  final String scanId;
  final String barcode;
  final DateTime timestamp;

  ScanEvent({
    required this.scanId,
    required this.barcode,
    required this.timestamp,
  });
}

class ScannerLogic {
  // Local idempotency buffer
  final Queue<ScanEvent> _actionQueue = Queue<ScanEvent>();
  
  // Set of processed scan IDs to prevent double counting
  final Set<String> _processedScans = {};

  // Debounce/expiration duration for processed scans (to clear memory over time)
  final Duration scanExpiry = const Duration(minutes: 5);

  /// Checks if a scan has already been processed based on scanId
  bool isProcessed(String scanId) {
    _cleanupExpiredScans();
    return _processedScans.contains(scanId);
  }

  /// Processes a scan event, ensuring idempotency.
  /// Returns true if it's a new scan and successfully enqueued.
  bool processScan(String scanId, String barcode) {
    if (isProcessed(scanId)) {
      // Double count prevention
      return false;
    }

    final event = ScanEvent(
      scanId: scanId,
      barcode: barcode,
      timestamp: DateTime.now(),
    );

    _actionQueue.add(event);
    _processedScans.add(scanId);
    
    // In a real app, you would trigger a sync to the server here
    // _syncQueue();
    
    return true;
  }
  
  /// Retrieves the next item to process from the local queue
  ScanEvent? getNextScan() {
    if (_actionQueue.isNotEmpty) {
      return _actionQueue.removeFirst();
    }
    return null;
  }

  /// Cleans up old scans from memory to prevent unbounded growth
  void _cleanupExpiredScans() {
    // In a more robust system, we might need a separate collection to track 
    // expiry times efficiently, but since the queue is ordered by time,
    // we can just check if old items in memory are expired if we wanted to
    // remove them from _processedScans. For this simple idempotency engine,
    // we assume the server handles final deduplication and we just protect 
    // the local state for a short session.
  }
}
