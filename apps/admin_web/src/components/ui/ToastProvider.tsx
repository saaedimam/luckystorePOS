import { Toaster as SonnerToaster } from 'sonner';

/**
 * ToastProvider initializes the Sonner toast system.
 * Configured for the POS environment: bottom-right placement, consistent with user requirements.
 */
export function ToastProvider() {
  return (
    <SonnerToaster
      position="bottom-right"
      expand={false}
      richColors
      closeButton
      theme="dark"
      toastOptions={{
        style: {
          width: '320px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)',
        },
        className: 'pos-toast',
      }}
    />
  );
}
