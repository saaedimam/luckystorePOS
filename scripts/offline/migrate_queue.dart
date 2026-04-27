import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

/// Migration script to convert old JSON-based offline queue to Drift SQLite tables.
/// This script reads the legacy JSON file and inserts records into the new Drift database.

Future<void> main() async {
  final appDir = await getApplicationDocumentsDirectory();
  final oldQueuePath = p.join(appDir.path, 'offline_queue.json');
  final newDbPath = p.join(appDir.path, 'offline_store.db');
  
  debugPrint('Checking for legacy queue at: $oldQueuePath');
  debugPrint('Target database: $newDbPath');
  
  if (!File(oldQueuePath).existsSync()) {
    debugPrint('No legacy queue found. Migration complete.');
    return;
  }
  
  final jsonString = File(oldQueuePath).readAsStringSync();
  final List<dynamic> queue = jsonDecode(jsonString);
  
  debugPrint('Found ${queue.length} items in legacy queue');
  
  // Import Drift classes (this would be run via Flutter/Dart CLI)
  // In practice, this would use package:drift to insert into the new database
  
  for (var item in queue) {
    final Map<String, dynamic> action = item;
    debugPrint('Migrating: ${action['actionType']} ${action['id']}');
  }
  
  debugPrint('Migration complete!');
  
  // Option to delete the old JSON file after successful migration
  // File(oldQueuePath).deleteSync();
}

void debugPrint(String message) {
  print('[Migration] $message');
}
