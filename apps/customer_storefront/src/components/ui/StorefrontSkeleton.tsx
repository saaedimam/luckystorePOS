'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StorefrontSkeletonProps {
  type?: 'page' | 'card-grid' | 'card-list' | 'product-detail' | 'header';
  count?: number;
}

export function StorefrontSkeleton({ type = 'page', count = 6 }: StorefrontSkeletonProps) {
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  if (type === 'header') {
    return (
      <motion.header
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeVariants}
        className="sticky top-0 z-50 bg-surface-default/80 backdrop-blur-lg border-b border-border-default px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-background-subtle rounded-full animate-pulse" />
            <div className="w-32 h-6 bg-background-subtle rounded animate-pulse" />
          </div>
          <div className="w-10 h-10 bg-background-subtle rounded-full animate-pulse" />
        </div>
      </motion.header>
    );
  }

  if (type === 'card-grid') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeVariants}
        className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4"
      >
        {[...Array(count)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            className="bg-surface-default border border-border-default rounded-xl p-3"
          >
            <div className="aspect-square bg-background-subtle rounded-lg mb-3 animate-pulse" />
            <div className="h-4 bg-background-subtle rounded w-3/4 mb-2 animate-pulse" />
            <div className="h-3 bg-background-subtle rounded w-1/2 mb-3 animate-pulse" />
            <div className="h-6 bg-background-subtle rounded w-1/3 animate-pulse" />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (type === 'card-list') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeVariants}
        className="space-y-3"
      >
        {[...Array(count)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            className="flex items-center gap-4 p-3 bg-surface-default border border-border-default rounded-xl"
          >
            <div className="w-20 h-20 bg-background-subtle rounded-lg flex-shrink-0 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-background-subtle rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-background-subtle rounded w-1/2 animate-pulse" />
              <div className="h-5 bg-background-subtle rounded w-1/4 animate-pulse" />
            </div>
            <div className="w-10 h-10 bg-background-subtle rounded-full animate-pulse" />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (type === 'product-detail') {
    return (
      <motion.main
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeVariants}
        className="min-h-screen bg-background-default"
      >
        {/* Skeleton Header */}
        <header className="sticky top-0 z-50 bg-surface-default/80 backdrop-blur-lg border-b border-border-default px-4 py-3 flex items-center justify-between">
          <div className="w-10 h-10 bg-background-subtle rounded-full animate-pulse" />
          <div className="w-32 h-5 bg-background-subtle rounded animate-pulse" />
          <div className="w-10 h-10 bg-background-subtle rounded-full animate-pulse" />
        </header>

        {/* Skeleton Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="px-4 py-4"
        >
          <div className="aspect-square bg-background-subtle rounded-2xl animate-pulse mb-6" />
          <div className="h-8 bg-background-subtle rounded w-3/4 mb-2 animate-pulse" />
          <div className="h-5 bg-background-subtle rounded w-1/2 mb-6 animate-pulse" />
          <div className="h-12 bg-background-subtle rounded animate-pulse" />
        </motion.div>
      </motion.main>
    );
  }

  // Default 'page' type
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeVariants}
      className="min-h-screen bg-background-default"
    >
      {/* Skeleton Header */}
      <header className="sticky top-0 z-50 bg-surface-default/80 backdrop-blur-lg border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-background-subtle rounded-full animate-pulse" />
          <div className="w-32 h-6 bg-background-subtle rounded animate-pulse" />
        </div>
      </header>

      {/* Skeleton Search Bar */}
      <div className="px-4 py-3 border-b border-border-default">
        <div className="h-12 bg-background-subtle rounded-full animate-pulse" />
      </div>

      {/* Skeleton Filter Bar */}
      <div className="px-4 py-3 border-b border-border-default">
        <div className="flex items-center justify-between gap-3">
          <div className="h-8 bg-background-subtle rounded w-32 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-background-subtle rounded-lg animate-pulse" />
            <div className="w-10 h-10 bg-background-subtle rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Skeleton Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(count)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="bg-surface-default border border-border-default rounded-xl p-3"
            >
              <div className="aspect-square bg-background-subtle rounded-lg mb-3 animate-pulse" />
              <div className="h-4 bg-background-subtle rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-3 bg-background-subtle rounded w-1/2 mb-3 animate-pulse" />
              <div className="h-6 bg-background-subtle rounded w-1/3 animate-pulse" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.main>
  );
}
