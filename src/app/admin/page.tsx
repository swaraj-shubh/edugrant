"use client";
import { useState } from 'react';
import { ethers } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext';

export default function AdminDashboard() {
  const { account, signer } = useWallet(); // NEW: Get global MetaMask connection
  const [vendorAddress, setVendorAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signer) {
      setStatus("Error: Please connect your MetaMask wallet via the Navbar first.");
      return;
    }

    setLoading(true);
    setStatus('Please approve the transaction in MetaMask...');

    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
      
      // Create a contract instance securely connected to the Admin's MetaMask
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);

      // Execute the whitelist function directly from the browser
      const tx = await contract.setVendorStatus(vendorAddress, true);
      setStatus('Transaction submitted. Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      setStatus(`Vendor Approved! Tx Hash: ${receipt.hash}`);
      setVendorAddress('');
    } catch (err: any) {
      console.error(err);
      // Smart contract error handling
      if (err.message.includes("Only Admin")) {
        setStatus("Transaction Failed: The connected wallet is not the authorized Admin.");
      } else {
        setStatus('Transaction rejected by user or network failed.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] pt-12 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#4A4238] tracking-tight mb-2">Admin Control Center</h1>
            <p className="text-[#8C8276] text-sm sm:text-base">Manage the whitelist of approved educational vendors.</p>
          </div>
          
          {/* CONNECTION BADGE */}
          <div className="inline-flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-full border border-[#EBE6E0] shadow-sm shrink-0">
            {account ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#7A9C59] animate-pulse"></span>
                <span className="text-[11px] font-bold text-[#5C7A43] uppercase tracking-wider">Admin Connected</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#9E473F]"></span>
                <span className="text-[11px] font-bold text-[#9E473F] uppercase tracking-wider">Wallet Disconnected</span>
              </>
            )}
          </div>
        </div>
        
        {/* MAIN CARD */}
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(74,66,56,0.04)] border border-[#EBE6E0] relative overflow-hidden">
          
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-[#F5F0E6] opacity-30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3.5 bg-[#F5F0E6] rounded-2xl text-[#A38A63] border border-[#EBE6E0]/50">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#4A4238]">Whitelist New Vendor</h2>
                <p className="text-sm text-[#8C8276] mt-0.5">Authorize a shopkeeper to receive grants</p>
              </div>
            </div>

            <form onSubmit={handleWhitelist} className="flex flex-col gap-6">
              
              {/* INPUT FIELD */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#8C8276] uppercase tracking-wider ml-1">Vendor Wallet Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#D6CEC4]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full pl-12 pr-4 py-4 bg-[#FAFAF7] border border-[#EBE6E0] rounded-xl text-[#4A4238] font-mono focus:border-[#A38A63] focus:ring-4 focus:ring-[#A38A63]/10 outline-none transition-all placeholder-[#D6CEC4]"
                    required
                  />
                </div>
              </div>
              
              {/* SUBMIT BUTTON */}
              <button 
                type="submit" 
                disabled={loading || !account}
                className="mt-2 w-full bg-[#4A4238] text-white font-bold py-4 rounded-xl hover:bg-[#363028] shadow-md shadow-[#4A4238]/10 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin text-[#D6CEC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Awaiting Signature...
                  </>
                ) : !account ? (
                  'Connect Wallet to Continue'
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Approve Vendor
                  </>
                )}
              </button>
            </form>

            {/* STATUS ALERTS */}
            {status && (
              <div className={`mt-6 p-4 rounded-xl text-sm font-medium border flex gap-3 ${
                status.includes('Approved') 
                  ? 'bg-[#EDF2EA] text-[#5C7A43] border-[#CDE0C0]' 
                  : status.includes('Error') || status.includes('Failed') || status.includes('rejected') 
                    ? 'bg-[#FDF2F2] text-[#9E473F] border-[#F2D6D6]' 
                    : 'bg-[#F5F0E6] text-[#A38A63] border-[#EBE6E0]'
              }`}>
                <div className="shrink-0 mt-0.5">
                  {status.includes('Approved') ? (
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
    </div>
  );
}