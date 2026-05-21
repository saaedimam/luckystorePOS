import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrderQueue, OnlineOrder } from '@/stores/useOrderQueue';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Phone,
  MapPin,
  RefreshCcw,
  AlertCircle,
  CreditCard,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

// Utility for CSS classes
function clsx(...classes: unknown[]) {
  return classes.filter(Boolean).join(' ');
}

// Icons
function PackageIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.27 6.96 8.73 5.04 8.73-5.04"></path><path d="M12 22.08V12"></path></svg>;
}

// Sub-component for Order details to keep code clean
function OrderDetailsPane({ 
  selectedOrder, 
  onAccept, 
  onDecline, 
  onMarkProcessing, 
  onMarkReady, 
  onMarkDelivered 
}: { 
  selectedOrder: OnlineOrder, 
  onAccept: () => void, 
  onDecline: () => void,
  onMarkProcessing: () => void,
  onMarkReady: () => void,
  onMarkDelivered: () => void
}) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (supabase as any).from('online_order_items')
      .select('*, product:products(*)')
      .eq('order_id', selectedOrder.id)
      .then(({ data }: { data: any }) => setItems(data || []));
  }, [selectedOrder.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black tracking-tight font-bangla">অর্ডার ডিটেইলস <span className="font-sans text-lg text-text-muted">({selectedOrder.order_number})</span></h2>
        
        {/* Action Dashboard based on Status */}
        <div className="flex gap-2 font-bangla">
          {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'pending') && (
            <>
              <Button variant="danger" onClick={onDecline} icon={<XCircle size={20} />}>বাতিল করুন (Decline)</Button>
              <Button variant="primary" onClick={onAccept} icon={<CheckCircle2 size={20} />}>গ্রহণ করুন (Accept)</Button>
            </>
          )}
          {(selectedOrder.status === 'ACCEPTED' || selectedOrder.status === 'confirmed') && (
            <Button variant="primary" onClick={onMarkProcessing} icon={<PackageIcon size={20} />}>প্যাকেজিং শুরু (Start Processing)</Button>
          )}
          {(selectedOrder.status === 'PROCESSING' || selectedOrder.status === 'preparing') && (
            <Button variant="primary" onClick={onMarkReady} icon={<Truck size={20} />}>ডেলিভারির জন্য প্রস্তুত (Ready for Dispatch)</Button>
          )}
          {(selectedOrder.status === 'READY_FOR_PICKUP' || selectedOrder.status === 'out_for_delivery') && (
            <Button variant="outline" className="text-success-default border-success-default/20 hover:bg-success-subtle" onClick={onMarkDelivered} icon={<CheckCircle2 size={20} />}>ডেলিভারি সম্পন্ন (Mark Delivered)</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <section className="bg-white/50 rounded-3xl p-6 border border-border-default shadow-level-1">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4 font-sans">Customer Info</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-background-subtle rounded-xl flex items-center justify-center text-text-secondary"><Phone size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-text-muted font-sans">WhatsApp</p>
                <p className="font-bold">{selectedOrder.customer_whatsapp}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-background-subtle rounded-xl flex items-center justify-center text-text-secondary"><MapPin size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-text-muted font-sans">Delivery Address</p>
                <p className="font-bold text-sm font-bangla">{selectedOrder.delivery_address}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/50 rounded-3xl p-6 border border-border-default shadow-level-1 flex flex-col justify-center">
           <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-bold text-text-muted font-sans">Subtotal</span>
             <span className="font-bold">৳{selectedOrder.subtotal}</span>
           </div>
           <div className="flex items-center justify-between mb-4 pb-4 border-b border-border-default">
             <span className="text-sm font-bold text-text-muted font-sans">Delivery Fee</span>
             <span className="font-bold">৳{selectedOrder.delivery_fee}</span>
           </div>
           <div className="flex items-center justify-between">
             <span className="text-lg font-black font-sans">Total Payable</span>
             <span className="text-2xl font-black text-primary-default">৳{selectedOrder.total}</span>
           </div>
        </section>
      </div>

      {/* Items Table */}
      <div className="flex-1 bg-white/50 border border-border-default rounded-3xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-default bg-surface-default/50">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted font-sans">Order Items</h4>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-text-muted border-b border-border-default">
                <th className="pb-2 font-sans">Item</th>
                <th className="pb-2 text-center font-sans">Qty</th>
                <th className="pb-2 text-right font-sans">Price</th>
                <th className="pb-2 text-right font-sans">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border-default/50 last:border-0">
                  <td className="py-3 font-bangla font-medium">{item.product?.name || 'Unknown Product'}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">৳{item.unit_price}</td>
                  <td className="py-3 text-right font-bold">৳{item.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

export default function OnlineOrdersPage() {
  const { tenantId } = useAuth();
  const { 
    orders, 
    selectedOrderId, 
    initializeSubscription, 
    initializeAudioContext,
    setSelectedOrderId, 
    pushToPosCart,
    clearNewFlag
  } = useOrderQueue();

  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'dispatched'>('pending');

  // Trigger AudioContext on first click in this container
  const handleContainerInteraction = () => {
    initializeAudioContext();
  };

  useEffect(() => {
    if (tenantId) {
      initializeSubscription(tenantId);
    }
  }, [tenantId, initializeSubscription]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Filter orders for tabs
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'pending');
  const activeOrders = orders.filter(o => ['ACCEPTED', 'confirmed', 'PROCESSING', 'preparing'].includes(o.status));
  const dispatchedOrders = orders.filter(o => ['READY_FOR_PICKUP', 'out_for_delivery', 'delivered'].includes(o.status));

  const displayOrders = activeTab === 'pending' ? pendingOrders 
                      : activeTab === 'active' ? activeOrders 
                      : dispatchedOrders;

  const updateStatus = async (orderId: string, status: string, reason?: string) => {
    // Determine which RPC to use. New RPC uses p_operation_id for idempotency.
    if (status === 'ACCEPTED') {
      const { error } = await (supabase as any).rpc('accept_online_order', {
        p_operation_id: crypto.randomUUID(),
        p_order_id: orderId,
        p_tenant_id: tenantId
      });
      if (error) toast.error('Failed to accept order: ' + error.message);
      else toast.success('Order Accepted');
    } else {
      const { error } = await (supabase as any).rpc('update_online_order_status', { 
        p_order_id: orderId, 
        p_new_status: status, 
        p_reason: reason || null 
      });
      if (error) toast.error('Failed to update status: ' + error.message);
      else toast.success(`Order marked as ${status}`);
    }
  };



  return (
    <SectionErrorBoundary sectionName="Online Orders Workspace">
      <div 
        className="flex-1 flex flex-col h-full bg-background-default"
        onClick={handleContainerInteraction} // Lazy initialize AudioContext
        onKeyDown={handleContainerInteraction}
      >
        <header className="p-6 border-b border-border-default flex items-center justify-between bg-surface-default/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight font-bangla text-text-primary">অনলাইন অর্ডার <span className="font-sans text-lg">(Online Orders)</span></h1>
            <p className="text-text-secondary mt-1 flex items-center gap-2 font-sans text-sm">
              <ShoppingBag size={16} /> 
              {pendingOrders.length} new orders pending
            </p>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Column 1: Order Queue Stream (25%) */}
          <div className="w-1/4 flex flex-col border-r border-border-default bg-surface-default/30">
            <div className="flex p-4 gap-2 border-b border-border-default font-sans">
              {(['pending', 'active', 'dispatched'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors",
                    activeTab === tab ? "bg-primary-default text-white shadow-md" : "text-text-muted hover:bg-background-subtle"
                  )}
                >
                  {tab}
                  {tab === 'pending' && pendingOrders.length > 0 && (
                    <span className="ml-2 bg-white text-primary-default px-1.5 py-0.5 rounded-full text-[10px]">
                      {pendingOrders.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {displayOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      if (order.isNew) clearNewFlag(order.id);
                    }}
                    className={clsx(
                      "p-4 rounded-2xl cursor-pointer transition-all border-2 bg-white/50",
                      selectedOrderId === order.id ? "border-primary-default shadow-level-1" : "border-transparent hover:border-border-default",
                      order.isNew ? "animate-pulse border-warning-default shadow-warning-default/20" : ""
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-text-secondary font-mono tracking-tighter">#{order.order_number}</p>
                      <span className="text-[10px] text-text-muted flex items-center gap-1 font-sans">
                        <Clock size={10} />
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-1 font-bangla line-clamp-1">{order.customer_name}</h3>
                    
                    <div className="flex items-center justify-between mt-3 font-sans">
                      <span className="text-xs font-bold px-2 py-1 bg-background-subtle rounded-md flex items-center gap-1">
                        <CreditCard size={12} />
                        {order.payment_method.toUpperCase()}
                      </span>
                      <span className="font-black text-primary-default">৳{order.total}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {displayOrders.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-text-muted py-10 opacity-50">
                  <ShoppingBag size={48} className="mb-4" />
                  <p className="font-bold uppercase tracking-widest text-[10px] font-sans">Queue Empty</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Live Processing Pane (50%) */}
          <div className="w-2/4 bg-surface-default/10 p-8 overflow-y-auto border-r border-border-default relative">
            {selectedOrder ? (
              <OrderDetailsPane 
                selectedOrder={selectedOrder} 
                onAccept={() => updateStatus(selectedOrder.id, 'ACCEPTED')}
                onDecline={() => {
                  const reason = window.prompt("Cancellation reason:", "স্টক নেই (Out of stock)");
                  if (reason) updateStatus(selectedOrder.id, 'CANCELLED', reason);
                }}
                onMarkProcessing={() => updateStatus(selectedOrder.id, 'PROCESSING')}
                onMarkReady={() => updateStatus(selectedOrder.id, 'READY_FOR_PICKUP')}
                onMarkDelivered={() => updateStatus(selectedOrder.id, 'DELIVERED')}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
                <RefreshCcw size={48} className="mb-4 opacity-10" />
                <p className="font-bold uppercase tracking-widest text-xs opacity-30 font-sans">Select an order</p>
              </div>
            )}
          </div>

          {/* Column 3: POS Quick Integration Panel (25%) */}
          <div className="w-1/4 bg-surface-default/50 p-6 flex flex-col items-center justify-center font-sans">
            <div className="bg-white/50 border border-border-default rounded-3xl p-6 text-center w-full shadow-level-1">
              <div className="w-16 h-16 bg-primary-subtle text-primary-default rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-lg font-black mb-2">POS Integration</h3>
              <p className="text-xs text-text-secondary mb-8">
                Push this online order directly to your local terminal cart for final adjustments and thermal printing.
              </p>

              <Button
                variant="primary"
                className="w-full py-4 text-sm font-bold uppercase tracking-wider"
                disabled={!selectedOrder || selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'cancelled'}
                onClick={async () => {
                  if (!selectedOrder) return;
                  if (window.confirm("This will REPLACE any items currently in your POS cart. Proceed?")) {
                    await pushToPosCart(selectedOrder.id);
                    toast.success('Pushed to POS Cart! Open POS to view.');
                  }
                }}
                icon={<CreditCard size={18} />}
              >
                Push to POS Cart
              </Button>
            </div>
            
            <div className="mt-8 flex items-start gap-3 p-4 bg-info-subtle text-info-default rounded-2xl border border-info-default/20 w-full text-left">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed font-bangla">
                কার্টে পুশ করার পর লোকাল টার্মিনাল থেকে ইনভয়েস প্রিন্ট করা যাবে।
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionErrorBoundary>
  );
}
