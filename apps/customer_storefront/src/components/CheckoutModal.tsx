'use client';

import React, { useState } from 'react';
import { useCart } from '@/store/useCart';
import { supabase } from '@/lib/supabase';
import { X, MapPin, Phone, User, CheckCircle2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Card'>('COD');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Fetch Store & Tenant ID (hardcoded for now or fetch from a config)
      // For this demo, we assume store_id and tenant_id are known
      const STORE_ID = '00000000-0000-0000-0000-000000000000'; // Placeholder
      const TENANT_ID = '00000000-0000-0000-0000-000000000000'; // Placeholder

      // 2. Create Order
      const { data: order, error: orderError } = await supabase
        .from('online_orders')
        .insert({
          tenant_id: TENANT_ID,
          store_id: STORE_ID,
          customer_name: formData.name,
          customer_phone: formData.phone,
          delivery_address: formData.address,
          total_amount: total(),
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'COD' ? 'pending' : 'awaiting_payment',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Create Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        qty: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('online_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Handle Payment Redirect if not COD
      if (paymentMethod !== 'COD') {
        const functionName = paymentMethod === 'bKash' ? 'create-bkash-checkout' : 'create-card-checkout';
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(functionName, {
          body: { 
            amount: total(), 
            order_id: order.id,
            success_url: `${window.location.origin}/order/${order.id}?payment=success`,
            fail_url: `${window.location.origin}/order/${order.id}?payment=fail`,
            cancel_url: `${window.location.origin}/order/${order.id}?payment=cancel`,
          }
        });

        if (paymentError) throw paymentError;

        if (paymentData.bkashURL || paymentData.redirect_url) {
          window.location.href = paymentData.bkashURL || paymentData.redirect_url;
          return;
        }
      }

      // 5. Trigger WhatsApp Redirection (for COD or as fallback)
      const message = encodeURIComponent(
        `*NEW ORDER: #${order.id.substring(0, 8)}*\n\n` +
        `*Customer:* ${formData.name}\n` +
        `*Phone:* ${formData.phone}\n` +
        `*Address:* ${formData.address}\n\n` +
        `*Items:*\n` +
        items.map(i => `- ${i.name_en} x${i.quantity} (৳${i.price * i.quantity})`).join('\n') +
        `\n\n*Total: ৳${total()}*\n\n` +
        `Please confirm my order. Thank you!`
      );
      
      const whatsappUrl = `https://wa.me/8801XXXXXXXXX?text=${message}`;
      
      setStep('success');
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        clearCart();
        onClose();
        setStep('form');
      }, 2000);

    } catch (err) {
      console.error('Checkout error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-surface-overlay backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ y: '100%' }} 
          animate={{ y: 0 }} 
          exit={{ y: '100%' }}
          className="relative w-full max-w-md bg-surface-default rounded-t-3xl sm:rounded-3xl shadow-level-3 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black tracking-tight">অর্ডার সম্পন্ন করুন</h2>
              <button onClick={onClose} className="p-2 hover:bg-background-subtle rounded-full transition-colors"><X size={20} /></button>
            </div>

            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="আপনার নাম (Your Name)" 
                      className="w-full bg-background-subtle border border-border-default rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary-default/20 transition-all font-sans font-medium"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                      required
                      type="tel" 
                      placeholder="ফোন নম্বর (Phone Number)" 
                      className="w-full bg-background-subtle border border-border-default rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary-default/20 transition-all font-sans font-medium"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-text-muted" size={18} />
                    <textarea 
                      required
                      rows={3}
                      placeholder="ডেলিভারি ঠিকানা (Delivery Address)" 
                      className="w-full bg-background-subtle border border-border-default rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary-default/20 transition-all font-sans font-medium resize-none"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2">Payment Method</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'COD', label: 'Cash', icon: '৳' },
                      { id: 'bKash', label: 'bKash', icon: 'b' },
                      { id: 'Card', label: 'Card', icon: '💳' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={clsx(
                          "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                          paymentMethod === method.id 
                            ? "border-primary-default bg-primary-subtle/30 text-primary-default" 
                            : "border-border-default hover:border-text-muted text-text-muted"
                        )}
                      >
                        <span className="text-xl font-black">{method.icon}</span>
                        <span className="text-[10px] font-bold uppercase">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-primary-subtle/50 rounded-2xl p-4 border border-primary-default/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Total Payable</span>
                    <span className="text-xl font-black text-text-primary tracking-tighter">৳{total()}</span>
                  </div>
                  <p className="text-[10px] text-text-muted">Cash on Delivery (COD) available</p>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || items.length === 0}
                  className="premium-button w-full bg-primary-default text-primary-on hover:bg-primary-hover disabled:opacity-50 disabled:grayscale transition-all py-7 text-lg"
                >
                  {loading ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}
                </button>
              </form>
            ) : (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-success-subtle text-success-default rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-2">অর্ডার সফল হয়েছে!</h3>
                <p className="text-text-secondary text-sm mb-8 px-8">
                  আমরা আপনাকে হোয়াটসঅ্যাপে নিয়ে যাচ্ছি বিস্তারিত আলোচনার জন্য...
                </p>
                <div className="flex items-center gap-2 text-success-default font-bold animate-pulse">
                  <MessageCircle size={20} />
                  <span>Redirecting to WhatsApp...</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
