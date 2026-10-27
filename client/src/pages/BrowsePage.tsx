import React, { useState, useEffect } from 'react';
import { Report } from '../types/index.js';
import { api } from '../lib/api.js';
import { ItemCard } from '../components/ItemCard.js';
import {
  Search,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  X,
  Building2,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface BrowsePageProps {
  initialSearch?: string;
  initialType?: string;
  initialHoldingLocation?: string;
  initialCategory?: string;
  onSelectReport: (publicId: string) => void;
  onOpenCreateReport: (type?: 'LOST' | 'FOUND') => void;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
  initialSearch = '',
  initialType = 'ALL',
  initialHoldingLocation = 'ALL',
  initialCategory = 'ALL',
  onSelectReport,
  onOpenCreateReport,
}) => {
  const { user, openAuthModal } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Filter States
  const [search, setSearch] = useState(initialSearch);
  const [reportType, setReportType] = useState(initialType);
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState('ALL');
  const [holdingLocation, setHoldingLocation] = useState(initialHoldingLocation);
  const [status, setStatus] = useState('ACTIVE');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Secondary filters collapsible toggle
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(false);

  // Available metadata
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    api.get('/categories').then((d) => setCategories(d.categories || [])).catch(() => {});
    api.get('/locations').then((d) => setLocations(d.locations || [])).catch(() => {});
  }, []);

  // Update if initial props change
  useEffect(() => {
    if (initialSearch !== undefined) setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (initialType !== undefined) setReportType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (initialHoldingLocation !== undefined) setHoldingLocation(initialHoldingLocation);
  }, [initialHoldingLocation]);

  useEffect(() => {
    if (initialCategory !== undefined) setCategory(initialCategory);
  }, [initialCategory]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (reportType !== 'ALL') params.append('type', reportType);
      if (category !== 'ALL') params.append('category', category);
      if (location !== 'ALL') params.append('location', location);
      if (holdingLocation !== 'ALL') params.append('holdingLocation', holdingLocation);
      if (status !== 'ALL') params.append('status', status);

      const data = await api.get(`/reports?${params.toString()}`);
      let list: Report[] = data.reports || [];

      // Sort client-side if needed
      if (sortBy === 'oldest') {
        list = [...list].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else {
        list = [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      setReports(list);
    } catch (_e) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType, category, location, holdingLocation, status, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleClearAllFilters = () => {
    setSearch('');
    setReportType('ALL');
    setCategory('ALL');
    setLocation('ALL');
    setHoldingLocation('ALL');
    setStatus('ACTIVE');
    setSortBy('newest');
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    reportType !== 'ALL' ||
    category !== 'ALL' ||
    location !== 'ALL' ||
    holdingLocation !== 'ALL' ||
    status !== 'ACTIVE' ||
    sortBy !== 'newest';

  const formatHoldingLocationLabel = (loc: string) => {
    switch (loc) {
      case 'MACRO_RECEPTION':
        return 'Macro Reception';
      case 'UNIWORLD_1_RECEPTION':
        return 'Uniworld 1 Reception';
      case 'UNIWORLD_2_RECEPTION':
        return 'Uniworld 2 Reception';
      case 'WITH_FINDER':
        return 'With Finder';
      default:
        return loc;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Browse Campus Listings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Search lost & found items across Uniworld 1, Uniworld 2, and Macro Campus
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!user) openAuthModal('login');
              else onOpenCreateReport('LOST');
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-[3px] bg-slate-900 text-slate-100 hover:bg-slate-800 transition-colors shadow-sm btn-fluid font-sans"
          >
            Report Lost
          </button>
          <button
            onClick={() => {
              if (!user) openAuthModal('login');
              else onOpenCreateReport('FOUND');
            }}
            className="px-4 py-2 text-xs font-semibold rounded-[3px] bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm btn-fluid font-sans"
          >
            Report Found
          </button>
        </div>
      </div>

      {/* Primary Search & Filter Bar (Always visible at top) */}
      <div className="p-4 sm:p-5 bg-white rounded-[6px] border border-slate-200 shadow-sm space-y-4">
        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords, brand, color, location..."
              className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 btn-fluid font-sans"
          >
            Search
          </button>
        </form>

        {/* Primary Controls Row: Report Type Tabs & Category Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Report Type Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-[4px] border border-slate-200 self-start">
            <button
              onClick={() => setReportType('ALL')}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all ${
                reportType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setReportType('FOUND')}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all ${
                reportType === 'FOUND'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Found Items
            </button>
            <button
              onClick={() => setReportType('LOST')}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all ${
                reportType === 'LOST'
                  ? 'bg-slate-900 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lost Items
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 rounded-[3px] border border-slate-300 focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Toggle Secondary Filters Button */}
            <button
              onClick={() => setShowSecondaryFilters(!showSecondaryFilters)}
              className={`px-3 py-2 rounded-[3px] text-xs font-semibold border transition-colors flex items-center gap-1.5 font-sans btn-fluid ${
                showSecondaryFilters || holdingLocation !== 'ALL' || location !== 'ALL' || status !== 'ACTIVE'
                  ? 'bg-blue-50 text-blue-900 border-blue-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Collapsible Secondary Filter Panel */}
        {showSecondaryFilters && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
            {/* Holding Location / Custody Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Custody Desk
              </label>
              <select
                value={holdingLocation}
                onChange={(e) => setHoldingLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-[3px] border border-slate-300 bg-slate-50 focus:outline-none"
              >
                <option value="ALL">All Custody Locations</option>
                <option value="MACRO_RECEPTION">Macro Campus Reception</option>
                <option value="UNIWORLD_1_RECEPTION">Uniworld 1 Reception</option>
                <option value="UNIWORLD_2_RECEPTION">Uniworld 2 Reception</option>
                <option value="WITH_FINDER">Held by Finder</option>
              </select>
            </div>

            {/* Campus Zone / Location */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Campus Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-[3px] border border-slate-300 bg-slate-50 focus:outline-none"
              >
                <option value="ALL">All Campus Areas</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Status & Sort */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-[3px] border border-slate-300 bg-slate-50 focus:outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="ALL">All Statuses</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-xs rounded-[3px] border border-slate-300 bg-slate-50 focus:outline-none"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Removable Active Filter Chips & Clear Action */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-500">Active filters:</span>

            {search.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-medium">
                Search: "{search}"
                <button onClick={() => setSearch('')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {reportType !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-medium">
                Type: {reportType}
                <button onClick={() => setReportType('ALL')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {category !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-medium">
                Category: {category}
                <button onClick={() => setCategory('ALL')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {holdingLocation !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-medium">
                Desk: {formatHoldingLocationLabel(holdingLocation)}
                <button onClick={() => setHoldingLocation('ALL')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {location !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-medium">
                Location: {location}
                <button onClick={() => setLocation('ALL')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {status !== 'ACTIVE' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-medium">
                Status: {status}
                <button onClick={() => setStatus('ACTIVE')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline ml-1"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Result Count Status */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-sans px-1">
        <span>
          Showing <strong className="text-slate-800">{reports.length}</strong> matching item{reports.length === 1 ? '' : 's'}
        </span>
        {status === 'ACTIVE' && (
          <span className="text-[11px] text-slate-400">Only showing active, unrecovered listings</span>
        )}
      </div>

      {/* Content Grid: Skeletons vs Empty State vs Item Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-[6px] bg-white border border-slate-200 shadow-sm p-4 space-y-3 animate-pulse"
            >
              <div className="h-36 bg-slate-200 rounded-[4px]" />
              <div className="h-4 bg-slate-200 rounded-[2px] w-3/4" />
              <div className="h-3 bg-slate-200 rounded-[2px] w-1/2" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[6px] border border-slate-200 shadow-sm p-8 space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-[4px] bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 font-display">
              No items match these filters
            </h3>
            <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto leading-relaxed">
              We couldn't find any listings matching your current search criteria. Try clearing your filters or posting a new report.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="px-4 py-2 text-xs font-semibold rounded-[3px] bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors btn-fluid font-sans"
              >
                Clear all filters
              </button>
            )}
            <button
              onClick={() => {
                if (!user) openAuthModal('login');
                else onOpenCreateReport('LOST');
              }}
              className="px-4 py-2 text-xs font-semibold rounded-[3px] bg-blue-600 text-white hover:bg-blue-700 transition-colors btn-fluid font-sans"
            >
              Report a missing item
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report) => (
            <ItemCard
              key={report._id}
              report={report}
              onClick={() => onSelectReport(report.publicId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
