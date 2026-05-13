"use client";
import { useState, useEffect, useCallback } from 'react';
import { ethers, EventLog } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext';

const CACHE_KEY = 'edugrant_admin_cache';

export default function AdminDashboardData() {
  const { account, signer } = useWallet();

  const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS;

  if (account && adminWallet && account.toLowerCase() !== adminWallet.toLowerCase()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#FDFCF8]">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#EBE6E0] text-center max-w-md w-full">
          <svg className="w-16 h-16 text-[#D6CEC4] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Access Denied</h2>
          <p className="text-[#8C8276]">Only the admin wallet is allowed to view this page.</p>
          <p className="text-xs text-[#8C8276] mt-4 break-all">Admin address: {adminWallet}</p>
        </div>
      </div>
    );
  }

  const [vendors, setVendors] = useState<string[]>([]);
  const [students, setStudents] = useState<{ address: string; balance: string }[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  // Load cached data once on mount (no dependencies)
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setVendors(data.vendors || []);
        setStudents(data.students || []);
        setHistory(data.history || []);
      } catch (e) {
        console.warn("Cache parse error", e);
      }
    }
    // If no cache, initial fetch will happen inside fetchAllData (see below)
  }, []);

  // Fetch fresh data from blockchain – no state dependencies
  const fetchAllData = useCallback(async () => {
    if (!signer) return;
    setLoading(true);
    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);
      const provider = signer.provider;
      const currentBlock = await provider.getBlockNumber();

      // 1. Vendors (from VendorStatusUpdated events)
      const vendorFilter = contract.filters.VendorStatusUpdated();
      const vendorEvents = (await contract.queryFilter(vendorFilter, 0, currentBlock)) as EventLog[];
      const vendorMap = new Map<string, boolean>();
      for (const ev of vendorEvents) {
        vendorMap.set(ev.args[0], ev.args[1]);
      }
      const approvedVendors = Array.from(vendorMap.entries())
        .filter(([, approved]) => approved === true)
        .map(([vendor]) => vendor);

      // 2. Students (from AllowanceAssigned events)
      const studentFilter = contract.filters.AllowanceAssigned();
      const studentEvents = (await contract.queryFilter(studentFilter, 0, currentBlock)) as EventLog[];
      const uniqueStudents = Array.from(new Set(studentEvents.map(ev => ev.args[0])));
      const studentsData = await Promise.all(uniqueStudents.map(async (addr) => {
        const bal = await contract.studentAllowances(addr);
        return { address: addr, balance: ethers.formatUnits(bal, 6) };
      }));

      // 3. History (GrantSpent + StudentFunded)
      const spendFilter = contract.filters.GrantSpent();
      const fundFilter = contract.filters.StudentFunded();
      const [spendEvents, fundEvents] = await Promise.all([
        contract.queryFilter(spendFilter, 0, currentBlock) as Promise<EventLog[]>,
        contract.queryFilter(fundFilter, 0, currentBlock) as Promise<EventLog[]>
      ]);
      const combinedHistory = [
        ...fundEvents.map(ev => ({
          type: 'Donation',
          donor: ev.args[0],
          student: ev.args[1],
          amount: ethers.formatUnits(ev.args[2], 6),
          txHash: ev.transactionHash,
          timestamp: parseInt(ev.blockNumber.toString()) * 1000
        })),
        ...spendEvents.map(ev => ({
          type: 'Purchase',
          student: ev.args[0],
          vendor: ev.args[1],
          amount: ethers.formatUnits(ev.args[2], 6),
          txHash: ev.transactionHash,
          timestamp: parseInt(ev.blockNumber.toString()) * 1000
        }))
      ];
      combinedHistory.sort((a, b) => b.timestamp - a.timestamp);

      // 4. Contract balance
      const balanceRaw = await contract.contractBalance();
      const contractBal = ethers.formatUnits(balanceRaw, 6);

      // Update state
      setVendors(approvedVendors);
      setStudents(studentsData);
      setHistory(combinedHistory);
      setContractBalance(contractBal);

      // Update cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        vendors: approvedVendors,
        students: studentsData,
        history: combinedHistory,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [signer]);

  // Initial fetch only when signer becomes available and if cache was empty
  useEffect(() => {
    if (signer) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        fetchAllData();
      } else {
        setLoading(false); // already showing cached data
      }
    }
  }, [signer, fetchAllData]);

  const forceRefresh = () => {
    localStorage.removeItem(CACHE_KEY);
    fetchAllData();
  };

  const formatAddr = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#FDFCF8]">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#EBE6E0] text-center max-w-md w-full">
          <svg className="w-16 h-16 text-[#D6CEC4] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Access Denied</h2>
          <p className="text-[#8C8276]">Please connect your Admin Wallet to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#4A4238] tracking-tight">Admin Panel</h1>
            <p className="text-[#8C8276] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7A9C59] animate-pulse"></span>
              Live on-chain statistics from Sepolia
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="bg-white px-4 py-2 rounded-full border border-[#EBE6E0] shadow-sm">
              <span className="text-sm text-[#4A4238] font-bold">💰 Contract Balance: </span>
              <span className="font-mono text-[#A38A63]">{contractBalance} USDC</span>
            </div>
            <button 
              onClick={forceRefresh} 
              disabled={loading}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-[#EBE6E0] text-[#4A4238] rounded-xl hover:bg-[#F5F0E6] transition-all disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {loading ? 'Syncing...' : 'Force Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vendors Card */}
          <div className="bg-white border border-[#EBE6E0] rounded-3xl p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#F5F0E6] rounded-xl text-[#A38A63]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h2 className="text-xl font-bold text-[#4A4238]">Approved Vendors</h2>
              <span className="ml-auto bg-[#F0EDE6] text-[#7A7165] py-1 px-3 rounded-full text-xs font-bold">{vendors.length}</span>
            </div>
            {vendors.length === 0 ? (
              <div className="text-center py-8 text-[#8C8276]">No vendors approved yet.</div>
            ) : (
              <ul className="space-y-3">
                {vendors.map(v => (
                  <li key={v} className="flex justify-between items-center p-4 bg-[#FAFAF7] rounded-2xl border border-[#EBE6E0]">
                    <span className="font-mono text-sm">{formatAddr(v)}</span>
                    <span className="text-[#5C7A43] bg-[#EDF2EA] px-3 py-1 rounded-full text-xs">Active</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Students Card */}
          <div className="bg-white border border-[#EBE6E0] rounded-3xl p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#FDF6ED] rounded-xl text-[#C28C53]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-[#4A4238]">Student Balances</h2>
              <span className="ml-auto bg-[#F0EDE6] text-[#7A7165] py-1 px-3 rounded-full text-xs font-bold">{students.length}</span>
            </div>
            {students.length === 0 ? (
              <div className="text-center py-8 text-[#8C8276]">No students funded yet.</div>
            ) : (
              <ul className="space-y-3">
                {students.map(s => (
                  <li key={s.address} className="flex justify-between items-center p-4 bg-[#FAFAF7] rounded-2xl border border-[#EBE6E0]">
                    <span className="font-mono text-sm">{formatAddr(s.address)}</span>
                    <span className="font-bold">{s.balance} USDC</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white border border-[#EBE6E0] rounded-3xl p-7 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#F0EDE6] rounded-xl text-[#7A7165]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-[#4A4238]">Activity Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#8C8276] border-b border-[#EBE6E0]">
                <tr><th className="pb-3 px-4">Type</th><th className="pb-3 px-4">From/Student</th><th className="pb-3 px-4">To/Vendor</th><th className="pb-3 px-4">Amount</th><th className="pb-3 px-4 text-right">Tx Hash</th></tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-[#8C8276]">No activity yet.</td></tr>
                ) : (
                  history.slice(0, 20).map((tx, i) => (
                    <tr key={i} className="hover:bg-[#FAFAF7]">
                      <td className="py-3 px-4"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${tx.type === 'Donation' ? 'bg-[#EDF2EA] text-[#5C7A43]' : 'bg-[#F0EDE6] text-[#A38A63]'}`}>{tx.type}</span></td>
                      <td className="py-3 px-4 font-mono">{formatAddr(tx.donor || tx.student)}</td>
                      <td className="py-3 px-4 font-mono">{formatAddr(tx.student || tx.vendor)}</td>
                      <td className="py-3 px-4 font-bold">{tx.amount} USDC</td>
                      <td className="py-3 px-4 text-right"><a href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noreferrer" className="text-[#A38A63] hover:underline">🔗</a></td>
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