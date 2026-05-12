"use client";
import { useState, useEffect } from 'react';
import { ethers, EventLog } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';
import { useWallet } from '@/context/WalletContext';

export default function StudentSpendPage() {
  const { account, signer } = useWallet();
  const [allowance, setAllowance] = useState('0');
  const [vendors, setVendors] = useState<string[]>([]);
  const [vendorAddress, setVendorAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

  // Fetch student's allowance
  const fetchAllowance = async () => {
    if (!signer || !account) return;
    try {
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);
      const bal = await contract.studentAllowances(account);
      setAllowance(ethers.formatUnits(bal, 6));
    } catch (err) {
      console.error("Failed to fetch allowance", err);
    }
  };

  // Fetch approved vendors from events (simplified: full fetch from block 0)
  const fetchVendors = async () => {
    if (!signer) return;
    try {
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);
      const provider = signer.provider;
      const currentBlock = await provider.getBlockNumber();
      const filter = contract.filters.VendorStatusUpdated();
      const events = (await contract.queryFilter(filter, 0, currentBlock)) as EventLog[];
      const vendorMap = new Map<string, boolean>();
      for (const ev of events) {
        vendorMap.set(ev.args[0], ev.args[1]);
      }
      const approved = Array.from(vendorMap.entries())
        .filter(([, approved]) => approved === true)
        .map(([addr]) => addr);
      setVendors(approved);
    } catch (err) {
      console.error("Failed to fetch vendors", err);
    }
  };

  const handleSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      setStatus("Please connect your wallet.");
      return;
    }
    if (!vendorAddress || !amount) {
      setStatus("Please fill all fields.");
      return;
    }
    setLoading(true);
    setStatus("Sending transaction...");
    try {
      const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);
      const amountWithDecimals = ethers.parseUnits(amount, 6);
      const tx = await contract.spendGrant(vendorAddress, amountWithDecimals);
      await tx.wait();
      setStatus(`✅ Paid ${amount} USDC to vendor. Tx: ${tx.hash.slice(0,10)}...`);
      setVendorAddress('');
      setAmount('');
      await fetchAllowance(); // refresh balance
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Vendor not approved")) {
        setStatus("❌ Vendor is not approved by the university.");
      } else if (err.message.includes("Insufficient allowance")) {
        setStatus("❌ You don't have enough allowance.");
      } else {
        setStatus("❌ Transaction failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (signer && account) {
      fetchAllowance();
      fetchVendors();
    }
  }, [signer, account]);

  const formatAddr = (addr: string) => `${addr.slice(0,6)}...${addr.slice(-4)}`;

  if (!account) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-sm border max-w-md text-center">
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Connect Wallet</h2>
          <p className="text-[#8C8276]">Please connect your student wallet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] pt-12 pb-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header + Balance */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#4A4238]">Student Portal</h1>
            <p className="text-[#8C8276] mt-1">Spend your education grant at approved vendors.</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-full border border-[#EBE6E0] shadow-sm">
            <span className="text-sm text-[#4A4238]">Your Allowance:</span>
            <span className="ml-2 text-2xl font-bold text-[#A38A63]">{allowance} USDC</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Spend Form */}
          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-[#EBE6E0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#F5F0E6] rounded-xl text-[#A38A63]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-[#4A4238]">Pay a Vendor</h2>
            </div>
            <form onSubmit={handleSpend} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase text-[#8C8276]">Vendor Address</label>
                <input
                  type="text"
                  value={vendorAddress}
                  onChange={(e) => setVendorAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 mt-1 bg-[#FAFAF7] border border-[#EBE6E0] rounded-xl font-mono focus:border-[#A38A63] outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-[#8C8276]">Amount (USDC)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50"
                  min="1"
                  className="w-full px-4 py-3 mt-1 bg-[#FAFAF7] border border-[#EBE6E0] rounded-xl font-bold focus:border-[#A38A63] outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !account}
                className="w-full bg-[#7A9C59] text-white font-bold py-3 rounded-xl hover:bg-[#5C7A43] transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Pay with Grant"}
              </button>
            </form>
            {status && (
              <div className={`mt-5 p-3 rounded-xl text-sm border ${
                status.includes('✅') ? 'bg-green-50 text-green-700 border-green-200' :
                status.includes('❌') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {status}
              </div>
            )}
          </div>

          {/* Approved Vendors List */}
          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-[#EBE6E0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#F0EDE6] rounded-xl text-[#7A7165]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h2 className="text-xl font-bold text-[#4A4238]">Approved Vendors</h2>
            </div>
            {vendors.length === 0 ? (
              <p className="text-[#8C8276] text-center py-6">No approved vendors yet.</p>
            ) : (
              <ul className="space-y-3">
                {vendors.map(v => (
                  <li key={v} className="flex justify-between items-center p-3 bg-[#FAFAF7] rounded-xl border">
                    <span className="font-mono text-sm">{formatAddr(v)}</span>
                    <button
                      onClick={() => setVendorAddress(v)}
                      className="text-xs bg-[#EDF2EA] px-3 py-1 rounded-full text-[#5C7A43] hover:bg-[#CDE0C0]"
                    >
                      Use
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}