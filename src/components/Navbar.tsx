import React from 'react';
import { Plane, ShieldCheck, Sun, Moon, Database, Landmark, User, RefreshCw, Calculator, Users } from 'lucide-react';
import { UserPersona } from '../types';

interface NavbarProps {
  activeTab: 'citizen' | 'command' | 'engine' | 'schema';
  setActiveTab: (tab: 'citizen' | 'command' | 'engine' | 'schema') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onRefreshData?: () => void;
  persona: UserPersona;
  setPersona: (persona: UserPersona) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onRefreshData,
  persona,
  setPersona,
}) => {
  const handlePersonaChange = (newPersona: UserPersona) => {
    setPersona(newPersona);
    if (newPersona === 'citizen') {
      setActiveTab('citizen');
    } else {
      setActiveTab('command');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs dark:border-slate-800 dark:bg-slate-900/95">
      {/* Tricolor Ministry Accent Strip */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-amber-500" />
        <div className="h-full w-1/3 bg-white dark:bg-slate-200" />
        <div className="h-full w-1/3 bg-emerald-600" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="h-10 w-10 flex items-center justify-center shrink-0">
              <img src="/skyfare-logo.png" alt="SkyFare India Logo" className="h-10 w-10 object-contain drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  SkyFare <span className="text-blue-600 dark:text-blue-400">India</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden xl:block">
                National Airfare Intelligence & Citizen Fair-Fare Platform
              </p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center gap-2">
            {/* Primary Two Views Switcher */}
            <nav className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
              <button
                id="nav-tab-citizen"
                onClick={() => {
                  setActiveTab('citizen');
                  setPersona('citizen');
                }}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'citizen'
                    ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <Plane className="h-3.5 w-3.5" />
                <span>Citizen Portal</span>
              </button>

              <button
                id="nav-tab-command"
                onClick={() => {
                  setActiveTab('command');
                  if (persona === 'citizen') setPersona('mospi_officer');
                }}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'command'
                    ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <Landmark className="h-3.5 w-3.5" />
                <span>Command Center</span>
              </button>
            </nav>

            {/* Technical Sub-Tools (Index Engine & SQL DB Schema) */}
            <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                id="nav-tab-engine"
                onClick={() => setActiveTab('engine')}
                title="Interactive Index Engine & Econometric Formulas"
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  activeTab === 'engine'
                    ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Calculator className="h-3 w-3" />
                <span>Index Engine</span>
              </button>

              <button
                id="nav-tab-schema"
                onClick={() => setActiveTab('schema')}
                title="PostgreSQL Production Database Specification"
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  activeTab === 'schema'
                    ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Database className="h-3 w-3" />
                <span>DB Schema</span>
              </button>
            </div>
          </div>

          {/* Right Toolbar: Persona Dropdown, Trust Badge & Theme Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Persona Switcher Dropdown */}
            <div className="flex items-center gap-1.5 pl-1">
              <Users className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              <label htmlFor="persona-select" className="sr-only">Active Persona</label>
              <select
                id="persona-select"
                value={persona}
                onChange={(e) => handlePersonaChange(e.target.value as UserPersona)}
                className="text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="citizen">Citizen Traveler</option>
                <option value="mospi_officer">MoSPI Officer</option>
                <option value="rbi_mpc">RBI MPC Member</option>
                <option value="dgca_regulator">DGCA Regulator</option>
              </select>
            </div>

            {/* Live Data Trust Badge */}
            <div
              title="Tamper-proof batch validated with SHA-256 Merkle verification"
              className="hidden 2xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Trust: 85.1/100</span>
            </div>

            {/* Quick Refresh Data */}
            {onRefreshData && (
              <button
                id="btn-refresh-telemetry"
                onClick={onRefreshData}
                title="Refresh real-time feed quotes"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}

            {/* Dark / Light Toggle */}
            <button
              id="btn-theme-toggle"
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
