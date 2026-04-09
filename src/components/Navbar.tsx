"use client";
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext'; // NEW

export default function Navbar() {
  const { account, connectWallet, disconnectWallet } = useWallet(); // NEW

  // Helper function to format address like: 0x1234...abcd
  const formatAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <nav className="bg-[#2A251E]/95 backdrop-blur-md border-b border-[#363028] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#A38A63] rounded-lg flex items-center justify-center shadow-md shadow-[#A38A63]/20 group-hover:bg-[#8F7856] transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
            </div>
            <span className="font-extrabold text-2xl text-[#FDFCF8] tracking-tight">
              EduGrant<span className="text-[#A38A63]">.</span>
            </span>
          </Link>
          
          {/* DESKTOP NAVIGATION */}
          <div className="hidden md:flex items-center gap-2 text-sm font-bold text-[#D6CEC4]">
            <Link href="/donor" className="px-4 py-2 rounded-xl hover:bg-[#363028] hover:text-[#FDFCF8] transition-all">Donor Portal</Link>
            <Link href="/student" className="px-4 py-2 rounded-xl hover:bg-[#363028] hover:text-[#FDFCF8] transition-all">Student App</Link>
            <Link href="/admin" className="px-4 py-2 rounded-xl hover:bg-[#363028] hover:text-[#FDFCF8] transition-all">Admin</Link>
            
            <div className="h-6 w-px bg-[#4A4238] mx-2"></div> {/* Divider */}
            
            <Link href="/admin/dashboard" className="px-4 py-2 rounded-xl hover:bg-[#363028] hover:text-[#A38A63] transition-all">Admin Data</Link>
            <Link href="/student/dashboard" className="px-4 py-2 rounded-xl hover:bg-[#363028] hover:text-[#A38A63] transition-all">Student Data</Link>
          </div>

          {/* WALLET BUTTON */}
          <div className="flex items-center">
            {account ? (
              <button 
                onClick={disconnectWallet}
                className="group flex items-center gap-2.5 px-4 py-2.5 bg-[#363028] text-[#D6CEC4] rounded-xl border border-[#4A4238] hover:bg-[#3B2A2A] hover:border-[#9E473F] hover:text-[#E8A09B] transition-all shadow-sm"
                title="Click to disconnect"
              >
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7A9C59] opacity-75 group-hover:hidden"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7A9C59] group-hover:bg-[#9E473F] transition-colors"></span>
                </div>
                <span className="font-mono text-sm tracking-wide">{formatAddress(account)}</span>
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            ) : (
              <button 
                onClick={connectWallet}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#A38A63] text-white font-bold rounded-xl hover:bg-[#8F7856] shadow-md shadow-[#A38A63]/20 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Connect Wallet
              </button>
            )}
          </div>
          
        </div>
      </div>
    </nav>
  );
}