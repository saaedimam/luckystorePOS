'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  CheckCircle2, 
  Truck, 
  Clock, 
  MapPin, 
  MessageCircle, 
  ShoppingBag,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  status: OrderStatus;
  delivery_address: string;
  created_at: string;
}

const statusSteps: { status: OrderStatus; label: string; icon: any; color: string }[] = [
  { status: 'pending', label: 'অর্ডার জমা হয়েছে', icon: Clock, color: 'text-warning-default' },
  { status: 'confirmed', label: 'অর্ডার গ্রহণ করা হয়েছে', icon: CheckCircle2, color: 'text-info-default' },
  { status: 'preparing', label: 'প্যাকিং হচ্ছে', icon: Package, color: 'text-secondary-default' },
  { status: 'out_for_delivery', label: 'ডেলিভারি পথে', icon: Truck, color: 'text-primary-default' },
  { status: 'delivered', label: 'ডেলিভারি সম্পন্ন', icon: CheckCircle2, color: 'text-success-default' },
];

export default function OrderStatusPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from('online_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
      } else {
        setOrder(data);
      }
      setLoading(false);
    }

    fetchOrder();

    // Realtime subscription for status updates
    const subscription = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'online_orders',
        filter: `id=eq.${id}` 
      }, (payload) => {
        setOrder(payload.new as Order);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-default">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-default"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-default p-6 text-center">
        <div className="w-20 h-20 bg-danger-subtle text-danger-default rounded-full flex items-center justify-center mb-6">
          <ArrowLeft size={32} />
        </div>
        <h1 className="text-2xl font-black mb-2">অর্ডার খুঁজে পাওয়া যায়নি</h1>
        <p className="text-text-secondary mb-8">দয়া করে অর্ডার আইডিটি পুনরায় পরীক্ষা করুন।</p>
        <Link href="/" className="premium-button bg-primary-default text-primary-on w-full max-w-xs">
          হোম পেজে ফিরে যান
        </Link>
      </div>
    );
  }

  const currentStatusIndex = statusSteps.findIndex(s => s.status === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <main className="min-h-screen bg-background-default pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-default/80 backdrop-blur-lg border-b border-border-default px-6 py-4 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-background-subtle rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-black tracking-tight">অর্ডার ট্র্যাকিং</h1>
      </header>

      <div className="store-container !pt-6">
        {/* Order Info Card */}
        <div className="glass-card rounded-3xl p-6 mb-8 border-primary-default/10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Order ID</p>
              <h2 className="text-xl font-black font-mono tracking-tighter">#{order.id.substring(0, 8).toUpperCase()}</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Total Amount</p>
              <h2 className="text-xl font-black tracking-tighter">৳{order.total_amount}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-background-subtle rounded-2xl">
            <MapPin size={18} className="text-text-muted shrink-0" />
            <p className="text-xs font-medium text-text-secondary line-clamp-2">{order.delivery_address}</p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="glass-card rounded-3xl p-8 mb-8">
          <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-text-muted">Order Progress</h3>
          
          {isCancelled ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-16 h-16 bg-danger-subtle text-danger-default rounded-full flex items-center justify-center mb-4">
                <X size={32} />
              </div>
              <h4 className="text-lg font-black text-danger-default">অর্ডারটি বাতিল করা হয়েছে</h4>
              <p className="text-xs text-text-secondary mt-1">দুঃখিত, কোনো সমস্যার কারণে অর্ডারটি বাতিল হয়েছে।</p>
            </div>
          ) : (
            <div className="space-y-10 relative">
              {/* Progress Line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border-default" />
              <div 
                className="absolute left-[15px] top-2 w-0.5 bg-primary-default transition-all duration-1000" 
                style={{ height: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
              />

              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={step.status} className="flex items-center gap-6 relative z-10">
                    <div className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500",
                      isActive ? "bg-primary-default text-primary-on shadow-lg" : "bg-surface-default border-2 border-border-default text-text-muted"
                    )}>
                      {isActive ? <Icon size={16} /> : <div className="w-2 h-2 rounded-full bg-border-default" />}
                    </div>
                    <div>
                      <p className={clsx(
                        "text-sm font-bold tracking-tight transition-colors duration-500",
                        isActive ? "text-text-primary" : "text-text-muted"
                      )}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <motion.p 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[10px] text-primary-default font-black uppercase tracking-widest mt-0.5"
                        >
                          Current State
                        </motion.p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* WhatsApp Support Button */}
        <button className="premium-button w-full bg-success-default text-success-on hover:bg-success-hover flex items-center justify-center gap-3">
          <MessageCircle size={24} />
          <span>আমাদের সাথে কথা বলুন (WhatsApp)</span>
        </button>
      </div>
    </main>
  );
}

function X({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}

function clsx(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
