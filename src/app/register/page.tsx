"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useWallet } from '@/context/WalletContext';
import { signMessage } from '@/lib/signMessage';

type Role = 'donor' | 'student' | 'vendor';

export default function RegisterPage() {
  const router = useRouter();
  const { account, signer } = useWallet();
  const [role, setRole] = useState<Role>('donor');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset role-specific fields when role changes
  useEffect(() => {
    setCollege('');
    setDepartment('');
    setBusinessName('');
    setError('');
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !signer) {
      setError('Please connect your wallet first.');
      return;
    }
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (role === 'student' && (!college.trim() || !department.trim())) {
      setError('College and department are required for students.');
      return;
    }
    if (role === 'vendor' && !businessName.trim()) {
      setError('Business name is required for vendors.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Message to sign – proves ownership of the wallet
      const message = `I verify that I own wallet ${account} and wish to register as a ${role} on EduGrant.`;
      const signature = await signMessage(signer, message);

      const payload: any = {
        wallet: account,
        role,
        name: name.trim(),
        signature,
        message,
      };
      if (role === 'student') {
        payload.college = college.trim();
        payload.department = department.trim();
      }
      if (role === 'vendor') {
        payload.businessName = businessName.trim();
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setSuccess(`Registration successful! Redirecting to ${role} dashboard...`);
      setTimeout(() => {
        router.push(`/${role}/dashboard`);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#FDFCF8] flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl border border-[#EBE6E0] shadow-sm text-center max-w-md">
          <svg className="w-16 h-16 text-[#A38A63] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Connect Wallet</h2>
          <p className="text-[#8C8276]">Please connect your wallet using the button in the navbar to register.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FDFCF8] pt-20 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl border border-[#EBE6E0] shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-[#EBE6E0] bg-gradient-to-r from-[#F5F0E6] to-white">
            <h1 className="text-2xl font-bold text-[#4A4238]">Create Your Profile</h1>
            <p className="text-[#8C8276] text-sm mt-1">Register to unlock all EduGrant features</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-bold text-[#4A4238] mb-2">I am a</label>
              <div className="flex gap-4">
                {(['donor', 'student', 'vendor'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      role === r
                        ? 'bg-[#A38A63] text-white shadow-md'
                        : 'bg-[#FAFAF7] text-[#8C8276] border border-[#EBE6E0] hover:bg-[#F5F0E6]'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Common: Name */}
            <div>
              <label className="block text-sm font-bold text-[#4A4238] mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-[#EBE6E0] rounded-xl focus:ring-2 focus:ring-[#A38A63] focus:border-transparent outline-none transition bg-[#FAFAF7]"
                placeholder="e.g., John Doe"
                required
              />
            </div>

            {/* Student-specific fields */}
            {role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-[#4A4238] mb-1">College / University *</label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full px-4 py-3 border border-[#EBE6E0] rounded-xl focus:ring-2 focus:ring-[#A38A63] focus:border-transparent outline-none transition bg-[#FAFAF7]"
                    placeholder="e.g., Dayananda Sagar College of Engineering"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A4238] mb-1">Department *</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 border border-[#EBE6E0] rounded-xl focus:ring-2 focus:ring-[#A38A63] focus:border-transparent outline-none transition bg-[#FAFAF7]"
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
              </>
            )}

            {/* Vendor-specific fields */}
            {role === 'vendor' && (
              <div>
                <label className="block text-sm font-bold text-[#4A4238] mb-1">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 border border-[#EBE6E0] rounded-xl focus:ring-2 focus:ring-[#A38A63] focus:border-transparent outline-none transition bg-[#FAFAF7]"
                  placeholder="e.g., Campus Bookstore"
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#A38A63] text-white font-bold py-3 rounded-xl hover:bg-[#8F7856] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Processing...
                </>
              ) : (
                'Register & Sign'
              )}
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm border border-green-200">
                {success}
              </div>
            )}
          </form>

          <div className="p-4 bg-[#FAFAF7] border-t border-[#EBE6E0] text-xs text-[#8C8276] text-center">
            By registering, you confirm that you own this wallet. No password or email required.
          </div>
        </motion.div>
      </div>
    </div>
  );
}