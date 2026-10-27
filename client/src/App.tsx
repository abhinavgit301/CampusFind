import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { api } from './lib/api.js';
import { Notification } from './types/index.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { AuthModal } from './components/AuthModal.js';
import { ProfileModal } from './components/ProfileModal.js';
import { NotificationDrawer } from './components/NotificationDrawer.js';
import { HomePage } from './pages/HomePage.js';
import { BrowsePage } from './pages/BrowsePage.js';
import { ReportDetailsPage } from './pages/ReportDetailsPage.js';
import { CreateReportPage } from './pages/CreateReportPage.js';
import { MyActivityPage } from './pages/MyActivityPage.js';
import { ModeratorPage } from './pages/ModeratorPage.js';

export const App: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Search routing state
  const [browseSearch, setBrowseSearch] = useState<string>('');
  const [browseType, setBrowseType] = useState<string>('ALL');
  const [browseHoldingLocation, setBrowseHoldingLocation] = useState<string>('ALL');
  const [browseCategory, setBrowseCategory] = useState<string>('ALL');

  // Create report initial type
  const [createReportType, setCreateReportType] = useState<'LOST' | 'FOUND'>('LOST');

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const data = await api.get('/me/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (_e) {
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [user]);

  // Navigate to single report details
  const handleSelectReport = (publicId: string) => {
    setSelectedReportId(publicId);
    setCurrentTab('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to browse with initial search, optional holdingLocation and category
  const handleNavigateBrowse = (search?: string, type?: string, holdingLocation?: string, category?: string) => {
    if (search !== undefined) setBrowseSearch(search);
    if (type !== undefined) setBrowseType(type);
    if (holdingLocation !== undefined) setBrowseHoldingLocation(holdingLocation);
    if (category !== undefined) setBrowseCategory(category);
    setCurrentTab('browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open create report
  const handleOpenCreateReport = (type: 'LOST' | 'FOUND' = 'LOST') => {
    setCreateReportType(type);
    setCurrentTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unreadNotifications={unreadCount}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenCreateReport={handleOpenCreateReport}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {currentTab === 'home' && (
          <HomePage
            onSelectReport={handleSelectReport}
            onNavigateBrowse={handleNavigateBrowse}
            onOpenCreateReport={handleOpenCreateReport}
          />
        )}

        {currentTab === 'browse' && (
          <BrowsePage
            initialSearch={browseSearch}
            initialType={browseType}
            initialHoldingLocation={browseHoldingLocation}
            initialCategory={browseCategory}
            onSelectReport={handleSelectReport}
            onOpenCreateReport={handleOpenCreateReport}
          />
        )}

        {currentTab === 'details' && selectedReportId && (
          <ReportDetailsPage
            publicId={selectedReportId}
            onBack={() => {
              setCurrentTab('browse');
              setSelectedReportId(null);
            }}
          />
        )}

        {currentTab === 'create' && (
          <CreateReportPage
            initialType={createReportType}
            onBack={() => setCurrentTab('home')}
            onSuccess={(publicId) => {
              handleSelectReport(publicId);
            }}
          />
        )}

        {currentTab === 'activity' && (
          <MyActivityPage
            onSelectReport={handleSelectReport}
            onOpenCreateReport={handleOpenCreateReport}
          />
        )}

        {currentTab === 'moderator' && <ModeratorPage />}
      </main>

      <Footer />

      {/* Global Modals and Drawers */}
      <AuthModal />
      <ProfileModal />
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onRefresh={fetchNotifications}
        onSelectReport={handleSelectReport}
      />
    </div>
  );
};
