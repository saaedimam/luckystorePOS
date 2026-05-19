/**
 * Custom Error classes for LuckyStorePOS
 * Designed to provide typed error handling across the application.
 */

export class POSError extends Error {
  code?: string;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'POSError';
    this.code = code;
  }
}

export class NetworkError extends POSError {
  constructor(message: string = 'Network connection lost. Please check your internet.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class PrintError extends POSError {
  constructor(message: string = 'Failed to print receipt. Check printer connection.') {
    super(message, 'PRINT_ERROR');
    this.name = 'PrintError';
  }
}

export class PaymentError extends POSError {
  constructor(message: string = 'Payment processing failed. Please try again.') {
    super(message, 'PAYMENT_ERROR');
    this.name = 'PaymentError';
  }
}

/**
 * Global error formatter and logger
 */
export const formatError = (error: unknown): string => {
  console.error('[POS System Error]:', error);
  
  if (error instanceof POSError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred in the POS system.';
};
