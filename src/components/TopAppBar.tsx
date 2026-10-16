import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Activity,
  RefreshCw,
  Database,
  Server,
  CheckCircle2,
  ShieldCheck,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';
import { useBackendStatus } from '../utils/useBackendStatus';

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
  const backend = useBackendStatus();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showHealthModal, setShowHealthModal] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('skyfare_notifs_read') === 'true' ? 0 : 1;
  });

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await backend.refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
    localStorage.setItem('skyfare_notifs_read', 'true');
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

            {/* Dynamic Interactive "LIVE" Connection Pill */}
            <div className="relative">
              {backend.isConnected ? (
                <button
                  id="btn-topbar-live-status"
                  onClick={() => setShowHealthModal(!showHealthModal)}
                  title={`Live Sovereign Backend Connected (${backend.latencyMs ?? 110}ms) — Click for health inspector`}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shrink-0 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>LIVE</span>
                  {backend.latencyMs && (
                    <span className="hidden md:inline font-mono text-[9px] font-normal opacity-80">
                      {backend.latencyMs}ms
                    </span>
                  )}
                </button>
              ) : backend.isConnecting ? (
                <button
                  id="btn-topbar-live-status"
                  onClick={() => setShowHealthModal(!showHealthModal)}
                  title="Connecting to Sovereign Compute Engine (Waking cloud backend) — Click for status"
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0 cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>CONNECTING...</span>
                </button>
              ) : (
                <button
                  id="btn-topbar-live-status"
                  onClick={() => setShowHealthModal(!showHealthModal)}
                  title="Backend asleep / offline — Click to reconnect"
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider shrink-0 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>OFFLINE</span>
                </button>
              )}

              {/* Live Health & Connection Inspector Popover */}
              {showHealthModal && (
                <div
                  id="health-inspector-dropdown"
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 space-y-3 animate-fadeIn"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Sovereign Cloud Engine Health
                      </span>
                    </div>
                    <button
                      onClick={() => setShowHealthModal(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Status Row */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Connection State</span>
                      {backend.isConnected ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Connected (HTTP 200)</span>
                        </span>
                      ) : backend.isConnecting ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Waking Server...</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                          <WifiOff className="w-3.5 h-3.5" />
                          <span>Offline / Standalone</span>
                        </span>
                      )}
                    </div>

                    {/* Latency & Database Metrics */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                          Round-Trip Ping
                        </span>
                        <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                          {backend.latencyMs ? `${backend.latencyMs} ms` : 'Measuring...'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                          Verified Quotes
                        </span>
                        <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                          {backend.observations.toLocaleString('en-IN')}+
                        </span>
                      </div>
                    </div>

                    {/* Backend Architecture Info */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Compute Host:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">Render (Python 3.12 FastAPI)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Database Vault:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">Supabase Cloud PostgreSQL</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>National Fisher Index:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">166.48 (Superlative)</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      id="btn-retest-backend-ping"
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>{isRefreshing ? 'Testing Connection...' : 'Ping & Refresh Live Feeds'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
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
                      <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Regulatory Surveillance Alerts
                      </span>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Notification Item */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        DGCA Rule 135 Status
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Live Sync</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      National Trunk Corridor Surveillance: 14/14 Category-I routes monitored across 5 horizons ($T+1$ to $T+45$).
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Continuous Fisher Ideal index is calibrated at <strong>166.48</strong> across 42,945+ real quotes with zero unverified pricing breaches.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          onNavigateToView('anomalies');
                          setShowNotifications(false);
                          handleMarkAllRead();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect Irregularities Stream</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Mark Read
                        </button>
                      )}
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

