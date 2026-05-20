"use client";

import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/store';
import { MapPinOff } from 'lucide-react';

// Haversine formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

export default function LocationGuard({ children }: { children: React.ReactNode }) {
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);
  const { lang } = useCartStore();

  // Hardcoded Store Location for MVL (e.g., Banani, Dhaka)
  const storeLat = 23.7940;
  const storeLng = 90.4043;
  const maxRadiusKm = 5;

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const dist = getDistanceFromLatLonInKm(
            storeLat, storeLng, 
            position.coords.latitude, position.coords.longitude
          );
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsWithinRadius(dist <= maxRadiusKm);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsWithinRadius(true); // Default allow if denied/error for MVL
        }
      );
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsWithinRadius(true); // Default allow if not supported
    }
  }, []);

  if (isWithinRadius === false) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6">
          <MapPinOff size={40} />
        </div>
        <h2 className="text-xl font-black text-text-main mb-2">
          {lang === 'bn' ? 'আমরা এখনো আপনার এলাকায় ডেলিভারি দিচ্ছি না' : 'We do not deliver to your area yet'}
        </h2>
        <p className="text-text-muted mb-8">
          {lang === 'bn' ? 'স্টোর নম্বর: 01700000000' : 'Store Phone: 01700000000'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
