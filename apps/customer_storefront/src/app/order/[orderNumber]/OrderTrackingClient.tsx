'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, PackageX, Loader2, MessageCircle, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name_en: string;
    name_bn: string | null;
    image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  customer_whatsapp: string;
  customer_address: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  online_order_items: OrderItem[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrderTrackingPage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const orderNumber = params?.orderNumber;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderNumber || orderNumber === 'sample-order') {
      setError('অর্ডারটি খুঁজে পাওয়া যায়নি।');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/order?orderNumber=${encodeURIComponent(orderNumber)}`);
      if (!res.ok) {
        setError('অর্ডারটি খুঁজে পাওয়া যায়নি।');
        setLoading(false);
        return;
      }
      const data: Order = await res.json();
      setOrder(data);
      setError(null);
    } catch {
      setError('নেটওয়ার্ক সমস্যা।');
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(() => {
      if (order?.status !== 'delivered' && order?.status !== 'cancelled') {
        fetchOrder();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrder, order?.status]);

  const trackingUrl = typeof window !== 'undefined' ? window.location.href : '';
  const whatsappShareText = encodeURIComponent(
    `আমার অর্ডার ট্র্যাক করুন: ${trackingUrl}\nঅর্ডার নম্বর: ${orderNumber}`
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-text-muted font-medium text-sm">Loading order...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-bg-canvas flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary font-bangla mb-2">অর্ডার পাওয়া যায়নি</h1>
          <p className="text-text-muted text-sm mb-6">{error || 'দয়া করে আবার চেষ্টা করুন।'}</p>
          <button
            onClick={() => router.push('/')}
            className="h-11 px-6 rounded-xl font-bold bg-primary text-text-primary hover:bg-primary-hover active:scale-95 transition-all"
          >
            হোমে যান
          </button>
        </div>
      </main>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  const getStatusColor = () => {
    if (isCancelled) return 'bg-rose-50 border-rose-100';
    if (isDelivered) return 'bg-emerald-50 border-emerald-100';
    return 'bg-primary/10 border-primary/20';
  };

  const getStatusText = () => {
    if (isCancelled) return 'Order Cancelled';
    if (isDelivered) return 'Order Delivered';
    return 'Live Tracking';
  };

  const getStatusBangla = () => {
    if (isCancelled) return 'বাতিল হয়েছে';
    if (isDelivered) return 'ডেলিভারি সম্পন্ন';
    if (order.status === 'pending') return 'অর্ডার হয়েছে';
    if (order.status === 'confirmed') return 'নিশ্চিত হয়েছে';
    if (order.status === 'preparing') return 'প্রস্তুত হচ্ছে';
    return 'ডেলিভারি পথে';
  };

  return (
    <main className="min-h-screen bg-bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-canvas/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-border-default">
        <div>
          <h1 className="text-base font-bold text-text-primary font-bangla">অর্ডার ট্র্যাকিং</h1>
          <p className="text-xs text-text-muted font-mono">{order.order_number}</p>
        </div>
        <a
          href={`https://wa.me/?text=${whatsappShareText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-emerald-100 transition-all"
        >
          <Share2 size={14} />
          শেয়ার
        </a>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 text-center border ${getStatusColor()}`}
        >
          <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${
            isCancelled ? 'text-rose-600' : isDelivered ? 'text-emerald-600' : 'text-primary'
          }`}>
            {getStatusText()}
          </p>
          <h2 className={`text-2xl font-bold font-bangla ${
            isCancelled ? 'text-rose-600' : isDelivered ? 'text-emerald-600' : 'text-text-primary'
          }`}>
            {getStatusBangla()}
          </h2>
          {!isCancelled && !isDelivered && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs text-text-muted">Auto-refreshing</p>
            </div>
          )}
        </motion.div>

        {/* Order Items */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
          <h3 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wider">অর্ডারকৃত পণ্য</h3>
          <div className="space-y-3">
            {order.online_order_items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-bg-canvas overflow-hidden shrink-0">
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt={item.products.name_en} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">🛒</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate font-bangla">
                    {item.products?.name_bn || item.products?.name_en || 'Product'}
                  </p>
                  <p className="text-xs text-text-muted">× {item.quantity}</p>
                </div>
                <p className="font-bold text-text-primary tabular-nums shrink-0">৳{item.total_price}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border-default mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-xs text-text-muted">
              <span>সাবটোটাল</span>
              <span className="tabular-nums font-medium">৳{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>ডেলিভারি</span>
              <span className="tabular-nums font-medium">৳{order.delivery_fee}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border-default">
              <span className="font-bangla">মোট</span>
              <span className="tabular-nums text-primary">৳{order.total}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
          <h3 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wider">ডেলিভারি তথ্য</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-text-muted text-xs w-20 shrink-0">নাম</span>
              <span className="text-text-primary text-sm font-medium font-bangla">{order.customer_name}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted text-xs w-20 shrink-0">WhatsApp</span>
              <a href={`tel:${order.customer_whatsapp}`} className="text-primary text-sm font-medium hover:underline">
                {order.customer_whatsapp}
              </a>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted text-xs w-20 shrink-0">ঠিকানা</span>
              <span className="text-text-primary text-sm leading-relaxed font-bangla">{order.customer_address}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pb-8">
          <button
            onClick={() => window.open(`https://wa.me/8801XXXXXXXXX?text=${encodeURIComponent(`অর্ডার #${order.order_number} সম্পর্কে জিজ্ঞাসা করতে চাই।`)}`, '_blank')}
            className="w-full h-12 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} />
            WhatsApp-এ যোগাযোগ করুন
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full h-12 rounded-xl font-bold bg-bg-surface border border-border-default text-text-primary hover:bg-bg-canvas active:scale-[0.98] transition-all"
          >
            ← কেনাকাটা চালিয়ে যান
          </button>
        </div>
      </div>
    </main>
  );
}
