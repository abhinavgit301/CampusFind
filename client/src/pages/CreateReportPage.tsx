import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import {
  ArrowLeft,
  Upload,
  Building2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Camera,
  ShieldCheck,
  X,
  Phone,
  Sparkles,
} from 'lucide-react';

interface CreateReportPageProps {
  initialType?: 'LOST' | 'FOUND';
  onBack: () => void;
  onSuccess: (publicId: string) => void;
}

export const CreateReportPage: React.FC<CreateReportPageProps> = ({
  initialType = 'LOST',
  onBack,
  onSuccess,
}) => {
  const { user, updateProfile } = useAuth();
  const [reportType, setReportType] = useState<'LOST' | 'FOUND'>(initialType);

  // Common Fields
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('Electronics');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [eventAt, setEventAt] = useState(new Date().toISOString().split('T')[0]);

  // Photo state (cached to prevent duplicate uploads)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedPhotoKey, setUploadedPhotoKey] = useState<string | null>(null);

  // Lost Fields
  const [lastSeenLocation, setLastSeenLocation] = useState('Macro Campus');

  // Found Fields
  const [foundLocation, setFoundLocation] = useState('Macro Campus');
  const [holdingLocation, setHoldingLocation] = useState<
    'MACRO_RECEPTION' | 'UNIWORLD_1_RECEPTION' | 'UNIWORLD_2_RECEPTION' | 'WITH_FINDER'
  >('MACRO_RECEPTION');

  // Finder In-App Coordination Consent
  const [consentGiven, setConsentGiven] = useState(false);

  // Phone modal when WITH_FINDER is selected and user lacks a phone number
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Metadata
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    api.get('/categories').then((d) => setCategories(d.categories || [])).catch(() => {});
    api.get('/locations').then((d) => setLocations(d.locations || [])).catch(() => {});
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setUploadedPhotoKey(null); // Clear cached key so new selection is processed
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPhotoPreview(null);
    setUploadedPhotoKey(null);
  };

  const handleSelectHoldingLocation = (
    loc: 'MACRO_RECEPTION' | 'UNIWORLD_1_RECEPTION' | 'UNIWORLD_2_RECEPTION' | 'WITH_FINDER'
  ) => {
    setHoldingLocation(loc);
    // If kept personally by finder and user has not set a phone number, prompt modal
    if (loc === 'WITH_FINDER' && (!user?.phoneNumber || user.phoneNumber.trim() === '')) {
      setPhoneInput('');
      setPhoneError(null);
      setPhoneModalOpen(true);
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim() || phoneInput.trim().length < 6) {
      setPhoneError('Please enter a valid contact phone number.');
      return;
    }
    setSavingPhone(true);
    setPhoneError(null);
    try {
      await updateProfile({ phoneNumber: phoneInput.trim() });
      setConsentGiven(true);
      setPhoneModalOpen(false);
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to update phone number in profile.');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleCancelPhoneModal = () => {
    setPhoneModalOpen(false);
    // If user still doesn't have a phone number, revert custody to Macro Reception
    if (!user?.phoneNumber || user.phoneNumber.trim() === '') {
      setHoldingLocation('MACRO_RECEPTION');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted || loading) return; // Prevent duplicate submission

    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Item name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a brief description to aid identification.');
      return;
    }

    if (reportType === 'FOUND' && holdingLocation === 'WITH_FINDER') {
      if (!user?.phoneNumber || user.phoneNumber.trim() === '') {
        setPhoneModalOpen(true);
        setError('A phone number is required on your profile to keep found items personally.');
        return;
      }
      if (!consentGiven) {
        setError('Please acknowledge the in-app handover coordination terms.');
        return;
      }
    }

    setLoading(true);

    try {
      let finalPhotoKeys: string[] = [];

      // Upload image only once; reuse cached key on retry
      if (uploadedPhotoKey) {
        finalPhotoKeys.push(uploadedPhotoKey);
      } else if (selectedFile) {
        const uploadRes = await api.uploadFile(selectedFile);
        finalPhotoKeys.push(uploadRes.key);
        setUploadedPhotoKey(uploadRes.key);
      }

      // Build payload
      const combinedDescription = color.trim()
        ? `Color/Distinguishing: ${color.trim()}\n\n${description.trim()}`
        : description.trim();

      const payload: any = {
        reportType,
        title: title.trim(),
        categoryId,
        description: combinedDescription,
        eventAt,
        photoKeys: finalPhotoKeys,
        attributes: color.trim() ? { color: color.trim() } : {},
      };

      if (reportType === 'LOST') {
        payload.lastSeenLocation = lastSeenLocation;
      } else {
        payload.foundLocation = foundLocation;
        payload.holdingLocation = holdingLocation;

        if (holdingLocation === 'WITH_FINDER') {
          payload.contactDetails = {
            displayName: user?.displayName || 'Finder',
            phoneNumber: user?.phoneNumber || '',
            hostel: user?.hostel && user.hostel !== 'NONE' ? user.hostel : undefined,
          };
          payload.consentGiven = true;
        }
      }

      const res = await api.post('/reports', payload);
      setIsSubmitted(true);
      onSuccess(res.report.publicId);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please review your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors btn-fluid font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </button>

        <span className="text-xs font-mono font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-[3px] border border-blue-200">
          Campus Verification Portal
        </span>
      </div>

      <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-display">
            Report an Item
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Submit details to connect lost belongings or log found items into campus safe custody.
          </p>
        </div>

        {/* 1. Choose Report Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 font-sans">
            1. Report Type
          </label>
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-[4px] border border-slate-200">
            <button
              type="button"
              onClick={() => setReportType('LOST')}
              className={`py-2.5 px-4 rounded-[3px] text-xs font-bold transition-all flex items-center justify-center gap-2 btn-fluid font-sans ${
                reportType === 'LOST'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>I Lost an Item</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('FOUND')}
              className={`py-2.5 px-4 rounded-[3px] text-xs font-bold transition-all flex items-center justify-center gap-2 btn-fluid font-sans ${
                reportType === 'FOUND'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              <span>I Found an Item</span>
            </button>
          </div>
        </div>

        {/* Compact High-Value Item Advisory Banner */}
        {reportType === 'FOUND' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-[4px] flex items-start gap-2 text-xs text-blue-950 font-sans">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-blue-900">High-Value Item Protocol:</span>
              <p className="text-[11px] text-blue-800 leading-normal">
                Electronics, IDs, wallets, and keys can be deposited directly at Macro, Uniworld 1, or Uniworld 2 reception desks for safe custody.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-[4px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 2. Item Basics: Name, Category, Color, Date */}
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700 border-b border-slate-100 pb-1 font-sans">
              2. Item Details
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1 font-sans">
                Item Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  reportType === 'LOST'
                    ? 'e.g. Sony WH-1000XM4 Wireless Headphones'
                    : 'e.g. Dell 65W USB-C Laptop Charger'
                }
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1 font-sans">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-sans cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1 font-sans">
                  Color / Distinguishing Mark
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Matte Black with blue sticker"
                  className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1 font-sans">
                  {reportType === 'LOST' ? 'Date Lost *' : 'Date Found *'}
                </label>
                <input
                  type="date"
                  required
                  value={eventAt}
                  onChange={(e) => setEventAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1 font-sans">
                Description & Circumstances *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  reportType === 'LOST'
                    ? 'Provide details to identify the item (do not include private security PINs or passwords)...'
                    : 'Describe where and how the item was found, condition, and any external markings...'
                }
                className="w-full p-3 text-xs rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-sans leading-relaxed"
              />
            </div>
          </div>

          {/* 3. Location: Where Lost or Found */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 border-b border-slate-100 pb-1 font-sans">
              3. Location
            </label>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1 font-sans">
                {reportType === 'LOST' ? 'Last Seen Location *' : 'Discovered Location *'}
              </label>
              <select
                value={reportType === 'LOST' ? lastSeenLocation : foundLocation}
                onChange={(e) =>
                  reportType === 'LOST'
                    ? setLastSeenLocation(e.target.value)
                    : setFoundLocation(e.target.value)
                }
                className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-sans cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Custody Holding Location (ONLY for Found items) */}
          {reportType === 'FOUND' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 border-b border-slate-100 pb-1 font-sans">
                4. Item Custody
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Macro Reception */}
                <div
                  onClick={() => handleSelectHoldingLocation('MACRO_RECEPTION')}
                  className={`p-3.5 rounded-[4px] border cursor-pointer transition-all ${
                    holdingLocation === 'MACRO_RECEPTION'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-900">Macro Central Reception</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    Admin Building Security Desk (8 AM - 8 PM). Zero personal details shared.
                  </p>
                </div>

                {/* Uniworld 1 Reception */}
                <div
                  onClick={() => handleSelectHoldingLocation('UNIWORLD_1_RECEPTION')}
                  className={`p-3.5 rounded-[4px] border cursor-pointer transition-all ${
                    holdingLocation === 'UNIWORLD_1_RECEPTION'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Uniworld 1 Reception</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    Ground Floor Warden Desk (8 AM - 10 PM). Hostel safe custody.
                  </p>
                </div>

                {/* Uniworld 2 Reception */}
                <div
                  onClick={() => handleSelectHoldingLocation('UNIWORLD_2_RECEPTION')}
                  className={`p-3.5 rounded-[4px] border cursor-pointer transition-all ${
                    holdingLocation === 'UNIWORLD_2_RECEPTION'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">Uniworld 2 Reception</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    Ground Floor Helpdesk & Security (8 AM - 10 PM). Hostel safe custody.
                  </p>
                </div>

                {/* Kept with finder */}
                <div
                  onClick={() => handleSelectHoldingLocation('WITH_FINDER')}
                  className={`p-3.5 rounded-[4px] border cursor-pointer transition-all ${
                    holdingLocation === 'WITH_FINDER'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Kept Personally by Me</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    Requires a contact number in profile for verified handover coordination.
                  </p>
                </div>
              </div>

              {holdingLocation === 'WITH_FINDER' && (
                <div className="p-3.5 bg-slate-50 rounded-[4px] border border-slate-200 text-xs space-y-2.5 font-sans">
                  {user?.phoneNumber ? (
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          Phone on profile: <strong className="text-slate-900">{user.phoneNumber}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneInput(user.phoneNumber || '');
                          setPhoneError(null);
                          setPhoneModalOpen(true);
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline"
                      >
                        Change Number
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
                      <span>No phone number registered on your profile.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneInput('');
                          setPhoneError(null);
                          setPhoneModalOpen(true);
                        }}
                        className="font-bold underline text-blue-700"
                      >
                        Add Phone Now
                      </button>
                    </div>
                  )}

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="mt-0.5 rounded-[2px] text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 text-[11px] leading-relaxed">
                      I agree to keep this item safe. My phone number is securely stored in my profile and will <strong>only</strong> be shared with verified claimants after in-platform approval.
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* 5. Photograph Upload with Preview & Replace */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 border-b border-slate-100 pb-1 font-sans">
              {reportType === 'FOUND' ? '5. Item Photograph' : '4. Item Photograph (Optional)'}
            </label>

            {photoPreview ? (
              <div className="relative rounded-[4px] border border-slate-200 overflow-hidden bg-slate-900 max-h-56 flex items-center justify-center p-2">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="max-h-52 w-auto object-contain rounded-[2px]"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1.5 rounded-[3px] bg-slate-900/80 text-white hover:bg-red-600 transition-colors shadow-md"
                  title="Remove photograph"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-[4px] p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
                <Camera className="w-6 h-6 text-slate-400 mb-1.5" />
                <span className="text-xs font-semibold text-blue-600 font-sans">
                  Upload an item photograph
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 font-sans">
                  JPEG, PNG, or WebP (uploaded directly to safe Supabase storage)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Privacy Disclosure Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-[4px] text-[11px] text-slate-600 space-y-1 font-sans">
            <p className="font-semibold text-slate-800">Privacy Safeguard Notice:</p>
            <p>
              • <strong>Publicly visible:</strong> Item title, category, description, location, and photos.
            </p>
            <p>
              • <strong>Protected:</strong> Your phone number and hostel room number are never exposed to unverified public visitors.
            </p>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-xs font-semibold rounded-[3px] text-slate-600 hover:bg-slate-100 transition-colors font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitted}
              className="px-6 py-2.5 text-xs font-bold rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5 btn-fluid font-sans"
            >
              {loading ? 'Submitting Report...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>

      {/* Pop-up Modal to Add Phone Number when WITH_FINDER is selected */}
      {phoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-[6px] shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <button
              onClick={handleCancelPhoneModal}
              className="absolute top-4 right-4 p-1.5 rounded-[3px] text-slate-400 hover:text-blue-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 pb-4 bg-gradient-to-b from-blue-50 to-white border-b border-blue-100">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-8 h-8 rounded-[3px] bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  <Phone className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Contact Phone Number Required
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    For personal custody of found items
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSavePhone} className="p-6 space-y-4">
              {phoneError && (
                <div className="p-3 rounded-[3px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{phoneError}</span>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Because you are keeping this item personally, a contact number is required on your profile so verified owners can coordinate handover with you.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  This will update your profile and is kept confidential until in-platform claim verification.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelPhoneModal}
                  className="px-3.5 py-2 text-xs font-semibold rounded-[3px] text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Choose Reception Instead
                </button>
                <button
                  type="submit"
                  disabled={savingPhone}
                  className="px-5 py-2 text-xs font-bold rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-colors btn-fluid"
                >
                  {savingPhone ? 'Saving Profile...' : 'Save & Select Custody'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
