import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'dart:io';
import 'tables.dart';
import 'database_config.dart';
import '../utils/result.dart';
import '../errors/exceptions.dart';

// Database connection
class ApplicationDatabase extends _$AppDatabase {
  ApplicationDatabase() : super(_openConnection());

  @override
  int get schemaVersion => DatabaseConfig.schemaVersion;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator m) async {
        await m.createAll();
      },
      onUpgrade: (Migrator m, int from, int to) async {
        // Handle version migrations here
        Logger.debug('Database migration from version $from to $to');
        
        if (from == 1 && to >= 2) {
          // Example migration logic if needed
          await m.addColumn(products, products.stockQuantity);
        }
        
        if (from == 1 && to == 2) {
          // Add new table if needed
          await m.createAll();
        }
      },
      onUpgradeTo: (Migrator m, int to) async {
        await m.createAll();
      },
    );
  }

  @override
  Future<void> close() async {
    // Perform cleanup before closing
    await super.close();
  }
}

// Open connection to database
LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    // Use documents directory for database file
    final docsDir = await getApplicationDocumentsDirectory();
    
    // Create database file path
    final dbFile = File(
      path.join(docsDir.path, DatabaseConfig.databaseName),
    );
    
    // Enable WAL mode for better concurrency
    final e = await DriftApi.openDatabase(
      dbFile,
      config: DatabaseConfig.enableDebugLogging
          ? null
          : DriftApiConfig.quiet(),
    );
    
    // Enable WAL mode
    await e.executor
        .customStatement('PRAGMA journal_mode = ${DatabaseConfig.journalMode}');
    
    // Set cache size
    await e.executor.customStatement(
      'PRAGMA cache_size = ${DatabaseConfig.cacheSize}',
    );
    
    // Enable foreign key constraints
    await e.executor.customStatement('PRAGMA foreign_keys = ON');
    
    return e;
  });
}

// Helper class for database operations
class DatabaseHelper {
  final ApplicationDatabase db;

  DatabaseHelper(this.db);

  // ===== Products =====

  Future<Result<int>> insertProduct(Product product) async {
    try {
      final id = await db.products.insert(product);
      return Success<int>(id);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.insertProduct failed', e, stackTrace);
      return Failure<int>('Failed to insert product: $e');
    }
  }

  Future<Result<bool>> updateProduct(Product product) async {
    try {
      await db.products.update(
        product..syncStatus = 'pending',
      );
      return Success<bool>(true);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.updateProduct failed', e, stackTrace);
      return Failure<bool>('Failed to update product: $e');
    }
  }

  Future<Result<List<Product>>> getProductsByStore(String storeId) async {
    try {
      final products = await db.products
          .select(db.products)
          ..where((p) => p.storeId.equals(storeId))
          .get();
      return Success<List<Product>>(products);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.getProductsByStore failed', e, stackTrace);
      return Failure<List<Product>>('Error fetching products: $e');
    }
  }

  Future<Result<Product>> getProduct(String productId) async {
    try {
      final product = await db(db.products)
          .where((p) => p.id.equals(productId))
          .getSingleOrNull();
      
      if (product != null) {
        return Success<Product>(product);
      }
      return Failure<Product>('Product not found');
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.getProduct failed', e, stackTrace);
      return Failure<Product>('Error fetching product: $e');
    }
  }

  Future<Result<List<Product>>> searchProducts(String query) async {
    try {
      final products = await db(db.products)
          .where((p) => p.name.isLike('%$query%'))
          .limit(20)
          .get();
      
      return Success<List<Product>>(products);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.searchProducts failed', e, stackTrace);
      return Failure<List<Product>>('Error searching products: $e');
    }
  }

  // ===== Offline Sales =====

  Future<Result<String>> insertOfflineSale(OfflineSale sale) async {
    try {
      final id = await db.offlineSales.insert(sale);
      return Success<String>(id);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.insertOfflineSale failed', e, stackTrace);
      return Failure<String>('Failed to save offline sale: $e');
    }
  }

