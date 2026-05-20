const fs = require('fs');

function replaceFile(path, replacements) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  for (const [from, to] of replacements) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(path, content, 'utf8');
}

// mappers.ts
replaceFile('apps/admin_web/src/lib/api/mappers.ts', [
  ['export function mapProduct(row: any): PosProduct {', 'export function mapProduct(row: Record<string, unknown>): PosProduct {'],
  ['cost: row.cost ? Number(row.cost) : undefined,', 'cost: row.cost ? Number(row.cost as string | number) : undefined,'],
  ['stock: Number(row.qty_on_hand ?? row.stock ?? 0),', 'stock: Number(row.qty_on_hand ?? row.stock ?? 0),'],
  ['category: row.category,', 'category: row.category as string | undefined,'],
  ['categoryId: row.category_id,', 'categoryId: row.category_id as string | undefined,'],
  ['imageUrl: row.image_url,', 'imageUrl: row.image_url as string | undefined,'],
  ['groupTag: row.group_tag,', 'groupTag: row.group_tag as string | undefined,'],
  
  ['export function mapCategory(row: any): PosCategory {', 'export function mapCategory(row: Record<string, unknown>): PosCategory {'],
  ['id: row.id,', 'id: row.id as string,'],
  ['name: row.name,', 'name: row.name as string,'],
  ['slug: row.slug,', 'slug: row.slug as string,'],
  ['imageUrl: row.image_url,', 'imageUrl: row.image_url as string | undefined,'],
  ['parentId: row.parent_id,', 'parentId: row.parent_id as string | undefined,'],
  ['sortOrder: row.sort_order,', 'sortOrder: row.sort_order as number | undefined,'],
  ['productCount: row.product_count,', 'productCount: row.product_count as number | undefined,'],
  
  ['export function mapDailySale(row: any): DailySale {', 'export function mapDailySale(row: Record<string, unknown>): DailySale {'],
  ['id: row.id,', 'id: row.id as string,'],
  ['storeId: row.store_id,', 'storeId: row.store_id as string,'],
  ['saleDate: row.sale_date,', 'saleDate: row.sale_date as string,'],
  ['cashAmount: Number(row.cash_amount),', 'cashAmount: Number(row.cash_amount as string | number),'],
  ['bkashAmount: Number(row.bkash_amount),', 'bkashAmount: Number(row.bkash_amount as string | number),'],
  ['creditAmount: Number(row.credit_amount),', 'creditAmount: Number(row.credit_amount as string | number),'],
  ['totalSales: Number(row.total_sales),', 'totalSales: Number(row.total_sales as string | number),'],
  ['stockPurchase: Number(row.stock_purchase),', 'stockPurchase: Number(row.stock_purchase as string | number),'],
  ['dailyExpense: Number(row.daily_expense),', 'dailyExpense: Number(row.daily_expense as string | number),'],
  ['status: row.status,', 'status: row.status as "draft" | "completed",'],
  ['createdAt: row.created_at,', 'createdAt: row.created_at as string,'],
  ['updatedAt: row.updated_at,', 'updatedAt: row.updated_at as string,'],

  ['export function mapExpense(row: any): Expense {', 'export function mapExpense(row: Record<string, unknown>): Expense {'],
  ['id: row.id,', 'id: row.id as string,'],
  ['storeId: row.store_id,', 'storeId: row.store_id as string,'],
  ['expenseDate: row.expense_date,', 'expenseDate: row.expense_date as string,'],
  ['category: row.category,', 'category: row.category as string,'],
  ['amount: Number(row.amount),', 'amount: Number(row.amount as string | number),'],
  ['description: row.description,', 'description: row.description as string | undefined,'],
  ['receiptUrl: row.receipt_url,', 'receiptUrl: row.receipt_url as string | undefined,'],
  ['recordedBy: row.recorded_by,', 'recordedBy: row.recorded_by as string | undefined,'],
  ['createdAt: row.created_at,', 'createdAt: row.created_at as string,'],
  ['updatedAt: row.updated_at,', 'updatedAt: row.updated_at as string,'],
  
  ['export function mapInventoryTransaction(row: any): InventoryTransaction {', 'export function mapInventoryTransaction(row: Record<string, unknown>): InventoryTransaction {'],
  ['id: row.id,', 'id: row.id as string,'],
  ['storeId: row.store_id,', 'storeId: row.store_id as string,'],
  ['productId: row.product_id,', 'productId: row.product_id as string,'],
  ['transactionType: row.transaction_type,', 'transactionType: row.transaction_type as "IN" | "OUT" | "ADJUST" | "TRANSFER",'],
  ['quantity: Number(row.quantity),', 'quantity: Number(row.quantity as string | number),'],
  ['referenceId: row.reference_id,', 'referenceId: row.reference_id as string | undefined,'],
  ['notes: row.notes,', 'notes: row.notes as string | undefined,'],
  ['performedBy: row.performed_by,', 'performedBy: row.performed_by as string | undefined,'],
  ['createdAt: row.created_at,', 'createdAt: row.created_at as string,'],
  
  ['export function mapCompetitorPrice(row: any): CompetitorPrice {', 'export function mapCompetitorPrice(row: Record<string, unknown>): CompetitorPrice {'],
  ['id: row.id,', 'id: row.id as string,'],
  ['productId: row.product_id,', 'productId: row.product_id as string,'],
  ['competitorName: row.competitor_name,', 'competitorName: row.competitor_name as string,'],
  ['price: Number(row.price),', 'price: Number(row.price as string | number),'],
  ['isLower: row.is_lower,', 'isLower: row.is_lower as boolean,'],
  ['notes: row.notes,', 'notes: row.notes as string | undefined,'],
  ['recordedBy: row.recorded_by,', 'recordedBy: row.recorded_by as string | undefined,'],
  ['createdAt: row.created_at,', 'createdAt: row.created_at as string,'],
]);

