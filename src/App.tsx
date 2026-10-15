import { useState, useEffect } from 'react';
import { TopAppBar } from './components/TopAppBar';
import { Sidebar, MainViewTab } from './components/Sidebar';
import { CitizenPortal } from './components/CitizenPortal';
import { NationalIndexOverview } from './components/NationalIndexOverview';
import { RouteIntelligencePanel } from './components/RouteIntelligencePanel';
import { BookingHorizonsPanel } from './components/BookingHorizonsPanel';
import { IndiaCorridorHeatmap } from './components/IndiaCorridorHeatmap';
import { AnomalyWatchlistPanel } from './components/AnomalyWatchlistPanel';
import { CpiDecompositionPanel } from './components/CpiDecompositionPanel';
import { ScenarioSimulatorView } from './components/ScenarioSimulatorView';
import { PolicyChatbotView } from './components/PolicyChatbotView';
import { AdminDashboard, AdminSubSection } from './components/AdminDashboard';
import { SupportView } from './components/SupportView';
import { AboutView } from './components/AboutView';
import { QuickSearchModal } from './components/QuickSearchModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ShieldCheck, Lock, ShieldAlert } from 'lucide-react';
import { apiUrl } from './config/api';

export default function App() {
  const [currentView, setCurrentView] = useState<MainViewTab>('citizen_portal');
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('skyfare_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
    } catch {
      return false;
    }
  });
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync dark class on html / root and body
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem('skyfare_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem('skyfare_theme', 'light');
      }
    } catch (e) {
      console.warn('Theme storage error:', e);
    }
  }, [isDark]);

  // Keyboard shortcut: Cmd/Ctrl + K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Verify persisted admin session token on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('skyfare_admin_token');
    if (savedToken) {
      if (savedToken === 'mock-demo-session-token') {
        setIsAdminLoggedIn(true);
        return;
      }
      fetch(apiUrl('/api/v1/auth/verify'), {
        headers: { 'X-Admin-Token': savedToken },
      })
        .then((res) => {
          if (res.ok) {
            setIsAdminLoggedIn(true);
          } else {
            sessionStorage.removeItem('skyfare_admin_token');
            setIsAdminLoggedIn(false);
          }
        })
        .catch(() => {
          // If backend offline, retain session
          setIsAdminLoggedIn(true);
        });
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAdminLoginSuccess = (token?: string) => {
    setIsAdminLoggedIn(true);
    if (token) {
      sessionStorage.setItem('skyfare_admin_token', token);
    }
    setCurrentView('admin_scraper');
    showToast('MoSPI Officer session authenticated. Admin Dashboard unlocked.');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('skyfare_admin_token');
    if (
      currentView === 'admin_scraper' ||
      currentView === 'admin_quarantine' ||
      currentView === 'admin_export' ||
      currentView === 'admin_api_keys'
    ) {
      setCurrentView('citizen_portal');
    }
    showToast('MoSPI Administrator session closed.');
  };

  const handleQuickNavigate = (viewId: string, param?: string) => {
    if (viewId === 'admin_login') {
      setIsAdminLoginOpen(true);
      return;
    }
    setCurrentView(viewId as MainViewTab);
    if (param) {
      showToast(`Navigated to corridor deep-dive: ${param}`);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors w-full overflow-x-hidden ${isDark ? 'dark' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold animate-fadeIn">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top App Bar Header */}
      <TopAppBar
        onToggleSidebar={() => setIsSidebarMobileOpen((prev) => !prev)}
        isDark={isDark}
        setIsDark={setIsDark}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigateToView={(viewId) => setCurrentView(viewId as MainViewTab)}
      />

      {/* Main Layout Body: Responsive Sidebar + Content Area */}
      <div className="flex-1 flex w-full overflow-x-hidden">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(view) => setCurrentView(view)}
          isOpenMobile={isSidebarMobileOpen}
          onCloseMobile={() => setIsSidebarMobileOpen(false)}
          isAdminLoggedIn={isAdminLoggedIn}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          onAdminLogout={handleAdminLogout}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 w-full overflow-x-hidden py-6">
          {/* 1. HOME: Citizen Portal */}
          {currentView === 'citizen_portal' && <CitizenPortal />}

          {/* 2. HOME: Today's National Index */}
          {currentView === 'national_index' && <NationalIndexOverview />}

          {/* 3. INTELLIGENCE: Route */}
          {currentView === 'route' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <RouteIntelligencePanel />
            </div>
          )}

          {/* 4. INTELLIGENCE: Booking Window */}
          {currentView === 'booking_window' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <BookingHorizonsPanel />
            </div>
          )}

          {/* 5. INTELLIGENCE: Heatmap */}
          {currentView === 'heatmap' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <IndiaCorridorHeatmap onSelectCorridor={() => setCurrentView('route')} />
            </div>
          )}

          {/* 6. ANALYTICS: Irregularities */}
          {currentView === 'anomalies' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <AnomalyWatchlistPanel />
            </div>
          )}

          {/* 7. ANALYTICS: CPI Decomposition */}
          {currentView === 'cpi_decomposition' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <CpiDecompositionPanel />
            </div>
          )}

          {/* 8. POLICY & AI: Scenario Simulator */}
          {currentView === 'scenario_simulator' && <ScenarioSimulatorView />}

          {/* 9. POLICY & AI: AI Chatbot */}
          {currentView === 'ai_chatbot' && <PolicyChatbotView />}

          {/* 10-13. ADMIN DASHBOARD SUBVIEWS */}
          {['admin_scraper', 'admin_quarantine', 'admin_export', 'admin_api_keys'].includes(currentView) && (
            isAdminLoggedIn ? (
              <AdminDashboard
                initialSubSection={
                  currentView === 'admin_scraper'
                    ? 'scraper'
                    : currentView === 'admin_quarantine'
                    ? 'quarantine'
                    : currentView === 'admin_export'
                    ? 'export'
                    : 'api_keys'
                }
              />
            ) : (
              <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                      Restricted Administrative Portal
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                      MoSPI Officer Authentication Required
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                      Exclusive access to the Scraper Fleet Controller, Data Quarantine Zone, API Key Management, and MoSPI Official PDF Export Engine is restricted to authorized personnel of the <strong>MoSPI Statistical Officer - Price Statistics Division</strong>.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsAdminLoginOpen(true)}
                      className="min-h-[44px] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authenticate as MoSPI Statistical Officer</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* 14. ABOUT: Support */}
          {currentView === 'support' && <SupportView />}

          {/* 15. ABOUT: About SkyFare */}
          {currentView === 'about' && <AboutView />}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-6 text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              SkyFare India
            </span>
            <span>— National Airfare Intelligence & Citizen Fair-Fare Platform</span>
          </div>
        </div>
      </footer>

      {/* Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleQuickNavigate}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
