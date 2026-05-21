import { ReactNode } from 'react';
import clsx from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={clsx('fixed inset-0 z-50 flex items-center justify-center p-4')}>
      {/* backdrop */}
      <div 
        className="fixed inset-0 bg-surface-overlay backdrop-blur-sm animate-fade-in" 
        onClick={onClose} 
      />
      <div
        className={clsx(
          'relative bg-surface rounded-xl shadow-level-3 border border-border-default max-w-lg w-full overflow-hidden animate-fade-in',
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-background-subtle">
          {title && <h2 className="text-heading font-bold text-text-primary">{title}</h2>}
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );
};
