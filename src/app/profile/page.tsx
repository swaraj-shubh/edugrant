"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useWallet } from '@/context/WalletContext';
import { signMessage } from '@/lib/signMessage';

interface UserProfile {
  wallet: string;
  role: 'donor' | 'student' | 'vendor';
  name: string;
  college?: string;
  department?: string;
  businessName?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const { account, signer } = useWallet();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch profile on component mount or account change
  useEffect(() => {
    if (account) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [account]);

  const fetchProfile = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile?wallet=${account}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');
      setProfile(data.user);
      setFormData(data.user);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    setError('');
    setSuccess('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!signer || !account || !profile) return;

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      // Prepare updates (only fields that are allowed to change)
      const updates: any = {};
      if (formData.name !== profile.name) updates.name = formData.name;
      if (profile.role === 'student') {
        if (formData.college !== profile.college) updates.college = formData.college;
        if (formData.department !== profile.department) updates.department = formData.department;
      } else if (profile.role === 'vendor') {
        if (formData.businessName !== profile.businessName) updates.businessName = formData.businessName;
      }

      if (Object.keys(updates).length === 0) {
        setEditMode(false);
        return;
      }

      // Sign message to verify ownership
      const message = `I verify that I own wallet ${account} and wish to update my profile.`;
      const signature = await signMessage(signer, message);

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: account,
          signature,
          message,
          updates,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setSuccess('Profile updated successfully!');
      setEditMode(false);
      await fetchProfile(); // refresh
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] pt-20 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl border border-[#EBE6E0] shadow-sm text-center max-w-md">
          <svg className="w-16 h-16 text-[#A38A63] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Connect Wallet</h2>
          <p className="text-[#8C8276]">Please connect your wallet to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="text-[#A38A63] text-lg">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] pt-20 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl border border-[#EBE6E0] shadow-sm text-center max-w-md">
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">No Profile Found</h2>
          <p className="text-[#8C8276] mb-6">You haven't registered yet. Please complete registration first.</p>
          <Link
            href="/register"
            className="inline-block bg-[#A38A63] text-white px-6 py-3 rounded-xl hover:bg-[#8F7856] transition"
          >
            Go to Registration
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] pt-12 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header with Dashboard Link */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold text-[#4A4238]">My Profile</h1>
            <Link
              href={`/${profile.role}/dashboard`}
              className="px-4 py-2 bg-[#F5F0E6] text-[#A38A63] rounded-xl hover:bg-[#EBE6E0] transition text-sm font-medium"
            >
              Go to {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} Dashboard →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-[#EBE6E0] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#EBE6E0] bg-gradient-to-r from-[#F5F0E6] to-white flex justify-between items-center">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8C8276]">Role</p>
                <p className="text-lg font-bold text-[#4A4238] capitalize">{profile.role}</p>
              </div>
              <button
                onClick={handleEditToggle}
                disabled={updating}
                className="px-4 py-2 bg-[#A38A63] text-white rounded-xl hover:bg-[#8F7856] transition text-sm disabled:opacity-50"
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Read-only or editable fields */}
              <div>
                <label className="block text-sm font-bold text-[#4A4238] mb-1">Wallet Address</label>
                <div className="font-mono text-sm bg-[#FAFAF7] p-3 rounded-xl border border-[#EBE6E0] break-all">
                  {profile.wallet}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4A4238] mb-1">Full Name</label>
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#EBE6E0] rounded-xl focus:ring-2 focus:ring-[#A38A63] focus:border-transparent outline-none transition bg-white"
                    required
                  />
                ) : (
                  <div className="text-[#4A4238] font-medium p-3 bg-[#FAFAF7] rounded-xl border border-[#EBE6E0]">
                    {profile.name}
                  </div>
                )}
              </div>

              {profile.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-[#4A4238] mb-1">College / University</label>
                    {editMode ? (
                      <input
                        type="text"
                        name="college"
                        value={formData.college || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-[#EBE6E0] rounded-xl focus:ring-2 focus:ring-[#A38A63] focus:border-transparent outline-none transition bg-white"
                      />
                    ) : (
                      <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#EBE6E0]">
                        {profile.college || '—'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#4A4238] mb-1">Department</label>
                    {editMode ? (
                      <input
                        type="text"
                        name="department"
                        value={formData.department || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-[#EBE6E0] rounded-xl focus:ring-2 focus:ring-[#A38A63] focus:border-transparent outline-none transition bg-white"
                      />
                    ) : (
                      <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#EBE6E0]">
                        {profile.department || '—'}
                      </div>
                    )}
                  </div>
                </>
              )}

              {profile.role === 'vendor' && (
                <div>
                  <label className="block text-sm font-bold text-[#4A4238] mb-1">Business Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-[#EBE6E0] rounded-xl focus:ring-2 focus:ring-[#A38A63] focus:border-transparent outline-none transition bg-white"
                    />
                  ) : (
                    <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#EBE6E0]">
                      {profile.businessName || '—'}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 text-sm text-[#8C8276]">
                <div>
                  <span className="font-medium">Registered:</span> {formatDate(profile.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Last updated:</span> {formatDate(profile.updatedAt)}
                </div>
              </div>

              {editMode && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="flex-1 bg-[#7A9C59] text-white font-bold py-3 rounded-xl hover:bg-[#5C7A43] transition disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="flex-1 bg-gray-200 text-[#4A4238] font-bold py-3 rounded-xl hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}

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
            </div>
          </div>

          {/* Quick links to other dashboards (optional) */}
          <div className="mt-8 text-center text-sm text-[#8C8276]">
            <Link href="/" className="hover:text-[#A38A63] transition">Home</Link>
            {' · '}
            <Link href="/register" className="hover:text-[#A38A63] transition">Register</Link>
            {' · '}
            <Link href={`/${profile.role}/dashboard`} className="hover:text-[#A38A63] transition">
              Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}