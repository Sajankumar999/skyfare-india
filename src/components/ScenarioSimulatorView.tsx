import React, { useEffect, useState } from 'react';
import {
  Sliders,
  TrendingUp,
  Scale,
  ShieldAlert,
  RotateCcw,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { PolicySimulatorState } from '../types';
import { apiUrl } from '../config/api';

export const ScenarioSimulatorView: React.FC = () => {
  const [simulator, setSimulator] = useState<PolicySimulatorState>({
    atfShockPct: 0,
    demandShiftPct: 0,
    fleetGroundingPct: 0,
  });
  const [liveResults, setLiveResults] = useState<{
    airfare_shift_pct: number;
    laspeyres_index: number;
    transport_bps: number;
    headline_bps: number;
  } | null>(null);
  const [isApiConnected, setIsApiConnected] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl('/api/v1/scenario/simulate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        atf_shock_pct: simulator.atfShockPct,
        demand_shift_pct: simulator.demandShiftPct,
        fleet_grounding_pct: simulator.fleetGroundingPct,
      }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Scenario API responded with ${response.status}`);
        return response.json();
      })
      .then((payload: unknown) => {
        if (
          typeof payload !== 'object' ||
          payload === null ||
          !Number.isFinite(Number((payload as { laspeyres_index?: unknown }).laspeyres_index)) ||
          !Number.isFinite(Number((payload as { headline_bps?: unknown }).headline_bps))
        ) throw new Error('Invalid scenario response');
        setLiveResults(payload as {
          airfare_shift_pct: number;
          laspeyres_index: number;
          transport_bps: number;
          headline_bps: number;
        });
        setIsApiConnected(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLiveResults(null);
          setIsApiConnected(false);
        }
      });
    return () => controller.abort();
  }, [simulator]);

  const baseLaspeyres = 114.59;
  const baseTransportBps = 42.4;
  const baseHeadlineBps = 3.64;

  const simAtfEffect = simulator.atfShockPct * 0.40 * 0.65;
  const simGroundingEffect = Math.abs(simulator.fleetGroundingPct) * 0.55;
  const simDemandEffect = simulator.demandShiftPct * 0.35;

  const simulatedTotalAirfareShiftPct = simAtfEffect + simGroundingEffect + simDemandEffect;
  const simulatedLaspeyres = liveResults?.laspeyres_index
    ?? baseLaspeyres * (1 + simulatedTotalAirfareShiftPct / 100);
  const simulatedTransportBps = liveResults?.transport_bps
    ?? baseTransportBps + (simulatedTotalAirfareShiftPct * 3.85);
  const simulatedHeadlineBps = liveResults?.headline_bps
    ?? baseHeadlineBps + (simulatedTotalAirfareShiftPct * 0.33);
  const displayedAirfareShift = liveResults?.airfare_shift_pct ?? simulatedTotalAirfareShiftPct;

  let policyAdvisory = {
    level: 'EQUILIBRIUM',
    badge: 'Normal Market Operations',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    recommendation: 'Market dynamic pricing is within the 95% historical tolerance band. No statutory intervention required under Rule 135 of Aircraft Rules 1937.',
  };

  if (simulatedHeadlineBps > 10.0 || displayedAirfareShift > 25.0) {
    policyAdvisory = {
      level: 'CRITICAL',
      badge: 'URGENT: DGCA Fare Cap Band Activation Required',
      color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      recommendation: 'Projected headline CPI transmission exceeds +10 bps threshold. Recommend MoCA invoke Section 5A of the Aircraft Act 1934 to mandate sector-specific upper fare bands on trunk routes.',
    };
  } else if (simulatedHeadlineBps > 6.0 || displayedAirfareShift > 12.0) {
    policyAdvisory = {
      level: 'ELEVATED',
      badge: 'WATCHLIST: Heightened Surveillance on Metro Trunk Pairs',
      color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      recommendation: 'Elevated ATF or capacity tightening pushing transport inflation higher. Issue warning to airline revenue management desks regarding predatory surge pricing algorithms.',
    };
  }

  return (
    <div className="space-y-6 pb-16 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              Econometric Scenario Lab
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Real-time elasticity pass-through model
            </span>
            {isApiConnected && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                LIVE API CONNECTED
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Policy Scenario Simulator
          </h2>
        </div>

        <button
          onClick={() => setSimulator({ atfShockPct: 0, demandShiftPct: 0, fleetGroundingPct: 0 })}
          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All Shocks</span>
        </button>
      </div>

      {/* Intro Note */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 text-xs text-slate-600 dark:text-slate-300">
        <p className="leading-relaxed">
          This simulator models the transmission of aviation input cost shocks (Aviation Turbine Fuel), passenger demand spikes, and supply-side capacity reductions (fleet grounding / engine supply chain snags) directly into the National Airfare Index, the All-India Transport CPI sub-basket, and final Headline CPI.
        </p>
      </div>

      {/* 3 Interactive Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Slider 1: ATF Fuel Price Shock */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              1. ATF Fuel Price Shock
            </span>
            <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
              {simulator.atfShockPct > 0 ? `+${simulator.atfShockPct}%` : `${simulator.atfShockPct}%`}
            </span>
          </div>
          <input
            id="sim-slider-atf"
            type="range"
            min={-20}
            max={50}
            step={5}
            value={simulator.atfShockPct}
            onChange={(e) => setSimulator((prev) => ({ ...prev, atfShockPct: Number(e.target.value) }))}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>-20% (Glut)</span>
            <span>0% Baseline</span>
            <span>+50% (Crude Spike)</span>
          </div>
          <p className="text-xs text-slate-500 leading-snug">
            Aviation Turbine Fuel constitutes ~40% of airline operating costs with a pass-through coefficient of 0.65.
          </p>
        </div>

        {/* Slider 2: Passenger Demand Shift */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              2. Passenger Demand Shift
            </span>
            <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
              {simulator.demandShiftPct > 0 ? `+${simulator.demandShiftPct}%` : `${simulator.demandShiftPct}%`}
            </span>
          </div>
          <input
            id="sim-slider-demand"
            type="range"
            min={-30}
            max={30}
            step={5}
            value={simulator.demandShiftPct}
            onChange={(e) => setSimulator((prev) => ({ ...prev, demandShiftPct: Number(e.target.value) }))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>-30% (Off-Season)</span>
            <span>0% Normal</span>
            <span>+30% (Diwali/Holi Rush)</span>
          </div>
          <p className="text-xs text-slate-500 leading-snug">
            Dynamic yield algorithms steepen fare ladders exponentially once flight booking loads cross 85%.
          </p>
        </div>

        {/* Slider 3: Fleet Grounding / Capacity Reduction */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              3. Fleet Grounding
            </span>
            <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300">
              {simulator.fleetGroundingPct}%
            </span>
          </div>
          <input
            id="sim-slider-capacity"
            type="range"
            min={-40}
            max={0}
            step={5}
            value={simulator.fleetGroundingPct}
            onChange={(e) => setSimulator((prev) => ({ ...prev, fleetGroundingPct: Number(e.target.value) }))}
            className="w-full accent-rose-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>-40% (Supply Squeeze)</span>
            <span>-20%</span>
            <span>0% Full Fleet</span>
          </div>
          <p className="text-xs text-slate-500 leading-snug">
            Simulates engine supply chain inspections or grounded aircraft reducing Available Seat Kilometers (ASK).
          </p>
        </div>
      </div>

      {/* Simulation Dynamic Results Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Output 1: Projected Airfare Index */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">
            Projected National Airfare Index
          </span>
          <div className="font-mono font-black text-3xl text-slate-900 dark:text-white">
            {simulatedLaspeyres.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <span>Baseline: 114.59</span>
            <span className={displayedAirfareShift >= 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
              ({displayedAirfareShift >= 0 ? `+${displayedAirfareShift.toFixed(1)}%` : `${displayedAirfareShift.toFixed(1)}%`})
            </span>
          </div>
        </div>

        {/* Output 2: Transport Subgroup Impact */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">
            Transport Subgroup CPI Impact
          </span>
          <div className="font-mono font-black text-3xl text-amber-600 dark:text-amber-400">
            {simulatedTransportBps >= 0 ? `+${simulatedTransportBps.toFixed(1)}` : simulatedTransportBps.toFixed(1)}{' '}
            <span className="text-base font-bold">bps</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <span>Base: +42.4 bps</span>
            <span className={simulatedTransportBps >= 42.4 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
              ({simulatedTransportBps >= 42.4 ? `+${(simulatedTransportBps - 42.4).toFixed(1)}` : (simulatedTransportBps - 42.4).toFixed(1)} bps shock)
            </span>
          </div>
        </div>

        {/* Output 3: Headline CPI Impact */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">
            Headline CPI Transmission
          </span>
          <div className="font-mono font-black text-3xl text-blue-600 dark:text-blue-400">
            {simulatedHeadlineBps >= 0 ? `+${simulatedHeadlineBps.toFixed(2)}` : simulatedHeadlineBps.toFixed(2)}{' '}
            <span className="text-base font-bold">bps</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <span>Base: +3.64 bps</span>
            <span className={simulatedHeadlineBps >= 3.64 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
              ({simulatedHeadlineBps >= 3.64 ? `+${(simulatedHeadlineBps - 3.64).toFixed(2)}` : (simulatedHeadlineBps - 3.64).toFixed(2)} bps shock)
            </span>
          </div>
        </div>
      </div>

      {/* Policy Advisory Banner */}
      <div className={`p-5 rounded-2xl border ${policyAdvisory.color} space-y-2 shadow-xs`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Regulatory Trigger Assessment: {policyAdvisory.badge}</span>
        </div>
        <p className="text-xs leading-relaxed">
          {policyAdvisory.recommendation}
        </p>
      </div>
    </div>
  );
};
