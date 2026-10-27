import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Search,
  Bell,
  Shield,
  Plus,
  LogOut,
  User as UserIcon,
  Compass,
  FileText,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Notification } from '../types/index.js';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  unreadNotifications: number;
  notifications: Notification[];
  onOpenNotifications: () => void;
  onOpenCreateReport: (type?: 'LOST' | 'FOUND') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  unreadNotifications,
  onOpenNotifications,
  onOpenCreateReport,
}) => {
  const { user, logout, openAuthModal, openProfileModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-header shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => {
                setCurrentTab('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-sm bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
                <Search className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors uppercase">
                    CampusFind
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-900 border border-blue-200 uppercase tracking-wider">
                    Pilot
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 -mt-0.5 tracking-tight">
                  Uniworld & Macro Hub
                </p>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-sm border border-slate-200">
              <button
                onClick={() => setCurrentTab('home')}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentTab === 'home'
                    ? 'text-blue-900 bg-white shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-blue-900 hover:bg-white/50'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Home
              </button>

              <button
                onClick={() => setCurrentTab('browse')}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentTab === 'browse'
                    ? 'text-blue-900 bg-white shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-blue-900 hover:bg-white/50'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Browse
              </button>

              {user && (
                <button
                  onClick={() => setCurrentTab('activity')}
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'activity'
                      ? 'text-blue-900 bg-white shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-blue-900 hover:bg-white/50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  My Activity
                </button>
              )}

              {user?.role === 'MODERATOR' && (
                <button
                  onClick={() => setCurrentTab('moderator')}
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'moderator'
                      ? 'text-blue-950 bg-blue-100 shadow-sm border border-blue-300'
                      : 'text-blue-800 hover:text-blue-950 hover:bg-blue-50'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  Moderation
                </button>
              )}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-3">
            {/* Create Post Buttons (Shades of Blue, Sharp Edges) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!user) openAuthModal('login');
                  else onOpenCreateReport('LOST');
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-sm border border-blue-900 bg-blue-950 text-blue-200 hover:bg-blue-900 transition-all flex items-center gap-1.5 btn-fluid"
              >
                <Plus className="w-3.5 h-3.5 text-blue-300 stroke-[2.5]" />
                Report Lost
              </button>

              <button
                onClick={() => {
                  if (!user) openAuthModal('login');
                  else onOpenCreateReport('FOUND');
                }}
                className="px-4 py-2 text-xs font-bold rounded-sm bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 btn-fluid"
              >
                <Plus className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                Report Found
              </button>
            </div>

            {/* In-app Notification Icon */}
            {user && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors focus:outline-none"
                title="In-website notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-sm bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
            )}

            {/* User Profile or Login CTA */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm border border-slate-200 hover:border-blue-300 bg-white transition-all focus:outline-none"
                >
                  <div className="w-6 h-6 rounded-sm bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left text-xs pr-1">
                    <p className="font-bold text-slate-900 leading-tight">
                      {user.displayName.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {user.role.toLowerCase()}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-1.5 w-60 rounded-md glass-dropdown py-1.5 z-50 shadow-xl animate-in fade-in duration-100"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.displayName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      {user.hostel && user.hostel !== 'NONE' && (
                        <p className="text-[11px] font-medium text-blue-700 mt-0.5">
                          📍 {user.hostel.replace('_', ' ')} {user.roomNumber ? `• Rm ${user.roomNumber}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          openProfileModal();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        Edit Profile & Phone
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('activity');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        My Listings & Claims
                      </button>

                      {user.role === 'MODERATOR' && (
                        <button
                          onClick={() => {
                            setCurrentTab('moderator');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4 text-blue-600" />
                          Moderator Panel
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-slate-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 rounded-sm text-xs font-bold bg-blue-950 text-white hover:bg-blue-900 transition-all shadow-sm btn-fluid"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-slate-600 hover:text-slate-900"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (!user) openAuthModal('login');
                else onOpenCreateReport('LOST');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 text-xs font-bold rounded-sm bg-blue-950 text-blue-200 border border-blue-900 text-center"
            >
              Report Lost Item
            </button>
            <button
              onClick={() => {
                if (!user) openAuthModal('login');
                else onOpenCreateReport('FOUND');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 text-xs font-bold rounded-sm bg-blue-600 text-white text-center shadow-sm"
            >
              Report Found Item
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                setCurrentTab('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-sm text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-slate-400" /> Home
            </button>
            <button
              onClick={() => {
                setCurrentTab('browse');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-sm text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-slate-400" /> Browse Listings
            </button>
            {user && (
              <>
                <button
                  onClick={() => {
                    openProfileModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-sm text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" /> Edit Profile & Phone
                </button>
                <button
                  onClick={() => {
                    setCurrentTab('activity');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-sm text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-400" /> My Activity
                </button>
              </>
            )}
            {user?.role === 'MODERATOR' && (
              <button
                onClick={() => {
                  setCurrentTab('moderator');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-sm text-sm font-semibold text-blue-900 hover:bg-blue-50 flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-blue-600" /> Moderation Dashboard
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{user.displayName}</p>
                  <p className="text-[11px] text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-sm text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  openAuthModal('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-sm text-xs font-bold bg-blue-950 text-white text-center"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
