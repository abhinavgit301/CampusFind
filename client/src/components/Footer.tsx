import React from 'react';
import { ShieldCheck, MapPin, Building, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 mt-20 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                CF
              </div>
              <span className="font-extrabold text-slate-900 text-base">CampusFind</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Official centralized platform for students to report, search, and coordinate returning lost belongings across Uniworld & Macro Campus.
            </p>
          </div>

          {/* Locations */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Pilot Campus Hubs
            </h4>
            <ul className="space-y-2 text-slate-500">
              <li>• Macro Campus Central Reception</li>
              <li>• Uniworld 1 Hostel Warden Office</li>
              <li>• Uniworld 2 Hostel Helpdesk</li>
              <li>• Campus Library & Sports Complex</li>
            </ul>
          </div>

          {/* Privacy Rules */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              Privacy Safeguards
            </h4>
            <ul className="space-y-2 text-slate-500">
              <li>• Reception items reveal zero student phone numbers</li>
              <li>• Personally held items require explicit consent</li>
              <li>• Lost item posts never publish room numbers</li>
              <li>• In-website notifications (no spam or external SMS)</li>
            </ul>
          </div>

          {/* Emergency / Moderation */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              Proctor & Reception
            </h4>
            <p className="text-slate-500 leading-relaxed mb-2">
              High-value items (laptops, phones, wallets with government IDs) should be deposited at the Macro Campus security reception counter during office hours (8 AM – 8 PM).
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <p>© {new Date().getFullYear()} CampusFind. All rights reserved.</p>
          <p className="text-[11px]">JWT Auth • MongoDB Atlas • Zero External AI/SMS Dependency</p>
        </div>
      </div>
    </footer>
  );
};
