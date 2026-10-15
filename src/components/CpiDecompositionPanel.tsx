import React, { useEffect, useState } from 'react';
import { CPI_WATERFALL_DATA, STRESS_MATRIX_DATA, REGIONAL_HUBS_DATA } from '../data/mockData';
import { TrendingUp, TrendingDown, Layers, AlertTriangle, ShieldCheck, MapPin, Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { apiUrl } from '../config/api';

export const CpiDecompositionPanel: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<'waterfall' | 'stress_matrix' | 'regional_hubs'>('waterfall');
  const [waterfallData, setWaterfallData] = useState(CPI_WATERFALL_DATA);
  const [totalTransportBps, setTotalTransportBps] = useState<number>(42.4);
  const [totalHeadlineBps, setTotalHeadlineBps] = useState<number>(3.64);
  const [isApiConnected, setIsApiConnected] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadImpact = async () => {
      try {
        const response = await fetch(apiUrl('/api/v1/analytics/cpi-impact'), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`CPI API responded with ${response.status}`);
        const payload: unknown = await response.json();
        if (
          typeof payload !== 'object' ||
          payload === null ||
          !Array.isArray((payload as { data?: unknown }).data)
        ) throw new Error('Invalid CPI response');
        const liveRows = (payload as { data: unknown[] }).data;
        if (liveRows.length === 0) throw new Error('No CPI observations available');
        setWaterfallData(liveRows.flatMap((row): typeof CPI_WATERFALL_DATA => {
          if (typeof row !== 'object' || row === null) return [];
          const item = row as Record<string, unknown>;
          if (typeof item.corridor_code !== 'string') return [];
          const fallback = CPI_WATERFALL_DATA.find((entry) => entry.corridorCode === item.corridor_code);
          const corridorName = fallback?.corridorName ?? `${item.corridor_code.replace('-', ' ↔ ')} Corridor`;
          return [{
            corridorCode: item.corridor_code,
            corridorName,
            rpkWeightPct: Number(item.rpk_weight_pct),
            inflationContributionPct: Number(item.inflation_contribution_pct),
            transportBps: Number(item.transport_bps),
            headlineBps: Number(item.headline_bps),
            status: item.status === 'CRITICAL' || item.status === 'ELEVATED' || item.status === 'SOFTENING'
              ? item.status
              : (fallback?.status ?? 'ELEVATED'),
          }];
        }));
        if (typeof (payload as { total_transport_bps?: unknown }).total_transport_bps === 'number') {
          setTotalTransportBps(Number((payload as { total_transport_bps: number }).total_transport_bps));
        }
        if (typeof (payload as { total_headline_bps?: unknown }).total_headline_bps === 'number') {
          setTotalHeadlineBps(Number((payload as { total_headline_bps: number }).total_headline_bps));
        }
        setIsApiConnected(true);
      } catch (error) {
        if (!controller.signal.aborted) setIsApiConnected(false);
      }
    };
    void loadImpact();
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Airfare Basket Weight</span>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>
          {isApiConnected && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              LIVE API CONNECTED
            </span>
          )}
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">0.124%</div>
          <div className="text-xs text-slate-500 mt-0.5">Official MoSPI National Consumer Basket weight</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Transport Group Weight</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">6.42%</div>
          <div className="text-xs text-slate-500 mt-0.5">Transport & Communications sub-index (Group V)</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Transport Subgroup Impulse</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {totalTransportBps >= 0 ? `+${totalTransportBps.toFixed(1)}` : totalTransportBps.toFixed(1)} bps
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Direct contribution to Transport Subgroup Index</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Net Headline CPI Impact</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {totalHeadlineBps >= 0 ? `+${totalHeadlineBps.toFixed(2)}` : totalHeadlineBps.toFixed(2)} bps
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Macroeconomic transmission: 0.124% × ΔP_airfare</div>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubView('waterfall')}
            className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'waterfall'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Corridor Inflation Waterfall</span>
          </button>

          <button
            onClick={() => setActiveSubView('stress_matrix')}
            className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'stress_matrix'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Transmission Stress Matrix (-20% to +30%)</span>
          </button>

          <button
            onClick={() => setActiveSubView('regional_hubs')}
            className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'regional_hubs'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Regional Hub Disaggregation</span>
          </button>
        </div>
      </div>

      {/* Sub-View 1: Corridor Inflation Waterfall */}
      {activeSubView === 'waterfall' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Corridor-Level CPI Transmission Waterfall
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Disaggregating how specific city-pairs contribute to total airfare inflation and transmit basis points (bps) to the Ministry’s indices
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="pb-3 pr-4">Route Corridor</th>
                  <th className="pb-3 px-3">Corridor Name</th>
                  <th className="pb-3 px-3 text-right">RPK Weight (%)</th>
                  <th className="pb-3 px-3 text-right">Inflation Share (%)</th>
                  <th className="pb-3 px-3 text-right">Transport Impact (bps)</th>
                  <th className="pb-3 px-3 text-right">Headline Impact (bps)</th>
                  <th className="pb-3 pl-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {waterfallData.map((row) => (
                  <tr key={row.corridorCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 pr-4 font-mono font-bold text-slate-900 dark:text-white">
                      {row.corridorCode}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                      {row.corridorName}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {row.rpkWeightPct}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      <span
                        className={
                          row.inflationContributionPct > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {row.inflationContributionPct > 0
                          ? `+${row.inflationContributionPct}%`
                          : `${row.inflationContributionPct}%`}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      <span className={row.transportBps > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {row.transportBps > 0 ? `+${row.transportBps}` : row.transportBps} bps
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {row.headlineBps > 0 ? `+${row.headlineBps}` : row.headlineBps} bps
                    </td>
                    <td className="py-3.5 pl-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : row.status === 'ELEVATED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 dark:border-slate-700 font-bold bg-slate-50/70 dark:bg-slate-800/50">
                  <td className="py-3.5 pr-4 text-slate-900 dark:text-white" colSpan={2}>
                    Total National Basket Aggregation
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono">100.0%</td>
                  <td className="py-3.5 px-3 text-right font-mono text-rose-600">+100.0%</td>
                  <td className="py-3.5 px-3 text-right font-mono text-amber-600">+42.4 bps</td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-900 dark:text-white">+3.64 bps</td>
                  <td className="py-3.5 pl-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                      SYNTHESIZED
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Sub-View 2: Transmission Stress Matrix */}
      {activeSubView === 'stress_matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-600" />
              Airfare Shock & Macroeconomic Transmission Stress Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulating headline CPI and Transport basket sensitivities across hypothetical ±30% airfare shifts
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="pb-3 pr-4">Scenario</th>
                  <th className="pb-3 px-3 text-right">Airfare Shift (%)</th>
                  <th className="pb-3 px-3 text-right">Transport CPI (bps)</th>
                  <th className="pb-3 px-3 text-right">Headline CPI (bps)</th>
                  <th className="pb-3 px-3 text-center">RBI Band Status</th>
                  <th className="pb-3 pl-4">DGCA Statutory Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {STRESS_MATRIX_DATA.map((row) => {
                  const isCurrent = row.airfareSwingPct === 0;
                  return (
                    <tr
                      key={row.scenario}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                        isCurrent ? 'bg-blue-50/50 dark:bg-blue-950/30 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                          <span className="font-bold text-slate-900 dark:text-white">{row.scenario}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold">
                        <span
                          className={
                            row.airfareSwingPct > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : row.airfareSwingPct < 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }
                        >
                          {row.airfareSwingPct > 0 ? `+${row.airfareSwingPct}%` : `${row.airfareSwingPct}%`}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold">
                        <span className={row.transportBps > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {row.transportBps > 0 ? `+${row.transportBps}` : row.transportBps} bps
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {row.headlineBps > 0 ? `+${row.headlineBps}` : row.headlineBps} bps
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            row.rbiStatus === 'Breach Risk'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : row.rbiStatus === 'Target Alert'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {row.rbiStatus}
                        </span>
                      </td>

                      <td className="py-3.5 pl-4 text-slate-600 dark:text-slate-300 text-[11px]">
                        {row.dgcaAction}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-View 3: Regional Hub Disaggregation */}
      {activeSubView === 'regional_hubs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Regional Hub Airfare Disaggregation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cluster-level indices, trunk departures, and discount/premium variances relative to the national baseline
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REGIONAL_HUBS_DATA.map((hub) => {
                const isPremium = hub.discountVsNationalPct > 0;
                return (
                  <div
                    key={hub.hubCode}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{hub.hubName}</h4>
                        <span className="text-[10px] text-slate-500 block">{hub.region}</span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          hub.status === 'Surging'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : hub.status === 'Elevated'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {hub.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Hub Airfare Index</span>
                        <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                          {hub.indexValue.toFixed(2)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">vs National Baseline</span>
                        <span
                          className={`font-mono font-bold text-sm flex items-center gap-0.5 ${
                            isPremium ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isPremium ? `+${hub.discountVsNationalPct}% Premium` : `${hub.discountVsNationalPct}% Discount`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 font-mono">
                      <span>{hub.trunkRoutesCount} trunk routes</span>
                      <span>{hub.dailyDepartures} daily departures</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