// withSerializableRetry.ts
replaceFile('apps/admin_web/src/lib/api/withSerializableRetry.ts', [
  ['} catch (error: any) {', '} catch (error: unknown) {'],
  ['const err = error as { code?: string; message?: string };', 'const err = error as { code?: string; message?: string };'],
  ['if (error?.code === \'40001\' || error?.message?.includes(\'serialization failure\')) {', 'if (err?.code === \'40001\' || err?.message?.includes(\'serialization failure\')) {']
]);

// debug.ts
replaceFile('apps/admin_web/src/lib/debug.ts', [
  ['export function debugLog(message: string, data?: any) {', 'export function debugLog(message: string, data?: unknown) {'],
  ['console.error(`[ERROR] ${message}`, error);', 'console.error(`[ERROR] ${message}`, error as Error);'],
  ['export function debugError(message: string, error?: any) {', 'export function debugError(message: string, error?: unknown) {']
]);

// stitch-integration.ts
replaceFile('apps/admin_web/src/lib/stitch-integration.ts', [
  ['const response = await (supabase as any).rpc', 'const response = await (supabase as Record<string, any>).rpc']
]);

// supabase.ts
replaceFile('apps/admin_web/src/lib/supabase.ts', [
  ['(error as any).status', '(error as { status?: number }).status'],
  ['(error as any).message', '(error as { message?: string }).message'],
  ['export const callRpc = async (rpcName: string, args?: any) => {', 'export const callRpc = async (rpcName: string, args?: Record<string, unknown>) => {']
]);

// table-query.ts
replaceFile('apps/admin_web/src/lib/table-query.ts', [
  ['function buildFilters(filters: any) {', 'function buildFilters(filters: Record<string, unknown>) {'],
  ['if (value instanceof Object) {', 'if (typeof value === "object" && value !== null && !Array.isArray(value)) {'],
  ['export function applyTableQuery<T = any>(', 'export function applyTableQuery<T = Record<string, unknown>>('],
  ['let valA = a as any;', 'const valA = a as Record<string, unknown>;'],
  ['let valB = b as any;', 'const valB = b as Record<string, unknown>;']
]);

// zodResolver.ts
replaceFile('apps/admin_web/src/lib/zodResolver.ts', [
  ['export const zodResolver = <T extends z.ZodType<any, any>>(', 'export const zodResolver = <T extends z.ZodType<unknown, z.ZodTypeDef, unknown>>('],
  [') => async (values: any): Promise<ResolverResult<z.infer<T>>> => {', ') => async (values: Record<string, unknown>): Promise<ResolverResult<z.infer<T>>> => {'],
  ['(acc: any, currentError: any) => {', '(acc: Record<string, any>, currentError: z.ZodIssue) => {'],
  ['acc[currentError.path[0]] = {', 'acc[currentError.path[0] as string] = {'],
  ['message: currentError.message,', 'message: currentError.message,'],
  ['type: currentError.code,', 'type: currentError.code,'],
  ['Promise.resolve<ResolverResult<z.infer<T>>>({', 'Promise.resolve({']
]);

// PdfGenerator.ts
replaceFile('apps/admin_web/src/utils/PdfGenerator.ts', [
  ['} catch (err: any) {', '} catch (err: unknown) {'],
  ['console.error(\'PDF generation failed:\', err.message);', 'console.error(\'PDF generation failed:\', (err as Error).message);']
]);

// Services
const services = [
  'apps/admin_web/src/services/customers/customerService.ts',
  'apps/admin_web/src/services/inventory/inventoryService.ts',
  'apps/admin_web/src/services/sales/salesService.ts'
];
for (const service of services) {
  if (fs.existsSync(service)) {
    let content = fs.readFileSync(service, 'utf8');
    // For these, they need `any` to avoid TS2339 on `rpc` for supabase client
    // So we'll use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 
    // where they have `(supabase as any)`
    content = content.replace(/\(supabase as any\)/g, '(supabase as Record<string, any>)');
    fs.writeFileSync(service, content, 'utf8');
  }
}

console.log('Fixed typescript errors');
