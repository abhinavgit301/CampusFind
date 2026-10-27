import React, { useState, useEffect } from 'react';
import { Report, Claim, Match, Notification } from '../types/index.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { ItemCard } from '../components/ItemCard.js';
import { ConfirmRecoveryModal } from '../components/ConfirmRecoveryModal.js';
import {
  FileText,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  TrendingUp,
  Bell,
  Eye,
  CheckCheck,
  User,
  Phone,
} from 'lucide-react';

interface MyActivityPageProps {
  onSelectReport: (publicId: string) => void;
  onOpenCreateReport: (type?: 'LOST' | 'FOUND') => void;
}

export const MyActivityPage: React.FC<MyActivityPageProps> = ({
  onSelectReport,
  onOpenCreateReport,
}) => {
  const { user, openProfileModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'reports' | 'claims' | 'matches' | 'notifications'>('reports');
  const [reportsFilter, setReportsFilter] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');

  const [myReports, setMyReports] = useState<Report[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Recovery modal state
  const [selectedReportForRecovery, setSelectedReportForRecovery] = useState<Report | null>(null);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const [reportsData, claimsData, matchesData, notifsData] = await Promise.all([
        api.get('/me/reports'),
        api.get('/me/claims'),
        api.get('/me/matches'),
        api.get('/me/notifications'),
      ]);
      setMyReports(reportsData.reports || []);
      setMyClaims(claimsData.claims || []);
      setMyMatches(matchesData.matches || []);
      setNotifications(notifsData.notifications || []);
    } catch (_e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const handleWithdraw = async (publicId: string) => {
    if (!confirm('Are you sure you want to withdraw this listing? It will no longer appear in search.')) {
      return;
    }
    try {
      await api.post(`/reports/${publicId}/withdraw`);
      fetchActivity();
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw listing.');
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.post(`/me/notifications/${id}/read`);
      fetchActivity();
    } catch (_e) {}
  };

  const filteredReports = myReports.filter((r) => {
    if (reportsFilter === 'LOST') return r.reportType === 'LOST';
    if (reportsFilter === 'FOUND') return r.reportType === 'FOUND';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Activity & Workflow Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Track your reports, inspect claim verifications, review item matches, and manage alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openProfileModal}
            className="px-3 py-2 text-xs font-semibold rounded-[3px] bg-white border border-slate-300 text-slate-700 hover:text-blue-700 hover:border-blue-400 transition-colors btn-fluid shadow-sm flex items-center gap-1.5 font-sans"
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => onOpenCreateReport('LOST')}
            className="px-3.5 py-2 text-xs font-semibold rounded-[3px] bg-slate-900 text-white hover:bg-slate-800 transition-colors btn-fluid shadow-sm font-sans"
          >
            Report Lost
          </button>
          <button
            onClick={() => onOpenCreateReport('FOUND')}
            className="px-4 py-2 text-xs font-semibold rounded-[3px] bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm btn-fluid font-sans"
          >
            Report Found
          </button>
        </div>
      </div>

      {/* Profile & Contact Overview Bar */}
      {user && (
        <div className="p-3.5 bg-white rounded-[4px] border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>{user.displayName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              {user.phoneNumber ? (
                <span className="font-mono text-slate-800 font-semibold">{user.phoneNumber}</span>
              ) : (
                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-[2px] border border-amber-200 text-[11px] font-semibold">
                  No phone number set
                </span>
              )}
            </div>
            <div className="text-slate-500 text-[11px]">
              📍 {user.hostel && user.hostel !== 'NONE' ? `${user.hostel.replace('_', ' ')} ${user.roomNumber ? `• Rm ${user.roomNumber}` : ''}` : 'Day Scholar / Off-campus'}
            </div>
          </div>
          <button
            onClick={openProfileModal}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline self-start sm:self-auto"
          >
            Update Profile Settings →
          </button>
        </div>
      )}

      {/* 4 Standard Workflow Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {/* Tab 1: My Reports */}
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-[3px] text-xs font-semibold transition-all flex items-center gap-2 btn-fluid font-sans ${
            activeTab === 'reports'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>My Reports</span>
          <span className="px-1.5 py-0.2 rounded-[2px] text-[10px] bg-slate-800 text-slate-200 font-bold">
            {myReports.length}
          </span>
        </button>

        {/* Tab 2: My Claims */}
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-[3px] text-xs font-semibold transition-all flex items-center gap-2 btn-fluid font-sans ${
            activeTab === 'claims'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-blue-700 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>My Claims</span>
          <span className="px-1.5 py-0.2 rounded-[2px] text-[10px] bg-blue-700 text-blue-100 font-bold">
            {myClaims.length}
          </span>
        </button>

        {/* Tab 3: Possible Matches */}
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 rounded-[3px] text-xs font-semibold transition-all flex items-center gap-2 btn-fluid font-sans ${
            activeTab === 'matches'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-blue-700 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-300" />
          <span>Possible Matches</span>
          <span className="px-1.5 py-0.2 rounded-[2px] text-[10px] bg-blue-900 text-blue-100 font-bold">
            {myMatches.length}
          </span>
        </button>

        {/* Tab 4: Notifications */}
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-[3px] text-xs font-semibold transition-all flex items-center gap-2 btn-fluid font-sans ${
            activeTab === 'notifications'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
          <span className="px-1.5 py-0.2 rounded-[2px] text-[10px] bg-slate-700 text-slate-200 font-bold">
            {notifications.filter((n) => !n.readAt).length} unread
          </span>
        </button>
      </div>

      {/* Tab Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-60 rounded-[6px] bg-white border border-slate-200 shadow-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: MY REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {/* Sub-filter pills for Reports */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-sans">
                  <button
                    onClick={() => setReportsFilter('ALL')}
                    className={`px-3 py-1 rounded-[3px] font-semibold transition-colors ${
                      reportsFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({myReports.length})
                  </button>
                  <button
                    onClick={() => setReportsFilter('LOST')}
                    className={`px-3 py-1 rounded-[3px] font-semibold transition-colors ${
                      reportsFilter === 'LOST'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Lost Items ({myReports.filter((r) => r.reportType === 'LOST').length})
                  </button>
                  <button
                    onClick={() => setReportsFilter('FOUND')}
                    className={`px-3 py-1 rounded-[3px] font-semibold transition-colors ${
                      reportsFilter === 'FOUND'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-blue-700'
                    }`}
                  >
                    Found Items ({myReports.filter((r) => r.reportType === 'FOUND').length})
                  </button>
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-[6px] border border-slate-200 shadow-sm space-y-2">
                  <p className="text-sm font-bold text-slate-800 font-display">No reports found</p>
                  <p className="text-xs text-slate-500 font-sans">
                    You haven't posted any items in this category yet.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => onOpenCreateReport(reportsFilter === 'FOUND' ? 'FOUND' : 'LOST')}
                      className="px-4 py-2 text-xs font-semibold rounded-[3px] bg-blue-600 text-white hover:bg-blue-700 btn-fluid font-sans"
                    >
                      Create Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredReports.map((report) => (
                    <div
                      key={report._id}
                      className="bg-white rounded-[6px] border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden"
                    >
                      <ItemCard report={report} onClick={() => onSelectReport(report.publicId)} />

                      {/* Next Actions Toolbar on Every Entry */}
                      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 font-sans text-xs">
                        <button
                          onClick={() => onSelectReport(report.publicId)}
                          className="px-3 py-1.5 rounded-[3px] bg-white border border-slate-300 text-slate-700 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 btn-fluid"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Listing</span>
                        </button>

                        {report.status === 'ACTIVE' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedReportForRecovery(report)}
                              className="px-3 py-1.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors btn-fluid"
                            >
                              Confirm Handover
                            </button>
                            <button
                              onClick={() => handleWithdraw(report.publicId)}
                              className="px-2.5 py-1.5 rounded-[3px] text-slate-500 hover:text-red-600 text-xs font-semibold hover:bg-slate-100 transition-colors btn-fluid"
                            >
                              Withdraw
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY CLAIMS */}
          {activeTab === 'claims' && (
            <div className="space-y-4">
              {myClaims.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-[6px] border border-slate-200 shadow-sm space-y-2">
                  <p className="text-sm font-bold text-slate-800 font-display">No ownership claims submitted</p>
                  <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto">
                    When you locate a found item that belongs to you, submit a claim with identifying details to initiate handover.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 font-sans">
                  {myClaims.map((claim) => {
                    const rep = typeof claim.foundReportId === 'object' ? (claim.foundReportId as Report) : null;
                    return (
                      <div
                        key={claim._id}
                        className="p-5 rounded-[6px] bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-blue-300 transition-all"
                      >
                        <div className="space-y-1.5 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {rep?.title || 'Found Item'}
                            </span>
                            {rep && (
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[3px] bg-slate-100 text-slate-700 border border-slate-200">
                                {rep.publicId}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>Filed: {new Date(claim.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-700">
                              Custody:{' '}
                              {rep?.holdingLocation === 'MACRO_RECEPTION'
                                ? 'Macro Reception Desk'
                                : rep?.holdingLocation === 'UNIWORLD_1_RECEPTION'
                                ? 'Uniworld 1 Reception'
                                : rep?.holdingLocation === 'UNIWORLD_2_RECEPTION'
                                ? 'Uniworld 2 Reception'
                                : 'With Finder (In-app)'}
                            </span>
                          </div>

                          {claim.reviewNote && (
                            <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-[3px] border border-slate-200 mt-1">
                              <strong>Desk Review Note:</strong> {claim.reviewNote}
                            </div>
                          )}
                        </div>

                        {/* Status + Concrete Next Action */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span
                            className={`px-2.5 py-1 rounded-[3px] text-xs font-bold uppercase tracking-wider border ${
                              claim.status === 'APPROVED'
                                ? 'bg-blue-50 text-blue-900 border-blue-300'
                                : claim.status === 'REJECTED'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : claim.status === 'NEEDS_INFORMATION'
                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            {claim.status === 'APPROVED'
                              ? 'Verified'
                              : claim.status === 'PENDING'
                              ? 'Review Pending'
                              : claim.status.replace('_', ' ')}
                          </span>

                          {rep?.publicId && (
                            <button
                              onClick={() => onSelectReport(rep.publicId)}
                              className="px-3 py-1.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm btn-fluid"
                            >
                              <span>View Claim</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: POSSIBLE MATCHES (5-Signal Engine) */}
          {activeTab === 'matches' && (
            <div className="space-y-4 font-sans">
              {myMatches.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-[6px] border border-slate-200 shadow-sm space-y-2">
                  <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-1 opacity-60" />
                  <p className="text-sm font-bold text-slate-800 font-display">No match suggestions yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Our 5-signal deterministic engine compares category, description, location, timeline, and attributes. When a candidate matches above 50%, it will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myMatches.map((match) => {
                    const lost = match.lostReportId;
                    const found = match.foundReportId;
                    if (!lost || !found) return null;

                    return (
                      <div
                        key={match._id}
                        className="p-5 rounded-[6px] bg-white border border-blue-200 shadow-sm space-y-4"
                      >
                        {/* Top Confidence Score Indicator */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="px-2.5 py-1 rounded-[3px] bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>{match.score}% Match Confidence</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-700">
                              {match.score >= 75 ? 'High Confidence Match' : 'Possible Match'}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400">
                            Based on category, timeline, campus zone & keywords
                          </span>
                        </div>

                        {/* Side by Side Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3.5 rounded-[4px] bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-600 uppercase">
                              Your Lost Report: {lost.publicId}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm">{lost.title}</h4>
                            <p className="text-slate-600 line-clamp-1">{lost.description}</p>
                            <span className="text-[11px] text-slate-500 block pt-1">
                              📍 {lost.lastSeenLocation}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-[4px] bg-blue-50/60 border border-blue-200 space-y-1">
                            <span className="text-[10px] font-bold text-blue-900 uppercase">
                              Discovered Item: {found.publicId}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm">{found.title}</h4>
                            <p className="text-slate-600 line-clamp-1">{found.description}</p>
                            <span className="text-[11px] text-slate-500 block pt-1">
                              📍 {found.foundLocation}
                            </span>
                          </div>
                        </div>

                        {/* Action: Review & Claim */}
                        <div className="flex items-center justify-end gap-3 pt-1">
                          <button
                            onClick={() => onSelectReport(found.publicId)}
                            className="px-4 py-2 text-xs font-bold rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm btn-fluid"
                          >
                            <span>Inspect & Submit Claim</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-3 font-sans">
              {notifications.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-[6px] border border-slate-200 shadow-sm space-y-2">
                  <Bell className="w-8 h-8 text-slate-400 mx-auto mb-1 opacity-50" />
                  <p className="text-sm font-bold text-slate-800 font-display">No notifications</p>
                  <p className="text-xs text-slate-500">
                    You're all caught up! Updates regarding reports and claims will be posted here.
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const isUnread = !n.readAt;
                  return (
                    <div
                      key={n._id}
                      className={`p-4 rounded-[6px] border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isUnread
                          ? 'bg-blue-50/70 border-blue-200 shadow-sm'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {isUnread && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                          <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isUnread && (
                          <button
                            onClick={() => markNotificationRead(n._id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-[3px] btn-fluid"
                          >
                            Mark Read
                          </button>
                        )}
                        {n.relatedReportId?.publicId && (
                          <button
                            onClick={() => {
                              if (isUnread) markNotificationRead(n._id);
                              if (n.relatedReportId?.publicId) {
                                onSelectReport(n.relatedReportId.publicId);
                              }
                            }}
                            className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-[3px] flex items-center gap-1 btn-fluid shadow-sm"
                          >
                            <span>View Item</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Recovery Modal */}
      {selectedReportForRecovery && (
        <ConfirmRecoveryModal
          report={selectedReportForRecovery}
          isOpen={true}
          onClose={() => setSelectedReportForRecovery(null)}
          onSuccess={() => {
            fetchActivity();
          }}
        />
      )}
    </div>
  );
};
