import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { WalletProvider } from "@/context/WalletContext"; // NEW: Import Provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduGrant | Programmable Scholarships",
  description: "Fraud-proof education funding powered by Blockchain and AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        {/* NEW: Wrap Navbar and Children in WalletProvider */}
        <WalletProvider>
          <Navbar />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}