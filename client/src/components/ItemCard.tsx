import React from 'react';
import { Report } from '../types/index.js';
import {
  MapPin,
  Calendar,
  Building2,
  UserCheck,
  CheckCircle2,
  Search,
  ArrowUpRight,
  Laptop,
  CreditCard,
  Key,
  Briefcase,
  Shirt,
  BookOpen,
  Package,
  HelpCircle,
} from 'lucide-react';

interface ItemCardProps {
  report: Report;
  onClick: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ report, onClick }) => {
  const isLost = report.reportType === 'LOST';
  const isResolved = report.status === 'RESOLVED';

  const formattedDate = new Date(report.eventAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const photoUrl = report.photoUrls && report.photoUrls.length > 0 ? report.photoUrls[0] : null;

  // Render category icon
  const renderCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'electronics':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'id cards and documents':
        return <CreditCard className="w-3.5 h-3.5" />;
      case 'keys':
        return <Key className="w-3.5 h-3.5" />;
      case 'bags and wallets':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'clothing':
        return <Shirt className="w-3.5 h-3.5" />;
      case 'books and stationery':
        return <BookOpen className="w-3.5 h-3.5" />;
      default:
        return <Package className="w-3.5 h-3.5" />;
    }
  };

  // Compute availability badge
  const renderAvailabilityBadge = () => {
    if (isResolved) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-[3px] border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Resolved
        </span>
      );
    }

    if (isLost) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-[3px] border border-slate-200">
          <HelpCircle className="w-3 h-3 text-slate-500" />
          Active Search
        </span>
      );
    }

    // Found item custody status
    if (report.holdingLocation === 'MACRO_RECEPTION') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-900 bg-sky-50 px-2 py-0.5 rounded-[3px] border border-sky-200">
          <Building2 className="w-3 h-3 text-sky-600" />
          Macro · Awaiting collection
        </span>
      );
    }

    if (report.holdingLocation === 'UNIWORLD_1_RECEPTION') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-[3px] border border-blue-200">
          <Building2 className="w-3 h-3 text-blue-600" />
          Uniworld 1 · Awaiting collection
        </span>
      );
    }

    if (report.holdingLocation === 'UNIWORLD_2_RECEPTION') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-[3px] border border-indigo-200">
          <Building2 className="w-3 h-3 text-indigo-600" />
          Uniworld 2 · Awaiting collection
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-[3px] border border-blue-200">
        <UserCheck className="w-3 h-3 text-blue-600" />
        With Finder · In verification
      </span>
    );
  };

  const displayLocation = isLost
    ? report.lastSeenLocation || 'Macro Campus'
    : report.foundLocation || 'Macro Campus';

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-[6px] border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-600 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 active:scale-[0.99] select-none"
    >
      {/* Top Media Thumbnail Container (Standardized 6px top radius) */}
      <div className="relative h-44 w-full bg-slate-50 overflow-hidden flex items-center justify-center border-b border-slate-100">
        {photoUrl ? (
          <>
            <img
              src={photoUrl}
              alt={report.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-slate-900/10 group-hover:opacity-0 transition-opacity" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-[4px] bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
              {renderCategoryIcon(report.categoryId)}
            </div>
            <span className="text-[11px] font-medium text-slate-500">{report.categoryId}</span>
          </div>
        )}

        {/* Top Floating Badges: Public ID and Explicit Lost/Found Status */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          {/* Public ID */}
          <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-display font-bold bg-slate-950/85 text-slate-200 backdrop-blur-md border border-slate-800 shadow-sm">
            {report.publicId}
          </span>

          {/* Explicit Lost vs Found Distinction with dedicated icons and text */}
          {isLost ? (
            <span className="px-2.5 py-0.5 rounded-[3px] text-[11px] font-bold bg-slate-900 text-white backdrop-blur-md flex items-center gap-1.5 shadow-sm border border-slate-700">
              <Search className="w-3 h-3 text-sky-400 stroke-[2.5]" />
              <span>LOST</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-[3px] text-[11px] font-bold bg-blue-600 text-white backdrop-blur-md flex items-center gap-1.5 shadow-sm border border-blue-400">
              <CheckCircle2 className="w-3 h-3 text-white stroke-[2.5]" />
              <span>FOUND</span>
            </span>
          )}
        </div>

        {/* Hover Action Indicator */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-150">
          <span className="px-2 py-1 rounded-[3px] bg-white text-blue-900 text-[11px] font-bold shadow-md border border-slate-200 flex items-center gap-1">
            View <ArrowUpRight className="w-3 h-3 text-blue-600" />
          </span>
        </div>
      </div>

      {/* Card Content Body: Answers What, Where, and Availability without clutter */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Category & Custody Status Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-[3px] border border-slate-200">
              {renderCategoryIcon(report.categoryId)}
              <span>{report.categoryId}</span>
            </span>

            {renderAvailabilityBadge()}
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
            {report.title}
          </h3>
        </div>

        {/* Footer info: Location & Date */}
        <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <div className="flex items-center gap-1 truncate max-w-[62%]">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{displayLocation}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
