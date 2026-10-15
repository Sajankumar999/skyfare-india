import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Plane,
  TrendingUp,
  MapPin,
  Clock,
  Sliders,
  Bot,
  Shield,
  HelpCircle,
  FileText,
  ArrowRight,
  Database,
  Calculator
} from 'lucide-react';
import { TOP_MOVING_CORRIDORS } from '../data/mockData';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string, contextParam?: string) => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Home' | 'Intelligence' | 'Analytics' | 'Policy' | 'Admin' | 'Corridor';
  icon: React.ElementType;
  viewId: string;
  param?: string;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const baseItems: SearchItem[] = [
    {
      id: 'citizen_portal',
      title: 'Citizen Fair-Fare Portal',
      subtitle: 'Search domestic flights, compare quotes against 30d baseline, inspect fees',
      category: 'Home',
      icon: Plane,
      viewId: 'citizen_portal',
    },
    {
      id: 'national_index',
      title: "Today's National Airfare Index",
      subtitle: 'Laspeyres 114.59, Fisher Superlative 114.50, and Macro Briefing',
      category: 'Home',
      icon: TrendingUp,
      viewId: 'national_index',
    },
    {
      id: 'route',
      title: 'Route Intelligence & Corridors',
      subtitle: 'Corridor basket, spot tariffs, and DGCA Rule 135 compliance check',
      category: 'Intelligence',
      icon: MapPin,
      viewId: 'route',
    },
    {
      id: 'booking_window',
      title: 'Booking Window Yield Curve',
      subtitle: 'Advance booking horizons matrix from T+1 (Spot) to T+45 (Early Bird)',
      category: 'Intelligence',
      icon: Clock,
      viewId: 'booking_window',
    },
    {
      id: 'heatmap',
      title: 'Airfare Heatmap Across India',
      subtitle: 'Interactive map of India with route arcs, surge nodes, and regional hubs',
      category: 'Intelligence',
      icon: MapPin,
      viewId: 'heatmap',
    },
    {
      id: 'anomalies',
      title: 'Irregularities Surveillance Stream',
      subtitle: 'High-frequency tariff spike detection, surge watchlist & Merkle logs',
      category: 'Analytics',
      icon: Shield,
      viewId: 'anomalies',
    },
    {
      id: 'cpi_decomposition',
      title: 'CPI Decomposition & Inflation Impact',
      subtitle: 'Transport CPI contribution (+42.4 bps) and headline transmission (+3.64 bps)',
      category: 'Analytics',
      icon: TrendingUp,
      viewId: 'cpi_decomposition',
    },
    {
      id: 'scenario_simulator',
      title: 'Policy Scenario Simulator',
      subtitle: 'Simulate ATF fuel price shocks, demand shifts, and fleet grounding',
      category: 'Policy',
      icon: Sliders,
      viewId: 'scenario_simulator',
    },
    {
      id: 'ai_chatbot',
      title: 'Ask SkyFare AI Chatbot',
      subtitle: 'Data-grounded conversational agent for statistical airfare inquiries',
      category: 'Policy',
      icon: Bot,
      viewId: 'ai_chatbot',
    },
    {
      id: 'admin_login',
      title: 'Login as MoSPI Administrator',
      subtitle: 'Access Scraper Fleet Controller, Quarantine Zone, and Export Engine',
      category: 'Admin',
      icon: Shield,
      viewId: 'admin_login',
    },
    {
      id: 'support',
      title: 'Citizen Support & DGCA Grievance',
      subtitle: 'Passenger charter, Rule 135 escalation, customer helplines & FAQ',
      category: 'Home',
      icon: HelpCircle,
      viewId: 'support',
    },
    {
      id: 'about',
      title: 'About SkyFare India (MoSPI Methodology)',
      subtitle: 'National Airfare Intelligence methodology and Fisher superlative formula',
      category: 'Home',
      icon: FileText,
      viewId: 'about',
    },
  ];

  // Add corridor items dynamically
  const corridorItems: SearchItem[] = TOP_MOVING_CORRIDORS.map((c) => ({
    id: `corridor-${c.routeCode}`,
    title: `${c.routeCode} (${c.originCity} → ${c.destCity})`,
    subtitle: `Current Fare: ₹${c.currentFare.toLocaleString('en-IN')} (${c.changePct > 0 ? `+${c.changePct}%` : `${c.changePct}%`}) • Status: ${c.status}`,
    category: 'Corridor',
    icon: Plane,
    viewId: 'route',
    param: c.routeCode,
  }));

  const allItems = [...baseItems, ...corridorItems];

  const filteredItems = query.trim() === ''
    ? baseItems
    : allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div
      id="quick-search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3 bg-slate-50/50 dark:bg-slate-950/40">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            id="quick-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search corridors (e.g. BOM-DEL), views, formulas, or policy tools..."
            autoFocus
            className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching corridors, views, or tools found for "{query}".
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.viewId, item.param);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                        <span>{item.title}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Tip: Press ESC to close anytime</span>
          <span className="font-mono">SkyFare India Quick Navigator</span>
        </div>
      </div>
    </div>
  );
};
