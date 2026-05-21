'use client';

import { StorefrontError } from '@/components/ui/StorefrontError';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  // Log error to monitoring service
  console.error('Storefront Error:', error);

  return (
    <StorefrontError
      variant="global"
      error={error}
      resetErrorBoundary={reset}
    />
  );
}
