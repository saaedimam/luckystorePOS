import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../models/sync_action_audit_log.dart';
import '../../../sales/offline_transaction_sync_service.dart';

class SyncAuditScreen extends StatefulWidget {
  const SyncAuditScreen({super.key});

  @override
  State<SyncAuditScreen> createState() => _SyncAuditScreenState();
}

class _SyncAuditScreenState extends State<SyncAuditScreen> {
  final _service = OfflineTransactionSyncService.instance;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _service.addListener(_refresh);
  }

  @override
  void dispose() {
    _service.removeListener(_refresh);
    super.dispose();
  }

  void _refresh() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final logs = _filtered(_service.auditLogs);
    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      appBar: AppBar(
        backgroundColor: const Color(0xFF161B22),
        title: const Text('Sync Audit Logs'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              onChanged: (value) => setState(() => _query = value.trim()),
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search by user, role, action, tx id, device, result',
                hintStyle: const TextStyle(color: Colors.white54),
                prefixIcon: const Icon(Icons.search, color: Colors.white54),
                filled: true,
                fillColor: const Color(0xFF161B22),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: logs.isEmpty
                ? const Center(
                    child: Text(
                      'No audit entries found.',
                      style: TextStyle(color: Colors.white60),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                    itemCount: logs.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, index) => _row(logs[index]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _row(SyncActionAuditLog log) {
    final ts = DateFormat('MMM d, yyyy HH:mm:ss').format(log.timestamp.toLocal());
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '[${log.result.toUpperCase()}] ${log.action}',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Text('User: ${log.userId} (${log.role})',
              style: const TextStyle(color: Colors.white70)),
          Text('Transaction: ${log.targetTransactionId}',
              style: const TextStyle(color: Colors.white70)),
          Text('Device: ${log.device}',
              style: const TextStyle(color: Colors.white70)),
          Text('Time: $ts', style: const TextStyle(color: Colors.white70)),
          if (log.note != null && log.note!.isNotEmpty)
            Text('Note: ${log.note}',
                style: const TextStyle(color: Colors.white60)),
        ],
      ),
    );
  }

  List<SyncActionAuditLog> _filtered(List<SyncActionAuditLog> source) {
    if (_query.isEmpty) return source;
    final q = _query.toLowerCase();
    return source.where((log) {
      final text = [
        log.userId,
        log.role,
        log.action,
        log.targetTransactionId,
        log.device,
        log.result,
        log.note ?? '',
      ].join(' ').toLowerCase();
      return text.contains(q);
    }).toList();
  }
}
