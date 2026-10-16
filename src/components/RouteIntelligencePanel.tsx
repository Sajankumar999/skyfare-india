import React, { useEffect, useState } from 'react';
import { TOP_MOVING_CORRIDORS } from '../data/mockData';
import { CorridorMovement } from '../types';
import { IndiaCorridorHeatmap } from './IndiaCorridorHeatmap';
import { Layers } from 'lucide-react';
import { apiUrl } from '../config/api';
import { getCachedData, fetchWithCache } from '../services/apiCache';

const CORRIDOR_DISTANCES: Record<string, number> = {
  'DEL-BOM': 1150,
  'BOM-DEL': 1150,
  'DEL-BLR': 1740,
  'BLR-DEL': 1740,
  'BOM-BLR': 840,
  'BLR-BOM': 840,
  'DEL-CCU': 1305,
  'CCU-DEL': 1305,
  'DEL-HYD': 1260,
  'HYD-DEL': 1260,
  'BOM-GOI': 435,
  'MAA-DEL': 1760,
  'DEL-MAA': 1760,
  'CCU-BOM': 1660,
};

const AIRPORT_CITIES: Record<string, string> = {
  DEL: 'Delhi',
  BOM: 'Mumbai',
  BLR: 'Bengaluru',
  CCU: 'Kolkata',
  HYD: 'Hyderabad',
  MAA: 'Chennai',
  GOI: 'Goa',
};

const parseRouteData = (data: unknown, currentCorridors: CorridorMovement[] = TOP_MOVING_CORRIDORS): CorridorMovement[] | null => {
  if (!Array.isArray(data)) return null;

  const liveRoutes = data.filter((route): route is {
    route_code: string;
    current_fare: number;
    baseline_fare: number;
    change_pct: number;
  } => (
    typeof route === 'object' &&
    route !== null &&
    typeof (route as { route_code?: unknown }).route_code === 'string' &&
    Number.isFinite(Number((route as { current_fare?: unknown }).current_fare)) &&
    Number.isFinite(Number((route as { baseline_fare?: unknown }).baseline_fare)) &&
    Number.isFinite(Number((route as { change_pct?: unknown }).change_pct))
  ));

  if (liveRoutes.length === 0) return null;

  return liveRoutes.map((route) => {
    const fallback = currentCorridors.find((corridor) => corridor.routeCode === route.route_code)
      ?? TOP_MOVING_CORRIDORS.find((corridor) => corridor.routeCode === route.route_code);
    const currentFare = Number(route.current_fare);
    const baselineFare = Number(route.baseline_fare);
    const changePct = Number(route.change_pct);
    const rpkWeightPct = Number((route as { rpk_weight_pct?: number }).rpk_weight_pct ?? fallback?.rpkWeightPct ?? 0);
    const cpiContributionBps = Number((route as { cpi_contribution_bps?: number }).cpi_contribution_bps ?? fallback?.cpiContributionBps ?? 0);
    const [origCode, destCode] = route.route_code.split('-');

    return {
      ...(fallback ?? {
        routeCode: route.route_code,
        originCity: AIRPORT_CITIES[origCode] || origCode,
        destCity: AIRPORT_CITIES[destCode] || destCode || '',
        rpkWeightPct,
        cpiContributionBps,
      }),
      originCity: fallback?.originCity || AIRPORT_CITIES[origCode] || origCode,
      destCity: fallback?.destCity || AIRPORT_CITIES[destCode] || destCode || '',
      currentFare,
      baselineFare,
      changePct,
      rpkWeightPct,
      cpiContributionBps,
      status: changePct >= 15 ? 'CRITICAL_SPIKE' : changePct >= 5 ? 'ELEVATED' : changePct < 0 ? 'SOFTENING' : 'NORMAL',
    };
  });
};

