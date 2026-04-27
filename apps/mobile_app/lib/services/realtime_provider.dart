import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Service that manages Supabase Realtime subscriptions for stock level updates.
///
/// It creates a channel filtered to the current user's `store_id` and
/// broadcasts incoming changes via a `Stream<Map<String, dynamic>>` so that
/// UI widgets can react to stock updates in real time.
class RealtimeProvider {
  final SupabaseClient _client;
  final String _storeId;
  final StreamController<Map<String, dynamic>> _controller =
      StreamController.broadcast();
  RealtimeChannel? _channel;

  RealtimeProvider(this._client, this._storeId);

  /// Exposes a stream of incoming payloads from the `stock_levels` table.
  Stream<Map<String, dynamic>> get updates => _controller.stream;

  /// Initializes the realtime subscription. The channel filters rows by `store_id`
  /// using a Postgres `WHERE` clause – this ensures we only receive events relevant
  /// to the current POS terminal and avoids memory leaks from unrelated stores.
  Future<void> init() async {
    // Clean up any existing subscription.
    await dispose();

    // Create a channel with a filter on the store_id.
    _channel = _client.channel('public:stock_levels',
        config: RealtimeChannelConfig(
          // The filter uses PostgreSQL syntax. Only rows where store_id matches
          // the current store are sent to this client.
          filter: "store_id=eq.'${_storeId}'",
        ));

    // Listen for all INSERT/UPDATE/DELETE events.
    _channel!.on(RealtimeListenTypes.all, (payload, [ref]) {
      // Payload data contains the new row data under `payload['new']` for
      // INSERT/UPDATE and `payload['old']` for DELETE.
      final Map<String, dynamic> data = payload['new'] ?? payload['old'] ?? {};
      _controller.add(data);
    });

    await _channel!.subscribe();
  }

  /// Dispose the channel and controller.
  Future<void> dispose() async {
    await _channel?.unsubscribe();
    await _channel?.removeAllListeners();
    await _controller.close();
    _channel = null;
  }
}
