'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/store/useCart';
import { useRouter } from 'next/navigation';
import { User, Phone, MapPin, CheckCircle2, AlertCircle, Navigation, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import clsx from 'clsx';

type DeliveryState = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

interface DistanceResult {
  distance_km: number;
  is_within_zone: boolean;
  delivery_fee: number | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Delivery check state
  const [deliveryState, setDeliveryState] = useState<DeliveryState>('idle');
  const [deliveryResult, setDeliveryResult] = useState<DistanceResult | null>(null);

  useEffect(() => setMounted(true), []);

  const itemCount = items.reduce((a, i) => a + i.quantity, 0);
  const subtotal = total();
  const deliveryFee = deliveryResult?.delivery_fee ?? 40;
  const grandTotal = subtotal + deliveryFee;

  const errors = {
    name: !name.trim() && touched.name ? 'আপনার নাম প্রয়োজন' : null,
    whatsapp: (!whatsapp.trim() || !/^\d{10,15}$/.test(whatsapp.replace(/\D/g, ''))) && touched.whatsapp ? 'সঠিক WhatsApp নম্বর দিন' : null,
    address: !address.trim() && touched.address ? 'ডেলিভারি ঠিকানা দিন' : null,
  };

  const isFormValid = !errors.name && !errors.whatsapp && !errors.address && name && whatsapp && address;

  // ── Get user's GPS location and check ──────────────────────────────────────
  const checkDelivery = () => {
    setDeliveryState('checking');
    setDeliveryResult(null);

    if (!navigator.geolocation) {
      setDeliveryState('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);

        try {
          const res = await fetch('/api/distance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          const data: DistanceResult = await res.json();
          setDeliveryResult(data);
          setDeliveryState(data.is_within_zone ? 'available' : 'unavailable');
        } catch {
          setDeliveryState('error');
        }
      },
      () => setDeliveryState('error')
    );
  };

  // ── Place order ───────────────────────────────────────────────────────────
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, whatsapp: true, address: true });
    
    if (!isFormValid || deliveryState !== 'available') return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Pre-checkout Stock Check
      for (const item of items) {
        const stockRes = await fetch('/api/stock-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: item.id }),
        });
        const stockData = await stockRes.json();
        
        if (stockData.sellable < item.quantity) {
          setSubmitError(`দুঃখিত, '${item.name_bn || item.name_en}' এর পর্যাপ্ত স্টক নেই। মাত্র ${stockData.sellable} টি অবশিষ্ট আছে।`);
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.id,
            quantity: i.quantity,
            unit_price: i.price,
          })),
          customer: { name: name.trim(), whatsapp: whatsapp.trim(), address: address.trim() },
          lat: lat ?? undefined,
          lng: lng ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'অর্ডার দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        return;
      }

      clearCart();
      router.push(`/order/${data.orderNumber}`);
    } catch {
      setSubmitError('নেটওয়ার্ক সমস্যা। পুনরায় চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background-default flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-text-muted font-black uppercase tracking-widest text-[10px] mb-4">Cart is empty</p>
          <Button onClick={() => router.push('/')}>কেনাকাটা শুরু করুন</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-default pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-default/80 backdrop-blur-lg border-b border-border-default px-6 py-4 flex items-center gap-4 shadow-level-1">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-10 h-10 rounded-full bg-background-subtle flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-black tracking-tight text-text-primary leading-none font-bangla">চেকআউট</h1>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
            {itemCount} items · ৳{subtotal}
          </p>
        </div>
      </header>

      <div className="store-container !pt-6 space-y-6">
        {/* ── Customer Info ─────────────────────────────────────────────────── */}
        <section className="bg-surface-default border border-border-default rounded-3xl p-6 shadow-level-1 space-y-5">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted">আপনার তথ্য (Customer Info)</h2>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="customer-name" className="text-xs font-bold text-text-secondary px-1">আপনার নাম</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} aria-hidden="true" />
              <input
                id="customer-name"
                required
                type="text"
                placeholder="আপনার নাম লিখুন"
                value={name}
                onBlur={() => setTouched(t => ({...t, name: true}))}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                className={clsx(
                  "w-full bg-background-subtle border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 transition-all",
                  errors.name 
                    ? "border-danger-default focus:ring-danger-default/20 bg-danger-subtle/30" 
                    : "border-border-default focus:ring-[#D4A843]/20 focus:border-[#D4A843]"
                )}
              />
            </div>
            {errors.name && <p className="text-[10px] text-danger-default font-black px-1 uppercase tracking-wider">{errors.name}</p>}
          </div>

          {/* WhatsApp Field */}
          <div className="space-y-1.5">
            <label htmlFor="customer-whatsapp" className="text-xs font-bold text-text-secondary px-1">WhatsApp নম্বর</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} aria-hidden="true" />
              <input
                id="customer-whatsapp"
                required
                type="tel"
                placeholder="01XXXXXXXXX"
                value={whatsapp}
                onBlur={() => setTouched(t => ({...t, whatsapp: true}))}
                onChange={(e) => setWhatsapp(e.target.value)}
                aria-invalid={!!errors.whatsapp}
                className={clsx(
                  "w-full bg-background-subtle border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 transition-all",
                  errors.whatsapp 
                    ? "border-danger-default focus:ring-danger-default/20 bg-danger-subtle/30" 
                    : "border-border-default focus:ring-[#D4A843]/20 focus:border-[#D4A843]"
                )}
              />
            </div>
            {errors.whatsapp && <p className="text-[10px] text-danger-default font-black px-1 uppercase tracking-wider">{errors.whatsapp}</p>}
          </div>

          {/* Address Field */}
          <div className="space-y-1.5">
            <label htmlFor="customer-address" className="text-xs font-bold text-text-secondary px-1">ডেলিভারি ঠিকানা</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-text-muted" size={18} aria-hidden="true" />
              <textarea
                id="customer-address"
                required
                rows={3}
                placeholder="বাসা নম্বর, রোড, এলাকা..."
                value={address}
                onBlur={() => setTouched(t => ({...t, address: true}))}
                onChange={(e) => setAddress(e.target.value)}
                aria-invalid={!!errors.address}
                className={clsx(
                  "w-full bg-background-subtle border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 transition-all resize-none",
                  errors.address 
                    ? "border-danger-default focus:ring-danger-default/20 bg-danger-subtle/30" 
                    : "border-border-default focus:ring-[#D4A843]/20 focus:border-[#D4A843]"
                )}
              />
            </div>
            {errors.address && <p className="text-[10px] text-danger-default font-black px-1 uppercase tracking-wider">{errors.address}</p>}
          </div>
        </section>

        {/* ── Delivery Check ────────────────────────────────────────────────── */}
        <section className={clsx(
          "bg-surface-default border rounded-3xl p-6 shadow-level-1 space-y-4 transition-all",
          deliveryState === 'idle' ? "border-[#D4A843]/40 bg-[#FEF3C7]/5" : "border-border-default"
        )}>
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted">ডেলিভারি যাচাই</h2>
            {deliveryState === 'available' && <CheckCircle2 size={16} className="text-success-default" />}
          </div>

          <AnimatePresence mode="wait">
            {(deliveryState === 'idle' || deliveryState === 'error' || deliveryState === 'checking') && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <Button 
                  type="button" 
                  fullWidth 
                  variant="outline"
                  onClick={checkDelivery}
                  isLoading={deliveryState === 'checking'}
                  icon={Navigation}
                >
                  এলাকা যাচাই করুন
                </Button>
                <p className="text-[10px] text-text-muted text-center font-bold px-4">
                  অর্ডার দেওয়ার আগে আপনার লোকেশন যাচাই করা বাধ্যতামূলক।
                </p>
              </motion.div>
            )}

            {deliveryState === 'available' && deliveryResult && (
              <motion.div key="available" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-success-subtle border border-success-default/25 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 size={20} className="text-success-dark shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-success-dark font-bangla">ডেলিভারি পাওয়া যাবে! 🎉</p>
                  <p className="text-[10px] font-bold text-success-dark/80 mt-1 uppercase tracking-tight">
                    Dist: {deliveryResult.distance_km}km · Fee: ৳{deliveryResult.delivery_fee} · Time: 30-45m
                  </p>
                </div>
              </motion.div>
            )}

            {deliveryState === 'unavailable' && deliveryResult && (
              <motion.div key="unavailable" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-danger-subtle border border-danger-default/25 rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle size={20} className="text-danger-default shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-danger-default font-bangla">দুঃখিত, সার্ভিস এলাকার বাইরে</p>
                    <p className="text-[10px] font-bold text-danger-dark/80 mt-1">
                      আপনি {deliveryResult.distance_km} কিমি দূরে আছেন (সীমা ৫ কিমি)।
                    </p>
                  </div>
                </div>
                <Button variant="secondary" fullWidth onClick={() => window.location.href='tel:+8801XXXXXXXXX'}>সরাসরি কল করুন</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Order Summary ─────────────────────────────────────────────────── */}
        <section className="bg-surface-default border border-border-default rounded-3xl p-6 shadow-level-1">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">অর্ডার সারসংক্ষেপ</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-text-secondary font-bold truncate mr-3">
                  {item.name_bn || item.name_en} <span className="text-text-muted text-[10px] font-black tabular-nums">×{item.quantity}</span>
                </span>
                <span className="font-black tabular-nums text-text-primary shrink-0">৳{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border-default pt-4 space-y-2">
            <div className="flex justify-between text-xs font-bold text-text-secondary">
              <span>Subtotal</span>
              <span className="tabular-nums">৳{subtotal}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-text-secondary">
              <span>Delivery Fee</span>
              <span className="tabular-nums">৳{deliveryFee}</span>
            </div>
            <div className="flex justify-between font-black text-lg pt-2 border-t border-border-default">
              <span className="font-bangla">মোট (Total)</span>
              <span className="tabular-nums text-[#D4A843]">৳{grandTotal}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-background-subtle rounded-xl border border-dashed border-border-default">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] text-center">
              💵 COD — Cash on Delivery
            </p>
          </div>
        </section>

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {submitError && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-danger-subtle border border-danger-default/25 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-danger-default shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-danger-dark leading-relaxed">{submitError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Submit ────────────────────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-surface-default/80 backdrop-blur-xl border-t border-border-default z-50">
          <Button
            type="submit"
            fullWidth
            onClick={handlePlaceOrder}
            isLoading={submitting}
            disabled={!isFormValid || deliveryState !== 'available'}
          >
            অর্ডার নিশ্চিত করুন (Confirm Order)
          </Button>
          
          {deliveryState !== 'available' && isFormValid && (
            <p className="text-center text-[9px] text-[#D4A843] font-black uppercase tracking-widest mt-3 animate-pulse">
              Please verify delivery area above
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
