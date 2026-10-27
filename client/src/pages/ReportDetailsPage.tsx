import React, { useState, useEffect } from 'react';
import { Report } from '../types/index.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { ClaimModal } from '../components/ClaimModal.js';
import { ConfirmRecoveryModal } from '../components/ConfirmRecoveryModal.js';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Clock,
  Search,
  Lock,
} from 'lucide-react';

interface ReportDetailsPageProps {
  publicId: string;
  onBack: () => void;
}

export const ReportDetailsPage: React.FC<ReportDetailsPageProps> = ({ publicId, onBack }) => {
  const { user, openAuthModal } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/reports/${publicId}`);
      setReport(data.report);
    } catch (err: any) {
      setError(err.message || 'Failed to load listing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [publicId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-4">
        <div className="h-8 w-32 bg-slate-200 rounded-[3px] animate-pulse" />
        <div className="h-[460px] bg-white rounded-[6px] border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="p-4 rounded-[4px] bg-blue-50 text-blue-700 w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-blue-200">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-display">Listing Unavailable</h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">{error || 'This report does not exist or was withdrawn.'}</p>
        <button
          onClick={onBack}
          className="mt-6 px-5 py-2 text-xs font-semibold rounded-[3px] bg-slate-900 hover:bg-slate-800 text-white btn-fluid font-sans"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  const isOwner = user && typeof report.reporterId === 'object' && report.reporterId?._id === user.id;
  const isModerator = user?.role === 'MODERATOR';
  const isLost = report.reportType === 'LOST';
  const isResolved = report.status === 'RESOLVED';
  const isMacroReception = report.holdingLocation === 'MACRO_RECEPTION';
  const isUniworld1Reception = report.holdingLocation === 'UNIWORLD_1_RECEPTION';
  const isUniworld2Reception = report.holdingLocation === 'UNIWORLD_2_RECEPTION';
  const isAnyReception = isMacroReception || isUniworld1Reception || isUniworld2Reception;

  const formattedDate = new Date(report.eventAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const photoUrl = report.photoUrls && report.photoUrls.length > 0 ? report.photoUrls[0] : null;

  // Explicit Handover Pipeline Steps
  const pipelineSteps = [
    { number: '1', title: 'Claim submitted', desc: 'Claimant submits distinguishing details' },
    { number: '2', title: 'Review pending', desc: 'Proof matched against hidden characteristics' },
    { number: '3', title: 'Ownership verified', desc: 'Authorized reviewer verifies student identity' },
    { number: '4', title: 'Handover confirmed', desc: 'Physical exchange logged and item closed' },
  ];

  const currentStepIndex = isResolved ? 3 : 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Nav Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors btn-fluid font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to listings
        </button>

        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-[3px] bg-slate-100 text-slate-800 border border-slate-200">
          ID: {report.publicId}
        </span>
      </div>

      {successMessage && (
        <div className="p-4 rounded-[4px] bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2 shadow-sm font-sans">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 4-Step Claim & Handover Sequence Banner */}
      <div className="bg-white rounded-[6px] border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
              Campus Handover Sequence
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500 font-sans">
            {isResolved ? 'Status: Handover Complete' : 'Status: Ready for Verification'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-sans">
          {pipelineSteps.map((step, idx) => {
            const isCompleted = isResolved || idx < currentStepIndex;
            const isCurrent = !isResolved && idx === currentStepIndex;
            return (
              <div
                key={step.number}
                className={`p-2.5 rounded-[4px] border text-xs space-y-1 ${
                  isCompleted
                    ? 'bg-blue-50 border-blue-300 text-blue-950'
                    : isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isCurrent
                        ? 'bg-white text-blue-600'
                        : isCompleted
                        ? 'bg-blue-200 text-blue-900'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {step.number}
                  </span>
                  <span className="truncate">{step.title}</span>
                </div>
                <p
                  className={`text-[10px] leading-tight ${
                    isCurrent ? 'text-blue-100' : isCompleted ? 'text-blue-800' : 'text-slate-400'
                  }`}
                >
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Details Card (Order: Photo, Name/Status, Custody Location, Date/Description, Actions) */}
      <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm overflow-hidden">
        {/* 1. Large Item Photograph */}
        <div className="relative bg-slate-950 flex items-center justify-center min-h-[300px] sm:min-h-[380px] p-6 border-b border-slate-200">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={report.title}
              className="max-h-[440px] w-auto max-w-full object-contain rounded-[4px]"
            />
          ) : (
            <div className="text-center text-slate-400 p-8">
              <div className="w-20 h-20 rounded-[4px] bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-300 font-bold text-3xl font-display">
                {report.title.charAt(0)}
              </div>
              <p className="text-sm font-semibold text-slate-300 font-sans">{report.title}</p>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">No photograph uploaded</p>
            </div>
          )}

          {/* Explicit Status Badges on Photo */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {isLost ? (
              <span className="px-3 py-1 rounded-[3px] text-xs font-bold bg-slate-900 text-white border border-slate-700 shadow-md flex items-center gap-1.5 font-sans">
                <Search className="w-3.5 h-3.5 text-sky-400 stroke-[2.5]" />
                LOST ITEM
              </span>
            ) : (
              <span className="px-3 py-1 rounded-[3px] text-xs font-bold bg-blue-600 text-white border border-blue-400 shadow-md flex items-center gap-1.5 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                FOUND ITEM
              </span>
            )}

            {isResolved && (
              <span className="px-3 py-1 rounded-[3px] text-xs font-bold bg-slate-900 text-emerald-300 border border-slate-700 shadow-md flex items-center gap-1 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Handover Resolved
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* 2. Item Name & Category */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-[3px] border border-blue-200">
              {report.categoryId}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
              {report.title}
            </h1>
          </div>

          {/* 3. Physical Custody Location & Collection Instructions */}
          {!isLost && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                Physical Custody & Collection Instructions
              </h3>

              {isMacroReception && (
                <div className="p-4 rounded-[6px] reception-card-macro space-y-2 font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-slate-900 text-sm">
                      Macro Central Campus Reception
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    This item is held in safe custody at the <strong>Macro Central Security Reception</strong> (Ground Floor, Admin Building).
                  </p>
                  <div className="p-2.5 bg-white rounded-[3px] border border-sky-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-sky-900">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      <span>Collection Hours: 8:00 AM – 8:00 PM Daily</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Present your student ID card for ownership verification before release.
                    </p>
                  </div>
                </div>
              )}

              {isUniworld1Reception && (
                <div className="p-4 rounded-[6px] reception-card-uniworld1 space-y-2 font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 text-sm">
                      Uniworld 1 Reception
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    This item is held in safe custody at the <strong>Uniworld 1 Ground Floor Warden & Security Desk</strong>.
                  </p>
                  <div className="p-2.5 bg-white rounded-[3px] border border-blue-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Collection Hours: 8:00 AM – 10:00 PM Daily</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Present your student ID and room confirmation for verified handover.
                    </p>
                  </div>
                </div>
              )}

              {isUniworld2Reception && (
                <div className="p-4 rounded-[6px] reception-card-uniworld2 space-y-2 font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm">
                      Uniworld 2 Reception
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    This item is held in safe custody at the <strong>Uniworld 2 Ground Floor Helpdesk & Security</strong>.
                  </p>
                  <div className="p-2.5 bg-white rounded-[3px] border border-indigo-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Collection Hours: 8:00 AM – 10:00 PM Daily</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Present your student ID and room confirmation for verified handover.
                    </p>
                  </div>
                </div>
              )}

              {!isAnyReception && (
                <div className="p-4 rounded-[6px] bg-slate-50 border border-slate-200 space-y-2 font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 text-sm">
                      Held in Safe Custody by Finder
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    The student finder has safeguarded this item. To uphold student privacy, private phone numbers are not published on the open website. Handover coordination is mediated safely in-platform.
                  </p>
                  <div className="p-2.5 bg-white rounded-[3px] border border-slate-200 flex items-center gap-2 text-slate-700">
                    <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-[11px]">
                      Submit an ownership claim below. Once your proof is verified, handover contact is coordinated directly.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Date & Relevant Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-[4px] bg-slate-50 border border-slate-200 text-xs font-sans">
            <div>
              <span className="text-slate-400 text-[11px] font-semibold block">
                {isLost ? 'Date Lost' : 'Date Discovered'}
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mt-0.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{formattedDate}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] font-semibold block">
                {isLost ? 'Last Seen Location' : 'Discovered Location'}
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mt-0.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{isLost ? report.lastSeenLocation : report.foundLocation}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
              Item Details & Characteristics
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
              {report.description}
            </p>
          </div>

          {/* 5. Ownership Claim or Handover Actions */}
          <div className="pt-4 border-t border-slate-200 space-y-3 font-sans">
            {isResolved ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[4px] text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Item Recovered:</strong> This listing is resolved. Further claims and handover requests are closed.
                </span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Submit Claim button for found items */}
                {!isLost && (
                  <button
                    onClick={() => {
                      if (!user) openAuthModal('login');
                      else setClaimModalOpen(true);
                    }}
                    className="flex-1 py-2.5 px-5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 btn-fluid"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Submit Ownership Claim</span>
                  </button>
                )}

                {/* Reporter or Moderator: Confirm Handover */}
                {(isOwner || isModerator) && (
                  <button
                    onClick={() => setRecoveryModalOpen(true)}
                    className="py-2.5 px-5 rounded-[3px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 btn-fluid"
                  >
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span>Confirm Handover & Resolve</span>
                  </button>
                )}
              </div>
            )}

            {/* Authorization explanation */}
            <p className="text-[11px] text-slate-400">
              Authorized actions: Handover resolution can only be confirmed by the item reporter or campus reception staff.
            </p>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      <ClaimModal
        report={report}
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        onSuccess={() => {
          setSuccessMessage('Ownership claim submitted successfully. The finder has been notified.');
          fetchDetails();
        }}
      />

      {/* Recovery Modal */}
      <ConfirmRecoveryModal
        report={report}
        isOpen={recoveryModalOpen}
        onClose={() => setRecoveryModalOpen(false)}
        onSuccess={() => {
          setSuccessMessage('Handover successfully confirmed and marked resolved!');
          fetchDetails();
        }}
      />
    </div>
  );
};
