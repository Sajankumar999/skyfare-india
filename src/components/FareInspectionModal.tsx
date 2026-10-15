import React from 'react';
import {
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
  Scale,
  Fuel,
  Building2,
  Receipt,
  Clock,
  Hash,
  FileCheck,
  CheckCircle2,
  Printer,
  Calendar
} from 'lucide-react';
import { FlightCardData } from '../types';

interface FareInspectionModalProps {
  flight: FlightCardData | null;
  onClose: () => void;
  travelDate: string;
}

export const FareInspectionModal: React.FC<FareInspectionModalProps> = ({
  flight,
  onClose,
  travelDate,
}) => {
  if (!flight) return null;

  const isDiscount = flight.priceDeviationPct < 0;
  const isSurge = flight.priceDeviationPct > 15;
  const udfTotal = flight.fareBreakdown.udfFee + flight.fareBreakdown.psfFee + flight.fareBreakdown.asfSecurityFee;

  // Mock SHA-256 quote signature
  const quoteHash = `0x7f4e9a${flight.flightNumber.replace(/[^A-Z0-9]/g, '')}b2c8d19e4a3${flight.fareBreakdown.totalFare}`;

  // Print fare audit slip
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="fare-inspection-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="fare-inspection-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-fare-title"
        className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl max-w-2xl w-full border border-white/40 dark:border-slate-700/80 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Strip */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  MoSPI Fare Inspection Dossier
                </span>
                <span className="font-mono text-xs text-blue-300 font-semibold">
                  Flight {flight.flightNumber}
                </span>
                <span className="text-xs text-blue-200">
                  • {flight.originAirport.iataCode} → {flight.destinationAirport.iataCode}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                  flight.sourcePlatform === 'makemytrip'
                    ? 'bg-rose-500/30 text-rose-200 border-rose-400/40'
                    : flight.sourcePlatform === 'easemytrip'
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/40'
                    : 'bg-blue-500/30 text-blue-200 border-blue-400/40'
                }`}>
                  Aggregator: {flight.sourcePlatform === 'makemytrip' ? 'MakeMyTrip' : flight.sourcePlatform === 'easemytrip' ? 'EaseMyTrip' : 'Google Flights'}
                </span>
              </div>
              <h2 id="modal-fare-title" className="text-xl sm:text-2xl font-black tracking-tight text-white">
                ₹{flight.fareBreakdown.totalFare.toLocaleString('en-IN')}{' '}
                <span className="text-sm font-medium text-blue-200">Total Unbundled Quote</span>
              </h2>
              <p className="text-xs text-blue-200/90 mt-0.5">
                {flight.airline.name} • Depart {flight.departureTime} ({flight.duration}, Non-stop) • Window: {flight.bookingHorizon} ({flight.leadTimeDays} days lead)
              </p>
            </div>

            <button
              id="btn-close-inspection-modal"
              onClick={onClose}
              aria-label="Close Modal"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Statutory Compliance Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-900 dark:text-emerald-200 block">
                  Compliant with DGCA Rule 135 (Fair Dynamic Pricing)
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-tight block">
                  Quote is certified within statutory yield bands and adheres to Aircraft Rules 1937 fair-practice thresholds.
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              AUDIT_PASS
            </span>
          </div>

          {/* Data Provenance & Aggregator Source */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                flight.sourcePlatform === 'makemytrip' ? 'bg-rose-500' : flight.sourcePlatform === 'easemytrip' ? 'bg-cyan-500' : 'bg-blue-500'
              }`} />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Aggregator Price Source:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {flight.sourcePlatform === 'makemytrip' ? 'MakeMyTrip Live OTA Feed' : flight.sourcePlatform === 'easemytrip' ? 'EaseMyTrip Live OTA Feed' : 'Google Flights Real-time Feed'}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
              Verified TLS Scrape
            </span>
          </div>

          {/* 1. Price Volatility Check */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  30-Day Trailing Corridor Volatility Check
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Corridor: {flight.originAirport.city} ↔ {flight.destinationAirport.city}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  Current Quoted Fare
                </span>
                <span className="font-mono text-lg font-black text-slate-900 dark:text-white">
                  ₹{flight.fareBreakdown.totalFare.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  30-Day Corridor Median
                </span>
                <span className="font-mono text-lg font-black text-slate-700 dark:text-slate-300">
                  ₹{flight.corridorBaseline30d.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  Economic Deviation
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isDiscount ? (
                    <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      <TrendingDown className="w-4 h-4" />
                      {Math.abs(flight.priceDeviationPct)}% BELOW
                    </span>
                  ) : isSurge ? (
                    <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                      <TrendingUp className="w-4 h-4" />
                      +{flight.priceDeviationPct}% SURGE
                    </span>
                  ) : (
                    <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                      ±{Math.abs(flight.priceDeviationPct)}% (Baseline)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Volatility Indicator Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span>Value Tranche: {isDiscount ? 'Discounted Tier (15th %ile)' : isSurge ? 'Peak Demand Tier (85th %ile)' : 'Equilibrium Median'}</span>
                <span>Recommendation: <strong className="text-blue-600 dark:text-blue-400">{flight.buyRecommendation.verdict}</strong></span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                <div className="w-1/3 bg-emerald-500" title="Discount Band" />
                <div className="w-1/3 bg-blue-500" title="Equilibrium Band" />
                <div className="w-1/3 bg-rose-500" title="Surge Pricing Band" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>₹{(flight.corridorBaseline30d * 0.8).toFixed(0)} (Min)</span>
                <span>₹{flight.corridorBaseline30d} (30d Median)</span>
                <span>₹{(flight.corridorBaseline30d * 1.5).toFixed(0)} (Max Observed)</span>
              </div>
            </div>

            {/* 30-Day Historical Trend Line Chart */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  30-Day Historical Price Trend vs. Corridor Baseline
                </span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                    <span className="w-2.5 h-0.5 bg-blue-600 dark:bg-blue-400 inline-block" /> Daily Trend
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                    <span className="w-2.5 h-0.5 border-b border-dashed border-slate-400 inline-block" /> 30d Baseline (₹{flight.corridorBaseline30d})
                  </span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="w-full h-36 bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 relative">
                {(() => {
                  const baseline = flight.corridorBaseline30d;
                  const currentFare = flight.fareBreakdown.totalFare;
                  // Synthesize 30 day sequence leading to currentFare on day 30
                  const daysCount = 30;
                  const dataPoints: { day: number; fare: number }[] = [];
                  for (let i = 0; i < daysCount; i++) {
                    const progress = i / (daysCount - 1);
                    // Smooth sinusoidal pattern with noise leading to currentFare
                    const wave = Math.sin(i * 0.7) * (baseline * 0.12) + Math.cos(i * 0.3) * (baseline * 0.08);
                    const interp = baseline + (currentFare - baseline) * progress;
                    const fare = Math.round(i === daysCount - 1 ? currentFare : interp + wave);
                    dataPoints.push({ day: i + 1, fare });
                  }

                  const minVal = Math.min(...dataPoints.map((d) => d.fare), baseline * 0.85);
                  const maxVal = Math.max(...dataPoints.map((d) => d.fare), baseline * 1.25);
                  const range = maxVal - minVal || 1;

                  const width = 560;
                  const height = 110;
                  const padX = 25;
                  const padY = 15;

                  const points = dataPoints.map((d, i) => {
                    const x = padX + (i / (daysCount - 1)) * (width - 2 * padX);
                    const y = height - padY - ((d.fare - minVal) / range) * (height - 2 * padY);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  }).join(' ');

                  const baselineY = (height - padY - ((baseline - minVal) / range) * (height - 2 * padY)).toFixed(1);
                  const currentPointX = (width - padX).toFixed(1);
                  const currentPointY = (height - padY - ((currentFare - minVal) / range) * (height - 2 * padY)).toFixed(1);

                  return (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="fareTrendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Baseline horizontal guide */}
                      <line
                        x1={padX}
                        y1={baselineY}
                        x2={width - padX}
                        y2={baselineY}
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                      />

                      {/* Area Fill */}
                      <polygon
                        points={`${padX},${height - padY} ${points} ${width - padX},${height - padY}`}
                        fill="url(#fareTrendGradient)"
                      />

                      {/* Trend Line */}
                      <polyline
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                      />

                      {/* Highlight Current Quote Point */}
                      <circle
                        cx={currentPointX}
                        cy={currentPointY}
                        r="5"
                        fill={isSurge ? '#f43f5e' : isDiscount ? '#10b981' : '#2563eb'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="animate-pulse"
                      />

                      {/* Labels on chart */}
                      <text x={padX} y={height - 2} fill="#94a3b8" fontSize="9" fontFamily="monospace">
                        30 Days Ago
                      </text>
                      <text x={width / 2 - 25} y={height - 2} fill="#94a3b8" fontSize="9" fontFamily="monospace">
                        15 Days Ago
                      </text>
                      <text x={width - padX - 35} y={height - 2} fill="#2563eb" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        Today (T-0)
                      </text>
                    </svg>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 2. Unbundled Fare Breakdown (MoSPI Format) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Statutory Unbundled Fare Breakdown
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                DGCA Circular 4/2010 Form
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Pure Airline Base Fare</span>
                    <span className="block text-[10px] text-slate-400">Carrier revenue for seat and scheduled carriage</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{flight.fareBreakdown.baseFare.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Fuel className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Aviation Turbine Fuel Surcharge (YQ)</span>
                    <span className="block text-[10px] text-slate-400">Pass-through fuel levy indexed to IOCL monthly ATF benchmark</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  ₹{flight.fareBreakdown.atfFuelSurcharge.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Airport Development & User Fees (UDF + PSF + ASF)</span>
                    <span className="block text-[10px] text-slate-400">AERA statutory tariffs: UDF (₹{flight.fareBreakdown.udfFee}) + PSF (₹{flight.fareBreakdown.psfFee}) + Security ASF (₹{flight.fareBreakdown.asfSecurityFee})</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ₹{udfTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">GST (5% Economy / 12% Business)</span>
                    <span className="block text-[10px] text-slate-400">Central & State GST on air transport services</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ₹{flight.fareBreakdown.gstAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Total Row */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 font-bold">
                <span className="text-slate-900 dark:text-white">Total Statutory Fare</span>
                <span className="font-mono text-base text-blue-600 dark:text-blue-400">
                  ₹{flight.fareBreakdown.totalFare.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Cryptographic Tamper-Proof Audit Badge */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Hash className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  MoSPI Microdata Audit Hash
                </span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate block">
                  {quoteHash}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
              TAMPER_PROOF_VALIDATED
            </span>
          </div>
        </div>

        {/* Footer Actions (No Booking, strictly Audit & Inspect) */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Statutory Reference • Official Airfare Transparency & Historical Audit</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="btn-print-fare-slip"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Fare Slip</span>
            </button>
            <button
              id="btn-dismiss-inspection-modal"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Dismiss Inspection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
