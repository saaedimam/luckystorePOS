'use client';

import React, { useState } from 'react';
import { useCart } from '@/store/useCart';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, MessageCircle, Loader2, User, Phone, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// This modal is a lightweight "quick checkout" option from the floating cart bar.
// Full checkout with delivery check lives at /checkout. Both paths lead to /order/[orderNumber].

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState<'cart' | 'success'>('cart');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', whatsapp: '', address: '' });

  const subtotal = total;
  const deliveryFee = 40;
  const grandTotal = subtotal + deliveryFee;

  const handleViewFullCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.id,
            quantity: i.quantity,
            unit_price: i.price,
          })),
          customer: {
            name: formData.name.trim(),
            whatsapp: formData.whatsapp.trim(),
            address: formData.address.trim(),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'অর্ডার দিতে সমস্যা হয়েছে।');
        return;
      }

      setStep('success');
      clearCart();
      setTimeout(() => {
        onClose();
        router.push(`/order/${data.orderNumber}`);
      }, 1800);
    } catch {
      setError('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-surface-overlay backdrop-blur-sm"
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="relative w-full max-w-md bg-surface-default rounded-t-3xl sm:rounded-3xl shadow-level-3 overflow-hidden"
        >
          {step === 'cart' ? (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black tracking-tight text-text-primary">অর্ডার করুন</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className={cn(
                    "p-2 hover:bg-background-subtle rounded-full",
                    "shadow-none hover:shadow-none"
                  )}
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Items summary */}
              <div className="bg-background-subtle rounded-2xl p-4 mb-4 space-y-2 max-h-40 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-text-secondary truncate mr-2">{item.name_bn || item.name_en} × {item.quantity}</span>
                    <span className="font-bold tabular-nums shrink-0">৳{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t border-border-default pt-2 flex justify-between font-black">
                  <span>মোট (+ ৳{deliveryFee} ডেলিভারি)</span>
                  <span className="tabular-nums text-primary-default">৳{grandTotal}</span>
                </div>
              </div>

              {/* Option 1: Full checkout (with GPS check) */}
              <Button
                onClick={handleViewFullCheckout}
                className={cn(
                  "w-full mb-3 premium-button bg-primary-default text-primary-on hover:bg-primary-hover shadow-level-2"
                )}
              >
                ডেলিভারি চেক করে অর্ডার দিন
              </Button>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-border-default" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">অথবা</span>
                <div className="flex-1 h-px bg-border-default" />
              </div>

              {/* Option 2: Quick order (no GPS — for returning customers) */}
              <form onSubmit={handleQuickSubmit} className="space-y-3">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest text-center">দ্রুত অর্ডার (পুরানো গ্রাহকদের জন্য)</p>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <input
                    required
                    type="text"
                    placeholder="আপনার নাম"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-background-subtle border border-border-default rounded-xl pl-10 pr-3 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-default/20 transition-all"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <input
                    required
                    type="tel"
                    placeholder="WhatsApp নম্বর"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full bg-background-subtle border border-border-default rounded-xl pl-10 pr-3 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-default/20 transition-all"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-text-muted" size={16} />
                  <textarea
                    required
                    rows={2}
                    placeholder="ডেলিভারি ঠিকানা"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-background-subtle border border-border-default rounded-xl pl-10 pr-3 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-default/20 transition-all resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs font-semibold text-danger-default bg-danger-subtle rounded-xl px-3 py-2">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading || items.length === 0}
                  className={cn(
                    "premium-button w-full bg-surface-raised text-text-primary border border-border-default hover:border-border-strong disabled:opacity-50",
                    "shadow-none hover:shadow-none"
                  )}
                >
                  {loading ? <><Loader2 size={18} className="animate-spin" /> প্রক্রিয়াকরণ...</> : 'অর্ডার কনফার্ম করুন (COD)'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center text-center px-6">
              <div className="w-20 h-20 bg-success-subtle text-success-default rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-2">অর্ডার সফল! 🎉</h3>
              <p className="text-text-secondary text-sm mb-6 px-4">
                ট্র্যাকিং পেজে নিয়ে যাওয়া হচ্ছে...
              </p>
              <div className="flex items-center gap-2 text-success-default font-bold animate-pulse">
                <MessageCircle size={20} />
                <span className="text-sm">Redirecting...</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
