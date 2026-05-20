import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const fontBangla = Noto_Sans_Bengali({
  variable: "--font-bangla",
  subsets: ["bengali", "latin"],
});

export const metadata: Metadata = {
  title: "Lucky Store",
  description: "Order online from Lucky Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className={`${fontBangla.variable} antialiased bg-bg-main text-text-main flex justify-center min-h-screen`}>
        <div className="w-full max-w-[480px] bg-bg-main min-h-screen flex flex-col relative shadow-2xl shadow-black/40 border-x border-white/5">
          <Header />
          <main className="flex-1 overflow-y-auto pb-20">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
