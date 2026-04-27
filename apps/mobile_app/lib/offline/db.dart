/// Drift database schema for offline inventory and store data.
/// This replaces the JSON-based offline queue with a robust SQLite database
/// that allows reliable local queries for inventory, items, and pending
/// sync actions even when the device is offline.

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

/// Table definitions for offline-first inventory storage.

@DataClassName('SyncAction')
class SyncActions extends Table {
  TextColumn get id => text().called('id')();
  
  TextColumn get actionType => text().map(const EnumMapper<SyncActionType>())();
  
  TextColumn get payload => text();
  
  TextColumn get status => text()
      .map(const EnumMapper<SyncActionStatus>())
      .default_;
  
  DateTimeColumn get createdAt => dateTime().withDefault(currentTime)();
  
  DateTimeColumn get updatedAt => dateTime().withDefault(currentTime);

  @override
  Set<Column> get primaryKey => {id};
}

class SyncActionType extends EnumClass<SyncActionType> {
  static const SyncActionType insert = $values[0];
  static const SyncActionType update = $values[1];
  static const SyncActionType delete = $values[2];

  static const $Values<SyncActionType> values = $Values($values);

  const SyncActionType._();

  Set<SyncActionType> get all => $values.toSet();

  static const $EnumDescriptor<SyncActionType> $ = $EnumDescriptor($values, SyncActionType._);

  @visibleForOverriding
  @override
  $EnumDescriptor<SyncActionType> get $enumDescriptor => $;
}

class SyncActionStatus extends EnumClass<SyncActionStatus> {
  static const SyncActionStatus pending = $values[0];
  static const SyncActionStatus syncing = $values[1];
  static const SyncActionStatus success = $values[2];
  static const SyncActionStatus failed = $values[3];

  static const $Values<SyncActionStatus> values = $Values($values);

  const SyncActionStatus._();

  Set<SyncActionStatus> get all => $values.toSet();

  static const $EnumDescriptor<SyncActionStatus> $ = $EnumDescriptor($values, SyncActionStatus._);

  @overridable
  @override
  $EnumDescriptor<SyncActionStatus> get $enumDescriptor => $;
}

/// Drift database class.
@DriftDatabase(tables: [SyncActions])
class OfflineDatabase extends _$OfflineDatabase {
  OfflineDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator m) async {
        await m.createAll();
      },
      onUpgrade: (Migrator m, int from, int to) async {
        // Future migrations can be added here
      },
    );
  }

  /// Get pending sync actions (status = pending)
  Future<List<SyncActionCompanion>> getPendingActions() async {
    return into(syncActions).select(syncActions).where((tbl) => tbl.status.equals('pending')).get();
  }

  /// Update action status
  Future<void> updateActionStatus(String id, String status) async {
    await into(syncActions).update(syncActions.id.equals(id)).write({
      syncActions.status.toColumnValue(status),
      syncActions.updatedAt.toColumnValue(DateTime.now()),
    });
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'offline_store.db'));
    return NativeDatabase.createInBackground(file);
  });
}
