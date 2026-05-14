"use client";
import { useState } from 'react';
import { ethers } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext';
import { Wallet } from 'ethers';
import Link from 'next/link';

export default function AdminDashboard() {
  const { account, signer } = useWallet();

  // Inside the component, after: const { account, signer } = useWallet();
  const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS;
  if (!account) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-sm border max-w-md text-center">
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Connect Wallet</h2>
          <p className="text-[#8C8276]">Please connect your ADMIN wallet.</p>
        </div>
      </div>
    );
  }

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

  const [vendorAddress, setVendorAddress] = useState('');
  const [revokeAddress, setRevokeAddress] = useState('');
  const [loadingWhitelist, setLoadingWhitelist] = useState(false);
  const [loadingRevoke, setLoadingRevoke] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const showStatus = (type: 'success' | 'error' | 'info', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 8000);
  };

  const handleWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      showStatus('error', 'Please connect your MetaMask wallet first.');
      return;
    }
    setLoadingWhitelist(true);
    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);
      const tx = await contract.setVendorStatus(vendorAddress, true);
      await tx.wait();
      showStatus('success', `✅ Vendor ${vendorAddress.slice(0,6)}... approved!`);
      setVendorAddress('');
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Only Admin")) {
        showStatus('error', '❌ The connected wallet is not the authorized Admin.');
      } else {
        showStatus('error', 'Transaction rejected or failed.');
      }
    }
    setLoadingWhitelist(false);
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      showStatus('error', 'Please connect your MetaMask wallet first.');
      return;
    }
    setLoadingRevoke(true);
    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);
      const tx = await contract.revokeAllowance(revokeAddress);
      await tx.wait();
      showStatus('success', `♻️ Allowance revoked for ${revokeAddress.slice(0,6)}...`);
      setRevokeAddress('');
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("No allowance to revoke")) {
        showStatus('error', 'This student has no allowance to revoke.');
      } else {
        showStatus('error', 'Revocation failed. Check console.');
      }
    }
    setLoadingRevoke(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] pt-12 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#4A4238] tracking-tight mb-2">Admin Control Center</h1>
            <p className="text-[#8C8276] text-sm sm:text-base">Manage vendors & student allowances</p>
          </div>
          <div className="flex items-center gap-3 ml-auto">

          {/* Status Pill */}
          <div className="inline-flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-full border border-[#EBE6E0] shadow-sm">
            {account ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#7A9C59] animate-pulse"></span>

                <span className="text-[11px] font-bold text-[#5C7A43] uppercase tracking-wider">
                  Admin Connected
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#9E473F]"></span>

                <span className="text-[11px] font-bold text-[#9E473F] uppercase tracking-wider">
                  Wallet Disconnected
                </span>
              </>
            )}
          </div>

          {/* Dashboard Button */}
          <Link
            href="/admin/dashboard"
            className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4A4238] text-white shadow-lg shadow-[#4A4238]/10 hover:bg-[#363028] transition-all duration-300"
          >
            <svg
              className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 13h8V3H3v10zm10 8h8V11h-8v10zm0-18v4h8V3h-8zM3 21h8v-6H3v6z"
              />
            </svg>

            <span className="text-sm font-semibold tracking-wide">
              Dashboard
            </span>
          </Link>

        </div>
        </div>

        {/* Two Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Whitelist Vendor Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-[#EBE6E0] relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-[#F5F0E6] opacity-30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-[#F5F0E6] rounded-2xl text-[#A38A63]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#4A4238]">Whitelist Vendor</h2>
                  <p className="text-sm text-[#8C8276]">Authorize a shopkeeper to receive grants</p>
                </div>
              </div>
              <form onSubmit={handleWhitelist} className="flex flex-col gap-5">
                <div>
                  <label className="text-[11px] font-bold text-[#8C8276] uppercase tracking-wider ml-1">Wallet Address</label>
                  <input 
                    type="text" 
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 mt-1 bg-[#FAFAF7] border border-[#EBE6E0] rounded-xl text-[#4A4238] font-mono focus:border-[#A38A63] focus:ring-2 focus:ring-[#A38A63]/20 outline-none"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loadingWhitelist || !account}
                  className="w-full bg-[#4A4238] text-white font-bold py-3 rounded-xl hover:bg-[#363028] transition-all disabled:opacity-50"
                >
                  {loadingWhitelist ? 'Processing...' : 'Approve Vendor'}
                </button>
              </form>
            </div>
          </div>

          {/* Revoke Allowance Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-[#EBE6E0] relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-[#FDF2F2] opacity-30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-[#FDF2F2] rounded-2xl text-[#9E473F]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#4A4238]">Revoke Allowance</h2>
                  <p className="text-sm text-[#8C8276]">Remove remaining grant from a student</p>
                </div>
              </div>
              <form onSubmit={handleRevoke} className="flex flex-col gap-5">
                <div>
                  <label className="text-[11px] font-bold text-[#8C8276] uppercase tracking-wider ml-1">Student Address</label>
                  <input 
                    type="text" 
                    value={revokeAddress}
                    onChange={(e) => setRevokeAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 mt-1 bg-[#FAFAF7] border border-[#EBE6E0] rounded-xl text-[#4A4238] font-mono focus:border-[#9E473F] focus:ring-2 focus:ring-[#9E473F]/20 outline-none"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loadingRevoke || !account}
                  className="w-full bg-[#9E473F] text-white font-bold py-3 rounded-xl hover:bg-[#7A3A33] transition-all disabled:opacity-50"
                >
                  {loadingRevoke ? 'Revoking...' : 'Revoke Allowance'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {status.message && (
          <div className={`mt-8 p-4 rounded-xl text-sm font-medium border ${
            status.type === 'success' ? 'bg-[#EDF2EA] text-[#5C7A43] border-[#CDE0C0]' :
            status.type === 'error' ? 'bg-[#FDF2F2] text-[#9E473F] border-[#F2D6D6]' :
            'bg-[#F5F0E6] text-[#A38A63] border-[#EBE6E0]'
          }`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}