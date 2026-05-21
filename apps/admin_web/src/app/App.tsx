
import { RouterProvider } from 'react-router-dom';
import { InstallPrompt } from '../components/InstallPrompt';
import { AuthProvider } from '../lib/AuthProvider';
import { useSyncSales } from '../hooks/useSyncSales';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { ToastProvider } from '../components/ui/ToastProvider';
import { ErrorBoundary as GlobalErrorBoundary } from '../components/ui/ErrorBoundary';
import { NotificationProvider } from '../components/Notification';
import { router } from './routes';

export function App() {
  useSyncSales(); // Background sync engine

  return (
    <AuthProvider>
      <NotificationProvider>
        <GlobalErrorBoundary>
          <ToastProvider />
          <OfflineBanner />
          <RouterProvider router={router} />
          <InstallPrompt />
        </GlobalErrorBoundary>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;