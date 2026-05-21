import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface GlobalErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function GlobalErrorFallback({ error, resetErrorBoundary }: GlobalErrorFallbackProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-subtle p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-xl shadow-level-2 border border-border-default text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
          <AlertTriangle className="h-8 w-8 text-danger" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-text-primary">Application Error</h2>
        <p className="mb-6 text-text-secondary text-sm">
          We encountered an unexpected error. Please try refreshing or report the issue if it persists.
        </p>
        
        <div className="mb-8 p-4 bg-background-default rounded-lg text-left overflow-auto max-h-40 border border-border-subtle">
          <p className="text-sm font-mono text-danger font-medium">
            {error.message || "Unknown error"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button onClick={resetErrorBoundary} className="gap-2 w-full sm:w-auto">
            <RefreshCw className="h-4 w-4" />
            Reload App
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full sm:w-auto">
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
