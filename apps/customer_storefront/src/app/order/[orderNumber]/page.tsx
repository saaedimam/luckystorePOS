'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Package, Truck, Home, Share2, MessageCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { OrderStatusStepper } from '@/components/OrderStatusStepper';
import { Button } from '@/components/ui/Button';

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
    if (!orderNumber) return;
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
      <main className="min-h-screen bg-background-default flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-[#D4A843]" />
          <p className="text-text-muted font-bold uppercase tracking-widest text-[10px]">Loading order...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-background-default flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-danger-subtle rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😕</span>
          </div>
          <h1 className="text-xl font-black text-text-primary mb-2 font-bangla">অর্ডার পাওয়া যায়নি</h1>
          <p className="text-text-muted text-sm mb-8">{error || 'দয়া করে আবার চেষ্টা করুন।'}</p>
          <Button onClick={() => router.push('/')}>হোমে যান</Button>
        </div>
      </main>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  return (
    <main className="min-h-screen bg-background-default">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-default/80 backdrop-blur-lg border-b border-border-default px-6 py-4 shadow-level-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-black tracking-tight text-text-primary leading-none font-bangla">অর্ডার ট্র্যাকিং</h1>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1.5 font-mono">{order.order_number}</p>
          </div>
          <a
            href={`https://wa.me/?text=${whatsappShareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-success-subtle text-success-dark border border-success-default/20 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-success-subtle/80 transition-all"
          >
            <Share2 size={12} />
            Share
          </a>
        </div>
      </header>

      <div className="store-container !pt-6 space-y-6">
        {/* ── Status Banner ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            'rounded-3xl p-8 text-center border shadow-level-2',
            isCancelled
              ? 'bg-danger-subtle border-danger-default/25'
              : isDelivered
              ? 'bg-success-subtle border-success-default/25'
              : 'bg-[#FEF3C7]/10 border-[#D4A843]/20'
          )}
        >
          <p className={clsx(
            'text-[10px] font-black uppercase tracking-[0.2em] mb-3',
            isCancelled ? 'text-danger-dark' : isDelivered ? 'text-success-dark' : 'text-[#D4A843]'
          )}>
            {isCancelled ? 'Order Cancelled' : isDelivered ? 'Order Delivered' : 'Live Tracking'}
          </p>
          <h2 className={clsx(
            'text-3xl font-black tracking-tight font-bangla',
            isCancelled ? 'text-danger-default' : isDelivered ? 'text-success-dark' : 'text-[#0F172A]'
          )}>
            {isCancelled ? 'বাতিল হয়েছে' : isDelivered ? 'ডেলিভারি সম্পন্ন' : 
              order.status === 'pending' ? 'অর্ডার হয়েছে' : 
              order.status === 'confirmed' ? 'নিশ্চিত হয়েছে' :
              order.status === 'preparing' ? 'প্রস্তুত হচ্ছে' : 'ডেলিভারি পথে'}
          </h2>
          {!isCancelled && !isDelivered && (
            <div className="flex items-center justify-center gap-2 mt-3">
               <div className="w-1.5 h-1.5 bg-success-default rounded-full animate-pulse" />
               <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Auto-refreshing</p>
            </div>
          )}
        </motion.div>

        {/* ── Status Stepper ───────────────────────────────────────────────── */}
        <OrderStatusStepper status={order.status} />

        {/* ── Order Items ───────────────────────────────────────────────────── */}
        <div className="bg-surface-default border border-border-default rounded-3xl p-6 shadow-level-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">অর্ডারকৃত পণ্য</h3>
          <div className="space-y-3">
            {order.online_order_items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-background-subtle overflow-hidden shrink-0">
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt={item.products.name_en} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🛒</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate font-bangla">
                    {item.products?.name_bn || item.products?.name_en || 'Product'}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">× {item.quantity}</p>
                </div>
                <p className="font-black tabular-nums text-text-primary shrink-0">৳{item.total_price}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border-default mt-4 pt-4 space-y-1">
            <div className="flex justify-between text-xs font-bold text-text-secondary">
              <span>Subtotal</span>
              <span className="tabular-nums font-semibold">৳{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-text-secondary">
              <span>Delivery</span>
              <span className="tabular-nums font-semibold">৳{order.delivery_fee}</span>
            </div>
            <div className="flex justify-between font-black text-lg pt-1 border-t border-border-default">
              <span className="font-bangla text-sm">মোট</span>
              <span className="tabular-nums text-[#D4A843]">৳{order.total}</span>
            </div>
          </div>
        </div>

        {/* ── Customer Info ─────────────────────────────────────────────────── */}
        <div className="bg-surface-default border border-border-default rounded-3xl p-6 shadow-level-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">ডেলিভারি তথ্য</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-text-muted text-[10px] uppercase font-black w-20 shrink-0">নাম</span>
              <span className="text-text-primary text-sm font-bold font-bangla">{order.customer_name}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted text-[10px] uppercase font-black w-20 shrink-0">WhatsApp</span>
              <a href={`tel:${order.customer_whatsapp}`} className="text-[#D4A843] text-sm font-bold hover:underline">
                {order.customer_whatsapp}
              </a>
            </div>
            <div className="flex gap-3">
              <span className="text-text-muted text-[10px] uppercase font-black w-20 shrink-0">ঠিকানা</span>
              <span className="text-text-primary text-sm font-semibold leading-relaxed font-bangla">{order.customer_address}</span>
            </div>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="space-y-4 pb-8">
          <Button
            variant="primary"
            fullWidth
            className="!bg-[#25D366] !text-white hover:!bg-[#1DA851] shadow-level-2 border-transparent"
            icon={MessageCircle}
            onClick={() => window.open(`https://wa.me/8801XXXXXXXXX?text=${encodeURIComponent(`অর্ডার #${order.order_number} সম্পর্কে জিজ্ঞাসা করতে চাই।`)}`, '_blank')}
          >
            WhatsApp-এ যোগাযোগ করুন
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => router.push('/')}
          >
            ← কেনাকাটা চালিয়ে যান
          </Button>
        </div>
      </div>
    </main>
  );
}
