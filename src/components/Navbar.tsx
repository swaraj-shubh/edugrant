"use client";

import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Navbar() {
  const { account, connectWallet, disconnectWallet } = useWallet();

  const formatAddress = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  const navLinks = [
    { href: "/donor", label: "Donors" },
    { href: "/student", label: "Students" },
    { href: "/vendor", label: "Vendors" },
    { href: "/admin", label: "Admin" },
  ];

  const navLinkRights = [
    { href: account ? "/donor/dashboard" : "/", label: "Dashboard" },
    { href: account ? "/student/dashboard" : "/", label: "Dashboard" },
    { href: account ? "/vendor/dashboard" : "/", label: "Dashboard" },
    { href: account ? "/admin/dashboard" : "/", label: "Dashboard" },
  ];

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
      <motion.nav
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-7xl"
      >
        <div
          className="flex items-center justify-between px-6 md:px-8 h-20 rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-2xl"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(255,255,255,0.72), rgba(255,255,255,0.42))",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[#A38A63]/20 blur-xl rounded-full scale-150" />

              <Image
                src="/icon2.png"
                alt="EduGrant"
                width={40}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
                className="relative z-10 transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[#4A4238] font-black text-xl tracking-tight">
                EduGrant
              </span>

              <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C8276] font-semibold">
                Smart Scholarship Wallet
              </span>
            </div>
          </Link>

          {/* NAV LINKS */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-[#6B6158] hover:text-[#4A4238] hover:bg-white/40 transition-all duration-300"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* a horizontal line to seperate left and right nav buttons */}
          <div className="hidden lg:block w-px h-6 bg-[#AC9362]/80"></div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">
            {/* Dashboard pill */}
            <Link
              href={
                account
                  ? "/register"
                  : "/"
              }
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/30 border border-white/20 text-[#6B6158] hover:bg-white/50 transition-all text-sm font-semibold"
            >
              Register
            </Link>
            <Link
              href={
                account
                  ? "/profile"
                  : "/"
              }
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/30 border border-white/20 text-[#6B6158] hover:bg-white/50 transition-all text-sm font-semibold"
            >
              Profile
            </Link>

            {/* Wallet Button */}
            {account ? (
              <button
                onClick={disconnectWallet}
                className="group relative overflow-hidden flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold text-[#4A4238] border border-[#D8D1C7] bg-white/50 hover:border-red-500/40 hover:border-2 transition-all duration-300 shadow-lg cursor-pointer"
              >
                <div className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#7A9C59] opacity-75 animate-ping"></span>

                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7A9C59]"></span>
                </div>

                <span className="font-mono tracking-wide">
                  {formatAddress(account)}
                </span>
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={connectWallet}
                className="px-6 py-3 rounded-2xl bg-[#4A4238] text-[#FDFCF8] font-semibold shadow-2xl hover:bg-[#3A342E] transition-all cursor-pointer"
              >
                Connect Wallet
              </motion.button>
            )}
          </div>
        </div>
      </motion.nav>
    </div>
  );
}