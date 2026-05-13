"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function VendorPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] pt-12 pb-20 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-[#EBE6E0] rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#7A9C59] animate-pulse"></span>
            <span className="text-xs font-medium text-[#5C7A43]">Secure Payments</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#4A4238] mb-4">
            Vendor Portal
          </h1>
          <p className="text-lg text-[#8C8276] mb-8">
            As an approved vendor, you receive USDC payments directly from students' education grants.
            All transactions are recorded on-chain – transparent and instant.
          </p>
          <Link href="/vendor/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-[#A38A63] text-white font-bold rounded-xl shadow-lg hover:bg-[#8F7856] transition-all"
            >
              Go to Dashboard
            </motion.button>
          </Link>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="bg-white p-5 rounded-xl border border-[#EBE6E0]">
            <div className="text-[#A38A63] text-2xl mb-2">💰</div>
            <h3 className="font-bold text-[#4A4238]">Instant Settlements</h3>
            <p className="text-sm text-[#8C8276]">Payments are transferred the moment a student spends their grant.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#EBE6E0]">
            <div className="text-[#A38A63] text-2xl mb-2">🔗</div>
            <h3 className="font-bold text-[#4A4238]">Full Transparency</h3>
            <p className="text-sm text-[#8C8276]">Every transaction is verifiable on the Sepolia blockchain.</p>
          </div>
        </div>
      </div>
    </div>
  );
}