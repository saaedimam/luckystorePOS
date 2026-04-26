class SyncActionAuditLog {
  final String userId;
  final String role;
  final String action;
  final String targetTransactionId;
  final DateTime timestamp;
  final String device;
  final String result;
  final String? note;

  const SyncActionAuditLog({
    required this.userId,
    required this.role,
    required this.action,
    required this.targetTransactionId,
    required this.timestamp,
    required this.device,
    required this.result,
    this.note,
  });

  Map<String, dynamic> toJson() => {
        'user_id': userId,
        'role': role,
        'action': action,
        'target_transaction_id': targetTransactionId,
        'timestamp': timestamp.toIso8601String(),
        'device': device,
        'result': result,
        'note': note,
      };

  factory SyncActionAuditLog.fromJson(Map<String, dynamic> json) {
    return SyncActionAuditLog(
      userId: json['user_id'] as String? ?? 'unknown',
      role: json['role'] as String? ?? 'unknown',
      action: json['action'] as String? ?? 'unknown',
      targetTransactionId:
          json['target_transaction_id'] as String? ?? 'unknown',
      timestamp: DateTime.tryParse(json['timestamp'] as String? ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
      device: json['device'] as String? ?? 'unknown',
      result: json['result'] as String? ?? 'unknown',
      note: json['note'] as String?,
    );
  }
}
