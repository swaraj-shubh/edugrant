"use client";
import { useState, useEffect } from 'react';
import { ethers, EventLog } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext';

export default function VendorDashboard() {
  const { account, signer } = useWallet();
  const [payments, setPayments] = useState<any[]>([]);
  const [totalReceived, setTotalReceived] = useState<string>('0');
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

  const fetchVendorData = async () => {
    if (!signer || !account) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);
      const provider = signer.provider;
      const currentBlock = await provider.getBlockNumber();

      // Check if vendor is whitelisted
      const whitelisted = await contract.isWhitelistedVendor(account);
      setIsWhitelisted(whitelisted);

      // Get all GrantSpent events where this vendor is the recipient
      const filter = contract.filters.GrantSpent(null, account);
      const events = (await contract.queryFilter(filter, 0, currentBlock)) as EventLog[];

      let total = ethers.parseUnits("0", 6);
      const formatted = events.map(ev => {
        const amount = ev.args[2];
        total += amount;
        return {
          txHash: ev.transactionHash,
          student: ev.args[0],
          amount: ethers.formatUnits(amount, 6),
          blockNumber: ev.blockNumber,
          timestamp: new Date(parseInt(ev.blockNumber.toString()) * 1000).toLocaleString()
        };
      });
      formatted.sort((a, b) => b.blockNumber - a.blockNumber);
      setPayments(formatted);
      setTotalReceived(ethers.formatUnits(total, 6));
    } catch (error) {
      console.error("Failed to fetch vendor data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (signer && account) {
      fetchVendorData();
    }
  }, [signer, account]);

  const formatAddress = (addr: string) => `${addr.slice(0,6)}...${addr.slice(-4)}`;

  if (!account) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-sm border max-w-md text-center">
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Connect Wallet</h2>
          <p className="text-[#8C8276]">Please connect your vendor wallet.</p>
        </div>
      </div>
    );
  }

  if (isWhitelisted === false) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-sm border max-w-md text-center">
          <svg className="w-16 h-16 text-[#9E473F] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Not Authorized</h2>
          <p className="text-[#8C8276]">Your wallet is not whitelisted as a vendor. Please contact the admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] pt-12 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#4A4238]">Vendor Dashboard</h1>
            <p className="text-[#8C8276] mt-1">View all payments received from students.</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-full border shadow-sm">
            <span className="text-sm">Total Received:</span>
            <span className="ml-2 text-2xl font-bold text-[#A38A63]">{totalReceived} USDC</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#EBE6E0] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#EBE6E0]">
            <h2 className="text-xl font-bold text-[#4A4238]">Payment History</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-[#8C8276]">Loading transactions...</div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-[#8C8276]">No payments received yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAF7] border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">Student</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F0E6]">
                  {payments.map((payment, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAF7]">
                      <td className="px-6 py-4 font-mono">{formatAddress(payment.student)}</td>
                      <td className="px-6 py-4 font-bold text-[#A38A63]">{payment.amount} USDC</td>
                      <td className="px-6 py-4 text-[#8C8276] text-xs">{payment.timestamp}</td>
                      <td className="px-6 py-4">
                        <a href={`https://sepolia.etherscan.io/tx/${payment.txHash}`} target="_blank" rel="noreferrer" className="text-[#7A9C59] hover:underline">View →</a>
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