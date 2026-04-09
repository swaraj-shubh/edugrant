"use client";
import { useState } from 'react';
import { ethers } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext';

export default function StudentDashboard() {
  const { account, signer } = useWallet(); // Get global MetaMask connection
  const [vendorAddress, setVendorAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      setStatus("Error: Please connect your MetaMask wallet via the Navbar first.");
      return;
    }

    setLoading(true);
    setStatus('Please approve the transaction in MetaMask...');

    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
      
      // Create a contract instance securely connected to the user's MetaMask
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);

      // Execute the purchase directly from the browser!
      const tx = await contract.spendGrant(vendorAddress, amount);
      setStatus('Transaction submitted. Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      setStatus(`Payment Successful! Tx Hash: ${receipt.hash}`);
      setVendorAddress('');
      setAmount('');
      
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Vendor is not approved")) {
        setStatus("Payment Failed: Vendor is not approved by the University.");
      } else if (err.message.includes("Insufficient allowance")) {
        setStatus("Payment Failed: Insufficient grant allowance.");
      } else {
        setStatus('Transaction rejected or failed.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] py-12 px-4 sm:px-6 flex flex-col items-center">
      
      {/* APP CARD / "PHONE" CONTAINER */}
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgb(74,66,56,0.06)] overflow-hidden border-4 sm:border-[8px] border-[#FAFAF7] pb-8 ring-1 ring-[#EBE6E0]">
        
        {/* HEADER SECTION */}
        <div className="bg-gradient-to-br from-[#4A4238] to-[#363028] p-8 text-[#FDFCF8] text-center rounded-b-[2.5rem] mb-8 shadow-sm relative overflow-hidden group">
          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity duration-700"></div>
          
          <div className="w-14 h-14 bg-[#FDFCF8]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-[#FDFCF8]/10">
            <svg className="w-7 h-7 text-[#D6CEC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          </div>

          <p className="text-[#D6CEC4] text-xs font-bold tracking-[0.2em] uppercase mb-1.5">My EduWallet</p>
          <h2 className="text-3xl font-black tracking-tight">Virtual ID</h2>
          
          {/* Connection Status Badge */}
          <div className="mt-5 inline-flex items-center gap-2.5 bg-[#2A251E]/60 px-4 py-2 rounded-full border border-[#5C5346]/50 backdrop-blur-md">
            {account ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#7A9C59] animate-pulse"></span>
                <span className="text-xs font-mono text-[#EBE6E0]">Connected: {account.substring(0,6)}...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#9E473F]"></span>
                <span className="text-xs font-medium text-[#D6CEC4]">Wallet Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* FORM SECTION */}
        <div className="px-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#F5F0E6] rounded-lg text-[#A38A63]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h3 className="text-[#4A4238] font-extrabold text-lg">Pay a Shopkeeper</h3>
          </div>
          
          <form onSubmit={handleSpend} className="flex flex-col gap-5">
            
            {/* VENDOR INPUT */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8C8276] uppercase tracking-wider ml-1">Vendor Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#D6CEC4]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  value={vendorAddress}
                  onChange={(e) => setVendorAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#FAFAF7] border border-[#EBE6E0] text-[#4A4238] font-mono text-sm focus:border-[#A38A63] focus:ring-4 focus:ring-[#A38A63]/10 outline-none transition-all placeholder-[#D6CEC4]"
                  required
                />
              </div>
            </div>

            {/* AMOUNT INPUT */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8C8276] uppercase tracking-wider ml-1">Amount to Spend (USDC)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#D6CEC4]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#FAFAF7] border border-[#EBE6E0] text-[#4A4238] font-bold focus:border-[#A38A63] focus:ring-4 focus:ring-[#A38A63]/10 outline-none transition-all placeholder-[#D6CEC4]"
                  required
                />
              </div>
            </div>
            
            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={loading || !account}
              className="mt-3 w-full bg-[#A38A63] text-white font-bold py-4 rounded-xl hover:bg-[#8F7856] shadow-md shadow-[#A38A63]/20 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Processing...
                </>
              ) : !account ? (
                'Connect Wallet First'
              ) : (
                'Pay via Smart Contract'
              )}
            </button>
          </form>

          {/* STATUS ALERTS */}
          {status && (
            <div className={`mt-6 p-4 rounded-xl text-sm font-medium border flex gap-3 ${
              status.includes('Success') 
                ? 'bg-[#EDF2EA] text-[#5C7A43] border-[#CDE0C0]' 
                : status.includes('Error') || status.includes('Failed') || status.includes('rejected') 
                  ? 'bg-[#FDF2F2] text-[#9E473F] border-[#F2D6D6]' 
                  : 'bg-[#F5F0E6] text-[#A38A63] border-[#EBE6E0]'
            }`}>
              <div className="shrink-0 mt-0.5">
                {status.includes('Success') ? (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : status.includes('Error') || status.includes('Failed') || status.includes('rejected') ? (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                   <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <span className="break-all">{status}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}