  Future<Result<List<OfflineSale>>> getPendingSales() async {
    try {
      final sales = await db.offlineSales
          .select(db.offlineSales)
          ..where((s) => s.syncStatus.equals('pending'))
          ..order((t) => OrderingTerm.desc(t.createdAt))
          .get();
      
      return Success<List<OfflineSale>>(sales);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.getPendingSales failed', e, stackTrace);
      return Failure<List<OfflineSale>>('Error fetching pending sales: $e');
    }
  }

  Future<Result<void>> updateSaleSyncStatus(String saleId, String status, {String? error}) async {
    try {
      await db.offlineSales.update(
        db.offlineSales
            .readWhere((t) => t.id.equals(saleId))
            .map((sale) {
          sale.syncStatus = status;
          sale.error = error;
          sale.updatedAt = DateTime.now();
          return sale;
        }),
      );
      return Success<void>(null);
    } catch (e, stackTrace) {
      Logger.error(
        'DatabaseHelper.updateSaleSyncStatus failed',
        e,
        stackTrace,
      );
      return Failure<void>('Failed to update sale status: $e');
    }
  }

  Future<Result<List<OfflineSale>>> getSalesForSync(int batchLimit) async {
    try {
      final sales = await db.offlineSales
          .select(db.offlineSales)
          ..where((s) =>
              s.syncStatus.equals('pending') || s.syncStatus.equals('retrying'))
          ..order((t) => OrderingTerm.asc(t.createdAt))
          .limit(batchLimit)
          .get();
      
      return Success<List<OfflineSale>>(sales);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.getSalesForSync failed', e, stackTrace);
      return Failure<List<OfflineSale>>('Error fetching sales for sync: $e');
    }
  }

  Future<Result<int>> getPendingSaleCount() async {
    try {
      final count = await db.selectedCount(db.offlineSales)
          ..where((s) => s.syncStatus.equals('pending'))
          .get();
      
      return Success<int>(count ?? 0);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.getPendingSaleCount failed', e, stackTrace);
      return Failure<int>('Error counting pending sales: $e');
    }
  }

  // ===== Offline Sale Items =====

  Future<Result<void>> insertSaleItems(String saleId, List<OfflineSaleItem> items) async {
    try {
      for (final item in items) {
        await db.offlineSaleItems.insert(item);
      }
      return Success<void>(null);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.insertSaleItems failed', e, stackTrace);
      return Failure<void>('Failed to insert sale items: $e');
    }
  }

  Future<Result<List<OfflineSaleItem>>> getSaleItems(String saleId) async {
    try {
      final items = await db.offlineSaleItems
          .select(db.offlineSaleItems)
          ..where((i) => i.saleId.equals(saleId))
          .get();
      
      return Success<List<OfflineSaleItem>>(items);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.getSaleItems failed', e, stackTrace);
      return Failure<List<OfflineSaleItem>>('Error fetching sale items: $e');
    }
  }

  // ===== Stock Levels =====

  Future<Result<void>> insertOrUpdateStockLevel(OfflineStockLevel level) async {
    try {
      // Try to update, if not found, insert
      await db.offlineStockLevels
          .put(level..syncStatus = 'pending')
          .then((value) {
        if (value == 0) {
          // If no update, insert
        }
      });
      return Success<void>(null);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.insertOrUpdateStockLevel failed', e, stackTrace);
      return Failure<void>('Failed to update stock level: $e');
    }
  }

  Future<Result<List<OfflineStockLevel>>> getStockLevels(String storeId) async {
    try {
      final levels = await db.offlineStockLevels
          .select(db.offlineStockLevels)
          ..where((t) => t.storeId.equals(storeId))
          .get();
      
      return Success<List<OfflineStockLevel>>(levels);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.getStockLevels failed', e, stackTrace);
      return Failure<List<OfflineStockLevel>>('Error fetching stock levels: $e');
    }
  }

  // ===== Sync Queue =====

