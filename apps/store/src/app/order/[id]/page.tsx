"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';
import { formatPrice, cn } from '@/lib/utils';
import { CheckCircle2, Clock, Package, Truck, MessageCircle, AlertTriangle } from 'lucide-react';

interface OnlineOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_whatsapp: string;
  customer_address: string;
  total: number;
  status: string;
  cancellation_reason?: string;
  created_at: string;
  subtotal: number;
  delivery_fee: number;
}

interface ProductDetails {
  name_en: string;
  name_bn: string;
}

interface OnlineOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total_price: number;
  products: ProductDetails | null;
}

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useCartStore();
  const [order, setOrder] = useState<OnlineOrder | null>(null);
  const [items, setItems] = useState<OnlineOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: o } = await supabase.from('online_orders').select('*').eq('id', id).single();
      const { data: i } = await supabase.from('online_order_items').select('*, products(name_en, name_bn)').eq('order_id', id);
      setOrder(o);
      setItems(i || []);
      setLoading(false);
    };

    fetchOrder();

    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'online_orders', filter: `id=eq.${id}` }, (payload) => {
        setOrder((current: OnlineOrder | null) => (current ? { ...current, ...payload.new as OnlineOrder } : null));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!order) return <div className="p-10 text-center text-text-muted">{lang === 'bn' ? 'অর্ডার পাওয়া যায়নি' : 'Order not found'}</div>;

  const steps = [
    { id: 'pending', labelBn: 'পেন্ডিং', labelEn: 'Pending', icon: Clock },
    { id: 'confirmed', labelBn: 'কনফার্মড', labelEn: 'Confirmed', icon: CheckCircle2 },
    { id: 'preparing', labelBn: 'প্রস্তুত হচ্ছে', labelEn: 'Preparing', icon: Package },
    { id: 'out_for_delivery', labelBn: 'ডেলিভারিতে', labelEn: 'Out for Delivery', icon: Truck },
    { id: 'delivered', labelBn: 'ডেলিভারি সম্পন্ন', labelEn: 'Delivered', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="p-4 space-y-6">
      <div className="text-center py-6">
        <h2 className="text-sm font-black text-text-muted uppercase tracking-widest mb-1">
          {lang === 'bn' ? 'অর্ডার নম্বর' : 'Order Number'}
        </h2>
        <div className="text-2xl font-black text-text-main tracking-tight">
          {order.order_number}
        </div>
      </div>

      {isCancelled ? (
        <div className="bg-danger/10 border border-danger/30 rounded-2xl p-6 text-center shadow-lg">
          <div className="w-12 h-12 bg-danger/20 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-black text-danger mb-2">
            {lang === 'bn' ? 'অর্ডার বাতিল করা হয়েছে' : 'Order Cancelled'}
          </h3>
          <p className="text-danger/80">
            {order.cancellation_reason || (lang === 'bn' ? 'অজানা কারণ' : 'Reason unknown')}
          </p>
        </div>
      ) : (
        <div className="bg-bg-card border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {steps.map((step, index) => {
              const isCompleted = currentStepIndex >= index;
              const isCurrent = currentStepIndex === index;
              const Icon = step.icon;

              return (
                <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={cn("flex items-center justify-center w-10 h-10 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2", isCompleted ? "bg-primary border-bg-card text-white" : "bg-bg-main border-white/5 text-text-muted")}>
                    <Icon size={16} />
                  </div>
                  <div className={cn("w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border shadow-lg", isCurrent ? "bg-primary/10 border-primary/30" : "bg-bg-main border-white/5")}>
                    <div className="flex items-center justify-between">
                      <h4 className={cn("font-bold text-sm", isCompleted ? "text-text-main" : "text-text-muted")}>
                        {lang === 'bn' ? step.labelBn : step.labelEn}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-bg-card border border-white/5 p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="font-bold text-text-main border-b border-white/10 pb-2">
          {lang === 'bn' ? 'অর্ডারের বিবরণ' : 'Order Details'}
        </h3>
        
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div className="flex-1 pr-4">
                <span className="font-bold text-text-main">
                  {lang === 'bn' ? formatPrice(item.quantity, 'bn').replace('৳','') : item.quantity}x
                </span>
                <span className="text-text-muted ml-2">
                  {lang === 'bn' ? (item.products?.name_bn || item.products?.name_en) : item.products?.name_en}
                </span>
              </div>
              <span className="text-text-main tabular-nums">
                {formatPrice(item.total_price, lang)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-white/10 space-y-2">
          <div className="flex justify-between text-sm text-text-muted">
            <span>{lang === 'bn' ? 'সাবটোটাল' : 'Subtotal'}</span>
            <span className="tabular-nums">{formatPrice(order.subtotal, lang)}</span>
          </div>
          <div className="flex justify-between text-sm text-text-muted">
            <span>{lang === 'bn' ? 'ডেলিভারি ফি' : 'Delivery Fee'}</span>
            <span className="tabular-nums">{formatPrice(order.delivery_fee, lang)}</span>
          </div>
          <div className="pt-2 flex justify-between text-lg font-black text-primary">
            <span>{lang === 'bn' ? 'মোট' : 'Total'}</span>
            <span className="tabular-nums">{formatPrice(order.total, lang)}</span>
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-white/5 p-6 rounded-2xl shadow-xl space-y-2 text-sm text-text-muted">
        <p><strong className="text-text-main">{lang === 'bn' ? 'নাম:' : 'Name:'}</strong> {order.customer_name}</p>
        <p><strong className="text-text-main">{lang === 'bn' ? 'নম্বর:' : 'Phone:'}</strong> {order.customer_whatsapp}</p>
        <p><strong className="text-text-main">{lang === 'bn' ? 'ঠিকানা:' : 'Address:'}</strong> {order.customer_address}</p>
      </div>

      <a 
        href={`https://wa.me/8801700000000?text=${encodeURIComponent(`Order ${order.order_number}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-4 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 font-black uppercase tracking-widest rounded-xl hover:bg-[#25D366]/20 transition-colors"
      >
        <MessageCircle size={20} />
        {lang === 'bn' ? 'হোয়াটসঅ্যাপ করুন' : 'Questions? WhatsApp us'}
      </a>
    </div>
  );
}
