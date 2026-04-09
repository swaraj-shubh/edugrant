"use client";
import { useState } from 'react';
import { ethers } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext'; // NEW: Access global wallet

export default function DonorDashboard() {
  const { account, signer } = useWallet(); // Get global wallet data
  const [studentAddress, setStudentAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signer) {
      setStatus("Error: Please connect your MetaMask wallet via the Navbar first.");
      return;
    }

    setLoading(true);
    setStatus('Please approve the transaction in MetaMask...');

    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
      
      // Create a contract instance connected to the DONOR'S MetaMask
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);

      console.log(`Donating ${amount} to ${studentAddress}...`);

      // Execute the assignAllowance function directly from the donor's wallet
      const tx = await contract.assignAllowance(studentAddress, amount);
      
      setStatus('Transaction submitted to Sepolia. Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      setStatus(`Success! Allocated ${amount} to student. Tx Hash: ${receipt.hash}`);
      setStudentAddress('');
      setAmount('');
    } catch (err: any) {
      console.error(err);
      // Specific error handling for the "onlyBackend" modifier in your contract
      if (err.message.includes("Only Backend can call this")) {
        setStatus("Error: Your wallet is not authorized as a 'Backend' or 'Admin' in this contract.");
      } else {
        setStatus(`Error: ${err.reason || "Transaction rejected or failed."}`);
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
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#4A4238] tracking-tight mb-2">Sponsor a Student</h1>
            <p className="text-[#8C8276] text-sm sm:text-base">Securely lock funds into the EduGrant Escrow using your connected wallet.</p>
          </div>
          
          {/* CONNECTION BADGE */}
          <div className="inline-flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-full border border-[#EBE6E0] shadow-sm shrink-0">
            {account ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#7A9C59] animate-pulse"></span>
                <span className="text-[11px] font-bold text-[#5C7A43] uppercase tracking-wider">Wallet Connected</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#9E473F]"></span>
                <span className="text-[11px] font-bold text-[#9E473F] uppercase tracking-wider">Disconnected</span>
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0-10V5" /></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#4A4238]">Make a Donation</h2>
                <p className="text-sm text-[#8C8276] mt-0.5">Empower a student's educational journey</p>
              </div>
            </div>

            <form onSubmit={handleFund} className="flex flex-col gap-6">
              
              {/* STUDENT INPUT */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#8C8276] uppercase tracking-wider ml-1">Student Wallet Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#D6CEC4]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    value={studentAddress}
                    onChange={(e) => setStudentAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full pl-12 pr-4 py-4 bg-[#FAFAF7] border border-[#EBE6E0] rounded-xl text-[#4A4238] font-mono focus:border-[#A38A63] focus:ring-4 focus:ring-[#A38A63]/10 outline-none transition-all placeholder-[#D6CEC4]"
                    required
                  />
                </div>
              </div>

              {/* AMOUNT INPUT */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#8C8276] uppercase tracking-wider ml-1">Amount (USDC)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#D6CEC4]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 500"
                    min="1"
                    className="w-full pl-12 pr-4 py-4 bg-[#FAFAF7] border border-[#EBE6E0] rounded-xl text-[#4A4238] font-bold focus:border-[#A38A63] focus:ring-4 focus:ring-[#A38A63]/10 outline-none transition-all placeholder-[#D6CEC4]"
                    required
                  />
                </div>
              </div>
              
              {/* SUBMIT BUTTON */}
              <button 
                type="submit" 
                disabled={loading || !account}
                className="mt-2 w-full bg-[#A38A63] text-white font-bold py-4 rounded-xl hover:bg-[#8F7856] shadow-md shadow-[#A38A63]/20 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Awaiting Confirmation...
                  </>
                ) : !account ? (
                  'Connect Wallet First'
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    Donate On-Chain
                  </>
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

        {/* INFO FOOTER CARDS */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-6 rounded-[1.5rem] bg-[#FAFAF7] border border-[#EBE6E0] flex flex-col items-start hover:border-[#D6CEC4] transition-colors">
            <div className="p-2.5 bg-[#F5F0E6] text-[#A38A63] rounded-xl mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <h4 className="font-bold text-[#4A4238] mb-1.5">Direct Custody</h4>
            <p className="text-sm text-[#8C8276] leading-relaxed">Funds go directly to the Smart Contract, bypassing any middleman fees or delays.</p>
          </div>
          
          <div className="p-6 rounded-[1.5rem] bg-[#EDF2EA] border border-[#CDE0C0] flex flex-col items-start hover:border-[#B1CD9E] transition-colors">
            <div className="p-2.5 bg-white text-[#5C7A43] rounded-xl mb-4 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h4 className="font-bold text-[#3B4F2B] mb-1.5">Fraud Proof</h4>
            <p className="text-sm text-[#5C7A43] leading-relaxed">Students can only spend these funds at verified universities and approved vendors.</p>
          </div>
        </div>

      </div>
    </div>
  );
}