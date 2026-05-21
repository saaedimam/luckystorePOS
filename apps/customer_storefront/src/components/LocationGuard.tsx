'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationGuardProps {
  children: React.ReactNode;
}

export function LocationGuard({ children }: LocationGuardProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'granted' | 'denied' | 'out_of_range'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  // For demo purposes, we auto-grant if a bypass key is in local storage
  useEffect(() => {
    setIsMounted(true);
    if (localStorage.getItem('lucky-location-bypass') === 'true') {
      setStatus('granted');
    }
    return () => setIsMounted(false);
  }, []);

  const checkLocation = () => {
    setStatus('checking');
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setStatus('denied');
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use environment variable or fallback to default
          const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || '00000000-0000-0000-0000-000000000001'; 
          
          const { data: isWithinRange, error: rpcError } = await supabase.rpc('is_within_delivery_range', {
            p_store_id: STORE_ID,
            p_customer_lat: latitude,
            p_customer_lng: longitude
          });

          if (rpcError) throw rpcError;

          if (isMounted) {
            if (isWithinRange) {
              setStatus('granted');
              localStorage.setItem('lucky-location-bypass', 'true');
            } else {
              setStatus('out_of_range');
            }
          }
        } catch (err) {
          logger.error('Location check error:', err);
          if (isMounted) {
            setError('Could not verify your location. Please try again.');
            setStatus('denied');
          }
        }
      },
      (err) => {
        logger.error('Geolocation error:', err);
        if (isMounted) {
          if (err.code === 1) setError('Please allow location access in your browser settings.');
          else if (err.code === 3) setError('Location request timed out. Please try again.');
          else setError('Could not determine your location.');
          setStatus('denied');
        }
      },
      geoOptions
    );
  };

  if (status === 'granted') return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[200] bg-background-default flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <AnimatePresence mode="wait">
          {status === 'idle' || status === 'denied' ? (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="w-20 h-20 bg-primary-subtle text-primary-default rounded-full flex items-center justify-center mx-auto mb-8 shadow-level-2">
                <MapPin size={40} />
              </div>
              <h1 className="text-2xl font-black tracking-tight mb-4 leading-tight">ডেলিভারি এরিয়া চেক করুন</h1>
              <p className="text-text-secondary mb-10 text-sm px-4">
                আমরা বর্তমানে শুধু চট্টগ্রাম ব্রাঞ্চের ১০ কিমি ব্যাসার্ধের মধ্যে ডেলিভারি দিচ্ছি। কেনাকাটা শুরু করতে আপনার লোকেশন শেয়ার করুন।
              </p>
              
              {error && (
                <div className="mb-8 p-4 bg-danger-subtle text-danger-default rounded-2xl flex items-center gap-3 text-left text-xs font-bold">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button 
                onClick={checkLocation}
                className="premium-button w-full bg-primary-default text-primary-on hover:bg-primary-hover shadow-level-2"
              >
                লোকেশন চেক করুন
              </button>
            </motion.div>
          ) : status === 'checking' ? (
            <motion.div 
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 border-4 border-primary-subtle border-t-primary-default rounded-full animate-spin mb-8" />
              <h2 className="text-xl font-bold">চেক করা হচ্ছে...</h2>
              <p className="text-text-muted text-sm mt-2">Checking your proximity to Lucky Store</p>
            </motion.div>
          ) : (
            <motion.div 
              key="out_of_range"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[40px] p-10 shadow-level-3 border border-border-default"
            >
              <div className="w-20 h-20 bg-danger-subtle text-danger-default rounded-full flex items-center justify-center mx-auto mb-8">
                <Navigation size={40} />
              </div>
              <h2 className="text-2xl font-black text-danger-default mb-4">দুঃখিত, আপনি রেঞ্জের বাইরে!</h2>
              <p className="text-text-secondary text-sm mb-10">
                আপনি বর্তমানে আমাদের ১০ কিমি ডেলিভারি রেঞ্জের বাইরে অবস্থান করছেন। আমরা শীঘ্রই আপনার এলাকায় আসার চেষ্টা করব!
              </p>
              <button 
                onClick={() => setStatus('idle')}
                className="text-primary-default font-black uppercase tracking-widest text-xs hover:underline"
              >
                আবার চেষ্টা করুন
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
