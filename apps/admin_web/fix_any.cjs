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
replaceFile('src/lib/api/mappers.ts', [
  ['export function mapSearchItem(row: any): PosProduct {', 'export function mapSearchItem(row: Record<string, string | number | boolean | null | undefined>): PosProduct {'],
  ['export function mapCategory(row: any): PosCategory {', 'export function mapCategory(row: Record<string, string | number | boolean | null | undefined>): PosCategory {'],
  ['export function mapDailySale(row: any) {', 'export function mapDailySale(row: Record<string, string | number | boolean | null | undefined>) {'],
  ['export function mapExpense(row: any) {', 'export function mapExpense(row: Record<string, string | number | boolean | null | undefined>) {'],
  ['export function mapInventoryTransaction(row: any) {', 'export function mapInventoryTransaction(row: Record<string, string | number | boolean | null | undefined>) {'],
  ['export function mapCompetitorPrice(row: any) {', 'export function mapCompetitorPrice(row: Record<string, string | number | boolean | null | undefined>) {'],
  ['export function mapReminder(row: any): Reminder {', 'export function mapReminder(row: Record<string, string | number | boolean | null | undefined>): Reminder {']
]);

// supabase.ts
replaceFile('src/lib/supabase.ts', [
  ['(import.meta as any).env.VITE_SUPABASE_URL', '(import.meta as unknown as { env: { VITE_SUPABASE_URL: string } }).env.VITE_SUPABASE_URL'],
  ['(import.meta as any).env.VITE_SUPABASE_ANON_KEY', '(import.meta as unknown as { env: { VITE_SUPABASE_ANON_KEY: string } }).env.VITE_SUPABASE_ANON_KEY'],
  ['new Proxy({} as any, {', 'new Proxy({} as Record<string, unknown>, {'],
  ['(getClient() as any)[prop]', '(getClient() as unknown as Record<string | symbol, unknown>)[prop]'],
  ['})', '}) as ReturnType<typeof createClient<Database>>']
]);

// table-query.ts
replaceFile('src/lib/table-query.ts', [
  ['filters?: Record<string, any>;', 'filters?: Record<string, unknown>;'],
  ['function getNestedValue(obj: any, path: string) {', 'function getNestedValue(obj: Record<string, unknown>, path: string) {'],
  ['let valA = getNestedValue(a, id);', 'const valA = getNestedValue(a as unknown as Record<string, unknown>, id);'],
  ['let valB = getNestedValue(b, id);', 'const valB = getNestedValue(b as unknown as Record<string, unknown>, id);'],
  ['export function applyTableQuery<T = any>(', 'export function applyTableQuery<T = Record<string, unknown>>(']
]);

console.log('Fixed typescript errors');
