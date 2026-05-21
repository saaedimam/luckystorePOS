import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { getInstallPrompt, clearInstallPrompt } from '../lib/sw-register';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return sessionStorage.getItem('pwa-install-dismissed') !== null;
  });

  useEffect(() => {
    if (dismissed) {
      return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Poll for deferred prompt (it may not be available yet)
    const check = () => {
      const p = getInstallPrompt();
      if (p) setPrompt(p);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      clearInstallPrompt();
      setPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!prompt || dismissed) return null;

  return (
    <div
      className="fixed bottom-20 right-6 z-[9997] bg-surface rounded-lg shadow-level-3 p-4 pr-5 flex items-center gap-3 max-w-[320px] border border-border-default transition-all"
    >
      <div
        className="w-10 h-10 rounded-md bg-primary flex items-center justify-center shrink-0"
      >
        <Download size={20} className="text-primary-on" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-text-primary">Install LuckyPOS</div>
        <div className="text-xs text-text-secondary mt-0.5">
          Add to home screen for fast access
        </div>
      </div>
      <button
        onClick={handleInstall}
        className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-primary-on rounded-md text-xs font-bold transition-colors shadow-sm"
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="absolute top-1 right-1 p-1 text-text-muted hover:text-text-secondary transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
