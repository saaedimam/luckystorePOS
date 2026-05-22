'use client';

import React from 'react';
import { CheckCircle2, Clock, Package, Truck, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

interface StepperProps {
  status: OrderStatus;
}

const STEPS = [
  { key: 'pending',          label: 'Placed',      bangla: 'অর্ডার হয়েছে',      icon: Clock },
  { key: 'confirmed',        label: 'Confirmed',   bangla: 'নিশ্চিত',           icon: CheckCircle2 },
  { key: 'preparing',        label: 'Preparing',   bangla: 'প্রস্তুত হচ্ছে',     icon: Package },
  { key: 'out_for_delivery', label: 'Out for Delivery', bangla: 'ডেলিভারি পথে',    icon: Truck },
  { key: 'delivered',        label: 'Delivered',   bangla: 'সম্পন্ন',           icon: Home },
];

export const OrderStatusStepper: React.FC<StepperProps> = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="bg-danger-subtle border border-danger-default/20 rounded-2xl p-6 text-center">
        <p className="text-danger-dark font-black uppercase tracking-widest text-[10px] mb-1">Status</p>
        <h2 className="text-xl font-black text-danger-default font-bangla">অর্ডারটি বাতিল করা হয়েছে</h2>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex(s => s.key === status);

  return (
    <div className="bg-surface-default border border-border-default rounded-3xl p-6 shadow-level-1">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-8">অর্ডারের অবস্থা</h3>
      <div className="space-y-0 relative">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isPending = idx > currentIdx;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 z-10 border-2",
                  isCompleted && "bg-success-default border-success-default text-white",
                  isActive && "bg-primary border-primary text-primary-contrast shadow-lg scale-110",
                  isPending && "bg-background-subtle border-border-default text-text-muted"
                )}>
                  <Icon size={18} />
                </div>
                
                {idx < STEPS.length - 1 && (
                  <div className="w-0.5 h-10 -mt-1 -mb-1 relative overflow-hidden bg-border-default">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.8 }}
                      className="absolute top-0 left-0 w-full bg-success-default"
                    />
                  </div>
                )}
              </div>

              <div className="pb-8">
                <p className={clsx(
                  "text-sm font-black leading-none font-bangla",
                  isActive ? "text-primary-contrast" : isCompleted ? "text-text-primary" : "text-text-muted"
                )}>
                  {step.bangla}
                </p>
                <p className={clsx(
                  "text-[10px] uppercase font-bold tracking-wider mt-1.5",
                  isActive ? "text-primary" : "text-text-muted/60"
                )}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
