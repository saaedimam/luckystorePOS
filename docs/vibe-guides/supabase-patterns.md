# Supabase Vibe Coding Patterns — Lucky Store POS

This guide outlines database, migration, and backend integration patterns under the `luckystorePOS` system.

## 🧱 Architectural Stack

*   **Database Engine:** PostgreSQL (Supabase managed).
*   **Security layer:** Row Level Security (RLS) policies.
*   **Business Logic:** Postgres Stored Procedures (RPC / PLpgSQL functions) + database triggers.
*   **Background workers:** Supabase Edge Functions (Deno + TypeScript).

---

## ⚡ Core Rules & Invariants

### 1. Row Level Security (RLS) is Absolute
*   Every single table **MUST** have RLS enabled.
*   Write clear, explicit policies for read (`SELECT`), insert (`INSERT`), update (`UPDATE`), and delete (`DELETE`).
*   Always test edge cases (e.g. check standard tenant-isolation checks and user roles using custom session variables or claims).

### 2. Append-Only ledger guarantees
*   Crucial financial/inventory transactions must be append-only.
*   Never run direct database updates against active stock levels from client-side code.
*   All inventory additions or sales deductions must go through the dedicated inventory RPC ledger functions.

### 3. PostgreSQL Stored Procedures (RPC) first
*   Encapsulate heavy business transactions inside database-level SQL functions.
*   Execute complex updates in serializable transactions (`ISOLATION LEVEL SERIALIZABLE`) to protect against concurrent race conditions during checkouts.

```sql
CREATE OR REPLACE FUNCTION adjust_stock_level(
  p_item_id UUID,
  p_qty INT,
  p_reason TEXT
) RETURNS VOID AS $$
BEGIN
  -- Insert into ledger (append-only)
  INSERT INTO stock_ledger (item_id, quantity, reason, created_at)
  VALUES (p_item_id, p_qty, p_reason, NOW());

  -- Update actual stock level
  UPDATE stock_levels
  SET current_quantity = current_quantity + p_qty
  WHERE item_id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Idempotent Migrations
*   Ensure that all migrations under `supabase/migrations/` are entirely replayable, idempotent, and do not destructively drop critical live production structures.
*   Include `IF NOT EXISTS` or `OR REPLACE` predicates on statements.

---

## 🚀 Verification
Validate global database rules, type consistency, and RLS validation across all schemas:
```bash
npm run check
```
