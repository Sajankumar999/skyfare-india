import React, { useEffect, useState } from 'react';
import { HORIZON_MATRIX_DATA } from '../data/mockData';
import { HorizonMatrixRow } from '../types';
import { Clock, TrendingUp, TrendingDown, Layers, BarChart2, Table as TableIcon, Info, Zap } from 'lucide-react';
import { CarrierAnalyticsPanel } from './CarrierAnalyticsPanel';
import { useIsMobile } from '../utils/useIsMobile';
import { apiUrl } from '../config/api';
import { getCachedData, fetchWithCache } from '../services/apiCache';

const parseTemporalRows = (payload: unknown): HorizonMatrixRow[] | null => {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !Array.isArray((payload as { data?: unknown }).data)
  ) {
    return null;
  }

  const liveRows = (payload as { data: unknown[] }).data.filter(
    (row): row is {
      horizon: string;
      current_fare: number;
      baseline_fare: number;
      spread_pct: number;
      observations: number;
    } => (
      typeof row === 'object' &&
      row !== null &&
      typeof (row as { horizon?: unknown }).horizon === 'string' &&
      Number.isFinite(Number((row as { current_fare?: unknown }).current_fare)) &&
      Number.isFinite(Number((row as { baseline_fare?: unknown }).baseline_fare)) &&
      Number.isFinite(Number((row as { spread_pct?: unknown }).spread_pct)) &&
      Number.isFinite(Number((row as { observations?: unknown }).observations))
    )
  );

  if (liveRows.length === 0) return null;

  return liveRows.map((row) => {
    const fallback = HORIZON_MATRIX_DATA.find((item) => item.horizon === row.horizon)
      ?? HORIZON_MATRIX_DATA[0];
    return {
      ...fallback,
      nationalAvgFare: Number(row.current_fare),
      baselineFare: Number(row.baseline_fare),
      spreadPct: Number(row.spread_pct),
      sampleQuotes: Number(row.observations),
    };
  });
};

