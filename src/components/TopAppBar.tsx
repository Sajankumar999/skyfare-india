import React, { useState } from 'react';
import {
  Menu,
  Plane,
  Search,
  Moon,
  Sun,
  Bell,
  Radio,
  AlertTriangle,
  X,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface TopAppBarProps {
  onToggleSidebar: () => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onOpenSearch: () => void;
  onNavigateToView: (viewId: string) => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onToggleSidebar,
  isDark,
  setIsDark,
  onOpenSearch,
  onNavigateToView,
}) => {
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(1);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs dark:border-slate-800 dark:bg-slate-900/95">
      {/* Tricolor Ministry Accent Strip */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-amber-500" />
        <div className="h-full w-1/3 bg-white dark:bg-slate-200" />
        <div className="h-full w-1/3 bg-emerald-600" />
      </div>

      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Left Side: Mobile Hamburger & Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Hamburger button for mobile & tablet (hidden on desktop lg) */}
            <button
              id="btn-sidebar-hamburger"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <button
              onClick={() => onNavigateToView('citizen_portal')}
              className="flex items-center space-x-2 sm:space-x-2.5 text-left group cursor-pointer"
            >
              <div className="h-9 w-9 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <img src="/skyfare-logo.png" alt="SkyFare India Logo" className="h-9 w-9 object-contain drop-shadow-sm" />
              </div>
              <div>
                <div className="flex items-center">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                    SkyFare <span className="text-blue-600 dark:text-blue-400">India</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden xl:block font-medium">
                  National Airfare Intelligence & Citizen Fair-Fare Platform
                </p>
              </div>
            </button>
          </div>

          {/* Right Side Tools: Search, Theme Mode, LIVE indicator, Notifications */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Search Button (Magnifying Glass) */}
            <button
              id="btn-topbar-search"
              onClick={onOpenSearch}
              title="Search corridors, views, and analytics (Cmd/Ctrl + K)"
              className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Dark Mode Toggle (Moon / Sun) */}
            <button
              id="btn-topbar-theme-toggle"
              onClick={handleThemeToggle}
              title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Green "LIVE" Status Indicator Pill */}
            <div
              title="High-Frequency Pricing Ingestion Active"
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shrink-0"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>LIVE</span>
            </div>

            {/* Notification Bell with Red Badge "1" */}
            <div className="relative shrink-0">
              <button
                id="btn-topbar-notifications"
                onClick={() => setShowNotifications(!showNotifications)}
                title="System and Regulatory Notices"
                className="h-9 w-9 flex items-center justify-center relative rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div
                  id="notifications-dropdown"
                  className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 space-y-3 animate-fadeIn"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Regulatory Surveillance Alerts
                      </span>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Notification Item */}
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                        DGCA Rule 135 Alert
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">14m ago</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      Critical Corridor Spike: <strong>BOM-DEL</strong> spot corridor breached the 15% surge threshold.
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Dynamic yield algorithm pushed spot quotes to ₹14,820 (+19.9% vs baseline). Pending compliance review under Aircraft Rules 1937.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          onNavigateToView('anomalies');
                          setShowNotifications(false);
                          setUnreadCount(0);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect Irregularities Stream</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setUnreadCount(0)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Mark Read
                      </button>
                    </div>
                  </div>

                  <div className="text-center pt-1 text-[10px] text-slate-400">
                    High-frequency surveillance active • MoSPI Price Statistics Division
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
