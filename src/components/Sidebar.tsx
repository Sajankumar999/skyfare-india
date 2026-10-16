import React, { useEffect, useState } from 'react';
import {
  Plane,
  TrendingUp,
  MapPin,
  Clock,
  Map,
  ShieldAlert,
  Sliders,
  Bot,
  Lock,
  LogOut,
  HelpCircle,
  FileText,
  Server,
  AlertOctagon,
  DownloadCloud,
  Key,
  X,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  PieChart
} from 'lucide-react';
import { apiUrl } from '../config/api';
import { getCachedData, fetchWithCache } from '../services/apiCache';

export type MainViewTab =
  | 'citizen_portal'
  | 'national_index'
  | 'route'
  | 'booking_window'
  | 'heatmap'
  | 'anomalies'
  | 'cpi_decomposition'
  | 'scenario_simulator'
  | 'ai_chatbot'
  | 'admin_scraper'
  | 'admin_quarantine'
  | 'admin_export'
  | 'admin_api_keys'
  | 'support'
  | 'about';

interface SidebarProps {
  currentView: MainViewTab;
  onSelectView: (view: MainViewTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onAdminLogout,
}) => {
  const [liveNationalIndex, setLiveNationalIndex] = useState<string>(() => {
    const cached = getCachedData<{ fisher_ideal_index?: number }>(apiUrl('/api/v1/indices/today'));
    if (cached?.fisher_ideal_index) {
      return Number(cached.fisher_ideal_index).toFixed(2);
    }
    return '166.48';
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadNationalIndex = async () => {
      try {
        const data = await fetchWithCache<{
          fisher_ideal_index?: number;
          laspeyres_index?: number;
          index_value?: number;
        }>(apiUrl('/api/v1/indices/today'), {
          signal: controller.signal,
          ttlMs: 60000,
        });

        const value = Number(data.fisher_ideal_index ?? data.laspeyres_index ?? data.index_value ?? 166.48);
        if (Number.isFinite(value)) {
          setLiveNationalIndex(value.toFixed(2));
        }
      } catch {
        if (!controller.signal.aborted) {
          setLiveNationalIndex('166.48');
        }
      }
    };

    void loadNationalIndex();
    return () => controller.abort();
  }, []);

  const handleNavClick = (view: MainViewTab) => {
    onSelectView(view);
    onCloseMobile();
  };

  const navButton = (
    viewId: MainViewTab,
    label: string,
    Icon: React.ElementType,
    badge?: string,
    isDangerBadge?: boolean
  ) => {
    const isActive = currentView === viewId;

    return (
      <button
        id={`sidebar-link-${viewId}`}
        onClick={() => handleNavClick(viewId)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
          isActive
            ? 'bg-blue-600 text-white shadow-xs font-bold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive
                ? 'text-white'
                : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'
            }`}
          />
          <span className="truncate">{label}</span>
        </div>

        {badge && (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium shrink-0 ml-1.5 ${
              isActive
                ? 'bg-white/20 text-white'
                : isDangerBadge
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto px-3 py-4 space-y-4 text-xs select-none">
      {/* 1. HOME (Replaces Citizen Portal) */}
      <div className="space-y-0.5">
        {navButton('citizen_portal', 'Home', Plane)}
      </div>

      {/* 2. TODAY'S NATIONAL INDEX */}
      <div className="space-y-0.5">
        {navButton('national_index', "Today's National Index", TrendingUp, liveNationalIndex)}
      </div>

      {/* 3. ROUTE INTELLIGENCE */}
      <div className="space-y-0.5">
        {navButton('route', 'Route Intelligence', MapPin, '14 Corridors')}
      </div>

      {/* 4. BOOKING HORIZONS & CARRIERS */}
      <div className="space-y-0.5">
        {navButton('booking_window', 'Booking Horizons & Carriers', Clock, 'T+1 → T+45')}
      </div>

      {/* 5. IRREGULARITIES */}
      <div className="space-y-0.5">
        {navButton('anomalies', 'Irregularities', ShieldAlert, 'Surveillance', true)}
      </div>

      {/* 6. CPI DECOMPOSITION */}
      <div className="space-y-0.5">
        {navButton('cpi_decomposition', 'CPI Decomposition', PieChart, '+42.4 bps')}
      </div>

      {/* 7. SCENARIO SIMULATOR */}
      <div className="space-y-0.5">
        {navButton('scenario_simulator', 'Scenario Simulator', Sliders, 'Shocks')}
      </div>

      {/* 8. SKYFARE AI CHATBOT */}
      <div className="space-y-0.5">
        {navButton('ai_chatbot', 'SkyFare AI Chatbot', Bot, 'Grounded')}
      </div>

      {/* 9. SUPPORT */}
      <div className="space-y-0.5">
        {navButton('support', 'Support', HelpCircle)}
      </div>

      {/* 10. ABOUT SKYFARE INDIA */}
      <div className="space-y-0.5">
        {navButton('about', 'About SkyFare India', FileText)}
      </div>

      {/* 11. ADMIN (At the bottom) */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
        {isAdminLoggedIn ? (
          <div className="space-y-1.5 p-2 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                MoSPI Statistical Officer
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 px-1 font-medium">
              Price Statistics Division
            </div>
            <div className="space-y-0.5 pt-1">
              {navButton('admin_scraper', 'Scraper Fleet Controller', Server, '5 Nodes')}
              {navButton('admin_quarantine', 'Data Quarantine Zone', AlertOctagon, '3 Pending', true)}
              {navButton('admin_export', 'MoSPI Official PDF Export', DownloadCloud, 'PDF/CSV')}
              {navButton('admin_api_keys', 'API Key Management', Key, '3 Active')}
            </div>
            <button
              id="btn-sidebar-admin-logout"
              onClick={() => {
                onAdminLogout();
                onCloseMobile();
              }}
              className="w-full mt-1.5 py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[11px]"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout Officer</span>
            </button>
          </div>
        ) : (
          <button
            id="btn-sidebar-admin-login"
            onClick={() => {
              onOpenAdminLogin();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer border border-indigo-200/60 dark:border-indigo-900/40"
          >
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Admin (MoSPI Access)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        )}
      </div>

      {/* Bottom Trust Seal */}
      <div className="mt-auto pt-4 border-t border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-400 space-y-1 px-2">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>MoSPI Price Statistics Division</span>
        </div>
        <p className="leading-tight">
          Superlative Fisher Ideal formula • Base Year: 2024-Q1 (100.00)
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed/Sticky Left Sidebar (lg and up) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-[calc(100vh-65px)] sticky top-[65px] border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-in) */}
      {isOpenMobile && (
        <div
          id="mobile-sidebar-drawer-backdrop"
          className="lg:hidden fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseMobile();
          }}
        >
          <div className="bg-white dark:bg-slate-900 w-72 max-w-[85vw] h-full shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 animate-slideRight">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 flex items-center justify-center shrink-0">
                  <img src="/skyfare-logo.png" alt="SkyFare India Logo" className="h-8 w-8 object-contain drop-shadow-xs" />
                </div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  SkyFare India
                </span>
              </div>
              <button
                id="btn-close-mobile-sidebar"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
