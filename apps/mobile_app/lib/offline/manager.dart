/// Background sync service for offline-first architecture.
/// Uses WorkManager (Android) and BGTaskScheduler (iOS) to process
/// offline sync actions even when the app is minimized or the device is asleep.

import 'dart:async';
import 'package:flutter_workmanager.dart';
import '../offline/db.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Main work manager task that executes background synchronization.
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      final database = LazyDatabase()() as OfflineDatabase;
      final supabase = Supabase.instance.client;
      
      // Get pending sync actions
      final pendingActions = await database.getPendingActions();
      
      if (pendingActions.isEmpty) {
        return Future.value(true);
      }
      
      // Process each action
      for (final action in pendingActions) {
        // Mark as syncing
        await database.updateActionStatus(action.id.toValue(), 'syncing');
        
        try {
          final payload = action.payload.toValue();
          
          // Sync to Supabase
          final response = await supabase.rpc('complete_sale', 
            params: {'p_action': payload}
          );
          
          if (response != null && response['success']) {
            await database.updateActionStatus(action.id.toValue(), 'success');
          } else {
            await database.updateActionStatus(action.id.toValue(), 'failed');
          }
        } catch (e) {
          await database.updateActionStatus(action.id.toValue(), 'failed');
        }
      }
      
      return Future.value(true);
    } catch (e) {
      debugPrint('Background sync failed: $e');
      return Future.value(false);
    }
  });
}

/// Manager class to coordinate background tasks.
class OfflineSyncManager {
  static final OfflineSyncManager _instance = OfflineSyncManager._internal();
  factory OfflineSyncManager() => _instance;
  OfflineSyncManager._internal();

  Future<void> initialize() async {
    await Workmanager().initialize(
      callbackDispatcher,
      isInDebugMode: false,
    );

    // Register periodic sync task
    await Workmanager().registerPeriodicTask(
      'offlineSync',
      'offlineSyncTask',
      frequency: const Duration(minutes: 15),
      constraints: TaskConstraints(
        networkType: NetworkType.connected,
      ),
    );
  }

  Future<void> enqueueSync(String actionId, Map<String, dynamic> payload) async {
    // This would be handled by the Drift database layer
    // The WorkManager will pick up pending actions
    debugPrint('Sync task queued: $actionId');
  }
}
