export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number; // Integer, represents paisa/cents
  stock: number;
  categoryId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number; // Integer, represents paisa/cents
}

export interface Sale {
  id: string;
  customerId?: string;
  items: SaleItem[];
  totalAmount: number; // Integer, represents paisa/cents
  paymentMethod: "CASH" | "CARD" | "MOBILE";
  timestamp: string;
  status: "COMPLETED" | "QUEUED" | "FAILED";
}

export function formatCurrency(amountInPaisa: number): string {
  // Assuming 100 paisa/cents = 1 unit
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  }).format(amountInPaisa / 100);
}
