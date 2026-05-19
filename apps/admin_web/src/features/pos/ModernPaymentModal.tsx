import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Banknote, 
  Smartphone, 
  CreditCard, 
  Wallet, 
  PlusCircle, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';

interface PaymentModalProps {
  show: boolean;
  totalAmount: number;
  isProcessing: boolean;
  isSplitMode: boolean;
  selectedPaymentMethod: string | null;
  paymentAmount: string;
  splitPayments: Array<{ id: string; accountId: string; amount: number }>;
  splitMethod: string | null;
  splitAmount: string;
  paymentMethods: any[];
  paidTotal: number;
  changeAmount: number;
  remainingAmount: number;
  error: string | null;
  onClose: () => void;
  onSetIsSplitMode: (mode: boolean) => void;
  onSelectPaymentMethod: (method: string | null) => void;
  onSetPaymentAmount: (amount: string) => void;
  onSetSplitMethod: (method: string | null) => void;
  onSetSplitAmount: (amount: string) => void;
  onAddSplitPayment: () => void;
  onRemoveSplitPayment: (id: string) => void;
  onQuickAmount: (amount: number) => void;
  onCheckout: () => void;
}

const getPaymentIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('cash')) return Banknote;
  if (lower.includes('bkash') || lower.includes('nagad') || lower.includes('mobile')) return Smartphone;
  if (lower.includes('card') || lower.includes('visa') || lower.includes('master')) return CreditCard;
  return Wallet;
};

const getPaymentColor = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('cash')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  if (lower.includes('bkash')) return 'text-pink-500 bg-pink-500/10 border-pink-500/20';
  if (lower.includes('nagad')) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
  if (lower.includes('card')) return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
  return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
};

