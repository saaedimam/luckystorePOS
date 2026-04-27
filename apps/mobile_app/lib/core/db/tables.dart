import 'package:drift/drift.dart';

/// Product table for local caching
class Products extends Table {
  TextColumn get id => text()();
  
  TextColumn get sku => text().nullable()();
  
  TextColumn get name => text().notNull()();
  
  TextColumn get barcode => text().nullable()();
  
  NumColumn get mrp => real().nullable()();
  
  NumColumn get sellingPrice => real().nullable()();
  
  TextColumn get categoryId => text().nullable()();
  
  TextColumn get storeId => text().notNull()();
  
  IntColumn get stockQuantity => integer().withDefault(const Constant(0))();
  
  TextColumn get unit => text().nullable()();
  
  TextColumn get description => text().nullable()();
  
  DateTimeColumn get createdAt => dateTime().withDefault(currentTimestamp)();
  
  DateTimeColumn get updatedAt => dateTime().withDefault(currentTimestamp)();
  
  IntColumn get syncStatus => integer().withDefault(const Constant(0))();
  
  TextColumn get syncId => text().nullable()();

  @override
  Set<Column> get primaryKeys => {id};
}

/// Offline Sale table for storing sales made while offline
class OfflineSales extends Table {
  TextColumn get id => text()();
  
  TextColumn get saleId => text().nullable()(); // Will be synced to server
  
  TextColumn get orderId => text().nullable()();
  
  TextColumn get storeId => text().notNull()();
  
  TextColumn get cashierId => text().nullable()();
  
  TextColumn get customerId => text().nullable()();
  
  IntColumn get totalAmount => integer().notNull()();
  
  IntColumn get paymentAmount => integer().notNull()();
  
  IntColumn get changeAmount => integer().notNull()();
  
  IntColumn get paymentMode => integer().nullable()(); // null=cash, 1=bkash, 2=card
  
  TextColumn get paymentReference => text().nullable()();
  
  DateTimeColumn get saleTime => dateTime().notNull()();
  
  IntColumn get itemCount => integer().notNull()();
  
  TextColumn get syncStatus => text().withDefault(const Constant('pending'))();
  
  TextColumn get error => text().nullable()();
  
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  
  DateTimeColumn get createdAt => dateTime().withDefault(currentTimestamp)();
  
  DateTimeColumn get updatedAt => dateTime().withDefault(currentTimestamp)();
  
  IntColumn get syncAttemptedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKeys => {id};
}

/// Sale Items table for offline sale line items
class OfflineSaleItems extends Table {
  TextColumn get id => text()();
  
  TextColumn get saleId => text().notNull()();
  
  TextColumn get productId => text().notNull()();
  
  TextColumn get productName => text().notNull()();
  
  IntColumn get quantity => integer().notNull()();
  
  NumColumn get price => real().notNull()();
  
  NumColumn get discount => real().withDefault(const Constant(0.0))();
  
  NumColumn get total => real().notNull()();
  
  IntColumn get tax => integer().nullable()();
  
  TextColumn get barcode => text().nullable()();

  @override
  Set<Column> get primaryKeys => {id};
}

/// Stock levels for offline cache
class OfflineStockLevels extends Table {
  TextColumn get id => text()();
  
  TextColumn get storeId => text().notNull()();
  
  TextColumn get itemId => text().notNull()();
  
  IntColumn get quantity => integer().notNull()();
  
  IntColumn get lastUpdatedTimestamp => integer().notNull()();
  
  TextColumn get syncStatus => text().withDefault(const Constant('pending'))();
  
  DateTimeColumn get createdAt => dateTime().withDefault(currentTimestamp)();
  
  DateTimeColumn get updatedAt => dateTime().withDefault(currentTimestamp)();

  @override
  Set<Column> get primaryKeys => {id};
}

/// Sync queue for tracking operations that need to sync
class SyncQueue extends Table {
  TextColumn get id => text()();
  
  IntColumn get operationType => integer().notNull()(); // 1=create, 2=update, 3=delete
  
  TextColumn get tableName => text().notNull()();
  
  TextColumn get recordId => text().notNull()();
  
  BlobColumn get rawData => blob().notNull()();
  
  TextColumn get syncStatus => text().withDefault(const Constant('pending'))();
  
  IntColumn get priority => integer().withDefault(const Constant(10))();
  
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  
  DateTimeColumn get failedAt => dateTime().nullable()();
  
  DateTimeColumn get lastRetryAt => dateTime().nullable()();
  
  DateTimeColumn get createdAt => dateTime().withDefault(currentTimestamp)();
  
  DateTimeColumn get updatedAt => dateTime().withDefault(currentTimestamp)();

  @override
  Set<Column> get primaryKeys => {id};
}

/// Settings for offline configuration
class OfflineSettings extends Table {
  TextColumn get key => text().primary().notNull()();
  
  TextColumn get value => text().notNull()();
  
  TextColumn get description => text().nullable()();
  
  DateTimeColumn get createdAt => dateTime().withDefault(currentTimestamp)();
  
  DateTimeColumn get updatedAt => dateTime().withDefault(currentTimestamp)();

