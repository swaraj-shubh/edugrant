"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext';

export default function AdminDashboardData() {
  const { account, signer } = useWallet();
  const [vendors, setVendors] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (signer) fetchOnChainData();
  }, [signer]);

  const fetchOnChainData = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
      console.log("1. Looking for contract at:", contractAddress);

      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);

      // 1. Fetch Whitelisted Vendors
      console.log("2. Fetching Vendor Events...");
      const vendorFilter = contract.filters.VendorStatusUpdated();
      
      // We pass 0 to tell it to search from the very first block
      const vendorEvents = await contract.queryFilter(vendorFilter, 0); 
      console.log("3. Vendor Events Found:", vendorEvents.length);

      const approvedVendors = new Set<string>();
      vendorEvents.forEach((event: any) => {
        if (event.args[1] === true) approvedVendors.add(event.args[0]);
        else approvedVendors.delete(event.args[0]);
      });
      setVendors(Array.from(approvedVendors));

      // 2. Fetch Students
      console.log("4. Fetching Student Events...");
      const studentFilter = contract.filters.AllowanceAssigned();
      const studentEvents = await contract.queryFilter(studentFilter, 0);
      console.log("5. Student Events Found:", studentEvents.length);
      
      const uniqueStudents = Array.from(new Set(studentEvents.map((e: any) => e.args[0])));
      const studentData = await Promise.all(uniqueStudents.map(async (address) => {
        const balance = await contract.studentAllowances(address); 
        return { address, balance: ethers.formatUnits(balance, 0) };
      }));
      setStudents(studentData);

      // 3. Fetch Transaction History
      console.log("6. Fetching Purchase Events...");
      const spendFilter = contract.filters.GrantSpent();
      const spendEvents = await contract.queryFilter(spendFilter, 0);
      console.log("7. Purchase Events Found:", spendEvents.length);
      
      const formattedHistory = spendEvents.map((e: any) => ({
        type: 'Purchase',
        student: e.args[0],
        vendor: e.args[1],
        amount: ethers.formatUnits(e.args[2], 0),
        txHash: e.transactionHash
      })).reverse(); 

      setHistory(formattedHistory);
      console.log("8. Dashboard Sync Complete!");
      
    } catch (error) {
      console.error("🚨 ERROR FETCHING BLOCKCHAIN DATA:", error);
    }
    setLoading(false);
  };

  const formatAddr = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#FDFCF8]">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#EBE6E0] text-center max-w-md w-full">
          <svg className="w-16 h-16 text-[#D6CEC4] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Access Denied</h2>
          <p className="text-[#8C8276]">Please connect your Admin Wallet to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#4A4238] tracking-tight">Global Overview</h1>
            <p className="text-[#8C8276] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7A9C59] animate-pulse"></span>
              Live on-chain statistics from Sepolia
            </p>
          </div>
          <button 
            onClick={fetchOnChainData} 
            disabled={loading}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-[#EBE6E0] text-[#4A4238] rounded-xl hover:bg-[#F5F0E6] hover:border-[#D6CEC4] transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed font-medium"
          >
            <svg className={`w-4 h-4 text-[#8C8276] group-hover:text-[#A38A63] transition-colors ${loading ? 'animate-spin text-[#A38A63]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {loading ? 'Syncing Data...' : 'Refresh Chain Data'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* VENDORS LIST */}
          <div className="bg-white border border-[#EBE6E0] rounded-3xl p-7 shadow-[0_8px_30px_rgb(74,66,56,0.03)] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#F5F0E6] rounded-xl text-[#A38A63]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h2 className="text-xl font-bold text-[#4A4238]">Approved Vendors</h2>
              <span className="ml-auto bg-[#F0EDE6] text-[#7A7165] py-1 px-3 rounded-full text-xs font-bold">{vendors.length}</span>
            </div>
            
            <div className="flex-1">
              {vendors.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#8C8276] py-8">
                  <p>No vendors approved yet.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {vendors.map(v => (
                    <li key={v} className="group bg-[#FAFAF7] hover:bg-[#F5F0E6]/50 p-4 rounded-2xl border border-[#EBE6E0] hover:border-[#D6CEC4] transition-colors flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EBE6E0] flex items-center justify-center text-[#7A7165] font-bold text-xs">V</div>
                        <span className="font-mono text-sm text-[#7A7165]">{formatAddr(v)}</span>
                      </div>
                      <span className="text-[#5C7A43] font-semibold bg-[#EDF2EA] px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7A9C59]"></span>
                        Active
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* STUDENTS LIST */}
          <div className="bg-white border border-[#EBE6E0] rounded-3xl p-7 shadow-[0_8px_30px_rgb(74,66,56,0.03)] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#FDF6ED] rounded-xl text-[#C28C53]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6l-9-5m9 5l9-5" /></svg>
              </div>
              <h2 className="text-xl font-bold text-[#4A4238]">Student Balances</h2>
              <span className="ml-auto bg-[#F0EDE6] text-[#7A7165] py-1 px-3 rounded-full text-xs font-bold">{students.length}</span>
            </div>

            <div className="flex-1">
              {students.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#8C8276] py-8">
                  <p>No students funded yet.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {students.map(s => (
                    <li key={s.address} className="group bg-[#FAFAF7] hover:bg-[#FDF6ED]/50 p-4 rounded-2xl border border-[#EBE6E0] hover:border-[#E8DCCB] transition-colors flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F2E8DA] flex items-center justify-center text-[#C28C53] font-bold text-xs">S</div>
                        <span className="font-mono text-sm text-[#7A7165]">{formatAddr(s.address)}</span>
                      </div>
                      <span className="font-bold text-[#4A4238] bg-white shadow-sm border border-[#EBE6E0] px-4 py-1.5 rounded-xl text-sm">
                        {s.balance} <span className="text-[#8C8276] font-medium">USDC</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* TRANSACTION HISTORY */}
        <div className="bg-white border border-[#EBE6E0] rounded-3xl p-7 shadow-[0_8px_30px_rgb(74,66,56,0.03)] overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#F0EDE6] rounded-xl text-[#7A7165]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-[#4A4238]">Recent Purchases</h2>
          </div>

          <div className="overflow-x-auto -mx-7 px-7">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-[#8C8276] border-b border-[#EBE6E0]">
                  <th className="pb-4 font-medium px-4">Transaction Type</th>
                  <th className="pb-4 font-medium px-4">Student</th>
                  <th className="pb-4 font-medium px-4">Vendor</th>
                  <th className="pb-4 font-medium px-4">Amount</th>
                  <th className="pb-4 font-medium px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F0E6]">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#8C8276]">
                      No purchase history found.
                    </td>
                  </tr>
                ) : (
                  history.map((tx, i) => (
                    <tr key={i} className="hover:bg-[#FAFAF7] transition-colors group">
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF2EA] text-[#5C7A43] font-medium text-xs">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[#7A7165]">{formatAddr(tx.student)}</td>
                      <td className="py-4 px-4 font-mono text-[#7A7165] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#D6CEC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        {formatAddr(tx.vendor)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-[#4A4238]">{tx.amount}</span>
                        <span className="text-[#8C8276] ml-1">USDC</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center justify-center p-2 text-[#8C8276] hover:text-[#A38A63] hover:bg-[#F5F0E6] rounded-lg transition-colors"
                          title="View on Etherscan"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}