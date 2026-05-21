'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Phone } from 'lucide-react';
import { clsx } from 'clsx';

interface StorefrontErrorProps {
  variant?: 'global' | 'section';
  error?: Error | null;
  resetErrorBoundary?: () => void;
  onRetry?: () => void;
  title?: string;
  titleBn?: string;
  message?: string;
  messageBn?: string;
  className?: string;
}

const defaultMessages = {
  global: {
    title: 'Something went wrong',
    titleBn: 'কিছু সমস্যা হয়েছে',
    message: 'We apologize for the inconvenience. Please try again or contact support if the problem persists.',
    messageBn: 'অসুবিধার জন্য আমরা দুঃখিত। অনুগ্রহ করে আবার চেষ্টা করুন বা সমস্যা থাকলে সহায়তায় যোগাযোগ করুন।',
  },
  section: {
    title: 'Failed to load',
    titleBn: 'লোড করতে ব্যর্থ হয়েছে',
    message: 'Unable to fetch data. Click retry to attempt again.',
    messageBn: 'ডেটা আনতে অক্ষম। আবার চেষ্টা করতে রিট্রাইতে ক্লিক করুন।',
  },
};

export function StorefrontError({
  variant = 'section',
  error,
  resetErrorBoundary,
  onRetry,
  title,
  titleBn,
  message,
  messageBn,
  className,
}: StorefrontErrorProps) {
  const defaults = defaultMessages[variant];
  const displayTitle = title || defaults.title;
  const displayTitleBn = titleBn || defaults.titleBn;
  const displayMessage = message || defaults.message;
  const displayMessageBn = messageBn || defaults.messageBn;

  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  if (variant === 'global') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={clsx(
          'min-h-screen bg-background-default flex flex-col items-center justify-center px-6 py-12',
          className
        )}
      >
        <div className="max-w-md w-full text-center">
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="w-20 h-20 mx-auto mb-6 bg-danger-subtle rounded-full flex items-center justify-center"
          >
            <AlertTriangle size={40} className="text-danger-default" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-bangla text-2xl font-bold text-text-primary mb-2"
          >
            {displayTitleBn}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-lg font-semibold text-text-secondary mb-4"
          >
            {displayTitle}
          </motion.p>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2 mb-8"
          >
            <p className="text-sm text-text-secondary leading-relaxed">
              {displayMessageBn}
            </p>
            <p className="text-xs text-text-muted">
              {displayMessage}
            </p>
          </motion.div>

          {/* Error Details (dev only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mb-6 p-4 bg-background-subtle rounded-lg text-left overflow-auto"
            >
              <p className="text-xs font-mono text-danger-default mb-1">{error.name}:</p>
              <p className="text-xs font-mono text-text-secondary">{error.message}</p>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <button
              onClick={handleRetry}
              className="flex-1 h-14 px-6 bg-primary-default text-primary-on rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all shadow-level-1"
            >
              <RefreshCw size={20} />
              <span className="font-bangla">আবার চেষ্টা করুন</span>
              <span className="text-xs opacity-80">(Try Again)</span>
            </button>

            <a
              href="/"
              className="flex-1 h-14 px-6 bg-background-subtle text-text-primary border border-border-default rounded-full font-bold flex items-center justify-center gap-2 hover:bg-background-default active:scale-95 transition-all"
            >
              <Home size={20} />
              <span className="font-bangla">হোম</span>
              <span className="text-xs text-text-muted">(Home)</span>
            </a>
          </motion.div>

          {/* Support Contact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 pt-6 border-t border-border-default"
          >
            <p className="text-xs text-text-muted mb-2">Need help? / সাহায্য দরকার?</p>
            <a
              href="tel:8801XXXXXXXXX"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary-default hover:text-primary-hover transition-colors"
            >
              <Phone size={16} />
              <span>+880 1XX-XXXXXXX</span>
            </a>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Section variant (compact card)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'p-6 bg-surface-default border border-danger-default/20 rounded-xl text-center',
        className
      )}
    >
      <div className="w-12 h-12 mx-auto mb-3 bg-danger-subtle rounded-full flex items-center justify-center">
        <AlertTriangle size={24} className="text-danger-default" />
      </div>

      <h3 className="font-bangla text-base font-bold text-text-primary mb-1">
        {displayTitleBn}
      </h3>
      <p className="text-xs text-text-muted mb-4">{displayTitle}</p>

      <button
        onClick={handleRetry}
        className="h-10 px-5 bg-primary-default text-primary-on rounded-full text-sm font-bold flex items-center justify-center gap-2 mx-auto hover:bg-primary-hover active:scale-95 transition-all"
      >
        <RefreshCw size={16} />
        <span className="font-bangla">রিট্রাই</span>
        <span className="text-xs opacity-80">(Retry)</span>
      </button>
    </motion.div>
  );
}
