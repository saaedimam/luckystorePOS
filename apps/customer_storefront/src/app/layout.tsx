import type { Metadata, Viewport } from "next";
import { Inter, Hind_Siliguri, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const hindSiliguri = Hind_Siliguri({ subsets: ["bengali"], weight: ["400","500","600","700"], variable: "--font-hind-siliguri", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: "লাকি স্টোর — Lucky Store",
  description: "Fresh groceries & essentials delivered to your door in Chittagong.",
  other: {
    'cache-control': 'no-cache, no-store, must-revalidate',
  },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, themeColor: "#D4A843",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${inter.variable} ${hindSiliguri.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-bg-canvas text-text-primary antialiased">
        <div className="max-w-2xl mx-auto min-h-screen relative shadow-[0_0_40px_rgba(0,0,0,0.04)] bg-bg-surface flex flex-col overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