  @override
  Set<Column> get primaryKeys => {key};
}

/// Generated configuration tables
// ignore: unused_field, invalid_annotation_target
@UseRowClass('Product', cons: '_product')
class ProductTable extends _ProductTable with _$ProductTableMixin {
  static const String tableName = 'products';
  
  static const String colId = 'id';
  static const String colSku = 'sku';
  static const String colName = 'name';
  static const String colBarcode = 'barcode';
  static const String colMrp = 'mrp';
  static const String colSellingPrice = 'selling_price';
  static const String colCategoryId = 'category_id';
  static const String colStoreId = 'store_id';
  static const String colStockQuantity = 'stock_quantity';
  static const String colUnit = 'unit';
  static const String colDescription = 'description';
  static const String colCreatedAt = 'created_at';
  static const String colUpdatedAt = 'updated_at';
  static const String colSyncStatus = 'sync_status';
  static const String colSyncId = 'sync_id';
}

// ignore: unused_field, invalid_annotation_target
@UseRowClass('OfflineSale', cons: '_offlineSale')
class OfflineSalesTable extends _OfflineSalesTable with _$OfflineSalesTableMixin {
  static const String tableName = 'offline_sales';
  
  static const String colId = 'id';
  static const String colSaleId = 'sale_id';
  static const String colOrderId = 'order_id';
  static const String colStoreId = 'store_id';
  static const String colCashierId = 'cashier_id';
  static const String colCustomerId = 'customer_id';
  static const String colTotalAmount = 'total_amount';
  static const String colPaymentAmount = 'payment_amount';
  static const String colChangeAmount = 'change_amount';
  static const String colPaymentMode = 'payment_mode';
  static const String colPaymentReference = 'payment_reference';
  static const String colSaleTime = 'sale_time';
  static const String colItemCount = 'item_count';
  static const String colSyncStatus = 'sync_status';
  static const String colError = 'error';
  static const String colRetryCount = 'retry_count';
  static const String colCreatedAt = 'created_at';
  static const String colUpdatedAt = 'updated_at';
  static const String colSyncAttemptedAt = 'sync_attempted_at';
}

// ignore: unused_field, invalid_annotation_target
@UseRowClass('OfflineSaleItem', cons: '_offlineSaleItem')
class OfflineSaleItemsTable extends _OfflineSaleItemsTable with _$OfflineSaleItemsTableMixin {
  static const String tableName = 'offline_sale_items';
  
  static const String colId = 'id';
  static const String colSaleId = 'sale_id';
  static const String colProductId = 'product_id';
  static const String colProductName = 'product_name';
  static const String colQuantity = 'quantity';
  static const String colPrice = 'price';
  static const String colDiscount = 'discount';
  static const String colTotal = 'total';
  static const String colTax = 'tax';
  static const String colBarcode = 'barcode';
}

// ignore: unused_field, invalid_annotation_target
@UseRowClass('OfflineStockLevel', cons: '_offlineStockLevel')
class OfflineStockLevelsTable extends _OfflineStockLevelsTable with _$OfflineStockLevelsTableMixin {
  static const String tableName = 'offline_stock_levels';
  
  static const String colId = 'id';
  static const String colStoreId = 'store_id';
  static const String colItemId = 'item_id';
  static const String colQuantity = 'quantity';
  static const String colLastUpdatedTimestamp = 'last_updated_timestamp';
  static const String colSyncStatus = 'sync_status';
  static const String colCreatedAt = 'created_at';
  static const String colUpdatedAt = 'updated_at';
}

// ignore: unused_field, invalid_annotation_target
@UseRowClass('SyncQueueEntry', cons: '_syncQueueEntry')
class SyncQueueTable extends _SyncQueueTable with _$SyncQueueTableMixin {
  static const String tableName = 'sync_queue';
  
  static const String colId = 'id';
  static const String colOperationType = 'operation_type';
  static const String colTableName = 'table_name';
  static const String colRecordId = 'record_id';
  static const String colRawData = 'raw_data';
  static const String colSyncStatus = 'sync_status';
  static const String colPriority = 'priority';
  static const String colRetryCount = 'retry_count';
  static const String colFailedAt = 'failed_at';
  static const String colLastRetryAt = 'last_retry_at';
  static const String colCreatedAt = 'created_at';
  static const String colUpdatedAt = 'updated_at';
}

// ignore: unused_field, invalid_annotation_target
@UseRowClass('OfflineSetting', cons: '_offlineSetting')
class OfflineSettingsTable extends _OfflineSettingsTable with _$OfflineSettingsTableMixin {
  static const String tableName = 'offline_settings';
  
  static const String colKey = 'key';
  static const String colValue = 'value';
  static const String colDescription = 'description';
  static const String colCreatedAt = 'created_at';
  static const String colUpdatedAt = 'updated_at';
}

// Table declarations
abstract class AppDatabase extends DatabaseConnection {
  Products get products;
  OfflineSales get offlineSales;
  OfflineSaleItems get offlineSaleItems;
  OfflineStockLevels get offlineStockLevels;
  SyncQueue get syncQueue;
  OfflineSettings get offlineSettings;
}