export const RouteIntelligencePanel: React.FC = () => {
  const [selectedRouteCode, setSelectedRouteCode] = useState<string>('BOM-DEL');
  const [corridorSort, setCorridorSort] = useState<'change' | 'weight' | 'yield'>('change');
  const [corridors, setCorridors] = useState<CorridorMovement[]>(() => {
    const cached = getCachedData(apiUrl('/api/v1/routes'));
    const parsed = parseRouteData(cached);
    return parsed || TOP_MOVING_CORRIDORS;
  });
  const [isApiConnected, setIsApiConnected] = useState<boolean>(() => {
    return Boolean(getCachedData(apiUrl('/api/v1/routes')));
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadRoutes = async () => {
      try {
        const data = await fetchWithCache<unknown>(apiUrl('/api/v1/routes'), {
          signal: controller.signal,
          ttlMs: 120000,
        });

        const liveCorridors = parseRouteData(data);
        if (!liveCorridors) {
          throw new Error('Routes API returned no valid routes');
        }

        setCorridors(liveCorridors);
        setIsApiConnected(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          setIsApiConnected(false);
        }
      }
    };

    void loadRoutes();
    return () => controller.abort();
  }, []);

  const sortedCorridors = [...corridors].sort((a, b) => {
    if (corridorSort === 'change') return Math.abs(b.changePct) - Math.abs(a.changePct);
    if (corridorSort === 'weight') return b.rpkWeightPct - a.rpkWeightPct;
    const distA = CORRIDOR_DISTANCES[a.routeCode] || 1000;
    const distB = CORRIDOR_DISTANCES[b.routeCode] || 1000;
    return (b.currentFare / distB) - (a.currentFare / distA);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Interactive National Corridor Heatmap with Merged Deep Dive & DGCA Rule 135 Check */}
      <IndiaCorridorHeatmap
        selectedRouteCode={selectedRouteCode}
        corridors={corridors}
        onSelectRouteCode={(routeCode) => setSelectedRouteCode(routeCode)}
        onSelectCorridor={(corridor) => setSelectedRouteCode(corridor.routeCode)}
      />

      {/* 2. Top Moving Corridors Full Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              National Corridor Monitoring Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked list of major domestic city-pairs sorted by price volatility, national RPK weight, or passenger yield (₹/km)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isApiConnected ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live API Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Connecting Route Feeds...
              </span>
            )}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setCorridorSort('change')}
                className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  corridorSort === 'change'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sort by % Change
              </button>
              <button
                onClick={() => setCorridorSort('weight')}
                className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  corridorSort === 'weight'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sort by Weight
              </button>
              <button
                onClick={() => setCorridorSort('yield')}
                className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  corridorSort === 'yield'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sort by Yield (₹/km)
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="pb-3 pr-4">Corridor</th>
                <th className="pb-3 px-3">City Pair</th>
                <th className="pb-3 px-3 text-right">Current Spot Fare</th>
                <th className="pb-3 px-3 text-right" title="Trailing 7-Day Empirical Baseline (Calibrated post-epoch baseline window)">7d Baseline</th>
                <th className="pb-3 px-3 text-right">Relative Shift (%)</th>
                <th className="pb-3 px-3 text-right">RPK Weight (%)</th>
                <th className="pb-3 px-3 text-right">Yield (₹/Seat-Km)</th>
                <th className="pb-3 pl-4 text-center">Rule 135 Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedCorridors.map((c) => {
                const isSelected = c.routeCode === selectedRouteCode;
                const isSpike = c.changePct >= 15;
                const isElevated = c.changePct >= 5 && c.changePct < 15;
                const dist = CORRIDOR_DISTANCES[c.routeCode] || 1000;
                const yieldPerKm = (c.currentFare / dist).toFixed(2);

                return (
                  <tr
                    key={c.routeCode}
                    onClick={() => setSelectedRouteCode(c.routeCode)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 font-semibold'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 pr-4 font-mono font-bold text-slate-900 dark:text-white">
                      {c.routeCode}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                      {c.originCity} → {c.destCity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{c.currentFare.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                      ₹{c.baselineFare.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      <span
                        className={
                          c.changePct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {c.changePct > 0 ? `+${c.changePct}%` : `${c.changePct}%`}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {c.rpkWeightPct}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{yieldPerKm} <span className="text-[10px] text-slate-400 font-normal">/km</span>
                    </td>
                    <td className="py-3.5 pl-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isSpike
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : isElevated
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {isSpike ? 'SURGE BREACH' : isElevated ? 'WATCHLIST' : 'COMPLIANT'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
