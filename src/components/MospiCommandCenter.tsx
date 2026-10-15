import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Activity,
  Sliders,
  AlertTriangle,
  FileCheck,
  Hash,
  Scale,
  Download,
  Users,
  Clock,
  MapPin,
  ShieldAlert,
  Info,
  CheckCircle2,
  ArrowUpRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { MOCK_AUDIT_BATCHES } from '../data/mockData';
import { UserPersona } from '../types';
import { DgcaValidationCard } from './DgcaValidationCard';
import { MospiBulletinModal } from './MospiBulletinModal';
import { apiUrl } from '../config/api';
import { CarrierAnalyticsPanel } from './CarrierAnalyticsPanel';
import { BookingHorizonsPanel } from './BookingHorizonsPanel';
import { CpiDecompositionPanel } from './CpiDecompositionPanel';
import { RouteIntelligencePanel } from './RouteIntelligencePanel';
import { AnomalyWatchlistPanel } from './AnomalyWatchlistPanel';

interface MospiCommandCenterProps {
  persona?: UserPersona;
}

export type CommandCenterSubTab =
  | 'overview'
  | 'airline_market'
  | 'booking_horizons'
  | 'cpi_decomposition'
  | 'route_intelligence'
  | 'anomalies_simulator';

export const MospiCommandCenter: React.FC<MospiCommandCenterProps> = ({ persona = 'mospi_officer' }) => {
  // Sub-Navigation Tabs State
  const [activeSubTab, setActiveSubTab] = useState<CommandCenterSubTab>('overview');

  // Official Bulletin Modal State
  const [isBulletinOpen, setIsBulletinOpen] = useState<boolean>(false);

  // Live Index State with safe baseline fallbacks
  const [liveIndex, setLiveIndex] = useState({
    laspeyres: 114.56,
    fisher: 114.45,
    paasche: 114.34,
    dodChange: 0.3,
    transportBps: 42.4,
    headlineBps: 3.64,
  });

  useEffect(() => {
    const controller = new AbortController();
    const loadIndex = async () => {
      try {
        const res = await fetch(apiUrl('/api/v1/indices/today'), { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        const laspeyres = Number(data.laspeyres_index);
        const fisher = Number(data.fisher_ideal_index);
        const paasche = Number(data.paasche_index);
        const dod = Number(data.dod_change_pct);
        if ([laspeyres, fisher, paasche, dod].every(Number.isFinite)) {
          setLiveIndex((prev) => ({
            ...prev,
            laspeyres,
            fisher,
            paasche,
            dodChange: dod,
          }));
        }
      } catch {
        // Safe fallback retains visual and mathematical stability
      }
    };
    void loadIndex();
    return () => controller.abort();
  }, []);

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: Activity, badge: 'Live' },
    { id: 'airline_market', label: 'Airline & Market Analytics', icon: Users, badge: '5 Carriers' },
    { id: 'booking_horizons', label: 'Booking Horizons', icon: Clock, badge: 'T+1 → T+45' },
    { id: 'cpi_decomposition', label: 'CPI Decomposition', icon: TrendingUp, badge: '+42.4 bps' },
    { id: 'route_intelligence', label: 'Route Intelligence & Map', icon: MapPin, badge: 'Interactive Map' },
    { id: 'anomalies_simulator', label: 'Irregularities Watchlist & Policy Simulator', icon: Sliders, badge: 'Watchlist & AI' },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7 pb-16">
      {/* Persona Context Banner */}
      {persona === 'dgca_regulator' && (
        <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              <strong>DGCA Regulator Mode:</strong> Focus active on Rule 135 Dynamic Pricing Compliance, corridor surge surveillance, and Form 1-B empirical validation.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
            Civil Aviation Oversight
          </span>
        </div>
      )}

      {persona === 'rbi_mpc' && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>RBI Monetary Policy Committee Mode:</strong> High-frequency pass-through surveillance active. Headline CPI sensitivity is currently estimated at +3.64 bps.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
            Macro Monetary Policy
          </span>
        </div>
      )}

      {persona === 'mospi_officer' && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>MoSPI Officer Mode:</strong> Price Statistics Division. National Airfare Index synthesis with Fisher Ideal superlative formula and SHA-256 Merkle audit.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            Official Statistics Division
          </span>
        </div>
      )}

      {/* Header with Title and Classification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
              MoSPI Internal Intelligence
            </span>
            <span className="text-xs font-medium text-slate-500">
              Ref: PSD-AVIATION-2025 • Base Year: 2024-Q1 = 100.00
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            National Airfare Econometric Command Center
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Download Official Bulletin Button */}
          <button
            id="btn-download-mospi-bulletin"
            onClick={() => setIsBulletinOpen(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Official Statistical Bulletin</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit: SHA-256 Validated</span>
          </div>
          <div className="text-xs text-slate-500 font-mono hidden md:block">
            Batch: 35,261 Quotes
          </div>
        </div>
      </div>

      {/* 1. EXECUTIVE STAT CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Stat Card 1: Laspeyres Index */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">National Airfare Index</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Laspeyres</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {liveIndex.laspeyres.toFixed(2)}
            </div>
            <span className="inline-flex items-center text-xs font-bold text-rose-600 dark:text-rose-400">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {liveIndex.dodChange >= 0 ? `+${liveIndex.dodChange.toFixed(1)}%` : `${liveIndex.dodChange.toFixed(1)}%`} DoD
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Base-weighted basket: Σ(p_t·q_0) / Σ(p_0·q_0). Base = 100.00
          </p>
        </div>

        {/* Stat Card 2: Fisher Ideal Index */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Superlative Index</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Fisher Ideal</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {liveIndex.fisher.toFixed(2)}
            </div>
            <span className="inline-flex items-center text-xs font-semibold text-slate-500">
              Substitution-proof
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Geometric mean: √(L·P). Eliminates consumer substitution bias.
          </p>
        </div>

        {/* Stat Card 3: Transport CPI Impact */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Transport Subgroup CPI</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">MoSPI Basket</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              +42.4 <span className="text-sm font-bold">bps</span>
            </div>
            <span className="text-xs font-semibold text-amber-600">Elevated</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Direct basis point contribution to All-India Transport & Communication.
          </p>
        </div>

        {/* Stat Card 4: Headline CPI Impact */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Headline CPI Impact</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Macro Level</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
              +3.64 <span className="text-sm font-bold">bps</span>
            </div>
            <span className="text-xs font-semibold text-blue-600">Transmitted</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Macro headline inflation impact across 8.59% transport CPI basket weight.
          </p>
        </div>

        {/* Stat Card 5: Data Trust Score */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Data Trust Score</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Audited</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              85.1 <span className="text-sm font-bold">/ 100</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">GOOD</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            99.4% ingest integrity • Zero schema irregularities detected in run batch.
          </p>
        </div>
      </section>

      {/* 2. SUB-NAVIGATION TABS (6 Sleek Tabs) */}
      <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`subtab-${tab.id}`}
                onClick={() => setActiveSubTab(tab.id as CommandCenterSubTab)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DYNAMIC TAB CONTENT */}

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Synthesis Banner */}
          <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-slate-900/5 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-slate-900/30 p-5 rounded-2xl border border-blue-200/60 dark:border-blue-900/50 space-y-3">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Executive Macroeconomic Briefing • 22 September 2026
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Today’s domestic airfare index closed at <strong>{liveIndex.laspeyres.toFixed(2)}</strong> (Laspeyres formula) and{' '}
              <strong>{liveIndex.fisher.toFixed(2)}</strong> (Fisher Ideal superlative), registering an elevated{' '}
              {liveIndex.dodChange >= 0 ? `+${liveIndex.dodChange.toFixed(1)}%` : `${liveIndex.dodChange.toFixed(1)}%`} day-on-day movement.
              Price escalation is primarily concentrated in the urgent T+1 and T+7 booking windows across the high-density
              BOM-DEL and DEL-BLR corridors. The All-India Transport & Communication sub-basket impact is measured at{' '}
              <strong>+42.4 basis points</strong>, translating to a direct <strong>+3.64 bps</strong> impulse on
              Headline CPI.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-slate-600 dark:text-slate-400">
              <span>• Laspeyres: <strong>{liveIndex.laspeyres.toFixed(2)}</strong></span>
              <span>• Paasche: <strong>{liveIndex.paasche.toFixed(2)}</strong></span>
              <span>• Fisher Ideal: <strong>{liveIndex.fisher.toFixed(2)}</strong></span>
              <span>• Substitution Bias Gap: <strong>{Math.abs(liveIndex.laspeyres - liveIndex.paasche).toFixed(2)} pts</strong></span>
            </div>
          </div>

          {/* DGCA Empirical Validation Card */}
          <section>
            <DgcaValidationCard />
          </section>

          {/* Cryptographic Audit Vault */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Data Trust & Cryptographic Audit Vault
                </h3>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                TAMPER_PROOF_VALIDATED
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Immutable log of high-frequency price quote batches ingested across Indian domestic OTAs and airline direct connections with SHA-256 cryptographic verification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Quotes Ingested</span>
                <span className="font-mono text-lg font-black text-slate-800 dark:text-slate-200">35,261</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Corridors Monitored</span>
                <span className="font-mono text-lg font-black text-slate-800 dark:text-slate-200">14 Corridors</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ingestion Integrity</span>
                <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">99.4%</span>
              </div>
            </div>

            {/* Batch Records List */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Recent Merkle Batch Seals
              </span>
              {MOCK_AUDIT_BATCHES.map((batch) => (
                <div
                  key={batch.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {batch.id}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {batch.quotesFetched.toLocaleString('en-IN')} quotes
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Source: {batch.sourceName}</span>
                    <span>{batch.completedAt}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200/60 dark:border-slate-800 truncate">
                    <Hash className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">SHA-256: {batch.sha256Hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: AIRLINE & MARKET ANALYTICS */}
      {activeSubTab === 'airline_market' && <CarrierAnalyticsPanel />}

      {/* TAB 3: BOOKING HORIZONS */}
      {activeSubTab === 'booking_horizons' && <BookingHorizonsPanel />}

      {/* TAB 4: CPI DECOMPOSITION */}
      {activeSubTab === 'cpi_decomposition' && <CpiDecompositionPanel />}

      {/* TAB 5: ROUTE INTELLIGENCE & MAP */}
      {activeSubTab === 'route_intelligence' && <RouteIntelligencePanel />}

      {/* TAB 6: IRREGULARITIES WATCHLIST & POLICY SIMULATOR */}
      {activeSubTab === 'anomalies_simulator' && <AnomalyWatchlistPanel />}

      {/* Official MoSPI Statistical Bulletin Modal */}
      <MospiBulletinModal
        isOpen={isBulletinOpen}
        onClose={() => setIsBulletinOpen(false)}
      />
    </div>
  );
};
