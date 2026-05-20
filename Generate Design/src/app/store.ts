import { create } from "zustand";

// ─── Online Order Types ───────────────────────────────────────────
export type OrderStatus = "Pending" | "Preparing" | "Out for Delivery" | "Delivered" | "Rejected";
export type WhatsAppState =
  | "pending"
  | "sent_received"
  | "sent_accepted"
  | "sent_ready"
  | "sent_delivered";
export type PaymentMethod = "COD" | "bKash";
export type PaymentStatus = "UNPAID" | "PAID";

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number; // paisa
}

export interface OnlineOrder {
  id: string;
  customerName: string;
  customerWhatsApp: string;
  deliveryZone: string;
  status: OrderStatus;
  createdAt: Date;
  items: OrderItem[];
  whatsappState: WhatsAppState;
  deliveryFee: number; // paisa
  source: "web" | "seed";
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  bkashTrxId?: string;
}

// ─── Seed data ────────────────────────────────────────────────────
const seedOrders: OnlineOrder[] = [
  {
    id: "INV-WEB-092",
    customerName: "Rafi Ahmed",
    customerWhatsApp: "+880 1711-223344",
    deliveryZone: "Gulshan 2, Block C",
    status: "Pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 12),
    whatsappState: "sent_received",
    deliveryFee: 6000,
    source: "seed",
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    items: [
      { id: "p1", name: "Premium Sona Moong Dal", qty: 2, price: 14500 },
      { id: "p2", name: "Radhuni Beef Masala 100g", qty: 1, price: 6500 },
      { id: "p3", name: "Fresh Soyabean Oil 5L", qty: 1, price: 82000 },
    ],
  },
  {
    id: "INV-WEB-093",
    customerName: "Nusrat Jahan",
    customerWhatsApp: "+880 1819-556677",
    deliveryZone: "Banani, Road 11",
    status: "Preparing",
    createdAt: new Date(Date.now() - 1000 * 60 * 25),
    whatsappState: "sent_accepted",
    deliveryFee: 6000,
    source: "seed",
    paymentMethod: "bKash",
    paymentStatus: "PAID",
    bkashTrxId: "BKX7H3M2P9",
    items: [
      { id: "p4", name: "Ispahani Mirzapore Tea 400g", qty: 3, price: 21000 },
      { id: "p5", name: "Pran Tomato Ketchup", qty: 1, price: 11000 },
    ],
  },
  {
    id: "INV-WEB-094",
    customerName: "Kamrul Hasan",
    customerWhatsApp: "+880 1912-889900",
    deliveryZone: "Dhanmondi 27",
    status: "Pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 3),
    whatsappState: "sent_received",
    deliveryFee: 6000,
    source: "seed",
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    items: [
      { id: "p6", name: "ACI Pure Salt 1kg", qty: 5, price: 3500 },
      { id: "p7", name: "Maggi 2-Minute Noodles 8pk", qty: 2, price: 16000 },
    ],
  },
  {
    id: "INV-WEB-095",
    customerName: "Farhana Begum",
    customerWhatsApp: "+880 1677-112233",
    deliveryZone: "Uttara Sector 4",
    status: "Out for Delivery",
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    whatsappState: "sent_ready",
    deliveryFee: 6000,
    source: "seed",
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    items: [
      { id: "p8", name: "Rupchanda Soyabean Oil 2L", qty: 2, price: 34000 },
    ],
  },
];

// ─── Store ────────────────────────────────────────────────────────
interface POSState {
  isOnline: boolean;
  offlineQueueCount: number;
  toggleOnline: () => void;
  incrementOfflineQueue: () => void;
  clearOfflineQueue: () => void;

  // Online orders
  onlineOrders: OnlineOrder[];
  pendingOrdersCount: number;
  lastCreatedOrderId: string | null;
  addOnlineOrder: (
    order: Omit<OnlineOrder, "id" | "createdAt" | "status" | "whatsappState" | "source"> & {
      id?: string;
    }
  ) => string;
  acceptOrder: (id: string) => void;
  markOrderReady: (id: string) => void;
  markOrderDelivered: (id: string) => void;
  rejectOrder: (id: string) => void;
  clearLastCreatedOrderId: () => void;

  // Legacy compatibility — no-op, count is now derived
  setPendingOrdersCount: (count: number) => void;
}

function countPending(orders: OnlineOrder[]) {
  return orders.filter((o) => o.status === "Pending").length;
}

function makeOrderId() {
  const n = Math.floor(100 + Math.random() * 900);
  return `INV-WEB-${n}`;
}

export const usePOSStore = create<POSState>((set) => ({
  isOnline: true,
  offlineQueueCount: 0,
  toggleOnline: () => set((s) => ({ isOnline: !s.isOnline })),
  incrementOfflineQueue: () =>
    set((s) => ({ offlineQueueCount: s.offlineQueueCount + 1 })),
  clearOfflineQueue: () => set({ offlineQueueCount: 0 }),

  onlineOrders: seedOrders,
  pendingOrdersCount: countPending(seedOrders),
  lastCreatedOrderId: null,

  addOnlineOrder: (payload) => {
    const id = payload.id ?? makeOrderId();
    const order: OnlineOrder = {
      id,
      customerName: payload.customerName,
      customerWhatsApp: payload.customerWhatsApp,
      deliveryZone: payload.deliveryZone,
      items: payload.items,
      deliveryFee: payload.deliveryFee,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus,
      bkashTrxId: payload.bkashTrxId,
      status: "Pending",
      whatsappState: "sent_received",
      createdAt: new Date(),
      source: "web",
    };
    set((s) => {
      const next = [order, ...s.onlineOrders];
      return {
        onlineOrders: next,
        pendingOrdersCount: countPending(next),
        lastCreatedOrderId: id,
      };
    });
    return id;
  },

  acceptOrder: (id) =>
    set((s) => {
      const next = s.onlineOrders.map((o) =>
        o.id === id
          ? { ...o, status: "Preparing" as OrderStatus, whatsappState: "sent_accepted" as WhatsAppState }
          : o
      );
      return { onlineOrders: next, pendingOrdersCount: countPending(next) };
    }),

  markOrderReady: (id) =>
    set((s) => {
      const next = s.onlineOrders.map((o) =>
        o.id === id
          ? { ...o, status: "Out for Delivery" as OrderStatus, whatsappState: "sent_ready" as WhatsAppState }
          : o
      );
      return { onlineOrders: next, pendingOrdersCount: countPending(next) };
    }),

  markOrderDelivered: (id) =>
    set((s) => {
      const next = s.onlineOrders.map((o) =>
        o.id === id
          ? { ...o, status: "Delivered" as OrderStatus, whatsappState: "sent_delivered" as WhatsAppState }
          : o
      );
      return { onlineOrders: next, pendingOrdersCount: countPending(next) };
    }),

  rejectOrder: (id) =>
    set((s) => {
      const next = s.onlineOrders.map((o) =>
        o.id === id ? { ...o, status: "Rejected" as OrderStatus } : o
      );
      return { onlineOrders: next, pendingOrdersCount: countPending(next) };
    }),

  clearLastCreatedOrderId: () => set({ lastCreatedOrderId: null }),

  setPendingOrdersCount: () => {
    /* derived from onlineOrders now — kept for backwards compat */
  },
}));
