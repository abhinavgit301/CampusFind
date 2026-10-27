import React from 'react';
import { Notification } from '../types/index.js';
import { X, Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import { api } from '../lib/api.js';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onRefresh: () => void;
  onSelectReport?: (publicId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
  onSelectReport,
}) => {
  if (!isOpen) return null;

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/me/notifications/${id}/read`);
      onRefresh();
    } catch (_e) {}
  };

  const markAllRead = async () => {
    try {
      await api.post('/me/notifications/read-all');
      onRefresh();
    } catch (_e) {}
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-sm bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">In-Website Notifications</h3>
                <p className="text-[11px] text-slate-500">Internal alerts & updates</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {notifications.some((n) => !n.readAt) && (
                <button
                  onClick={markAllRead}
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-sm transition-colors flex items-center gap-1 border border-blue-200"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-sm text-slate-400 hover:text-blue-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Updates on your listings, claims, and matches will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n._id}
                    onClick={() => {
                      if (isUnread) markAsRead(n._id);
                      if (n.relatedReportId?.publicId && onSelectReport) {
                        onSelectReport(n.relatedReportId.publicId);
                        onClose();
                      }
                    }}
                    className={`p-3.5 rounded-sm border transition-all cursor-pointer ${
                      isUnread
                        ? 'bg-blue-50/70 border-blue-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-sm bg-blue-600 shrink-0" />
                        )}
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        {new Date(n.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>

                    {n.relatedReportId?.publicId && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-700 font-medium">
                        <span>Report: {n.relatedReportId.publicId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