export function ModernPaymentModal(props: PaymentModalProps) {
  const { 
    show, totalAmount, isProcessing, isSplitMode, selectedPaymentMethod, 
    paymentAmount, splitPayments, splitMethod, splitAmount, paymentMethods,
    paidTotal, changeAmount, remainingAmount, error, onClose, onCheckout 
  } = props;

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900/80 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-xl"
        >
          {/* Header */}
          <div className="p-8 flex items-center justify-between border-b border-white/5 bg-white/5">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Checkout</h2>
              <p className="text-slate-400 text-sm">Select payment method and complete sale</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-slate-400"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Summary & Inputs */}
              <div className="space-y-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payable</span>
                  <div className="text-4xl font-black text-sky-400 mt-1">
                    ৳{totalAmount.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-400 ml-1">Payment Mode</label>
                  <div className="flex p-1.5 bg-slate-950/50 rounded-2xl border border-white/5">
                    <button 
                      onClick={() => props.onSetIsSplitMode(false)}
                      className={clsx(
                        "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2",
                        !isSplitMode ? "bg-sky-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      <Banknote size={16} />
                      Single
                    </button>
                    <button 
                      onClick={() => props.onSetIsSplitMode(true)}
                      className={clsx(
                        "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2",
                        isSplitMode ? "bg-sky-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      <PlusCircle size={16} />
                      Split
                    </button>
                  </div>
                </div>

                {!isSplitMode ? (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-400 ml-1">Amount Received</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">৳</span>
                        <input 
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => props.onSetPaymentAmount(e.target.value)}
                          className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-xl font-bold text-white focus:outline-none focus:border-sky-500/50 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[100, 500, 1000].map(amount => (
                        <button 
                          key={amount}
                          onClick={() => props.onQuickAmount(amount)}
                          className="py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 border border-white/5 transition-all"
                        >
                          +{amount}
                        </button>
                      ))}
                      <button 
                        onClick={() => props.onQuickAmount(Math.ceil(totalAmount))}
                        className="py-2 bg-sky-500/10 hover:bg-sky-500/20 rounded-xl text-xs font-bold text-sky-400 border border-sky-500/20 transition-all"
                      >
                        Exact
                      </button>
                    </div>

                    {parseFloat(paymentAmount) >= totalAmount && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center"
                      >
                        <span className="text-sm font-medium text-emerald-400">Change Due</span>
                        <span className="text-xl font-black text-emerald-400">৳{changeAmount.toLocaleString()}</span>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                     <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Paid Total</span>
                           <span className="text-sm text-slate-300 font-bold">৳{paidTotal.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                           <motion.div 
                              className="h-full bg-sky-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (paidTotal/totalAmount) * 100)}%` }}
                           />
                        </div>
                        {remainingAmount > 0 && (
                           <div className="mt-3 flex justify-between items-center">
                              <span className="text-xs text-rose-400 font-bold uppercase">Remaining</span>
                              <span className="text-lg font-black text-rose-400">৳{remainingAmount.toLocaleString()}</span>
                           </div>
                        )}
                     </div>

                     <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                        {splitPayments.map(sp => {
                           const method = paymentMethods.find(m => m.id === sp.accountId);
                           return (
                              <div key={sp.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl group">
                                 <div className="flex items-center gap-3">
                                    <div className={clsx("p-2 rounded-lg", getPaymentColor(method?.name || ''))}>
                                       {React.createElement(getPaymentIcon(method?.name || ''), { size: 14 })}
                                    </div>
                                    <span className="text-sm text-slate-300 font-medium">{method?.name}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-white">৳{sp.amount}</span>
                                    <button 
                                       onClick={() => props.onRemoveSplitPayment(sp.id)}
                                       className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-all"
                                    >
                                       <X size={14} />
                                    </button>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
                )}
              </div>

              {/* Right Column: Payment Methods */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-400 ml-1">
                   {isSplitMode ? 'Add Payment Method' : 'Select Method'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map(method => {
                    const Icon = getPaymentIcon(method.name);
                    const colorClasses = getPaymentColor(method.name);
                    const isSelected = isSplitMode ? splitMethod === method.id : selectedPaymentMethod === method.id;

                    return (
                      <button
                        key={method.id}
                        onClick={() => isSplitMode ? props.onSetSplitMethod(method.id) : props.onSelectPaymentMethod(method.id)}
                        className={clsx(
                          "relative p-4 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-3 group overflow-hidden",
                          isSelected 
                            ? "bg-sky-500 border-sky-400 shadow-lg shadow-sky-500/20" 
                            : "bg-white/5 border-white/5 hover:border-white/20"
                        )}
                      >
                        <div className={clsx(
                          "p-4 rounded-2xl transition-all duration-300",
                          isSelected ? "bg-white/20 text-white" : colorClasses
                        )}>
                          <Icon size={24} />
                        </div>
                        <span className={clsx(
                          "text-sm font-bold tracking-tight",
                          isSelected ? "text-white" : "text-slate-300"
                        )}>
                          {method.name}
                        </span>
                        
                        {isSelected && (
                           <motion.div 
                              layoutId="selection-tick"
                              className="absolute top-2 right-2 text-white"
                           >
                              <CheckCircle2 size={14} />
                           </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {isSplitMode && splitMethod && (
                   <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-3xl space-y-3"
                   >
                      <input 
                        type="number"
                        value={splitAmount}
                        onChange={(e) => props.onSetSplitAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-white font-bold focus:outline-none"
                      />
                      <button 
                        onClick={props.onAddSplitPayment}
                        disabled={!splitAmount || parseFloat(splitAmount) <= 0 || parseFloat(splitAmount) > remainingAmount}
                        className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                      >
                        Add to Split
                        <ArrowRight size={16} />
                      </button>
                   </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 bg-white/5 border-t border-white/5 flex gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onCheckout}
              disabled={isProcessing || (isSplitMode ? splitPayments.length === 0 || remainingAmount > 0 : !selectedPaymentMethod || !paymentAmount)}
              className="flex-1 px-8 py-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-30 disabled:grayscale text-white font-black text-lg rounded-2xl shadow-xl shadow-sky-500/20 transition-all flex items-center justify-center gap-3 group"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={24} className="animate-spin text-white/50" />
                  Processing Sale...
                </>
              ) : (
                <>
                  Complete Transaction
                  <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
             {error && (
                <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="px-8 pb-8"
                >
                   <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400">
                      <AlertCircle size={18} />
                      <span className="text-sm font-medium">{error}</span>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
