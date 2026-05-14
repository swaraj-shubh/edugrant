"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext';
import Link from 'next/link';

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function mint(address to, uint256 amount) external" // for MockUSDC testing
];

export default function DonorDashboard() {
  const { account, signer } = useWallet();
  const [studentAddress, setStudentAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(true);
  const [usdcBalance, setUsdcBalance] = useState('0');

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS!;

  // Fetch USDC balance of connected wallet
  const fetchBalance = async () => {
    if (!signer || !account) return;
    try {
      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
      const balance = await usdcContract.balanceOf(account);
      setUsdcBalance(ethers.formatUnits(balance, 6));
    } catch (err) {
      console.warn("Failed to fetch USDC balance", err);
    }
  };

  // Check allowance for the current amount
  const checkAllowance = async (value: string) => {
    if (!signer || !value) {
      setNeedsApproval(true);
      return;
    }
    try {
      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
      const amountWei = ethers.parseUnits(value, 6);
      const allowance = await usdcContract.allowance(account, contractAddress);
      setNeedsApproval(allowance < amountWei);
    } catch (err) {
      console.warn("Allowance check failed", err);
      setNeedsApproval(true);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    if (val) checkAllowance(val);
    else setNeedsApproval(true);
  };

  // Mint test USDC (only works with MockUSDC)
  const handleMint = async () => {
    if (!signer) return;
    setLoading(true);
    setStatus('Minting test USDC...');
    try {
      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
      // Mint 10,000 USDC (with 6 decimals = 10_000 * 10^6)
      const mintAmount = ethers.parseUnits("10000", 6);
      const tx = await usdcContract.mint(account, mintAmount);
      await tx.wait();
      await fetchBalance();
      setStatus('✅ Minted 10,000 USDC to your wallet!');
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Mint failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!signer || !amount) return;
    setLoading(true);
    setStatus('Approving USDC spend...');
    try {
      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
      const amountWithDecimals = ethers.parseUnits(amount, 6);
      const tx = await usdcContract.approve(contractAddress, amountWithDecimals);
      await tx.wait();
      setNeedsApproval(false);
      setStatus('✅ Approval successful! You can now fund the student.');
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Approval failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      setStatus("Error: Please connect your MetaMask wallet.");
      return;
    }
    if (needsApproval) {
      setStatus("Please approve USDC spending first.");
      return;
    }

    setLoading(true);
    setStatus('Sending funds to smart contract...');

    try {
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);
      const amountWithDecimals = ethers.parseUnits(amount, 6);
      const tx = await contract.fundStudent(studentAddress, amountWithDecimals);
      setStatus('Transaction submitted. Waiting for confirmation...');
      const receipt = await tx.wait();
      setStatus(`✅ Success! Funded ${amount} USDC to student. Tx: ${receipt.hash}`);
      setStudentAddress('');
      setAmount('');
      setNeedsApproval(true);
      await fetchBalance(); // update balance after donation
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("USDC transfer failed")) {
        setStatus("Error: USDC transfer failed. Did you approve enough?");
      } else {
        setStatus(`Error: ${err.reason || "Transaction failed."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (signer && account) {
      fetchBalance();
    }
  }, [signer, account]);

  if (!account) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#FDFCF8] flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#EBE6E0] text-center max-w-md">
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Connect Wallet</h2>
          <p className="text-[#8C8276]">Please connect your wallet to sponsor a student.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#FDFCF8] px-4 sm:px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Two‑column grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* LEFT COLUMN – Information & navigation */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#4A4238] tracking-tight mb-2">
                Sponsor a Student
              </h1>
              <p className="text-[#8C8276] text-sm sm:text-base">
                Securely lock funds into the EduGrant Escrow.
              </p>
            </div>

            {/* USDC Balance Card */}
            <div className="bg-white p-4 rounded-xl border border-[#EBE6E0] shadow-sm flex justify-between items-center">
              <span className="text-[#4A4238] font-medium">Your USDC Balance:</span>
              <span className="text-2xl font-bold text-[#A38A63]">{usdcBalance} USDC</span>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-[1.5rem] bg-[#FAFAF7] border border-[#EBE6E0]">
                <div className="p-2.5 bg-[#F5F0E6] text-[#A38A63] rounded-xl mb-3 inline-block">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h4 className="font-bold text-[#4A4238] mb-1">Direct Custody</h4>
                <p className="text-sm text-[#8C8276]">Funds go directly to the Smart Contract, bypassing any middleman.</p>
              </div>
              <div className="p-5 rounded-[1.5rem] bg-[#EDF2EA] border border-[#CDE0C0]">
                <div className="p-2.5 bg-white text-[#5C7A43] rounded-xl mb-3 inline-block">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="font-bold text-[#3B4F2B] mb-1">Fraud Proof</h4>
                <p className="text-sm text-[#5C7A43]">Students can only spend at approved vendors.</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/donor/nlp"
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#A38A63]/20 text-[#A38A63] rounded-2xl hover:bg-[#F5F0E6] hover:border-[#A38A63]/40 shadow-sm transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm font-medium">AI Assistant</span>
              </Link>
              <Link
                href="/donor/dashboard"
                className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4A4238] text-white shadow-lg shadow-[#4A4238]/10 hover:bg-[#3A342E] transition-all duration-300"
              >
                <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h8V3H3v10zm10 8h8V11h-8v10zm0-18v4h8V3h-8zM3 21h8v-6H3v6z" />
                </svg>
                <span className="text-sm font-semibold tracking-wide">Dashboard</span>
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN – Donation form */}
          <div>
            <div className="bg-white p-8 sm:p-6 rounded-[2rem] shadow-md border border-[#EBE6E0]">
              <div className="flex items-center gap-4 mb-7">
                <div className="p-3.5 bg-[#F5F0E6] rounded-2xl text-[#A38A63]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#4A4238]">Make a Donation</h2>
                  <p className="text-sm text-[#8C8276]">Empower a student's educational journey</p>
                </div>
              </div>

              <form onSubmit={handleFund} className="flex flex-col gap-6">
                <div>
                  <label className="text-[11px] font-bold text-[#8C8276] uppercase tracking-wider ml-1">Student Wallet Address</label>
                  <input
                    type="text"
                    value={studentAddress}
                    onChange={(e) => setStudentAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-4 mt-1 bg-[#FAFAF7] border border-[#EBE6E0] rounded-xl text-[#4A4238] font-mono focus:border-[#A38A63] focus:ring-4 focus:ring-[#A38A63]/10 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8C8276] uppercase tracking-wider ml-1">Amount (USDC)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="e.g. 500"
                    min="1"
                    className="w-full px-4 py-4 mt-1 bg-[#FAFAF7] border border-[#EBE6E0] rounded-xl text-[#4A4238] font-bold focus:border-[#A38A63] focus:ring-4 focus:ring-[#A38A63]/10 outline-none"
                    required
                  />
                </div>

                {parseFloat(usdcBalance) < (parseFloat(amount) || 0) && (
                  <button
                    type="button"
                    onClick={handleMint}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    🪙 Mint Test USDC (10,000)
                  </button>
                )}

                {needsApproval && amount && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={loading}
                    className="w-full bg-[#7A9C59] text-white font-bold py-4 rounded-xl hover:bg-[#5C7A43] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Approving...' : '1. Approve USDC Spend'}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading || !account || needsApproval || !amount || !studentAddress}
                  className="w-full bg-[#A38A63] text-white font-bold py-4 rounded-xl hover:bg-[#8F7856] transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : '2. Donate On-Chain'}
                </button>
              </form>

              {status && (
                <div className={`mt-6 p-4 rounded-xl text-sm font-medium border ${
                  status.includes('✅') ? 'bg-[#EDF2EA] text-[#5C7A43] border-[#CDE0C0]' :
                  status.includes('❌') ? 'bg-[#FDF2F2] text-[#9E473F] border-[#F2D6D6]' :
                  'bg-[#F5F0E6] text-[#A38A63] border-[#EBE6E0]'
                }`}>
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}