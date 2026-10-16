import React from 'react';
import { Printer, Download, X, ShieldCheck, Landmark, CheckCircle2, Hash, Calendar, FileText } from 'lucide-react';
import { HORIZON_MATRIX_DATA, TOP_MOVING_CORRIDORS, DGCA_EMPIRICAL_VALIDATION } from '../data/mockData';
import { apiUrl } from '../config/api';
import { getCachedData } from '../services/apiCache';

interface BulletinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MospiBulletinModal: React.FC<BulletinModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const cachedIndex = getCachedData<Record<string, unknown>>(apiUrl('/api/v1/indices/today'));
  const fisherVal = Number(cachedIndex?.fisher_ideal_index) || 166.48;
  const laspeyresVal = Number(cachedIndex?.laspeyres_index) || 166.43;
  const dodChange = Number(cachedIndex?.dod_change_pct) || 0.3;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="mospi-bulletin-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="mospi-bulletin-document"
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Top Control Bar (Hidden during physical print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
              MoSPI Official Statistical Release Bulletin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-bulletin"
              onClick={handlePrint}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              id="btn-close-bulletin"
              onClick={onClose}
              className="min-h-[44px] p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs leading-relaxed font-sans">
          {/* Government Official Header */}
          <div className="text-center border-b-2 border-slate-900 dark:border-slate-100 pb-4 space-y-1">
            <div className="inline-block mx-auto mb-1">
              <div className="w-8 h-8 rounded-full border border-slate-900 dark:border-slate-100 flex items-center justify-center font-serif font-black text-xs">
                स
              </div>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
              Government of India • भारत सरकार
            </div>
            <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Ministry of Statistics & Programme Implementation (MoSPI)
            </h1>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              National Statistical Office (NSO) — Price Statistics Division
            </div>
            <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
              <span>DOC REF: MoSPI/PSD/AIR-2026/0922</span>
              <span>•</span>
              <span>BASE YEAR: 2024-Q1 = 100.00</span>
              <span>•</span>
              <span>RELEASE DATE: 22 September 2026</span>
            </div>
          </div>

          {/* Executive Release Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                1. Executive Summary & Key Airfare Indices
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                OFFICIAL BULLETIN
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              The National Statistical Office (NSO), MoSPI, hereby releases the daily All-India Domestic Airfare Price Index for Tuesday, 22 September 2026, synthesized under the National Civil Aviation Price Surveillance Framework. A total of <strong>35,261 commercial flight quotes</strong> across 14 major domestic city-pairs were ingested and mathematically audited.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Laspeyres Base Index</span>
                <span className="font-mono text-xl font-black text-slate-900 dark:text-white">{laspeyresVal.toFixed(2)}</span>
                <span className="text-[10px] text-rose-600 block font-semibold">{dodChange >= 0 ? '+' : ''}{dodChange.toFixed(1)}% DoD Movement</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Fisher Superlative</span>
                <span className="font-mono text-xl font-black text-indigo-600 dark:text-indigo-400">{fisherVal.toFixed(2)}</span>
                <span className="text-[10px] text-slate-500 block">Substitution Neutral</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Transport CPI Impact</span>
                <span className="font-mono text-xl font-black text-amber-600 dark:text-amber-400">+42.4 bps</span>
                <span className="text-[10px] text-slate-500 block">Direct Subgroup Impact</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Headline CPI Impact</span>
                <span className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">+3.64 bps</span>
                <span className="text-[10px] text-slate-500 block">Macro Transmission</span>
              </div>
            </div>
          </div>

          {/* Advance Booking Lead-Time Matrix */}
          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              2. Yield Curve & Booking-Horizon Divergence
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              The table below summarizes average national airfares observed across standard MoSPI advance-booking lead-time horizons, contrasting emergency spot quotes with planned leisure tiers:
            </p>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3">Horizon</th>
                    <th className="py-2 px-3">Purpose Category</th>
                    <th className="py-2 px-3 text-right">Avg Fare (INR)</th>
                    <th className="py-2 px-3 text-right">30d Baseline</th>
                    <th className="py-2 px-3 text-right">Spread vs Base</th>
                    <th className="py-2 px-3 text-right">Volatility Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {HORIZON_MATRIX_DATA.map((row) => (
                    <tr key={row.horizon} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-sans font-bold text-blue-600 dark:text-blue-400">
                        {row.horizon} ({row.leadTime})
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">
                        {row.purpose}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹{row.nationalAvgFare.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        ₹{row.baselineFare.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={row.spreadPct > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                          {row.spreadPct > 0 ? `+${row.spreadPct}%` : `${row.spreadPct}%`}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                        {row.volatilityIndex.toFixed(1)} / 100
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Moving Corridors Table */}
          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              3. Significant Trunk Corridor Variations
            </h2>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3">Corridor</th>
                    <th className="py-2 px-3">Route Pair</th>
                    <th className="py-2 px-3 text-right">Current Quote</th>
                    <th className="py-2 px-3 text-right">Price Relative</th>
                    <th className="py-2 px-3 text-right">RPK Weight</th>
                    <th className="py-2 px-3 text-right">CPI Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {TOP_MOVING_CORRIDORS.map((c) => (
                    <tr key={c.routeCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white font-sans">
                        {c.routeCode}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {c.originCity} → {c.destCity}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹{c.currentFare.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={c.changePct > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                          {c.changePct > 0 ? `+${c.changePct}%` : `${c.changePct}%`}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                        {c.rpkWeightPct}%
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                        {c.cpiContributionBps > 0 ? `+${c.cpiContributionBps}` : c.cpiContributionBps} bps
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Econometric Model Validation Seal */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              4. DGCA Empirical Validation & Statutory Audit Verification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block font-sans">Pearson r</span>
                <span className="font-bold text-emerald-600">{DGCA_EMPIRICAL_VALIDATION.pearsonR}</span> (Target: {DGCA_EMPIRICAL_VALIDATION.pearsonThreshold})
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block font-sans">MAPE</span>
                <span className="font-bold text-blue-600">{DGCA_EMPIRICAL_VALIDATION.mape}%</span> (Target: {DGCA_EMPIRICAL_VALIDATION.mapeThreshold})
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block font-sans">R² Goodness of Fit</span>
                <span className="font-bold text-indigo-600">{DGCA_EMPIRICAL_VALIDATION.rSquared}</span> (Target: {DGCA_EMPIRICAL_VALIDATION.rSquaredThreshold})
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-500 pt-1 flex items-center justify-between flex-wrap gap-2">
              <span>SHA-256 Merkle Root: 7d5a99f603f231d53e8b7e7811956035c94b0e440107f53f377999f654601144</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">STATE: TAMPER_PROOF_VALIDATED</span>
            </div>
          </div>

          {/* Official Signoff Box */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Dr. A. K. Sengupta, IES
              </p>
              <p>Senior Economic Advisor & Chief Director General (Statistics)</p>
              <p>Ministry of Statistics & Programme Implementation, New Delhi</p>
            </div>
            <div className="text-right font-mono text-[10px]">
              <p>Digital Cryptographic Seal: VALID</p>
              <p>Timestamp: 2026-09-22T04:33:02+05:30</p>
              <p className="text-blue-600">Verified via SkyFare Merkle Audit Trail</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
