"use client";

import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, lang, getSubtotal, clearCart } = useCartStore();

  const router = useRouter();

  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate BD WhatsApp: 01[3-9]XXXXXXXX
    const waRegex = /^01[3-9]\d{8}$/;
    if (!waRegex.test(whatsapp.replace(/\D/g, ''))) {
      setError(lang === 'bn' ? 'সঠিক হোয়াটসঅ্যাপ নম্বর দিন (যেমন: 01712345678)' : 'Enter a valid BD WhatsApp number (e.g. 01712345678)');
      return;
    }

    if (items.length === 0) {
      setError(lang === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      
      const payload = {
        p_store_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab', // Replace with dynamic store_id in prod
        p_customer_name: name,
        p_whatsapp: whatsapp,
        p_address: address,
        p_items: items,
        p_subtotal: subtotal,
        p_delivery_fee: deliveryFee,
        p_total: total
      };

      const { data: result, error: orderError } = await supabase.rpc('place_online_order', payload);

      if (orderError) throw orderError;
      if (!result.success) throw new Error('Order placement failed');

      const order = { id: result.order_id };

      clearCart();
      router.push(`/order/${order.id}`);

    } catch (err: unknown) {
      console.error(err);
      setError(lang === 'bn' ? 'অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-xl font-black text-text-main mb-4">
          {lang === 'bn' ? 'কার্ট খালি' : 'Cart Empty'}
        </h2>
        <Link href="/" className="text-primary font-bold">
          {lang === 'bn' ? 'ফিরে যান' : 'Go back'}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col min-h-full">
      <div className="flex items-center gap-4 mb-6 px-2">
        <Link href="/cart" className="text-text-muted hover:text-text-main">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-xl font-black uppercase tracking-widest">
          {lang === 'bn' ? 'চেকআউট' : 'Checkout'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-6">
        <div className="bg-bg-card border border-white/5 p-6 rounded-2xl shadow-lg space-y-5">
          <div>
            <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">
              {lang === 'bn' ? 'পুরো নাম' : 'Full Name'}
            </label>
            <input 
              required
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary transition-colors"
              placeholder={lang === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">
              {lang === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর' : 'WhatsApp Number'}
            </label>
            <input 
              required
              type="tel" 
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary transition-colors"
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">
              {lang === 'bn' ? 'ডেলিভারি ঠিকানা' : 'Delivery Address'}
            </label>
            <textarea 
              required
              rows={3}
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder={lang === 'bn' ? 'বিস্তারিত ঠিকানা লিখুন' : 'Enter full delivery address'}
            />
          </div>
        </div>

        <div className="bg-bg-card border border-white/5 p-6 rounded-2xl shadow-lg">
          <label className="block text-sm font-bold text-text-muted mb-4 uppercase tracking-wide">
            {lang === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}
          </label>
          <div className="flex items-center gap-3 border border-primary/30 bg-primary/10 rounded-xl p-4 text-primary">
            <CheckCircle2 size={20} />
            <span className="font-bold">
              {lang === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery (COD)'}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-bg-card border border-white/5 p-6 rounded-2xl shadow-lg space-y-4">
          <div className="flex justify-between text-text-muted">
            <span>{lang === 'bn' ? 'সাবটোটাল' : 'Subtotal'}</span>
            <span className="tabular-nums">{formatPrice(subtotal, lang)}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>{lang === 'bn' ? 'ডেলিভারি' : 'Delivery'}</span>
            <span className="tabular-nums">{formatPrice(deliveryFee, lang)}</span>
          </div>
          <div className="pt-4 border-t border-white/10 flex justify-between text-lg font-black text-text-main">
            <span>{lang === 'bn' ? 'মোট' : 'Total'}</span>
            <span className="text-primary tabular-nums">{formatPrice(total, lang)}</span>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              lang === 'bn' ? 'অর্ডার কনফার্ম করুন' : 'Place Order'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
