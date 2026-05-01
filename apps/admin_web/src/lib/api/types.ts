// =============================================================================
// POS Domain Types for Admin Web App
// Aligned with mobile app PosItem structure for parity
// =============================================================================

export interface PosProduct {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  shortCode?: string;
  brand?: string;
  price: number;
  cost?: number;
  stock: number;
  category?: string;
  categoryId?: string;
  imageUrl?: string;
  groupTag?: string;
}

export interface PosCategory {
  id: string;
  name: string;
  itemCount: number;
}

export interface CartItem {
  product: PosProduct;
  qty: number;
  unitPrice: number; // allows price override
  lineTotal: number;
}

export interface PaymentInput {
  accountId: string;
  amount: number;
  reference?: string;
}

export interface SaleResult {
  status: 'success' | 'error';
  batchId?: string;
  saleNumber?: string;
  totalAmount?: number;
  error?: string;
}

export interface SplitPayment {
  id: string;
  accountId: string;
  methodName: string;
  amount: number;
}

export interface HeldCart {
  id: string;
  label: string;
  items: CartItem[];
  discount: number;
  heldAt: number;
}
