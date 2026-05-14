"use client";
import { useState, useEffect } from 'react';
import { ethers, EventLog } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext';

export default function DonorDashboardData() {
  const { account, signer } = useWallet();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (signer && account) fetchDonations();
  }, [signer, account]);

  const fetchDonations = async () => {
    if (!signer || !account) return;
    setLoading(true);
    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);
      const provider = signer.provider;
      const currentBlock = await provider.getBlockNumber();

      const fundFilter = contract.filters.StudentFunded(account, null);
      const events = (await contract.queryFilter(fundFilter, 0, currentBlock)) as EventLog[];

      const formatted = await Promise.all(events.map(async (ev) => {
        const student = ev.args[1];
        const amount = ethers.formatUnits(ev.args[2], 6);
        const allowance = await contract.studentAllowances(student);
        return {
          txHash: ev.transactionHash,
          student,
          amount,
          remainingAllowance: ethers.formatUnits(allowance, 6),
          timestamp: parseInt(ev.blockNumber.toString()) * 1000
        };
      }));

      formatted.sort((a, b) => b.timestamp - a.timestamp);
      setDonations(formatted);
    } catch (error) {
      console.error("Failed to fetch donations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddr = (addr: string) => `${addr.substring(0,6)}...${addr.substring(addr.length-4)}`;

  if (!account) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] bg-[#FDFCF8] items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#EBE6E0] text-center max-w-md">
          <svg className="w-16 h-16 text-[#D6CEC4] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Connect Wallet</h2>
          <p className="text-[#8C8276]">Please connect your donor wallet to see your donation history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FDFCF8] pt-12 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-[#4A4238]">My Donations</h1>
          <p className="text-[#8C8276] mt-1">All the students you have funded through EduGrant</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#EBE6E0] shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#8C8276]">Loading your donations...</div>
          ) : donations.length === 0 ? (
            <div className="p-12 text-center text-[#8C8276]">You haven't made any donations yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAFAF7] border-b border-[#EBE6E0]">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-[#8C8276]">Student</th>
                    <th className="px-6 py-4 font-semibold text-[#8C8276]">Amount Donated</th>
                    <th className="px-6 py-4 font-semibold text-[#8C8276]">Remaining Allowance</th>
                    <th className="px-6 py-4 font-semibold text-[#8C8276]">Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F0E6]">
                  {donations.map((donation, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAF7]">
                      <td className="px-6 py-4 font-mono">{formatAddr(donation.student)}</td>
                      <td className="px-6 py-4 font-bold text-[#A38A63]">{donation.amount} USDC</td>
                      <td className="px-6 py-4">{donation.remainingAllowance} USDC</td>
                      <td className="px-6 py-4">
                        <a href={`https://sepolia.etherscan.io/tx/${donation.txHash}`} target="_blank" rel="noreferrer" className="text-[#7A9C59] hover:underline">View →</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-[#8C8276]">
          * Remaining allowance shows how much of your donation the student can still spend.
        </div>
      </div>
    </div>
  );
}