  Future<Result<String>> addSyncQueueEntry(SyncQueueEntry entry) async {
    try {
      final id = await db.syncQueue.insert(entry);
      return Success<String>(id);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.addSyncQueueEntry failed', e, stackTrace);
      return Failure<String>('Failed to add to sync queue: $e');
    }
  }

  Future<Result<List<SyncQueueEntry>>> getPendingEntries(int limit) async {
    try {
      final entries = await db.syncQueue
          .select(db.syncQueue)
          ..where((s) => s.syncStatus.equals('pending'))
          ..order((t) => OrderingTerm.asc([t.priority, t.createdAt]))
          .limit(limit)
          .get();
      
      return Success<List<SyncQueueEntry>>(entries);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.getPendingEntries failed', e, stackTrace);
      return Failure<List<SyncQueueEntry>>('Error fetching sync queue entries: $e');
    }
  }

  Future<Result<void>> markEntryAsSynced(String entryId, {String? error}) async {
    try {
      await db.syncQueue
          .update(
            db.syncQueue
                .readWhere((t) => t.id.equals(entryId))
                .map((entry) {
              entry.syncStatus = 'synced';
              if (error != null) {
                entry.failedAt = DateTime.now();
              }
              entry.updatedAt = DateTime.now();
              return entry;
            }),
          )
          .catchError((e, s) => Logger.error('markEntryAsSynced failed', e, s));
      
      return Success<void>(null);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.markEntryAsSynced failed', e, stackTrace);
      return Failure<void>('Failed to mark entry as synced: $e');
    }
  }

  Future<Result<int>> getPendingCount() async {
    try {
      final count = await db.selectedCount(db.syncQueue)
          ..where((s) => s.syncStatus.equals('pending') || s.syncStatus.equals('retrying'))
          .get();
      
      return Success<int>(count ?? 0);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.getPendingCount failed', e, stackTrace);
      return Failure<int>('Error counting pending entries: $e');
    }
  }

  // ===== Offline Settings =====

  Future<Result<List<OfflineSetting>>> getAllSettings() async {
    try {
      final settings = await db.offlineSettings.select(db.offlineSettings).get();
      return Success<List<OfflineSetting>>(settings);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.getAllSettings failed', e, stackTrace);
      return Failure<List<OfflineSetting>>('Error fetching settings: $e');
    }
  }

  Future<Result<void>> saveSetting(String key, String value, {String? description}) async {
    try {
      await db.offlineSettings.put(OfflineSettingCompanion(
        key: Value(key),
        value: Value(value),
        description: Value(description),
        updatedAt: Value(DateTime.now()),
      ));
      
      return Success<void>(null);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.saveSetting failed', e, stackTrace);
      return Failure<void>('Failed to save setting: $e');
    }
  }

  Future<Result<OfflineSetting>> getSetting(String key) async {
    try {
      final setting = await db.offlineSettings
          .select(db.offlineSettings)
          ..where((s) => s.key.equals(key))
          .getSingleOrNull();
      
      if (setting != null) {
        return Success<OfflineSetting>(setting);
      }
      return Failure<OfflineSetting>('Setting not found');
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.getSetting failed', e, stackTrace);
      return Failure<OfflineSetting>('Error fetching setting: $e');
    }
  }

  // ===== Cleanup =====

  Future<Result<void>> cleanUpSyncedSales() async {
    try {
      await db.transaction(() async {
        // This will be scheduled after sync completes
        await db.delete(db.offlineSales)
            .where((s) => s.syncStatus.equals('synced'))
            .go();
            
        await db.delete(db.offlineSaleItems)
            .selectWhere((i) => i.saleId.equalsAll(
              db.offlineSales.select(db.offlineSales.id)
                  .where((s) => s.syncStatus.equals('synced')),
            ))
            .go();
      });
      
      return Success<void>(null);
    } catch (e, stackTrace) {
      Logger.error('DatabaseHelper.cleanUpSyncedSales failed', e, stackTrace);
      return Failure<void>('Failed to cleanup synced data: $e');
    }
  }
}
