import React, { useEffect, useState } from 'react';
import { CARRIER_ANALYTICS_DATA, CHANNEL_HEALTH_DATA } from '../data/mockData';
import { Users, Wifi, Activity, ShieldCheck, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiUrl } from '../config/api';

export const CarrierAnalyticsPanel: React.FC = () => {
  const [filterModel, setFilterModel] = useState<'ALL' | 'LCC' | 'FSC'>('ALL');
  const [carriers, setCarriers] = useState(CARRIER_ANALYTICS_DATA);
  const [channels, setChannels] = useState(CHANNEL_HEALTH_DATA);
  const [totalQuotesCount, setTotalQuotesCount] = useState<number>(() =>
    CARRIER_ANALYTICS_DATA.reduce((acc, c) => acc + c.quotesIngested, 0)
  );
  const [totalFleetCount, setTotalFleetCount] = useState<number>(() =>
    CARRIER_ANALYTICS_DATA.reduce((acc, c) => acc + c.fleetActive, 0)
  );
  const [hhiValue, setHhiValue] = useState<number>(4680);
  const [verificationRate, setVerificationRate] = useState<number>(100.0);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCarrierData = async () => {
      try {
        const response = await fetch(apiUrl('/api/v1/analytics/carriers'), {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Carrier analytics API responded with ${response.status}`);
        }
        const payload = await response.json();
        if (
          payload &&
          Array.isArray(payload.carriers) &&
          payload.carriers.length > 0
        ) {
          setCarriers(payload.carriers);
          if (Array.isArray(payload.channels) && payload.channels.length > 0) {
            setChannels(payload.channels);
          }
          if (typeof payload.total_quotes === 'number') {
            setTotalQuotesCount(payload.total_quotes);
          }
          if (typeof payload.total_fleet === 'number') {
            setTotalFleetCount(payload.total_fleet);
          }
          if (typeof payload.hhi === 'number') {
            setHhiValue(payload.hhi);
          }
          if (typeof payload.verification_rate_pct === 'number') {
            setVerificationRate(payload.verification_rate_pct);
          }
          setIsApiConnected(true);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setIsApiConnected(false);
        }
      }
    };

    void fetchCarrierData();
    return () => controller.abort();
  }, []);

  const domesticCarriers = carriers.filter((c) =>
    ['6E', 'AI', 'QP', 'IX', 'SG'].includes(c.iataCode) ||
    ['IndiGo', 'Air India', 'Akasa Air', 'Air India Express', 'SpiceJet'].includes(c.carrier)
  );

  const filteredCarriers = domesticCarriers.filter((c) => {
    if (filterModel === 'ALL') return true;
    return c.category === filterModel;
  });

  const totalQuotes = domesticCarriers.reduce((acc, c) => acc + c.quotesIngested, 0);
  const totalFleet = domesticCarriers.reduce((acc, c) => acc + c.fleetActive, 0);
  const lccCount = domesticCarriers.filter((c) => c.category === 'LCC').length;
  const fscCount = domesticCarriers.filter((c) => c.category === 'FSC').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Reporting Carriers</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {domesticCarriers.length} Airlines
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {lccCount} LCCs • {fscCount} FSC Network Carrier{fscCount !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Ingested Daily Quotes</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalQuotes.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium flex items-center gap-1.5">
            <span>{verificationRate}% verification rate</span>
            {isApiConnected && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                LIVE
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Monitored Fleet</span>
            <Wifi className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalFleet} Aircraft</div>
          <div className="text-xs text-slate-500 mt-0.5">Active commercial scheduled capacity</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">HHI Market Concentration</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {hhiValue.toLocaleString('en-IN')} HHI
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
            High market concentration (IndiGo &gt;60%)
          </div>
        </div>
      </div>

      {/* Carrier Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Airfare by Airlines & Market Intelligence
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparative tariff trajectory, market share weighting, and volatility across Indian domestic carriers
            </p>
          </div>

          {/* Model Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {(['ALL', 'LCC', 'FSC'] as const).map((model) => (
              <button
                key={model}
                onClick={() => setFilterModel(model)}
                className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterModel === model
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {model === 'ALL' ? 'All Airlines' : model}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="pb-3 pr-4">Carrier</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3 text-right">Avg Fare</th>
                <th className="pb-3 px-3 text-right">30-Day % Change</th>
                <th className="pb-3 px-3 text-right">Market Share</th>
                <th className="pb-3 px-3 text-right">Quotes Ingested</th>
                <th className="pb-3 px-3 text-right">Volatility Index</th>
                <th className="pb-3 pl-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCarriers.map((carrier) => {
                const isRising = carrier.changePct30d > 0;
                return (
                  <tr
                    key={carrier.iataCode}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold font-mono text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {carrier.iataCode}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{carrier.carrier}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Fleet: {carrier.fleetActive} aircraft
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          carrier.category === 'LCC'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                        }`}
                      >
                        {carrier.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{carrier.avgFare.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isRising
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isRising ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isRising ? `+${carrier.changePct30d}%` : `${carrier.changePct30d}%`}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {carrier.marketSharePct}%
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, carrier.marketSharePct * 1.5)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {carrier.quotesIngested.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {carrier.volatilityIndex}/100
                      </span>
                    </td>

                    <td className="py-3.5 pl-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          carrier.statusBadge === 'Rising'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {carrier.statusBadge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Channel Health Status Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-500" />
              Channel Ingestion Health (Direct Airline Portals vs. OTAs)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live quote ingestion volume, latency SLAs, and synchronization health across primary distribution channels
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {channels.filter((c) => c.status === 'OPTIMAL' || c.status === 'ACTIVE').length}/{channels.length} Connectors Healthy
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {channels.map((ch) => (
            <div
              key={ch.name}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">{ch.name}</h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{ch.type}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    ch.status === 'OPTIMAL'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {ch.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 block">Quotes</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {ch.quotesCount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Latency</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{ch.latencyMs}ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Uptime</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{ch.uptimePct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
                <span>Last payload sync</span>
                <span>{ch.lastSync}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