export const BookingHorizonsPanel: React.FC = () => {
  const isMobile = useIsMobile(640);
  const [activeSection, setActiveSection] = useState<'horizons' | 'market'>('horizons');
  const [selectedHorizon, setSelectedHorizon] = useState<string>('T+1');
  const [viewMode, setViewMode] = useState<'curve' | 'bars' | 'table'>('curve');
  const [horizonData, setHorizonData] = useState<HorizonMatrixRow[]>(() => {
    const cached = getCachedData(apiUrl('/api/v1/analytics/temporal'));
    const parsed = parseTemporalRows(cached);
    return parsed || HORIZON_MATRIX_DATA;
  });
  const [isApiConnected, setIsApiConnected] = useState<boolean>(() => {
    return Boolean(getCachedData(apiUrl('/api/v1/analytics/temporal')));
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadHorizonData = async () => {
      try {
        const payload = await fetchWithCache<unknown>(apiUrl('/api/v1/analytics/temporal'), {
          signal: controller.signal,
          ttlMs: 120000,
        });

        const liveData = parseTemporalRows(payload);
        if (!liveData) {
          throw new Error('Temporal API returned no valid horizons');
        }

        setHorizonData(liveData);

        try {
          const elasticityPayload = await fetchWithCache<unknown>(apiUrl('/api/v1/analytics/elasticity'), {
            signal: controller.signal,
            ttlMs: 120000,
          });
          if (typeof elasticityPayload === 'object' && elasticityPayload !== null && Array.isArray((elasticityPayload as { data?: unknown }).data)) {
            const elasticityByHorizon = new Map(
              (elasticityPayload as { data: Array<{ horizon?: unknown; volatility_index?: unknown }> }).data
                .filter((row) => typeof row.horizon === 'string' && Number.isFinite(Number(row.volatility_index)))
                .map((row) => [row.horizon as string, Number(row.volatility_index)])
            );
            setHorizonData((current) => current.map((row) => ({
              ...row,
              volatilityIndex: elasticityByHorizon.get(row.horizon) ?? row.volatilityIndex,
            })));
          }
        } catch {
          // Non-critical elasticity enhancement
        }

        setIsApiConnected(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          setIsApiConnected(false);
        }
      }
    };

    void loadHorizonData();
    return () => controller.abort();
  }, []);

  // Multiplier relative to early bird / baseline
  const t45Row = horizonData.find((r) => r.horizon === 'T+45');
  const t45Fare = t45Row ? t45Row.nationalAvgFare : 10794;

  const getYieldMultiplier = (horizon: string) => {
    if (isApiConnected && t45Fare > 0) {
      const row = horizonData.find((r) => r.horizon === horizon);
      if (row && row.nationalAvgFare > 0) {
        return `${(row.nationalAvgFare / t45Fare).toFixed(2)}x`;
      }
    }
    switch (horizon) {
      case 'T+1':
        return '2.58x';
      case 'T+7':
        return '1.68x';
      case 'T+15':
        return '1.20x';
      case 'T+30':
        return '0.95x';
      case 'T+45':
        return '0.85x';
      default:
        return '1.00x';
    }
  };

  const getSubIndex = (horizon: string) => {
    if (isApiConnected) {
      const row = horizonData.find((r) => r.horizon === horizon);
      if (row && row.baselineFare > 0) {
        return Number(((row.nationalAvgFare / row.baselineFare) * 100).toFixed(2));
      }
    }
    switch (horizon) {
      case 'T+1':
        return 142.10;
      case 'T+7':
        return 121.50;
      case 'T+15':
        return 105.80;
      case 'T+30':
        return 97.20;
      case 'T+45':
        return 92.40;
      default:
        return 100.00;
    }
  };

  const activeRow = horizonData.find((r) => r.horizon === selectedHorizon) || horizonData[0];

  // Yield curve coordinates for SVG chart
  // On Mobile: viewBox is 380x270
  // On Tablet/Desktop: widescreen 1000x290 viewbox
  const svgWidth = isMobile ? 380 : 1000;
  const svgHeight = isMobile ? 270 : 290;
  const bottomBaselineY = isMobile ? 215 : 240;
  const scaleHeight = isMobile ? 160 : 190;
  const maxScaleFare = 16000;

  const rawPoints = [...horizonData].reverse().map((row, index) => ({
    horizon: row.horizon,
    label: row.horizonLabel,
    observed: row.nationalAvgFare,
    baseline: row.baselineFare,
    xDesktop: 68 + index * 218,
    xMobile: 34 + index * 78,
    mult: getYieldMultiplier(row.horizon),
  }));

  const chartPoints = rawPoints.map((p) => {
    const x = isMobile ? p.xMobile : p.xDesktop;
    const obsY = Math.round(bottomBaselineY - (p.observed / maxScaleFare) * scaleHeight);
    const baseY = Math.round(bottomBaselineY - (p.baseline / maxScaleFare) * scaleHeight);
    return {
      ...p,
      x,
      obsY,
      baseY,
    };
  });

  const observedPath = chartPoints.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x},${p.obsY}` : `${acc} L ${p.x},${p.obsY}`;
  }, '');

  const observedAreaPath = `${observedPath} L ${chartPoints[chartPoints.length - 1].x},${bottomBaselineY} L ${chartPoints[0].x},${bottomBaselineY} Z`;

  const baselinePath = chartPoints.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x},${p.baseY}` : `${acc} L ${p.x},${p.baseY}`;
  }, '');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Section Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSection('horizons')}
            className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === 'horizons'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Advance Booking Horizons (T+1 to T+45)</span>
          </button>

          <button
            onClick={() => setActiveSection('market')}
            className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === 'market'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Airline Fleet & Market Concentration (HHI)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
              5 Carriers
            </span>
          </button>
        </div>

        {isApiConnected ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mr-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Live Temporal API Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 mr-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Connecting Temporal Feeds...
          </span>
        )}
      </div>

      {activeSection === 'horizons' ? (
        <>
          {/* 5 Comparative Metric Cards */}
          <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Advance-Booking Horizon Matrix (T+1 to T+45)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cross-sectional fare escalation curves and yield premiums by booking lead time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {horizonData.map((row) => {
            const isSelected = selectedHorizon === row.horizon;
            const multiplier = getYieldMultiplier(row.horizon);
            const subIndex = getSubIndex(row.horizon);
            const isSurging = row.spreadPct > 0;

            return (
              <div
                key={row.horizon}
                onClick={() => setSelectedHorizon(row.horizon)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    {row.horizon}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      row.horizon === 'T+1'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : row.horizon === 'T+7'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {multiplier} Multiplier
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {row.horizonLabel}
                  </div>
                  <div className="text-[10px] text-slate-400">{row.leadTime} Lead</div>
                </div>

                {/* Avg Fare & Spread */}
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-slate-400">Avg Fare</span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      ₹{row.nationalAvgFare.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] mt-1">
                    <span className="text-[10px] text-slate-400">Sub-Index</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {subIndex.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] mt-0.5">
                    <span className="text-[10px] text-slate-400">vs 30d Median</span>
                    <span
                      className={`font-mono font-bold text-[11px] ${
                        isSurging ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isSurging ? `+${row.spreadPct.toFixed(1)}%` : `${row.spreadPct.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advance Booking Yield Curve & Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Advance Booking Yield Curve (Empirical vs Baseline)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualizing the non-linear hockey stick price surge inside the 7-day departure window
            </p>
          </div>
          {isApiConnected && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live API Connected
            </span>
          )}

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('curve')}
              className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'curve'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Yield Curve</span>
            </button>
            <button
              onClick={() => setViewMode('bars')}
              className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'bars'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Spread Bars</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Audit Table</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Interactive SVG Yield Curve */}
        {viewMode === 'curve' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="p-2 sm:p-3 sm:px-3.5 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden space-y-3">
              {/* Top Legend Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
                <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Real-time Tenor Yield Curve</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-xs bg-slate-900/90 border border-slate-800 px-2.5 sm:px-3 py-1.5 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-blue-500 rounded-full" />
                    <span className="text-slate-200 font-medium text-[11px] sm:text-xs">Observed Today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-b-2 border-dashed border-slate-400" />
                    <span className="text-slate-400 font-medium text-[11px] sm:text-xs">30d Median</span>
                  </div>
                </div>
              </div>

              {/* Tenor Quick Touch Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {rawPoints.map((p) => {
                  const isSel = selectedHorizon === p.horizon;
                  return (
                    <button
                      key={p.horizon}
                      id={`btn-tenor-pill-${p.horizon}`}
                      onClick={() => setSelectedHorizon(p.horizon)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        isSel
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-mono">{p.horizon}</span>
                      <span className="text-[10px] font-sans font-medium text-slate-300">
                        ₹{p.observed.toLocaleString('en-IN')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* SVG Canvas - Responsive 100% container filling widescreen viewbox */}
              <div className="w-full overflow-hidden">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto select-none block"
                >
                  <defs>
                    <linearGradient id="yieldAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                      <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Horizontal Grid lines and Y-axis Price Labels */}
                  {[
                    { val: 15000, label: '₹15k' },
                    { val: 11000, label: '₹11k' },
                    { val: 7000, label: '₹7k' },
                    { val: 3000, label: '₹3k' },
                    { val: 0, label: '₹0' },
                  ].map((item) => {
                    const yVal = Math.round(bottomBaselineY - (item.val / maxScaleFare) * scaleHeight);
                    const xStart = isMobile ? 28 : 42;
                    const xEnd = isMobile ? 372 : 980;
                    const textX = isMobile ? 24 : 36;
                    return (
                      <g key={item.val}>
                        <line
                          x1={xStart}
                          y1={yVal}
                          x2={xEnd}
                          y2={yVal}
                          stroke="#1e293b"
                          strokeWidth="0.8"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={textX}
                          y={yVal + 3.5}
                          textAnchor="end"
                          fontSize={isMobile ? '9.5' : '11'}
                          fill="#64748b"
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {item.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill under observed curve */}
                  <path d={observedAreaPath} fill="url(#yieldAreaGradient)" />

                  {/* Baseline 30-Day Median Curve */}
                  <path
                    d={baselinePath}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth={isMobile ? '1.8' : '2'}
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                  />

                  {/* Observed Yield Curve Line */}
                  <path
                    d={observedPath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={isMobile ? '3' : '3.5'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Nodes and Vertical Callouts */}
                  {chartPoints.map((pt) => {
                    const isSel = selectedHorizon === pt.horizon;
                    return (
                      <g key={pt.horizon} className="cursor-pointer" onClick={() => setSelectedHorizon(pt.horizon)}>
                        {/* Large invisible touch hit-target for effortless mobile interaction */}
                        <circle cx={pt.x} cy={pt.obsY} r={isMobile ? 22 : 14} fill="transparent" />

                        {/* Vertical Guideline */}
                        <line
                          x1={pt.x}
                          y1={isMobile ? 30 : 40}
                          x2={pt.x}
                          y2={bottomBaselineY}
                          stroke={isSel ? '#3b82f6' : '#334155'}
                          strokeWidth={isSel ? '1.5' : '0.8'}
                          strokeDasharray={isSel ? undefined : '2 3'}
                          opacity={isSel ? 0.8 : 0.5}
                        />

                        {/* Baseline Dot */}
                        <circle cx={pt.x} cy={pt.baseY} r={isMobile ? 3 : 3.5} fill="#64748b" opacity="0.8" />

                        {/* Selected Glow Ring */}
                        {isSel && (
                          <circle
                            cx={pt.x}
                            cy={pt.obsY}
                            r={isMobile ? 11 : 13}
                            fill={pt.horizon === 'T+1' ? '#ef4444' : pt.horizon === 'T+7' ? '#f59e0b' : '#3b82f6'}
                            opacity="0.3"
                            filter="url(#glowFilter)"
                          />
                        )}

                        {/* Observed Dot */}
                        <circle
                          cx={pt.x}
                          cy={pt.obsY}
                          r={isSel ? (isMobile ? 6.5 : 7.5) : (isMobile ? 4.5 : 5.5)}
                          fill={pt.horizon === 'T+1' ? '#ef4444' : pt.horizon === 'T+7' ? '#f59e0b' : '#3b82f6'}
                          stroke="#ffffff"
                          strokeWidth={isMobile ? 2 : 2.5}
                        />

                        {/* Price callout badge above point */}
                        <g transform={`translate(${pt.x}, ${pt.obsY - (isMobile ? 12 : 14)})`}>
                          <rect
                            x={isMobile ? -25 : -32}
                            y={isMobile ? -14 : -16}
                            width={isMobile ? 50 : 64}
                            height={isMobile ? 16 : 18}
                            rx={isMobile ? 4 : 5}
                            fill={isSel ? '#1e293b' : '#0f172a'}
                            stroke={isSel ? '#38bdf8' : '#334155'}
                            strokeWidth="1"
                          />
                          <text
                            x="0"
                            y={isMobile ? -3 : -3.5}
                            textAnchor="middle"
                            fontSize={isMobile ? '9.5' : '10.5'}
                            fontWeight="bold"
                            fill="#ffffff"
                            fontFamily="monospace"
                          >
                            ₹{pt.observed.toLocaleString('en-IN')}
                          </text>
                        </g>

                        {/* Multiplier tag below point */}
                        <text
                          x={pt.x}
                          y={pt.obsY + (isMobile ? 16 : 20)}
                          textAnchor="middle"
                          fontSize={isMobile ? '10' : '11'}
                          fill={pt.horizon === 'T+1' ? '#f87171' : pt.horizon === 'T+7' ? '#fbbf24' : '#38bdf8'}
                          fontWeight="bold"
                        >
                          {pt.mult}
                        </text>

                        {/* X-axis Horizon Code */}
                        <text
                          x={pt.x}
                          y={bottomBaselineY + (isMobile ? 18 : 22)}
                          textAnchor="middle"
                          fontSize={isMobile ? '11.5' : '13'}
                          fontWeight="900"
                          fontFamily="monospace"
                          fill={isSel ? '#38bdf8' : '#e2e8f0'}
                        >
                          {pt.horizon}
                        </text>

                        {/* X-axis Sub-label */}
                        <text
                          x={pt.x}
                          y={bottomBaselineY + (isMobile ? 32 : 38)}
                          textAnchor="middle"
                          fontSize={isMobile ? '9' : '10'}
                          fontWeight="600"
                          fill={isSel ? '#93c5fd' : '#94a3b8'}
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Selected Horizon Deep Dive Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {activeRow.horizon} ({activeRow.horizonLabel}) Economic Deep Dive
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Sample Size: {activeRow.sampleQuotes.toLocaleString('en-IN')} quotes
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>Primary Travel Motif:</strong> {activeRow.purpose}. In this tranche, airlines deploy dynamic pricing
                algorithms with a volatility score of <strong>{activeRow.volatilityIndex}/100</strong>. At {activeRow.horizon},
                tickets are trading at <strong>{getYieldMultiplier(activeRow.horizon)}</strong> of the early-bird baseline rate.
              </p>
            </div>
          </div>
        )}

        {/* View Mode 2: Spread Bars */}
        {viewMode === 'bars' && (
          <div className="space-y-3 pt-2">
            {horizonData.map((row) => (
              <div key={row.horizon} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {row.horizon} — {row.horizonLabel}
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    ₹{row.nationalAvgFare.toLocaleString('en-IN')} (
                    <span className={row.spreadPct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {row.spreadPct > 0 ? `+${row.spreadPct}%` : `${row.spreadPct}%`}
                    </span>
                    )
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all ${
                      row.horizon === 'T+1'
                        ? 'bg-rose-500'
                        : row.horizon === 'T+7'
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, (row.nationalAvgFare / 16000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Mode 3: Audit Table */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="pb-3 pr-4">Horizon</th>
                  <th className="pb-3 px-3">Lead Time</th>
                  <th className="pb-3 px-3">Travel Motif</th>
                  <th className="pb-3 px-3 text-right">National Avg Fare</th>
                  <th className="pb-3 px-3 text-right">30d Baseline</th>
                  <th className="pb-3 px-3 text-right">Spread (%)</th>
                  <th className="pb-3 px-3 text-right">Yield Multiplier</th>
                  <th className="pb-3 pl-4 text-right">Quotes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {horizonData.map((row) => (
                  <tr key={row.horizon} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-4 font-mono font-bold text-slate-900 dark:text-white">{row.horizon}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{row.leadTime}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">{row.purpose}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{row.nationalAvgFare.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      ₹{row.baselineFare.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={row.spreadPct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {row.spreadPct > 0 ? `+${row.spreadPct}%` : `${row.spreadPct}%`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {getYieldMultiplier(row.horizon)}
                    </td>
                    <td className="py-3 pl-4 text-right font-mono text-slate-500">
                      {row.sampleQuotes.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="pt-2 animate-fadeIn">
      <CarrierAnalyticsPanel />
    </div>
  )}
</div>
  );
};
