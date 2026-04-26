import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../providers/auth_provider.dart';
import '../../services/offline_transaction_sync_service.dart';
import '../../services/store_closing_health_check_service.dart';

class StoreClosingHealthCheckScreen extends StatefulWidget {
  const StoreClosingHealthCheckScreen({super.key});

  @override
  State<StoreClosingHealthCheckScreen> createState() =>
      _StoreClosingHealthCheckScreenState();
}

class _StoreClosingHealthCheckScreenState
    extends State<StoreClosingHealthCheckScreen> {
  final _sync = OfflineTransactionSyncService.instance;
  final _service = const StoreClosingHealthCheckService();
  bool _managerReviewConfirmed = false;
  DateTime? _reviewCompletedAt;

  @override
  void initState() {
    super.initState();
    _sync.addListener(_refresh);
  }

  @override
  void dispose() {
    _sync.removeListener(_refresh);
    super.dispose();
  }

  void _refresh() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.appUser?.role ?? 'unknown';
    final isManager = auth.appUser?.isManager == true;

    if (!isManager) {
      return Scaffold(
        backgroundColor: const Color(0xFF0D1117),
        appBar: AppBar(
          backgroundColor: const Color(0xFF161B22),
          title: const Text('Store Closing Health Check'),
        ),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Text(
              'Manager or admin access required for end-of-day closing review.',
              style: TextStyle(color: Colors.white70),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    final check = _service.evaluate(
      queue: _sync.queue,
      telemetry: _sync.telemetry,
      hasInventoryMismatchWarnings: false,
    );
    final canFinalize = _managerReviewConfirmed;

    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      appBar: AppBar(
        backgroundColor: const Color(0xFF161B22),
        title: const Text('Store Closing Health Check'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _statusCard(check.status),
          const SizedBox(height: 16),
          _item('Queued pending count', '${check.queuedPendingCount}',
              preferred: check.queuedPendingCount == 0),
          _item('Failed syncs reviewed', '${check.failedNeedingReview} unreviewed',
              preferred: check.failedNeedingReview == 0),
          _item(
            'Conflicts acknowledged',
            '${check.conflictsUnacknowledged} pending',
            preferred: check.conflictsUnacknowledged == 0,
          ),
          _item('Last sync success recent', check.lastSyncIsRecent ? 'Yes' : 'No',
              preferred: check.lastSyncIsRecent),
          _item(
            'Inventory mismatch warnings',
            check.hasInventoryMismatchWarnings ? 'Present' : 'None',
            preferred: !check.hasInventoryMismatchWarnings,
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF161B22),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Closing reviewer: ${auth.appUser?.name ?? 'Manager'} ($role)',
                  style: const TextStyle(color: Colors.white),
                ),
                const SizedBox(height: 10),
                CheckboxListTile(
                  value: _managerReviewConfirmed,
                  onChanged: (value) {
                    setState(() {
                      _managerReviewConfirmed = value ?? false;
                    });
                  },
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                  activeColor: const Color(0xFFE8B84B),
                  title: const Text(
                    'I reviewed pending/failed/conflict sync health before closing.',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: canFinalize ? () => _finalizeReview(check) : null,
              icon: const Icon(Icons.task_alt, color: Colors.black),
              label: const Text(
                'Finalize Closing Review',
                style: TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.bold,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE8B84B),
                disabledBackgroundColor: const Color(0xFF333A44),
                disabledForegroundColor: Colors.white54,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          if (_reviewCompletedAt != null) ...[
            const SizedBox(height: 8),
            Text(
              'Last review completed at '
              '${DateFormat('MMM dd, hh:mm a').format(_reviewCompletedAt!.toLocal())}',
              style: const TextStyle(color: Colors.white60, fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _finalizeReview(StoreClosingHealthCheck check) async {
    setState(() {
      _reviewCompletedAt = DateTime.now();
    });
    if (!mounted) return;
    final status = check.status.name.toUpperCase();
    final guidance = switch (check.status) {
      StoreCloseStatus.green =>
        'Store is clear for close. No operational blockers detected.',
      StoreCloseStatus.yellow =>
        'Store can close with caution. Review non-blocking warnings tomorrow morning.',
      StoreCloseStatus.red =>
        'Store has high-risk sync issues. Escalate to admin before final financial lock.',
    };
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Close status: $status. $guidance'),
      ),
    );
  }

  Widget _statusCard(StoreCloseStatus status) {
    final color = switch (status) {
      StoreCloseStatus.green => const Color(0xFF2ECC71),
      StoreCloseStatus.yellow => const Color(0xFFE8B84B),
      StoreCloseStatus.red => const Color(0xFFE74C3C),
    };
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.7)),
      ),
      child: Text(
        'Close Status: ${status.name.toUpperCase()}',
        style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 18),
      ),
    );
  }

  Widget _item(String title, String value, {required bool preferred}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          Icon(
            preferred ? Icons.check_circle_outline : Icons.warning_amber_rounded,
            color: preferred ? const Color(0xFF2ECC71) : const Color(0xFFE8B84B),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white)),
                Text(value, style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
