"use client";
import { useState, useEffect, useCallback } from 'react';
import { ethers, EventLog } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext';

export default function StudentDashboard() {
  const { account, signer } = useWallet();
  const [allowance, setAllowance] = useState<string>('0');
  const [vendors, setVendors] = useState<string[]>([]);
  const [spendTransactions, setSpendTransactions] = useState<any[]>([]);
  const [fundTransactions, setFundTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

  // Fetch all data from the blockchain
  const fetchAllData = useCallback(async () => {
    if (!signer || !account) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);
      const provider = signer.provider;
      const currentBlock = await provider.getBlockNumber();

      // 1. Student's current allowance
      const rawAllowance = await contract.studentAllowances(account);
      setAllowance(ethers.formatUnits(rawAllowance, 6));

      // 2. Approved vendors (from VendorStatusUpdated events)
      const vendorFilter = contract.filters.VendorStatusUpdated();
      const vendorEvents = (await contract.queryFilter(vendorFilter, 0, currentBlock)) as EventLog[];
      const vendorMap = new Map<string, boolean>();
      for (const ev of vendorEvents) {
        vendorMap.set(ev.args[0], ev.args[1]);
      }
      const approvedVendors = Array.from(vendorMap.entries())
        .filter(([, status]) => status === true)
        .map(([addr]) => addr);
      setVendors(approvedVendors);

      // 3. Spend transactions (GrantSpent where this student is the spender)
      const spendFilter = contract.filters.GrantSpent(account, null);
      const spendEvents = (await contract.queryFilter(spendFilter, 0, currentBlock)) as EventLog[];
      const formattedSpends = spendEvents.map(ev => ({
        txHash: ev.transactionHash,
        vendor: ev.args[1],
        amount: ethers.formatUnits(ev.args[2], 6),
        blockNumber: ev.blockNumber,
        timestamp: new Date(parseInt(ev.blockNumber.toString()) * 1000).toLocaleString()
      }));
      formattedSpends.sort((a, b) => b.blockNumber - a.blockNumber);
      setSpendTransactions(formattedSpends);

      // 4. Funding transactions (StudentFunded where this student is the recipient)
      const fundFilter = contract.filters.StudentFunded(null, account);
      const fundEvents = (await contract.queryFilter(fundFilter, 0, currentBlock)) as EventLog[];
      const formattedFunds = fundEvents.map(ev => ({
        txHash: ev.transactionHash,
        donor: ev.args[0],
        amount: ethers.formatUnits(ev.args[2], 6),
        blockNumber: ev.blockNumber,
        timestamp: new Date(parseInt(ev.blockNumber.toString()) * 1000).toLocaleString()
      }));
      formattedFunds.sort((a, b) => b.blockNumber - a.blockNumber);
      setFundTransactions(formattedFunds);

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch student data:", error);
    } finally {
      setLoading(false);
    }
  }, [signer, account, contractAddress]);

  useEffect(() => {
    if (signer && account) {
      fetchAllData();
    }
  }, [signer, account, fetchAllData]);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!account) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#EBE6E0] text-center max-w-md">
          <svg className="w-16 h-16 text-[#D6CEC4] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Connect Wallet</h2>
          <p className="text-[#8C8276]">Please connect your student wallet to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header with wallet info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#4A4238] tracking-tight">Student Dashboard</h1>
            <p className="text-[#8C8276] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7A9C59] animate-pulse"></span>
              Connected: {formatAddress(account)}
            </p>
          </div>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EBE6E0] rounded-xl hover:bg-[#F5F0E6] transition"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-[#4A4238] to-[#363028] rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#D6CEC4] text-sm uppercase tracking-wide">Available Grant Balance</p>
              <p className="text-4xl font-black mt-1">{allowance} <span className="text-lg">USDC</span></p>
            </div>
            <div className="bg-[#2A251E]/50 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-[#D6CEC4] mt-4">Last updated: {lastRefresh.toLocaleTimeString()}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Approved Vendors */}
          <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#F5F0E6] rounded-lg text-[#A38A63]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#4A4238]">Approved Vendors</h2>
              <span className="ml-auto bg-[#F0EDE6] text-[#7A7165] px-3 py-1 rounded-full text-xs">{vendors.length}</span>
            </div>
            {vendors.length === 0 ? (
              <p className="text-center text-[#8C8276] py-6">No vendors approved yet.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {vendors.map(v => (
                  <li key={v} className="flex justify-between items-center p-3 bg-[#FAFAF7] rounded-xl border">
                    <span className="font-mono text-sm">{formatAddress(v)}</span>
                    <span className="text-[#5C7A43] bg-[#EDF2EA] px-2 py-0.5 rounded-full text-xs">Active</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Funding History (Donations you received) */}
          <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#EDF2EA] rounded-lg text-[#5C7A43]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#4A4238]">Funds Received</h2>
              <span className="ml-auto bg-[#F0EDE6] text-[#7A7165] px-3 py-1 rounded-full text-xs">{fundTransactions.length}</span>
            </div>
            {loading ? (
              <p className="text-center py-6 text-[#8C8276]">Loading...</p>
            ) : fundTransactions.length === 0 ? (
              <p className="text-center py-6 text-[#8C8276]">No donations yet.</p>
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-[#8C8276] border-b">
                    <tr><th className="text-left py-2">Donor</th><th className="text-left py-2">Amount</th><th className="text-right py-2">Tx</th></tr>
                  </thead>
                  <tbody>
                    {fundTransactions.map((tx, i) => (
                      <tr key={i} className="border-b border-[#F5F0E6]">
                        <td className="py-2 font-mono">{formatAddress(tx.donor)}</td>
                        <td className="py-2 font-bold text-[#A38A63]">{tx.amount} USDC</td>
                        <td className="py-2 text-right">
                          <a href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noreferrer" className="text-[#7A9C59] hover:underline">🔗</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Spending Transactions */}
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#FDF6ED] rounded-lg text-[#C28C53]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#4A4238]">Spending History</h2>
            <span className="ml-auto bg-[#F0EDE6] text-[#7A7165] px-3 py-1 rounded-full text-xs">{spendTransactions.length}</span>
          </div>
          {loading ? (
            <p className="text-center py-8 text-[#8C8276]">Loading transactions...</p>
          ) : spendTransactions.length === 0 ? (
            <p className="text-center py-8 text-[#8C8276]">You haven't made any purchases yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[#8C8276] border-b">
                  <tr><th className="text-left py-3 px-2">Vendor</th><th className="text-left py-3 px-2">Amount</th><th className="text-left py-3 px-2">Date</th><th className="text-right py-3 px-2">Transaction</th></tr>
                </thead>
                <tbody className="divide-y divide-[#F5F0E6]">
                  {spendTransactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-[#FAFAF7]">
                      <td className="py-3 px-2 font-mono">{formatAddress(tx.vendor)}</td>
                      <td className="py-3 px-2 font-bold text-[#A38A63]">{tx.amount} USDC</td>
                      <td className="py-3 px-2 text-[#8C8276] text-xs">{tx.timestamp}</td>
                      <td className="py-3 px-2 text-right">
                        <a href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noreferrer" className="text-[#7A9C59] hover:underline">View →</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}