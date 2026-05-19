import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Phone, 
  MapPin, 
  ChevronRight,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnlineOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function OnlineOrdersPage() {
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('online_orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching online orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel('online-orders-queue')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'online_orders' 
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('online_orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
      fetchOrders();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning-subtle text-warning-default border-warning-default/20';
      case 'confirmed': return 'bg-info-subtle text-info-default border-info-default/20';
      case 'preparing': return 'bg-secondary-subtle text-secondary-default border-secondary-default/20';
      case 'out_for_delivery': return 'bg-primary-subtle text-primary-default border-primary-default/20';
      case 'delivered': return 'bg-success-subtle text-success-default border-success-default/20';
      case 'cancelled': return 'bg-danger-subtle text-danger-default border-danger-default/20';
      default: return 'bg-background-subtle text-text-muted border-border-default';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-default">
      {/* Header */}
      <header className="p-8 border-b border-border-default flex items-center justify-between bg-surface-default/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">অনলাইন অর্ডার</h1>
          <p className="text-text-secondary mt-1 flex items-center gap-2">
            <ShoppingBag size={16} /> 
            {orders.filter(o => o.status === 'pending').length} টি নতুন অর্ডার অপেক্ষমাণ
          </p>
        </div>
        <button 
          onClick={fetchOrders}
          className="p-3 hover:bg-background-subtle rounded-full transition-all text-text-secondary active:rotate-180 duration-500"
        >
          <RefreshCcw size={20} />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Orders List */}
        <div className="w-1/2 overflow-y-auto p-8 space-y-4 border-r border-border-default scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedOrder(order)}
                className={clsx(
                  "glass-card p-6 rounded-3xl cursor-pointer transition-all border-2",
                  selectedOrder?.id === order.id ? "border-primary-default shadow-level-2 scale-[1.02]" : "border-transparent hover:border-border-default hover:bg-surface-default"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-background-subtle rounded-2xl flex items-center justify-center text-text-primary">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg">{order.customer_name}</h3>
                      <p className="text-xs text-text-secondary font-mono tracking-tighter">#{order.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <span className={clsx(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    getStatusColor(order.status)
                  )}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <MapPin size={14} />
                    <span className="truncate max-w-[200px]">{order.delivery_address}</span>
                  </div>
                  <span className="text-lg font-black text-text-primary">৳{order.total_amount}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {orders.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-text-muted py-20">
              <ShoppingBag size={64} opacity={0.1} className="mb-4" />
              <p className="font-bold uppercase tracking-widest text-xs">No orders found</p>
            </div>
          )}
        </div>

        {/* Order Details Panel */}
        <div className="w-1/2 bg-surface-default/30 p-12 overflow-y-auto">
          {selectedOrder ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black tracking-tight">অর্ডার ডিটেইলস</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                    className="p-3 text-danger-default hover:bg-danger-subtle rounded-2xl transition-all"
                  >
                    <XCircle size={24} />
                  </button>
                  <button 
                    onClick={() => updateStatus(selectedOrder.id, 'confirmed')}
                    className="p-3 bg-primary-default text-primary-on hover:bg-primary-hover rounded-2xl shadow-level-2 transition-all"
                  >
                    <CheckCircle2 size={24} />
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <section className="bg-white/50 rounded-3xl p-8 border border-border-default shadow-level-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-6">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-background-subtle rounded-xl flex items-center justify-center text-text-secondary"><Phone size={18} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-text-muted">Phone Number</p>
                        <p className="font-bold">{selectedOrder.customer_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-background-subtle rounded-xl flex items-center justify-center text-text-secondary"><MapPin size={18} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-text-muted">Delivery Address</p>
                        <p className="font-bold text-sm line-clamp-1">{selectedOrder.delivery_address}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Process Order</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => updateStatus(selectedOrder.id, 'preparing')}
                      className="p-6 glass-card rounded-3xl hover:bg-white transition-all flex flex-col items-center gap-3 border-2 border-transparent hover:border-secondary-default/20 text-secondary-default"
                    >
                      <Package size={32} />
                      <span className="font-black text-sm uppercase">Packing</span>
                    </button>
                    <button 
                      onClick={() => updateStatus(selectedOrder.id, 'out_for_delivery')}
                      className="p-6 glass-card rounded-3xl hover:bg-white transition-all flex flex-col items-center gap-3 border-2 border-transparent hover:border-primary-default/20 text-primary-default"
                    >
                      <Truck size={32} />
                      <span className="font-black text-sm uppercase">Dispatch</span>
                    </button>
                  </div>
                </section>

                <div className="flex items-center gap-2 p-4 bg-info-subtle text-info-default rounded-2xl border border-info-default/20">
                  <AlertCircle size={18} />
                  <p className="text-xs font-bold">Status updates will automatically notify the customer via WhatsApp.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-muted">
              <RefreshCcw size={48} className="animate-spin-slow mb-4 opacity-10" />
              <p className="font-bold uppercase tracking-widest text-xs opacity-30">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Package({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.27 6.96 8.73 5.04 8.73-5.04"></path><path d="M12 22.08V12"></path></svg>;
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
