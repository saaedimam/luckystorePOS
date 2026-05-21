import React, {} from 'react';
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
import type { PaymentMethodRow } from '../../lib/api/types';

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
  paymentMethods: PaymentMethodRow[];
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
  if (lower.includes('cash')) return 'text-success-dark dark:text-success bg-success/10 border-success/20';
  if (lower.includes('bkash')) return 'text-danger bg-danger/10 border-danger/20';
  if (lower.includes('nagad')) return 'text-warning bg-warning/10 border-warning/20';
  if (lower.includes('card')) return 'text-info bg-info/10 border-info/20';
  return 'text-text-muted bg-background-subtle border-border-default';
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
          className="absolute inset-0 bg-surface-overlay backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-surface-default border border-border-strong rounded-xl shadow-level-3 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-border-default bg-background-subtle">
            <div>
              <h2 className="text-2xl font-bold text-text-primary tracking-tight">Checkout</h2>
              <p className="text-text-secondary text-sm">Select payment method and complete sale</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-background-default hover:bg-background-subtle rounded-lg transition-colors text-text-secondary"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Summary & Inputs */}
              <div className="space-y-6">
                <div className="p-5 bg-background-subtle rounded-xl border border-border-default">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Payable</span>
                  <div className="text-4xl font-black text-primary-default mt-1">
                    ৳{totalAmount.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-secondary ml-1">Payment Mode</label>
                  <div className="flex p-1 bg-background-default rounded-xl border border-border-default">
                    <button 
                      onClick={() => props.onSetIsSplitMode(false)}
                      className={clsx(
                        "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2",
                        !isSplitMode ? "bg-primary-default text-primary-on shadow-level-1" : "text-text-muted hover:text-text-secondary"
                      )}
                    >
                      <Banknote size={16} />
                      Single
                    </button>
                    <button 
                      onClick={() => props.onSetIsSplitMode(true)}
                      className={clsx(
                        "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2",
                        isSplitMode ? "bg-primary-default text-primary-on shadow-level-1" : "text-text-muted hover:text-text-secondary"
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
                      <label className="text-sm font-medium text-text-secondary ml-1">Amount Received</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">৳</span>
                        <input 
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => props.onSetPaymentAmount(e.target.value)}
                          className="w-full bg-background-default border border-border-default rounded-lg py-3.5 pl-10 pr-4 text-xl font-bold text-text-primary focus:outline-none focus:border-primary-default transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[100, 500, 1000].map(amount => (
                        <button 
                          key={amount}
                          onClick={() => props.onQuickAmount(amount)}
                          className="py-2 bg-background-default hover:bg-background-subtle rounded-lg text-xs font-bold text-text-secondary border border-border-default transition-all"
                        >
                          +{amount}
                        </button>
                      ))}
                      <button 
                        onClick={() => props.onQuickAmount(Math.ceil(totalAmount))}
                        className="py-2 bg-primary-subtle hover:bg-primary-subtle/80 rounded-lg text-xs font-bold text-primary-default border border-primary-default/20 transition-all"
                      >
                        Exact
                      </button>
                    </div>

                    {parseFloat(paymentAmount) >= totalAmount && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-success/10 border border-success/20 rounded-xl flex justify-between items-center"
                      >
                        <span className="text-sm font-medium text-success-dark dark:text-success">Change Due</span>
                        <span className="text-xl font-black text-success-dark dark:text-success">৳{changeAmount.toLocaleString()}</span>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                     <div className="p-4 bg-background-subtle border border-border-default rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs text-text-muted font-bold uppercase tracking-widest">Paid Total</span>
                           <span className="text-sm text-text-primary font-bold">৳{paidTotal.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-background-default rounded-full overflow-hidden">
                           <motion.div 
                              className="h-full bg-primary-default"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (paidTotal/totalAmount) * 100)}%` }}
                           />
                        </div>
                        {remainingAmount > 0 && (
                           <div className="mt-3 flex justify-between items-center">
                              <span className="text-xs text-danger font-bold uppercase">Remaining</span>
                              <span className="text-lg font-black text-danger">৳{remainingAmount.toLocaleString()}</span>
                           </div>
                        )}
                     </div>

                     <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                        {splitPayments.map(sp => {
                           const method = paymentMethods.find((m: PaymentMethodRow) => m.id === sp.accountId);
                           return (
                              <div key={sp.id} className="flex items-center justify-between p-3 bg-background-default border border-border-default rounded-lg group">
                                 <div className="flex items-center gap-3">
                                    <div className={clsx("p-2 rounded-lg", getPaymentColor(method?.name || ''))}>
                                       {React.createElement(getPaymentIcon(method?.name || ''), { size: 14 })}
                                    </div>
                                    <span className="text-sm text-text-primary font-medium">{method?.name}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-text-primary">৳{sp.amount}</span>
                                    <button 
                                       onClick={() => props.onRemoveSplitPayment(sp.id)}
                                       className="opacity-0 group-hover:opacity-100 p-1 hover:bg-danger/20 hover:text-danger rounded-lg transition-all"
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
                <label className="text-sm font-medium text-text-secondary ml-1">
                   {isSplitMode ? 'Add Payment Method' : 'Select Method'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method: PaymentMethodRow) => {
                    const Icon = getPaymentIcon(method.name);
                    const colorClasses = getPaymentColor(method.name);
                    const isSelected = isSplitMode ? splitMethod === method.id : selectedPaymentMethod === method.id;

                    return (
                      <button
                        key={method.id}
                        onClick={() => isSplitMode ? props.onSetSplitMethod(method.id) : props.onSelectPaymentMethod(method.id)}
                        className={clsx(
                          "relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-3 group overflow-hidden",
                          isSelected 
                            ? "bg-primary-default border-primary-hover shadow-level-1 text-primary-on" 
                            : "bg-background-subtle border-border-default hover:border-border-strong text-text-primary"
                        )}
                      >
                        <div className={clsx(
                          "p-3 rounded-lg transition-all duration-300",
                          isSelected ? "bg-white/20 text-white" : colorClasses
                        )}>
                          <Icon size={24} />
                        </div>
                        <span className={clsx(
                          "text-sm font-bold tracking-tight",
                          isSelected ? "text-primary-on" : "text-text-secondary"
                        )}>
                          {method.name}
                        </span>
                        
                        {isSelected && (
                           <motion.div 
                              layoutId="selection-tick"
                              className="absolute top-2 right-2 text-primary-on"
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
                      className="p-4 bg-primary-subtle border border-primary-default/20 rounded-xl space-y-3"
                   >
                      <input 
                        type="number"
                        value={splitAmount}
                        onChange={(e) => props.onSetSplitAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-full bg-background-default border border-border-default rounded-lg py-2.5 px-4 text-text-primary font-bold focus:outline-none"
                      />
                      <button 
                        onClick={props.onAddSplitPayment}
                        disabled={!splitAmount || parseFloat(splitAmount) <= 0 || parseFloat(splitAmount) > remainingAmount}
                        className="w-full py-2.5 bg-primary-default hover:bg-primary-hover disabled:opacity-50 text-primary-on font-bold rounded-lg transition-all flex items-center justify-center gap-2"
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
          <div className="p-6 bg-background-subtle border-t border-border-default flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-background-default hover:bg-background-subtle text-text-primary border border-border-default font-bold rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onCheckout}
              disabled={isProcessing || (isSplitMode ? splitPayments.length === 0 || remainingAmount > 0 : !selectedPaymentMethod || !paymentAmount)}
              className="flex-1 px-6 py-3 bg-primary-default hover:bg-primary-hover disabled:opacity-30 disabled:grayscale text-primary-on font-black text-md rounded-lg shadow-level-1 transition-all flex items-center justify-center gap-3 group"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin text-primary-on/50" />
                  Processing Sale...
                </>
              ) : (
                <>
                  Complete Transaction
                  <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
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
                   className="px-6 pb-6"
                >
                   <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-3 text-danger">
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
