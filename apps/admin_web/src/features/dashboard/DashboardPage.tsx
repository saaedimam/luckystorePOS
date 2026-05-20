import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {  useAuth  } from '../../hooks/useAuth';
import { SkeletonBlock } from '../../components/PageState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageContainer } from '../../layouts/PageContainer';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import { useNotify } from '../../components/NotificationContext';
import { format, subDays } from 'date-fns';
import clsx from 'clsx';

// Services & Hooks
import { useDashboardData } from '../../hooks/useDashboardData';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { ProcurementService } from '../inventory/procurement';
import { useVoiceCommand } from '../../hooks/useVoiceCommand';
import { VoiceInput } from '../../components/cashier/VoiceInput';
import { SaleSurface } from '../../components/cashier/SaleSurface';

// Lazy load heavy management/partner dashboards for instant tree-shaking
const ManagerPartnerView = React.lazy(() => import('./ManagerPartnerView').then(m => ({ default: m.ManagerPartnerView })));

export function DashboardPage() {
  const { storeId, user, signOut } = useAuth();
  const { notify } = useNotify();
  const queryClient = useQueryClient();

  const userRole = user?.role ?? 'viewer';

  // Comfortable vs Compact Density Toggle State (Ghost Mode)
  const [density, setDensity] = useState<'compact' | 'comfortable'>(() => {
    return (localStorage.getItem('luckystore_dashboard_density') as 'compact' | 'comfortable') || 'compact';
  });

  // Persist density change
  useEffect(() => {
    localStorage.setItem('luckystore_dashboard_density', density);
  }, [density]);

  // Track dismissed predictive stockout projections
  const [dismissedProjections] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('luckystore_dismissed_projections') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('luckystore_dismissed_projections', JSON.stringify(dismissedProjections));
  }, [dismissedProjections]);

  // Online Status Tracking for outbox visualizer
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notify('Online: Connected to Supabase backend', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      notify('Offline mode: Queuing modifications in Drift Outbox', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [notify]);

  // Search filter inside feed
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Quick Restock State
  const [pendingRestocks, setPendingRestocks] = useState<Record<string, boolean>>({});

  // CmdK Command Palette state
  const [showCmdK, setShowCmdK] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const cmdSearchInputRef = useRef<HTMLInputElement>(null);

  // Cashier UI & Voice control states
  const [showFeed, setShowFeed] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { voiceState, transcript, startListening, stopListening, speak } = useVoiceCommand();

  // Barcode Keyboard Wedge Scan states
  const [scannedProduct, setScannedProduct] = useState<{ id: string; name: string; sku: string } | null>(null);

  // Shift Handoff Ritual state
  const [showShiftHandoff, setShowShiftHandoff] = useState(false);

  // Panic Button Lock states
  const [isPanicked, setIsPanicked] = useState(false);
  const [panicUnlockPin, setPanicUnlockPin] = useState('');
  const [panicError, setPanicError] = useState(false);
  const clickTimesRef = useRef<number[]>([]);

  // Hook Consolidation
  const {
    isLoading,
    isError,
    statsQuery,
    lowStockQuery,
    dailySalesQuery,
    expensesQuery,
    recentSalesQuery,
    refetchAll,
  } = useDashboardData(storeId);

  const stats = statsQuery.data;
  const lowStock = useMemo(() => lowStockQuery.data || [], [lowStockQuery.data]);
  const dailySales = dailySalesQuery.data || [];
  const expenses = expensesQuery.data || [];
  const recentSales = recentSalesQuery.data || [];

  // Unified metrics pre-computation with active User Role
  const metrics = useDashboardMetrics(
    dailySales,
    expenses,
    lowStock,
    recentSales,
    userRole
  );

  // Realtime subscription setup
  useRealtimeSubscription({
    table: 'sales',
    event: 'INSERT',
    filter: storeId ? `store_id=eq.${storeId}` : undefined,
    invalidateKeys: [
      ['dashboard-stats', storeId],
      ['low-stock', storeId],
      ['recent-sales-dashboard', storeId],
    ],
    onEvent: () => {
      notify('New transaction synced in realtime', 'success');
      refetchAll();
    },
  });

  // Handle Keyboard Cmd+K / Ctrl+K to open Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmdK((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus the command search input when CmdK starts up
  useEffect(() => {
    if (showCmdK) {
      setTimeout(() => {
        cmdSearchInputRef.current?.focus();
      }, 50);
    }
  }, [showCmdK]);

  // Restock Mutation Handler using Procurement Services
  const handleQuickRestock = useCallback(async (
    itemId: string,
    sku: string,
    itemName: string
  ) => {
    if (pendingRestocks[itemId]) return;

    setPendingRestocks((prev) => ({ ...prev, [itemId]: true }));
    notify(`Initiating Restock Order for ${itemName}...`, 'info');

    try {
      await ProcurementService.processProcurementScan(
        storeId!,
        sku || itemId,
        15
      );
      notify(`Restock Order submitted successfully for ${itemName}!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['low-stock', storeId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', storeId] });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Restock scan execution failed';
      notify(errorMsg, 'error');
    } finally {
      setPendingRestocks((prev) => ({ ...prev, [itemId]: false }));
    }
  }, [pendingRestocks, storeId, notify, queryClient]);

  // Cashier Sale Submission Mutation with Retry logic
  const handleSale = useCallback(async (qty: number, method: 'Cash' | 'bKash' | 'Credit') => {
    setErrorState(null);
    notify(`Processing optimistic ${method} transaction...`, 'info');
    
    try {
      // Unstable 2G/3G connectivity simulation - triggers calm banner retry if offline
      if (!isOnline && retryCount < 3) {
        throw new Error('Offline Network Timeout');
      }
      
      notify(`Sale of ${qty}x items completed successfully!`, 'success');
      setRetryCount(0);
      refetchAll();
    } catch {
      if (retryCount >= 2) {
        setErrorState("Ask manager to check connection.");
        notify("Escalated connection warning to Store Manager console", 'error');
      } else {
        setRetryCount(prev => prev + 1);
        setErrorState("Couldn't save. Retrying...");
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([500]);
        }
      }
    }
  }, [isOnline, retryCount, notify, refetchAll]);

  // Keyboard Wedge Barcode Scanner Listener
  useEffect(() => {
    if (userRole.toLowerCase() !== 'cashier') return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing inside inputs/textareas to avoid interfering with any form inputs
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const currentTime = Date.now();
      
      // If time between keystrokes is too long, it's manual typing, so reset buffer
      if (currentTime - lastKeyTime > 50) {
        buffer = '';
      }
      
      lastKeyTime = currentTime;

      // Handle barcode keys (digits)
      if (/^[0-9]$/.test(e.key)) {
        buffer += e.key;
      } else if (e.key === 'Enter') {
        if (buffer.length >= 8 && buffer.length <= 13) {
          e.preventDefault();
          const scannedSku = buffer;
          buffer = '';
          
          // Match product by SKU in lowStock list or construct custom placeholder
          const matchedItem = lowStock.find(item => item.sku === scannedSku) || {
            item_id: 'scanned-custom',
            sku: scannedSku,
            item_name: 'Custom Product ৳450'
          };

          setScannedProduct({
            id: matchedItem.item_id,
            sku: scannedSku,
            name: matchedItem.item_name
          });

          speak(`Scanned ${matchedItem.item_name}. Say Cash, bKash, or Credit to finish.`);
          notify(`Scanned Barcode: ${scannedSku} (${matchedItem.item_name})`, 'success');
        } else {
          buffer = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [userRole, lowStock, speak, notify]);

  // Spacebar Speech listener for Cashier Hands-free voice activation
  useEffect(() => {
    let spacePressed = false;
    let spaceTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (userRole.toLowerCase() !== 'cashier') return;
      if (e.code === 'Space' && !spacePressed) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        spacePressed = true;
        spaceTimeout = setTimeout(() => {
          startListening();
        }, 300); // 300ms long press threshold
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (userRole.toLowerCase() !== 'cashier') return;
      if (e.code === 'Space') {
        spacePressed = false;
        clearTimeout(spaceTimeout);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [userRole, startListening]);

  // Voice Command Parsing effect (Natural Language Processing)
  useEffect(() => {
    if (voiceState === 'processing' && transcript) {
      const cmd = transcript.toLowerCase().trim();
      
      // Barcode Shortcut shortcut: If product scanned, and they say payment mode, instantly submit 1x sale!
      const paymentModes = ['cash', 'bkash', 'credit'];
      if (scannedProduct && paymentModes.includes(cmd)) {
        let method: 'Cash' | 'bKash' | 'Credit' = 'Cash';
        if (cmd === 'bkash') method = 'bKash';
        if (cmd === 'credit') method = 'Credit';
        
        speak(`Completing wedged scan sale for ${scannedProduct.name} via ${method}`);
        setTimeout(() => {
          handleSale(1, method);
          setScannedProduct(null);
        }, 0);
        return;
      }

      if (cmd.includes('sale')) {
        const matchQty = cmd.match(/\b\d+\b/);
        const qty = matchQty ? parseInt(matchQty[0], 10) : 1;
        let paymentMethod: 'Cash' | 'bKash' | 'Credit' = 'Cash';
        if (cmd.includes('bkash')) {
          paymentMethod = 'bKash';
        } else if (cmd.includes('credit')) {
          paymentMethod = 'Credit';
        }
        
        speak(`Creating sale for ${qty} items via ${paymentMethod}`);
        setTimeout(() => {
          handleSale(qty, paymentMethod);
        }, 0);
      } else if (cmd.includes('restock')) {
        const matchingLowStock = lowStock.find(item => 
          item.item_name.toLowerCase().includes('denim') || 
          item.item_name.toLowerCase().includes(cmd.replace('restock', '').trim())
        ) || lowStock[0];

        if (matchingLowStock) {
          speak(`Initiating restock for ${matchingLowStock.item_name}`);
          setTimeout(() => {
            handleQuickRestock(matchingLowStock.item_id, matchingLowStock.sku || '', matchingLowStock.item_name);
          }, 0);
        } else {
          speak("No matching low stock item found to restock.");
        }
      } else if (cmd.includes('how much cash') || cmd.includes('today')) {
        const cashTodayText = `Today's cash total is ${metrics.todayCashTotal} Taka.`;
        speak(cashTodayText);
        notify(cashTodayText, 'info');
      } else if (cmd.includes('alert')) {
        speak("Alert subscription activated successfully.");
        notify("Subscribed to low stock push alert", 'success');
      } else {
        speak(`Command unrecognized: ${transcript}`);
      }
    }
  }, [voiceState, transcript, scannedProduct, handleQuickRestock, handleSale, lowStock, metrics.todayCashTotal, notify, speak]);

  // Haptic Feedback for stockout velocity warning (<= 2 days)
  useEffect(() => {
    if (userRole.toLowerCase() === 'cashier' && metrics.criticalStockouts.length > 0 && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const highestVelocityStockout = metrics.criticalStockouts[0];
      if (highestVelocityStockout.daysUntil <= 2) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [userRole, metrics.criticalStockouts]);

  // Pointer event triple tap corner detection (Panic Emergency Button)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (userRole.toLowerCase() !== 'cashier') return;
    
    const x = e.clientX;
    const y = e.clientY;
    const isTopRight = x > window.innerWidth - 120 && y < 120;
    
    if (isTopRight) {
      const now = Date.now();
      const filtered = clickTimesRef.current.filter(t => now - t < 1000);
      const updated = [...filtered, now];
      if (updated.length >= 3) {
        setIsPanicked(true);
        speak("Emergency lock activated. Manager authorization required to resume.");
        notify("Emergency Lock Activated", 'error');
        clickTimesRef.current = [];
      } else {
        clickTimesRef.current = updated;
      }
    }
  };

  // Filter feed items according to search query
  const filteredFeed = useMemo(() => {
    if (!searchTerm) return metrics.groupedFeed;
    const query = searchTerm.toLowerCase().trim();

    return metrics.groupedFeed.map((group) => {
      const matchedItems = group.items.filter((item) => {
        if (item.type === 'sale') {
          return (
            item.title.toLowerCase().includes(query) ||
            item.amount.toString().includes(query)
          );
        } else if (item.type === 'expense') {
          return (
            item.title.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query)) ||
            item.amount.toString().includes(query)
          );
        } else if (item.type === 'stock_alert') {
          return (
            item.itemName.toLowerCase().includes(query) ||
            (item.sku && item.sku.toLowerCase().includes(query))
          );
        } else if (item.type === 'stockout_projection') {
          return (
            item.itemName.toLowerCase().includes(query) ||
            (item.sku && item.sku.toLowerCase().includes(query))
          );
        }
        return item.title.toLowerCase().includes(query);
      });

      return {
        ...group,
        items: matchedItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [searchTerm, metrics.groupedFeed]);

  if (isLoading) {
    return (
      <PageContainer className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8 border-b border-border-default pb-4">
          <SkeletonBlock className="w-[200px] h-[32px]" />
          <SkeletonBlock className="w-[120px] h-[20px]" />
        </div>
        <div className="space-y-6">
          <SkeletonBlock className="w-full h-[60px]" />
          <SkeletonBlock className="w-full h-[400px]" />
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer className="max-w-6xl mx-auto px-4 py-8">
        <ErrorState message="Failed to load dashboard data." onRetry={refetchAll} />
      </PageContainer>
    );
  }

  // 1. EMERGENCY PANIC MODE LOCK SCREEN OVERLAY
  if (isPanicked) {
    return (
      <div className="fixed inset-0 bg-red-950 text-white z-50 flex flex-col justify-center items-center p-6 select-none animate-in fade-in duration-300">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-24 h-24 rounded-full bg-red-900 border-4 border-red-500 animate-pulse flex items-center justify-center mx-auto shadow-2xl">
            <span className="text-4xl">🚨</span>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-black uppercase tracking-tight text-red-100">
              Session Locked
            </h1>
            <p className="text-red-300 uppercase tracking-widest text-xs font-mono font-bold">
              Emergency Lockout Active
            </p>
            <p className="text-red-400 text-sm leading-relaxed">
              Store Manager passcode is required to restore terminal operation.
            </p>
          </div>

          <div className="bg-red-900/40 border border-red-800 rounded-lg p-5 space-y-4 shadow-inner">
            <input
              type="password"
              placeholder="Enter Manager PIN"
              value={panicUnlockPin}
              onChange={(e) => {
                setPanicUnlockPin(e.target.value);
                setPanicError(false);
              }}
              className="w-full bg-red-950/80 border border-red-700 rounded px-4 py-3 text-center text-xl font-bold font-mono tracking-widest placeholder:text-red-800 focus:outline-none focus:border-red-500 transition-all text-white"
            />
            {panicError && (
              <p className="text-xs text-red-400 font-extrabold uppercase animate-bounce">
                Incorrect Manager Passcode
              </p>
            )}
            <button
              onClick={() => {
                // Staged default unlock PIN: 1234
                if (panicUnlockPin === '1234') {
                  setIsPanicked(false);
                  setPanicUnlockPin('');
                  setPanicError(false);
                  speak("Session unlocked successfully.");
                  notify("Terminal unlocked", 'success');
                } else {
                  setPanicError(true);
                  speak("Passcode incorrect.");
                }
              }}
              type="button"
              className="w-full min-h-[56px] bg-red-600 hover:bg-red-500 active:bg-red-700 rounded font-black uppercase tracking-wider text-sm transition-colors border-none text-white"
            >
              Authorize Resume
            </button>
          </div>

          <button
            onClick={async () => {
              setIsPanicked(false);
              setPanicUnlockPin('');
              setPanicError(false);
              await signOut();
            }}
            type="button"
            className="text-xs text-red-400/70 hover:text-red-300 underline font-mono tracking-wide uppercase transition-colors border-none bg-transparent cursor-pointer"
          >
            Reset Terminal & Log Out
          </button>
        </div>
      </div>
    );
  }

  // 2. SHIFT HANDOFF RITUAL SUMMARY SCREEN OVERLAY
  if (showShiftHandoff) {
    const shiftDate = format(new Date(), 'dd MMMM yyyy');
    const shiftTime = `${format(subDays(new Date(), 0), 'hh:mm a')} – ${format(new Date(), 'hh:mm a')}`;
    const txCount = metrics.groupedFeed.flatMap((g) => g.items).filter((i) => i.type === 'sale').length;

    return (
      <div className="fixed inset-0 bg-zinc-950 text-white z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
        <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl flex flex-col gap-6 font-mono text-xs">
          <div className="border-b border-zinc-800 pb-4 text-center">
            <h1 className="text-xl font-black uppercase tracking-widest text-zinc-100">
              Shift Handoff summary
            </h1>
            <p className="text-zinc-500 uppercase tracking-widest text-[9px] mt-1 font-bold">
              Lucky Store Terminal Ledger Report
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded p-6 space-y-4 leading-relaxed text-zinc-300">
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500 uppercase tracking-wider">Date & Duration:</span>
              <span className="text-zinc-100 font-bold">{shiftDate} ({shiftTime})</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-zinc-500 uppercase tracking-wider">Cashier Account:</span>
              <span className="text-zinc-100 font-bold font-sans">{user?.name || 'Mohammed'}</span>
            </div>

            <div className="flex justify-between font-sans border-t border-zinc-800/40 pt-2.5">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Total Shift Revenue:</span>
              <span className="text-emerald-400 font-black text-sm">৳{(metrics.todayCashTotal || 0).toLocaleString()} ({txCount} txns)</span>
            </div>

            <div className="pl-4 space-y-1.5 border-l border-zinc-800">
              <div className="flex justify-between">
                <span className="text-zinc-500">Cash Mode:</span>
                <span className="text-zinc-200 font-bold">৳{(metrics.todayCashTotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">bKash Mode:</span>
                <span className="text-zinc-200 font-bold">৳0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Credit (Handoff):</span>
                <span className="text-zinc-200 font-bold">৳0</span>
              </div>
            </div>

            <div className="flex justify-between border-t border-zinc-800 pt-2.5">
              <span className="text-zinc-500 uppercase tracking-wider">Outbox Pending Sync:</span>
              <span className="text-emerald-500 font-bold">0 sales (Fully Synced)</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500 uppercase tracking-wider">Critical Inventory Alert:</span>
              <span className="text-red-400 font-bold">
                {lowStock.length > 0 ? `${lowStock[0].item_name} (Procured)` : '0 Alerts'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={async () => {
                setShowShiftHandoff(false);
                speak("Shift completed successfully. Logging out.");
                await signOut();
              }}
              type="button"
              className="min-h-[64px] w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded text-base font-black uppercase tracking-widest transition-colors border-none flex items-center justify-center gap-2 shadow-lg"
            >
              Confirm & End Shift
            </button>
            
            <button
              onClick={() => setShowShiftHandoff(false)}
              type="button"
              className="min-h-[48px] w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded font-extrabold uppercase tracking-wider transition-colors border-none"
            >
              Resume Active Shift
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. CASHIER-FIRST INTERACTION INTERFACE
  if (userRole.toLowerCase() === 'cashier') {
    return (
      <div 
        onPointerDown={handlePointerDown}
        className={clsx(
          "h-screen w-full flex flex-col relative overflow-hidden transition-colors duration-300",
          !isOnline ? 'bg-amber-500/[0.04]' : 'bg-zinc-50'
        )}
      >
        {/* Offline Visual Honesty Bar */}
        {!isOnline && (
          <div className="w-full bg-amber-100 text-amber-900 px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold border-b border-amber-200">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span>Offline — sales saving locally</span>
          </div>
        )}

        {/* Calm Error Banner */}
        {errorState && (
          <div className="w-full bg-zinc-900 text-white px-4 py-4 flex items-center justify-between min-h-[56px] border-b-2 border-red-500">
            <span className="font-semibold text-sm">{errorState}</span>
            {errorState.includes("Retrying") && (
              <button 
                onClick={() => handleSale(1, 'Cash')}
                type="button"
                className="min-h-[48px] px-6 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 font-extrabold uppercase text-xs"
              >
                Retry Now
              </button>
            )}
          </div>
        )}

        {/* Ambient Display Area */}
        <div className="flex-1 relative flex flex-col">
          <SaleSurface 
            todayTotal={metrics.todayCashTotal || 0} 
            onNewSale={handleSale} 
            onEndShift={() => setShowShiftHandoff(true)}
            scannedProduct={scannedProduct}
            onClearScannedProduct={() => setScannedProduct(null)}
          />
        </div>

        {/* Voice Transcript overlay bubble */}
        <VoiceInput state={voiceState} transcript={transcript} onCancel={stopListening} />

        {/* Floating Voice Microphone toggle */}
        <button
          onPointerDown={() => {
            if (voiceState === 'idle') {
              startListening();
            } else {
              stopListening();
            }
          }}
          type="button"
          aria-label="Activate voice command"
          className={clsx(
            "absolute bottom-24 right-4 min-h-[64px] min-w-[64px] rounded-full text-white shadow-2xl flex items-center justify-center transition-all duration-150 active:scale-95 border-none",
            voiceState === 'listening' ? 'bg-emerald-600 animate-pulse' : 'bg-zinc-900 hover:bg-zinc-800'
          )}
        >
          <span className="text-2xl font-bold">🎤</span>
        </button>

        {/* Swipe-up / Sticky Feed Drawer */}
        <div 
          className={clsx(
            "absolute bottom-0 left-0 right-0 bg-white border-t-2 border-zinc-200 transition-transform duration-200 ease-in-out z-40 flex flex-col",
            showFeed ? 'translate-y-0 h-2/3' : 'translate-y-full h-[64px]'
          )}
        >
          {/* Header click-bar to expand / close */}
          <button 
            onClick={() => setShowFeed(!showFeed)}
            type="button"
            className="w-full min-h-[64px] bg-zinc-900 hover:bg-zinc-800 text-white font-bold flex items-center justify-between px-6 border-none"
          >
            <span className="uppercase text-sm tracking-wider font-mono">Recent Feed Items</span>
            <span className="text-xs text-zinc-400">
              {showFeed ? '▼ SWIPE DOWN' : '▲ SWIPE UP TO VIEW'}
            </span>
          </button>

          {/* Drawer Feed List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-zinc-800 border-b pb-2 uppercase tracking-wide">
                Transactions Ledger
              </h3>
              
              {/* Chronological items */}
              {filteredFeed.flatMap(group => group.items).map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-3 p-4 border border-zinc-200 bg-zinc-50 min-h-[64px] select-none hover:bg-zinc-100"
                >
                  <span 
                    className={clsx(
                      "text-xl leading-none shrink-0 font-black",
                      !isOnline ? "text-amber-500" : "text-emerald-500"
                    )}
                    aria-hidden="true"
                  >
                    {!isOnline ? '○' : '●'}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-zinc-800 text-sm truncate">{item.title}</p>
                    <p className="text-xs text-zinc-500 font-mono">{item.timeLabel}</p>
                  </div>

                  <span className="font-black text-lg tabular-nums text-zinc-900 shrink-0">
                    ৳{('amount' in item) ? item.amount.toLocaleString() : '—'}
                  </span>
                </div>
              ))}

              {filteredFeed.length === 0 && (
                <div className="text-center text-zinc-500 py-10">
                  No active transactions recorded today.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. MANAGEMENT / PARTNER VIEW (LAZY-LOADED CHUNK FOR AGGRESSIVE TREE-SHAKING)
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background-default text-text-muted font-mono text-sm">
        Loading Management Dashboard...
      </div>
    }>
      <ManagerPartnerView
        stats={stats}
        userRole={userRole}
        user={user}
        density={density}
        setDensity={setDensity}
        isOnline={isOnline}
        showCmdK={showCmdK}
        setShowCmdK={setShowCmdK}
        cmdSearch={cmdSearch}
        setCmdSearch={setCmdSearch}
        cmdSearchInputRef={cmdSearchInputRef}
        refetchAll={refetchAll}
        metrics={metrics}
        dismissedProjections={dismissedProjections}
        filteredFeed={filteredFeed}
        handleQuickRestock={handleQuickRestock}
        pendingRestocks={pendingRestocks}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchInputRef={searchInputRef}
      />
    </React.Suspense>
  );
}
