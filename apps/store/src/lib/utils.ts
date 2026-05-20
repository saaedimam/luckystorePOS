import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function formatPrice(amount: number, lang: 'en' | 'bn' = 'en'): string {
  const str = amount.toString();
  if (lang === 'en') return `৳${str}`;
  
  const bnStr = str.split('').map(char => {
    if (/[0-9]/.test(char)) {
      return bnDigits[parseInt(char)];
    }
    return char;
  }).join('');
  
  return `৳${bnStr}`;
}
