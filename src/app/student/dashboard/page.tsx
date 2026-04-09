"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext';

export default function StudentDashboardData() {
  const { account, signer } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [vendors, setVendors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (signer && account) fetchStudentData();
  }, [signer, account]);

  const fetchStudentData = async () => {
    if (!signer || !account) return;
    setLoading(true);
    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);

      // 1. Fetch Student's Live Balance
      // Note: Change 'studentAllowances' to whatever your mapping is named in your .sol file
      const myBalance = await contract.studentAllowances(account);
      setBalance(ethers.formatUnits(myBalance, 0));

      // 2. Fetch Whitelisted Vendors (So the student knows who to pay)
      const vendorFilter = contract.filters.VendorStatusUpdated();
      const vendorEvents = await contract.queryFilter(vendorFilter);
      
      const approvedVendors = new Set<string>();
      vendorEvents.forEach((event: any) => {
        if (event.args[1] === true) approvedVendors.add(event.args[0]);
        else approvedVendors.delete(event.args[0]);
      });
      setVendors(Array.from(approvedVendors));

    } catch (error) {
      console.error("Error fetching student data:", error);
    }
    setLoading(false);
  };

  const formatAddr = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#FDFCF8]">
        <div className="bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(74,66,56,0.03)] border border-[#EBE6E0] text-center max-w-md w-full">
          <div className="w-16 h-16 bg-[#F5F0E6] text-[#A38A63] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Access Denied</h2>
          <p className="text-[#8C8276]">Please connect your Student Wallet to view your grant details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] pt-10 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* WALLET CARD */}
        <div className="bg-gradient-to-br from-[#4A4238] to-[#363028] rounded-[2rem] p-8 sm:p-10 text-[#FDFCF8] shadow-xl shadow-[#4A4238]/10 mb-10 relative overflow-hidden group">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity duration-700"></div>
          <svg className="absolute -bottom-6 -right-6 w-48 h-48 text-[#EBE6E0] opacity-5 rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6l-9-5m9 5l9-5" /></svg>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#7A9C59] animate-pulse"></div>
              <p className="text-[#D6CEC4] font-medium text-sm tracking-wide uppercase">Available Education Grant</p>
            </div>
            
            <div className="flex items-end gap-3 mb-8">
              <h1 className="text-6xl sm:text-7xl font-black tracking-tight">
                {loading ? (
                  <span className="animate-pulse text-[#8C8276]">...</span>
                ) : balance}
              </h1>
              <span className="text-xl text-[#A38A63] font-bold mb-2">USDC</span>
            </div>
            
            <div className="inline-flex items-center gap-3 bg-[#2A251E]/50 px-4 py-2.5 rounded-xl border border-[#5C5346]/50 backdrop-blur-sm">
              <svg className="w-4 h-4 text-[#A38A63]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              <span className="font-mono text-sm text-[#D6CEC4] tracking-wider">
                {formatAddr(account)}
              </span>
            </div>
          </div>
        </div>

        {/* APPROVED VENDORS LIST */}
        <div className="bg-white border border-[#EBE6E0] rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(74,66,56,0.03)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-[#4A4238]">Where you can spend</h2>
              <p className="text-[#8C8276] mt-1 text-sm">Approved institutional partners</p>
            </div>
            <button 
              onClick={fetchStudentData} 
              disabled={loading}
              className="group flex items-center gap-2 px-4 py-2 bg-[#F5F0E6] text-[#A38A63] rounded-xl hover:bg-[#EBE6E0] transition-colors text-sm font-bold active:scale-95 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#8C8276]">
              <div className="w-8 h-8 border-4 border-[#EBE6E0] border-t-[#A38A63] rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Scanning blockchain for vendors...</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-12 bg-[#FAFAF7] rounded-2xl border border-dashed border-[#D6CEC4]">
              <svg className="w-12 h-12 text-[#D6CEC4] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="text-[#8C8276] font-medium">No university vendors available yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {vendors.map((v, index) => (
                <div key={v} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#FAFAF7] border border-[#EBE6E0] rounded-2xl hover:border-[#D6CEC4] hover:bg-[#F5F0E6]/50 transition-all duration-200 group">
                  
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="bg-white p-3.5 rounded-xl shadow-sm border border-[#EBE6E0] text-[#C28C53] group-hover:scale-105 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#4A4238] text-lg">University Bookstore #{index + 1}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7A9C59]"></span>
                        <p className="text-sm font-mono text-[#7A7165]">{formatAddr(v)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigator.clipboard.writeText(v)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-sm font-bold text-[#7A7165] border border-[#EBE6E0] rounded-xl hover:border-[#A38A63] hover:text-[#A38A63] shadow-sm active:scale-95 transition-all w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Copy Address
                  </button>
                  
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}