import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { X, User, Phone, Home, Building2, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const { user, isProfileModalOpen, closeProfileModal, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [hostel, setHostel] = useState(user?.hostel || 'NONE');
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
      setHostel(user.hostel || 'NONE');
      setRoomNumber(user.roomNumber || '');
      setError(null);
      setSuccess(false);
    }
  }, [user, isProfileModalOpen]);

  if (!isProfileModalOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!displayName.trim()) {
      setError('Full Name is required.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        hostel: hostel as any,
        roomNumber: roomNumber.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        closeProfileModal();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-[6px] shadow-2xl border border-slate-200 overflow-hidden font-sans">
        {/* Close Button */}
        <button
          onClick={closeProfileModal}
          className="absolute top-4 right-4 p-1.5 rounded-[3px] text-slate-400 hover:text-blue-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-b from-blue-50 to-white border-b border-blue-100">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-8 h-8 rounded-[3px] bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              <User className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">My Campus Profile</h2>
              <p className="text-xs text-slate-500 font-sans">
                Update your contact details and hostel location
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-[3px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-[3px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* Email (Read-Only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Registered Email (Account ID)
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Sharma"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Contact Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Used when you personally hold a found item to coordinate verified handover.
            </p>
          </div>

          {/* Hostel & Room Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Hostel / Residence
              </label>
              <select
                value={hostel}
                onChange={(e) => setHostel(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
              >
                <option value="NONE">Day Scholar / None</option>
                <option value="UNIWORLD_1">Uniworld 1</option>
                <option value="UNIWORLD_2">Uniworld 2</option>
                <option value="OTHER">Other Campus Hostel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Room Number
              </label>
              <div className="relative">
                <Home className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 304"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeProfileModal}
              className="px-4 py-2 text-xs font-semibold rounded-[3px] text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-colors btn-fluid"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
