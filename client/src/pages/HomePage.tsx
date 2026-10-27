import React, { useState, useEffect } from 'react';
import { Report } from '../types/index.js';
import { api } from '../lib/api.js';
import { ItemCard } from '../components/ItemCard.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
  MapPin,
  Laptop,
  CreditCard,
  Key,
  Briefcase,
  BookOpen,
  Package,
} from 'lucide-react';

interface HomePageProps {
  onSelectReport: (publicId: string) => void;
  onNavigateBrowse: (searchQuery?: string, type?: string, holdingLocation?: string, category?: string) => void;
  onOpenCreateReport: (type?: 'LOST' | 'FOUND') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectReport,
  onNavigateBrowse,
  onOpenCreateReport,
}) => {
  const { user, openAuthModal } = useAuth();
  const [recentlyFound, setRecentlyFound] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchRecentlyFound = async () => {
      try {
        // Prioritize recently found items for immediate actionability
        const data = await api.get('/reports?type=FOUND&status=ACTIVE&limit=6');
        if (data.reports && data.reports.length > 0) {
          setRecentlyFound(data.reports);
        } else {
          // Fallback to active reports if few found items
          const fallback = await api.get('/reports?status=ACTIVE&limit=6');
          setRecentlyFound(fallback.reports || []);
        }
      } catch (_e) {
      } finally {
        setLoading(false);
      }
    };
    fetchRecentlyFound();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateBrowse(
      searchQuery.trim() || undefined,
      undefined,
      undefined,
      selectedCategory === 'ALL' ? undefined : selectedCategory
    );
  };

  const categories = [
    'Electronics',
    'ID Cards and Documents',
    'Keys',
    'Bags and Wallets',
    'Books and Stationery',
    'Bottles and Containers',
  ];

  return (
    <div className="space-y-12">
      {/* 1. Midnight Navy Hero Section: Search & Category Above the Fold */}
      <section className="relative overflow-hidden rounded-[6px] bg-[#0F172A] text-white p-7 sm:p-11 lg:p-14 shadow-xl border border-slate-800">
        {/* Subtle single radial glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 blur-[90px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          {/* Brand & Pilot Badge */}
          <div className="flex flex-col items-center justify-center space-y-1">
            <span className="text-[11px] font-display font-semibold tracking-widest uppercase text-blue-400">
              CAMPUS LOST & FOUND
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white">
              Lost something on campus?
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto pt-1 font-sans">
              Search reported items or report something missing across Macro Campus and Uniworld Hostels.
            </p>
          </div>

          {/* Prominent Search Field + Category Selector Above the Fold */}
          <form
            onSubmit={handleSearchSubmit}
            className="p-2 bg-white rounded-[6px] shadow-2xl border border-slate-300 max-w-2xl mx-auto text-left"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by item, color or location..."
                  className="w-full pl-10 pr-3 py-2 text-sm text-slate-900 bg-transparent placeholder-slate-400 focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 rounded-[3px] border border-slate-300 focus:outline-none cursor-pointer font-sans"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 btn-fluid font-sans"
                >
                  <span>Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Secondary Reporting Actions (Kept visible but secondary to search) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={() => {
                if (!user) openAuthModal('login');
                else onOpenCreateReport('LOST');
              }}
              className="px-4 py-2 rounded-[3px] bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2 btn-fluid font-sans"
            >
              Report Lost
            </button>
            <button
              onClick={() => {
                if (!user) openAuthModal('login');
                else onOpenCreateReport('FOUND');
              }}
              className="px-4 py-2 rounded-[3px] bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold border border-blue-500 transition-colors flex items-center gap-2 btn-fluid font-sans"
            >
              Report Found
            </button>
          </div>

          {/* Find Your Item: Quick Filters for the Three Official Collection Points */}
          <div className="pt-2 border-t border-slate-800/80 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-medium font-sans">Find your item by desk:</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => onNavigateBrowse(undefined, 'FOUND', 'MACRO_RECEPTION')}
                className="px-3 py-1 rounded-[3px] bg-slate-800/90 hover:bg-slate-700 text-sky-200 border border-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1.5 btn-fluid"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                Macro Reception
              </button>
              <button
                onClick={() => onNavigateBrowse(undefined, 'FOUND', 'UNIWORLD_1_RECEPTION')}
                className="px-3 py-1 rounded-[3px] bg-slate-800/90 hover:bg-slate-700 text-blue-200 border border-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1.5 btn-fluid"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Uniworld 1
              </button>
              <button
                onClick={() => onNavigateBrowse(undefined, 'FOUND', 'UNIWORLD_2_RECEPTION')}
                className="px-3 py-1 rounded-[3px] bg-slate-800/90 hover:bg-slate-700 text-indigo-200 border border-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1.5 btn-fluid"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                Uniworld 2
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Recently Found Items (Answers: What was found? Where is it? How do I get it back?) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">
              Recently found
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Latest items awaiting collection across campus reception desks
            </p>
          </div>

          <button
            onClick={() => onNavigateBrowse(undefined, 'FOUND')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group btn-fluid font-sans"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-60 rounded-[6px] bg-slate-200 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : recentlyFound.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[6px] border border-slate-200">
            <p className="text-sm font-semibold text-slate-700">No recently found items reported yet.</p>
            <p className="text-xs text-slate-500 mt-1">Check back soon or post a lost item report.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentlyFound.map((report) => (
              <ItemCard
                key={report._id}
                report={report}
                onClick={() => onSelectReport(report.publicId)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Official Collection Points: Hours & Collection Instructions */}
      <section className="space-y-4 pt-2">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-display">
            Official Campus Collection Points
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Opening hours and verified collection instructions for high-value belongings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Macro Campus Reception */}
          <div className="p-5 rounded-[6px] reception-card-macro shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[4px] bg-sky-100 text-sky-800 border border-sky-300 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-semibold bg-sky-100 text-sky-900 border border-sky-300 uppercase">
                  Central Campus
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">Macro Central Reception</h3>
                <p className="text-[11px] font-medium text-sky-800 mt-0.5 flex items-center gap-1 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  Admin Building Ground Floor Security
                </p>
              </div>

              <div className="p-2.5 bg-white rounded-[4px] border border-sky-200 text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-sky-900">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>8:00 AM – 8:00 PM Daily</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Ownership verified via valid Student Identity Card.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateBrowse(undefined, 'FOUND', 'MACRO_RECEPTION')}
              className="mt-4 w-full py-2 px-3 rounded-[3px] bg-white border border-sky-300 text-sky-900 hover:bg-sky-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors btn-fluid font-sans"
            >
              <span>View Macro Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Uniworld 1 Reception */}
          <div className="p-5 rounded-[6px] reception-card-uniworld1 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[4px] bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-semibold bg-blue-100 text-blue-900 border border-blue-300 uppercase">
                  Uniworld 1
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">Uniworld 1 Reception</h3>
                <p className="text-[11px] font-medium text-blue-800 mt-0.5 flex items-center gap-1 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Ground Floor Warden & Security Desk
                </p>
              </div>

              <div className="p-2.5 bg-white rounded-[4px] border border-blue-200 text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>8:00 AM – 10:00 PM Daily</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Ownership verified via Student ID & Room check.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateBrowse(undefined, 'FOUND', 'UNIWORLD_1_RECEPTION')}
              className="mt-4 w-full py-2 px-3 rounded-[3px] bg-white border border-blue-300 text-blue-900 hover:bg-blue-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors btn-fluid font-sans"
            >
              <span>View Uniworld 1 Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Uniworld 2 Reception */}
          <div className="p-5 rounded-[6px] reception-card-uniworld2 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[4px] bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-semibold bg-indigo-100 text-indigo-950 border border-indigo-300 uppercase">
                  Uniworld 2
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">Uniworld 2 Reception</h3>
                <p className="text-[11px] font-medium text-indigo-800 mt-0.5 flex items-center gap-1 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  Ground Floor Helpdesk & Security
                </p>
              </div>

              <div className="p-2.5 bg-white rounded-[4px] border border-indigo-200 text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>8:00 AM – 10:00 PM Daily</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Ownership verified via Student ID & Room check.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateBrowse(undefined, 'FOUND', 'UNIWORLD_2_RECEPTION')}
              className="mt-4 w-full py-2 px-3 rounded-[3px] bg-white border border-indigo-300 text-indigo-900 hover:bg-indigo-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors btn-fluid font-sans"
            >
              <span>View Uniworld 2 Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Privacy & Safe Recovery Process (Compact 3-step timeline) */}
      <section className="p-6 bg-white rounded-[6px] border border-slate-200 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 font-display">
            CampusFind Handover & Privacy Guarantee
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans text-slate-600">
          <div className="p-3 bg-slate-50 rounded-[4px] border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">1. Zero Contact Leakage</p>
            <p>Student phone numbers and hostel rooms are never publicly displayed on lost or reception items.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-[4px] border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">2. Official Desk Custody</p>
            <p>Found electronics, IDs, wallets, and keys can be deposited at Macro, Uniworld 1, or Uniworld 2 desks.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-[4px] border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">3. Verified Claim Pipeline</p>
            <p>Handover requires physical ID verification and claimant proof before marking resolved.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
