class CloseReviewLog {
  final String id;
  final String storeId;
  final String sessionId;
  final String reviewerUserId;
  final String reviewerRole;
  final DateTime reviewedAt;
  final int queuePendingCount;
  final int failedCount;
  final int conflictCount;
  final DateTime? lastSyncSuccessAt;
  final String closeStatus;
  final bool acknowledgementConfirmed;
  final String? notes;
  final bool adminOverride;
  final String? overrideReason;
  final String? overrideReasonCategory;
  final String? overrideNotes;
  final bool dualApprovalRequired;
  final String? secondaryApproverUserId;
  final String? secondaryApproverRole;
  final String? reviewerName;
  final String? storeName;

  const CloseReviewLog({
    required this.id,
    required this.storeId,
    required this.sessionId,
    required this.reviewerUserId,
    required this.reviewerRole,
    required this.reviewedAt,
    required this.queuePendingCount,
    required this.failedCount,
    required this.conflictCount,
    required this.lastSyncSuccessAt,
    required this.closeStatus,
    required this.acknowledgementConfirmed,
    required this.notes,
    required this.adminOverride,
    required this.overrideReason,
    required this.overrideReasonCategory,
    required this.overrideNotes,
    required this.dualApprovalRequired,
    required this.secondaryApproverUserId,
    required this.secondaryApproverRole,
    this.reviewerName,
    this.storeName,
  });

  factory CloseReviewLog.fromJson(Map<String, dynamic> json) {
    return CloseReviewLog(
      id: json['id'] as String? ?? '',
      storeId: json['store_id'] as String? ?? '',
      sessionId: json['session_id'] as String? ?? '',
      reviewerUserId: json['reviewer_user_id'] as String? ?? '',
      reviewerRole: json['reviewer_role'] as String? ?? 'unknown',
      reviewedAt:
          DateTime.tryParse(json['reviewed_at'] as String? ?? '') ?? DateTime.now(),
      queuePendingCount: (json['queue_pending_count'] as num?)?.toInt() ?? 0,
      failedCount: (json['failed_count'] as num?)?.toInt() ?? 0,
      conflictCount: (json['conflict_count'] as num?)?.toInt() ?? 0,
      lastSyncSuccessAt: DateTime.tryParse(
        json['last_sync_success_at'] as String? ?? '',
      ),
      closeStatus: (json['close_status'] as String? ?? 'red').toLowerCase(),
      acknowledgementConfirmed: json['acknowledgement_confirmed'] == true,
      notes: json['notes'] as String?,
      adminOverride: json['admin_override'] == true,
      overrideReason: json['override_reason'] as String?,
      overrideReasonCategory: json['override_reason_category'] as String?,
      overrideNotes: json['override_notes'] as String?,
      dualApprovalRequired: json['dual_approval_required'] == true,
      secondaryApproverUserId: json['secondary_approver_user_id'] as String?,
      secondaryApproverRole: json['secondary_approver_role'] as String?,
      reviewerName: json['reviewer_name'] as String?,
      storeName: json['store_name'] as String?,
    );
  }
}
