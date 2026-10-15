import React from 'react';
import {
  FileText,
  Award,
  Database,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Scale,
  Layers,
  Code,
  Users,
  Landmark,
  Compass,
  CheckCircle2,
  Zap,
  Lock,
  ArrowUpRight,
  Split
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-6 pb-16 animate-fadeIn max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
            National Airfare Intelligence Initiative
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Ministry of Statistics & Programme Implementation (MoSPI)
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          About SkyFare India & Econometric Methodology
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          National Airfare Intelligence & Citizen Fair-Fare Platform
        </p>
      </div>

      {/* EXECUTIVE OVERVIEW: Purpose, Use Cases & Advantages */}
      <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
            <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Executive Overview: Purpose, Use Cases & Advantages</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 uppercase tracking-wider">
            Dual-Portal Architecture
          </span>
        </div>

        {/* 1. Purpose */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
            Platform Purpose
          </h3>
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              SkyFare India (built for MoSPI under SIH26056) bridges the gap between macroeconomic inflation tracking and consumer transparency. It replaces archaic, manual monthly surveys with an automated, high-frequency pipeline that captures dynamic airfare pricing. Our dual-portal platform empowers everyday travelers to spot algorithmic surge pricing while supplying the Government of India with a cryptographic, real-time Airfare Price Index (APIx).
            </p>
          </div>
        </div>

        {/* 2. Primary Use Cases Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
              Primary Use Cases
            </h3>
            <span className="text-[11px] text-slate-400">Target Stakeholders</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1: Citizens & Travelers */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 hover:border-blue-500/40 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 uppercase tracking-wider">
                    Portal 1 • Citizen
                  </span>
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Citizens & Travelers
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Search flights with unbundled fee breakdowns, receive "Buy/Wait" elasticity recommendations, and instantly identify predatory surge fares via the Fair-Fare benchmark.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>Consumer Fair-Fare Engine</span>
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>

            {/* Card 2: MoSPI & RBI Officials */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 hover:border-indigo-500/40 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 uppercase tracking-wider">
                    Portal 2 • Command
                  </span>
                  <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  MoSPI & RBI Officials
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Consume the Superlative Fisher Ideal Index to monitor inflation transmission into the Headline CPI, directly informing national monetary policy.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span>Macro Econometric Index</span>
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>

            {/* Card 3: DGCA Regulators */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 hover:border-rose-500/40 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 uppercase tracking-wider">
                    Surveillance • Policy
                  </span>
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  DGCA Regulators
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Audit automated pricing algorithms across trunk routes to ensure compliance with Aircraft Rules 1937 (Rule 135) against predatory pricing.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <span>Rule 135 Tariff Scrutiny</span>
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Platform Advantages */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
            Platform Advantages
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>High-Frequency Tracking</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Monitors pricing across 5 advance-booking horizons (T+1 to T+45), capturing dynamic yield management behavior that monthly surveys miss.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <Split className="w-4 h-4 text-blue-500" />
                <span>Fare Disaggregation</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Isolates raw base fares from external shocks like Aviation Turbine Fuel (ATF) surcharges and User Development Fees (UDF).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>Cryptographic Auditability</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Every ingested price quote batch is sealed with a SHA-256 Merkle hash, guaranteeing zero data tampering for statutory reporting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
          <Award className="w-5 h-5 text-amber-500" />
          <span>The Problem Context: Modernizing India's Transport Inflation Measurement</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Airfare constitutes a crucial and volatile sub-component of the All-India Consumer Price Index (CPI) under the Transport & Communication basket. Historically, airfare data collection relied on infrequent, manual monthly surveys across fixed travel dates. In the modern era of dynamic algorithmic revenue management, ticket prices change thousands of times per second based on advance booking horizons (T+1 to T+45) and real-time load factors.
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong>SkyFare India</strong> bridges this gap by creating an automated, high-frequency quote ingestion pipeline coupled with superlative econometric index theory (Fisher Ideal Index) to produce daily tamper-proof inflation indices for MoSPI, the Reserve Bank of India, and the Directorate General of Civil Aviation.
        </p>
      </div>

      {/* Mathematical Formulations Grid (Preserved exactly as requested) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Scale className="w-5 h-5 text-indigo-600" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Econometric Index Formulations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Formula 1: Laspeyres */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
              <span>Laspeyres Price Index (L)</span>
              <span className="font-mono text-blue-600">Base-Weighted</span>
            </div>
            <div className="font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center font-bold text-xs">
              L = Σ(p_t · q_0) / Σ(p_0 · q_0)
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Fixes passenger traffic quantities to the base period (2024-Q1). Provides an upper bound on true inflation because it does not account for passenger substitution to lower-priced flights.
            </p>
          </div>

          {/* Formula 2: Paasche */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
              <span>Paasche Price Index (P)</span>
              <span className="font-mono text-purple-600">Current-Weighted</span>
            </div>
            <div className="font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center font-bold text-xs">
              P = Σ(p_t · q_t) / Σ(p_0 · q_t)
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Weights prices by current observed passenger seat kilometer volumes (q_t). Typically understates inflation as consumers react to surges by shifting to cheaper carriers or dates.
            </p>
          </div>

          {/* Formula 3: Fisher Superlative */}
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
            <div className="flex items-center justify-between font-bold text-indigo-950 dark:text-indigo-200">
              <span>Superlative Fisher Ideal (F)</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Gold Standard</span>
            </div>
            <div className="font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
              F = √(L · P)
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              The geometric mean of Laspeyres and Paasche. Mathematically satisfies the Time Reversal and Factor Reversal tests, entirely eliminating consumer substitution bias.
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Pipeline (Preserved exactly as requested) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-blue-600" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            End-to-End System Architecture
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
            <div>
              <strong className="text-slate-900 dark:text-white block">Multi-Source Ingestion:</strong>
              Scrapes 35,000+ daily domestic quotes from Airline NDC APIs (IndiGo, Air India) and major OTAs.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
            <div>
              <strong className="text-slate-900 dark:text-white block">Unbundled Tariff Disaggregation:</strong>
              Separates base fare, fuel surcharge (ATF), User Development Fee (UDF), Passenger Service Fee (PSF), and GST.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
            <div>
              <strong className="text-slate-900 dark:text-white block">Cryptographic Data Quarantine & Audit:</strong>
              Validates quotes with SHA-256 Merkle hashes. Quarantines fat-finger errors and zero-fare phantom records.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-[11px]">4</span>
            <div>
              <strong className="text-slate-900 dark:text-white block">National Index & CPI Transmission Engine:</strong>
              Applies Revenue Passenger Kilometer (RPK) weights to compute Laspeyres, Paasche, and Fisher indices and outputs basis-point impacts on Headline CPI.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
