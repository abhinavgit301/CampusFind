import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Shield,
  Eye,
  EyeOff,
  UserX,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  FileText,
  Users,
} from 'lucide-react';

export const ModeratorPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'audit'>('listings');

  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchModeratorData = async () => {
    setLoading(true);
    try {
      const [reportsRes, analyticsRes] = await Promise.all([
        api.get(`/admin/reports?status=${filterStatus}`),
        api.get('/admin/analytics'),
      ]);
      setReports(reportsRes.reports || []);
      setAnalytics(analyticsRes.analytics);
      setAuditLogs(analyticsRes.recentAuditLogs || []);
    } catch (_e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModeratorData();
  }, [filterStatus]);

  const handleToggleReportVisibility = async (publicId: string, currentStatus: string) => {
    const isHidden = currentStatus === 'UNDER_REVIEW';
    const action = isHidden ? 'RESTORE' : 'HIDE';
    const reason = prompt(
      isHidden
        ? 'Enter reason for restoring this listing to active status:'
        : 'Enter reason for placing this listing under review / hiding it:'
    );

    if (reason === null) return;

    try {
      await api.patch(`/admin/reports/${publicId}/moderation`, {
        action,
        reason: reason.trim() || 'Moderator policy action',
      });
      fetchModeratorData();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleToggleUserSuspension = async (userId: string, currentStatus: string) => {
    const isSuspended = currentStatus === 'SUSPENDED';
    const action = isSuspended ? 'ACTIVE' : 'SUSPENDED';
    const reason = prompt(
      isSuspended
        ? 'Enter reason to reactivate user account:'
        : 'Enter reason to suspend user account (will revoke active sessions):'
    );

    if (reason === null) return;

    try {
      await api.patch(`/admin/users/${userId}/status`, {
        status: action,
        reason: reason.trim() || 'Administrative action',
      });
      fetchModeratorData();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  if (user?.role !== 'MODERATOR') {
    return (
      <div className="p-12 text-center bg-white rounded-md border border-slate-200">
        <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          This portal is reserved for campus moderators and administration proctors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-sm bg-blue-100 text-blue-700">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Campus Moderator Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review suspicious listings, enforce campus policies, investigate disputes, and review audit trail
          </p>
        </div>
      </div>

      {/* Analytics KPI Overview */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 block">Total Reports</span>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{analytics.totalReports}</p>
          </div>
          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 block">Active Listings</span>
            <p className="text-2xl font-black text-blue-600 mt-0.5">{analytics.activeReports}</p>
          </div>
          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 block">Under Review</span>
            <p className="text-2xl font-black text-blue-900 mt-0.5">{analytics.underReviewReports}</p>
          </div>
          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 block">Items Recovered</span>
            <p className="text-2xl font-black text-blue-700 mt-0.5">{analytics.resolvedReports}</p>
          </div>
          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 block">Registered Users</span>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{analytics.totalUsers}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 text-xs font-bold rounded-sm transition-all ${
            activeTab === 'listings'
              ? 'bg-blue-950 text-blue-200 border border-blue-800'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-blue-700'
          }`}
        >
          Listing Moderation
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-sm transition-all ${
            activeTab === 'audit'
              ? 'bg-blue-950 text-blue-200 border border-blue-800'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-blue-700'
          }`}
        >
          Moderation Audit Log
        </button>
      </div>

      {activeTab === 'listings' ? (
        <div className="space-y-4">
          {/* Status Filter for moderator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Filter status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-sm border border-slate-300 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNDER_REVIEW">Under Review Only</option>
              <option value="ACTIVE">Active Only</option>
              <option value="RESOLVED">Resolved</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Report</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Reporter</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Moderator Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No reports matching this filter.
                      </td>
                    </tr>
                  ) : (
                    reports.map((r) => {
                      const isUnderReview = r.status === 'UNDER_REVIEW';
                      const reporter = r.reporterId;
                      return (
                        <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4">
                            <span className="font-mono text-[10px] text-slate-400 block">
                              {r.publicId}
                            </span>
                            <span className="font-bold text-slate-900">{r.title}</span>
                            <span className="text-slate-400 text-[11px] block">{r.categoryId}</span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                                r.reportType === 'LOST'
                                  ? 'bg-blue-950 text-blue-200 border border-blue-800'
                                  : 'bg-blue-600 text-white border border-blue-400'
                              }`}
                            >
                              {r.reportType}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-900 block">
                              {reporter?.displayName || 'Unknown'}
                            </span>
                            <span className="text-slate-400 text-[11px] block">{reporter?.email}</span>
                            {reporter?.status === 'SUSPENDED' && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded-sm">
                                Suspended User
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                                isUnderReview
                                  ? 'bg-rose-100 text-rose-800'
                                  : r.status === 'ACTIVE'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleReportVisibility(r.publicId, r.status)}
                              className={`px-2.5 py-1 rounded-sm text-xs font-semibold ${
                                isUnderReview
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {isUnderReview ? 'Restore to Active' : 'Hide / Review'}
                            </button>

                            {reporter && (
                              <button
                                onClick={() =>
                                  handleToggleUserSuspension(reporter._id, reporter.status)
                                }
                                className={`px-2.5 py-1 rounded-sm text-xs font-semibold ${
                                  reporter.status === 'SUSPENDED'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                }`}
                              >
                                {reporter.status === 'SUSPENDED' ? 'Reactivate User' : 'Suspend User'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Log */
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Administrative Action History</h3>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No audit records found.</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log._id}
                  className="p-3.5 rounded-sm bg-slate-50 border border-slate-200 flex items-start justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.actionType}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Target: {log.entityType} ({log.entityId})
                      </span>
                    </div>
                    <p className="text-slate-600">
                      By: {log.actingUserId?.displayName || 'System'} ({log.actingUserId?.email})
                    </p>
                    {log.metadata?.reason && (
                      <p className="text-[11px] text-slate-500 italic">
                        Reason: "{log.metadata.reason}"
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
