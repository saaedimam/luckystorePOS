// scripts/replay-certification/duplicate_delivery.ts
import { ReplayOp } from './replay_runner';
import { executeHybridReplay, TestContext, bootstrap } from './certify';
import { db } from './db';

export async function testDuplicateDelivery(testIds: TestContext) {
  console.log('[REPLAY-CERT] Running Duplicate Delivery Proof...');
  
  const opId = '00000000-0000-0000-0000-000000000004';
  const op: ReplayOp = {
    rpc: 'deduct_stock',
    params: {
      p_store_id: testIds.storeId,
      p_product_id: testIds.itemId,
      p_quantity: 1,
      p_operation_id: opId,
      p_expected_quantity: null,
      p_metadata: null
    }
  };

  // Re-seed to a clean slate
  await bootstrap();

  // Replay the exact duplicate operation 3 times sequentially
  const trace = [op, op, op];
  await executeHybridReplay(testIds, trace, 1000);

  // Assert in DB that only exactly 1 movement was written
  let result;
  try {
    result = await db.query(`
      SELECT COUNT(*) as count
      FROM stock_ledger
      WHERE movement_id = '${opId}'
    `);
  } catch (e) {
    result = await db.query(`
      SELECT COUNT(*) as count
      FROM inventory_movements
      WHERE operation_id = '${opId}'
    `);
  }

  if (parseInt(result.rows[0].count) !== 1) {
    throw new Error(`DUPLICATE_DELIVERY_FAILURE: Expected 1 ledger entry, found ${result.rows[0].count}`);
  }

  console.log('✅ Duplicate Delivery Proof Passed.');
}
