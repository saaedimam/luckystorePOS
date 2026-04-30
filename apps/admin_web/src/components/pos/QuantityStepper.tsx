import React from 'react';
import clsx from 'clsx';

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  min = 0,
  max = Infinity,
  onChange,
  className,
}) => {
  const decrement = () => {
    const newVal = Math.max(value - 1, min);
    onChange(newVal);
  };
  const increment = () => {
    const newVal = Math.min(value + 1, max);
    onChange(newVal);
  };

  return (
    <div className={clsx('flex items-center border border-border-light rounded-md overflow-hidden', className)}>
      <button
        type="button"
        onClick={decrement}
        className="px-2 py-1 text-text-main hover:bg-gray-100 disabled:opacity-50"
        disabled={value <= min}
      >
        –
      </button>
      <span className="px-3 py-1 text-center w-8 text-text-main border-l border-r border-border-light">
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        className="px-2 py-1 text-text-main hover:bg-gray-100 disabled:opacity-50"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
};
