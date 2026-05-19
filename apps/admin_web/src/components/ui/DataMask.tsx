import React from 'react';

interface DataMaskProps {
  value: string | number;
  isMasked: boolean;
  className?: string;
}

export const DataMask: React.FC<DataMaskProps> = ({ value, isMasked, className = '' }) => {
  return (
    <span className={`inline-flex items-center font-mono ${className}`} aria-busy={isMasked}>
      {isMasked ? (
        <span 
          className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded text-sm tracking-widest select-none animate-fade-in"
          title="Data masked for cashier view"
        >
          ৳••••••
        </span>
      ) : (
        <span className="animate-fade-in">
          {typeof value === 'number' ? `৳${value.toLocaleString('en-BD')}` : value}
        </span>
      )}
    </span>
  );
};
