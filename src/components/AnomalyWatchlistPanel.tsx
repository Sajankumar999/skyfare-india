import React, { useEffect, useState } from 'react';
import { ANOMALY_WATCHLIST_DATA } from '../data/mockData';
import { ShieldAlert, AlertTriangle, ArrowUpRight, Filter, Hash, Eye, Scale, Sparkles } from 'lucide-react';
import { apiUrl } from '../config/api';

export const AnomalyWatchlistPanel: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE'>('ALL');
  const [viewFormat, setViewFormat] = useState<'cards' | 'table'>('cards');
  const [surveillanceMode, setSurveillanceMode] = useState<'STANDARD' | 'FESTIVE_PEAK'>('STANDARD');
  const [anomalies, setAnomalies] = useState(ANOMALY_WATCHLIST_DATA);
  const [scannedQuotes, setScannedQuotes] = useState<number>(35261);
  const [conformingQuotes, setConformingQuotes] = useState<number>(33215);
  const [quarantinedQuotes, setQuarantinedQuotes] = useState<number>(2046);
  const [compliancePct, setCompliancePct] = useState<number>(94.2);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAnomalies = async () => {
      try {
        const response = await fetch(apiUrl(`/api/v1/analytics/anomalies?mode=${surveillanceMode}`), {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Anomalies API responded with ${response.status}`);
        }
        const payload = await response.json();
        if (payload && Array.isArray(payload.anomalies)) {
          setAnomalies(payload.anomalies);
          if (typeof payload.scanned_quotes === 'number') {
            setScannedQuotes(payload.scanned_quotes);
          }
          if (typeof payload.conforming_quotes === 'number') {
            setConformingQuotes(payload.conforming_quotes);
          }
          if (typeof payload.quarantined_quotes === 'number') {
            setQuarantinedQuotes(payload.quarantined_quotes);
          }
          if (typeof payload.compliance_pct === 'number') {
            setCompliancePct(payload.compliance_pct);
          }
          setIsApiConnected(true);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setIsApiConnected(false);
        }
      }
    };

    void fetchAnomalies();
    return () => controller.abort();
  }, [surveillanceMode]);

  const filteredAnomalies = anomalies.filter((a) => {
    if (severityFilter === 'ALL') return true;
    return a.severity === severityFilter;
  });

  const criticalCount = anomalies.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = anomalies.filter((a) => a.severity === 'HIGH').length;
  const moderateCount = anomalies.filter((a) => a.severity === 'MODERATE').length;

  return (
    <div className="w-full overflow-x-hidden space-y-6 animate-fadeIn pb-12">
      {/* Statutory Tariff Compliance Ribbon & Mode Switcher */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-indigo-900/10 via-blue-900/10 to-slate-900/5 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-slate-900/30 border border-indigo-200/80 dark:border-indigo-900/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-md shadow-indigo-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                DGCA Rule 135(1) Tariff Band Compliance
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {compliancePct}% COMPLIANT
              </span>
              {isApiConnected && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  LIVE API CONNECTED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {conformingQuotes.toLocaleString('en-IN')} of {scannedQuotes.toLocaleString('en-IN')} daily quotes conform to published tariff tranches. {isApiConnected ? `${quarantinedQuotes.toLocaleString('en-IN')} flagged under econometric outlier/surge audit.` : '5.8% flagged under algorithmic surge audit.'}
            </p>
          </div>
        </div>

        {/* Surveillance Mode Switcher */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setSurveillanceMode('STANDARD')}
            className={`min-h-[34px] px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              surveillanceMode === 'STANDARD'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Standard Baseline
          </button>
          <button
            type="button"
            onClick={() => setSurveillanceMode('FESTIVE_PEAK')}
            className={`min-h-[34px] px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              surveillanceMode === 'FESTIVE_PEAK'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            <span>Festive Surge Watch</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </button>
        </div>
      </div>

      {surveillanceMode === 'FESTIVE_PEAK' && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Festive Surge Mode Active:</strong> Monitoring holiday surge multipliers (Diwali & Festive demand rush). High risk corridors under active capping surveillance: DEL-CCU, BOM-GOI, BLR-DEL, HYD-DEL, MAA-DEL.
          </span>
        </div>
      )}

      {/* Overview Stat Strip with flex-wrap and responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Active Flags</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {anomalies.length} Irregularities
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Scanned across {scannedQuotes.toLocaleString('en-IN')} daily quotes
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Critical Breaches</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {criticalCount} Critical
          </div>
          <div className="text-xs text-rose-700 dark:text-rose-400 mt-0.5 font-semibold">
            {surveillanceMode === 'FESTIVE_PEAK' ? '>15% Festive Cap Breach' : '>25% Statistical Ceiling Breach'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">High Surveillance</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {highCount} Routes
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 font-medium">
            {surveillanceMode === 'FESTIVE_PEAK' ? '5% - 15% Festive Surcharge' : '15% - 25% Above Baseline'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Moderate Alerts</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {moderateCount} Routes
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {surveillanceMode === 'FESTIVE_PEAK' ? '0.5% - 5% Early Holiday Surge' : '5% - 15% Early Surge Warning'}
          </div>
        </div>
      </div>

      {/* Main Watchlist Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4 w-full">
        {/* Header with flex-wrap and responsive controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Irregularities Detection and Watchlist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated econometric surveillance flagging fare-ladder gouging and abnormal surges across Indian corridors
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Format Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewFormat('cards')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewFormat === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewFormat('table')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewFormat === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Table
              </button>
            </div>

            {/* Severity Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`min-h-[32px] px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    severityFilter === sev
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sev === 'ALL' ? 'All' : sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card View */}
        {viewFormat === 'cards' && (
          <div className="space-y-3 w-full">
            {filteredAnomalies.map((anom) => {
              const isCritical = anom.severity === 'CRITICAL';
              const isHigh = anom.severity === 'HIGH';

              return (
                <div
                  key={anom.id}
                  className={`p-4 rounded-xl border transition-all space-y-2.5 w-full ${
                    isCritical
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      : isHigh
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {anom.corridorCode}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Ref: {anom.id}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {anom.severity} SEVERITY
                      </span>
                      {(anom.id.startsWith('ano-quar-') || anom.ruleCitation.includes('QUARANTINE')) && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          QUARANTINED OUTLIER (BLOCKED)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                      <span className="text-slate-500">
                        Confidence: <strong className="text-slate-900 dark:text-white">{anom.confidenceScore}%</strong>
                      </span>
                      <span className="text-slate-400">{anom.timestamp}</span>
                    </div>
                  </div>

                  {/* Price Matrix Comparison */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Observed Fare</span>
                      <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                        ₹{anom.observedFare.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Expected Model Ceiling</span>
                      <span className="font-mono font-semibold text-sm text-slate-700 dark:text-slate-300">
                        ₹{anom.expectedCeiling.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Statistical Deviation</span>
                      <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {anom.deviationPct >= 0 ? `+${anom.deviationPct.toFixed(1)}%` : `${anom.deviationPct.toFixed(1)}%`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Merkle Root Hash</span>
                      <span className="font-mono text-[11px] text-slate-500 truncate block">
                        {anom.merkleAnomalyId}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 pt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                    <span>
                      <strong>Statutory Detection:</strong> {anom.ruleCitation}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table View with Horizontal Scroll Container */}
        {viewFormat === 'table' && (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="pb-3 pr-4">Corridor</th>
                  <th className="pb-3 px-3">Severity</th>
                  <th className="pb-3 px-3 text-right">Observed Fare</th>
                  <th className="pb-3 px-3 text-right">Expected Ceiling</th>
                  <th className="pb-3 px-3 text-right">Deviation</th>
                  <th className="pb-3 px-3 text-right">Confidence</th>
                  <th className="pb-3 pl-4">Statutory Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAnomalies.map((anom) => (
                  <tr key={anom.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-4 font-mono font-bold text-slate-900 dark:text-white">
                      {anom.corridorCode}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            anom.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : anom.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {anom.severity}
                        </span>
                        {(anom.id.startsWith('ano-quar-') || anom.ruleCitation.includes('QUARANTINE')) && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            BLOCKED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      ₹{anom.observedFare.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      ₹{anom.expectedCeiling.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {anom.deviationPct >= 0 ? `+${anom.deviationPct.toFixed(1)}%` : `${anom.deviationPct.toFixed(1)}%`}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {anom.confidenceScore}%
                    </td>
                    <td className="py-3 pl-4 text-slate-500 text-[11px] truncate max-w-xs">
                      {anom.ruleCitation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
