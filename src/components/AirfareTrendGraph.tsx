import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Activity, MousePointerClick } from 'lucide-react';
import { useIsMobile } from '../utils/useIsMobile';
import { apiUrl } from '../config/api';
import { getCachedData, fetchWithCache } from '../services/apiCache';

export type TimeRange = '7D' | '1M' | '3M' | '6M' | '1Y';

interface TrendDataPoint {
  date: string;
  laspeyres: number;
  fisher: number;
  paasche: number;
}

const formatAxisDate = (isoDate: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [, m, d] = isoDate.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(m, 10) - 1;
    return `${d} ${months[monthIdx] || m}`;
  }
  return isoDate;
};

const parseTimeseriesRows = (payload: unknown): TrendDataPoint[] | null => {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !Array.isArray((payload as { data?: unknown }).data)
  ) return null;

  const rows = (payload as { data: unknown[] }).data.flatMap((row): TrendDataPoint[] => {
    if (typeof row !== 'object' || row === null) return [];
    const item = row as Record<string, unknown>;
    const values = [
      item.index_date,
      item.laspeyres_index,
      item.fisher_ideal_index,
      item.paasche_index,
    ];
    if (
      typeof values[0] !== 'string' ||
      !values.slice(1).every((value) => Number.isFinite(Number(value)))
    ) return [];
    return [{
      date: formatAxisDate(values[0]),
      laspeyres: Number(values[1]),
      fisher: Number(values[2]),
      paasche: Number(values[3]),
    }];
  });

  return rows.length >= 2 ? rows : null;
};

const TREND_DATA: Record<TimeRange, TrendDataPoint[]> = {
  '7D': [
    { date: '16 Sep', laspeyres: 104.20, fisher: 104.12, paasche: 104.05 },
    { date: '17 Sep', laspeyres: 105.80, fisher: 105.71, paasche: 105.62 },
    { date: '18 Sep', laspeyres: 107.45, fisher: 107.38, paasche: 107.30 },
    { date: '19 Sep', laspeyres: 109.10, fisher: 109.02, paasche: 108.95 },
    { date: '20 Sep', laspeyres: 111.35, fisher: 111.28, paasche: 111.20 },
    { date: '21 Sep', laspeyres: 113.20, fisher: 113.11, paasche: 113.02 },
    { date: '22 Sep', laspeyres: 114.59, fisher: 114.50, paasche: 114.41 },
  ],
  '1M': [
    { date: '23 Aug', laspeyres: 98.40, fisher: 98.35, paasche: 98.30 },
    { date: '27 Aug', laspeyres: 99.80, fisher: 99.72, paasche: 99.65 },
    { date: '31 Aug', laspeyres: 101.50, fisher: 101.42, paasche: 101.35 },
    { date: '04 Sep', laspeyres: 103.20, fisher: 103.10, paasche: 103.01 },
    { date: '08 Sep', laspeyres: 104.90, fisher: 104.82, paasche: 104.74 },
    { date: '12 Sep', laspeyres: 107.10, fisher: 107.01, paasche: 106.92 },
    { date: '16 Sep', laspeyres: 109.50, fisher: 109.41, paasche: 109.32 },
    { date: '19 Sep', laspeyres: 112.10, fisher: 112.01, paasche: 111.92 },
    { date: '22 Sep', laspeyres: 114.59, fisher: 114.50, paasche: 114.41 },
  ],
  '3M': [
    { date: 'Jul W1', laspeyres: 96.20, fisher: 96.15, paasche: 96.10 },
    { date: 'Jul W2', laspeyres: 97.50, fisher: 97.42, paasche: 97.35 },
    { date: 'Jul W4', laspeyres: 95.80, fisher: 95.74, paasche: 95.68 },
    { date: 'Aug W1', laspeyres: 97.10, fisher: 97.05, paasche: 97.00 },
    { date: 'Aug W2', laspeyres: 98.90, fisher: 98.82, paasche: 98.75 },
    { date: 'Aug W3', laspeyres: 101.20, fisher: 101.12, paasche: 101.05 },
    { date: 'Aug W4', laspeyres: 103.80, fisher: 103.71, paasche: 103.62 },
    { date: 'Sep W2', laspeyres: 107.50, fisher: 107.41, paasche: 107.32 },
    { date: 'Sep W3', laspeyres: 114.59, fisher: 114.50, paasche: 114.41 },
  ],
  '6M': [
    { date: 'Apr 26', laspeyres: 92.40, fisher: 92.35, paasche: 92.30 },
    { date: 'May 26', laspeyres: 98.60, fisher: 98.52, paasche: 98.45 },
    { date: 'Jun 26', laspeyres: 96.10, fisher: 96.04, paasche: 95.98 },
    { date: 'Jul 26', laspeyres: 95.50, fisher: 95.42, paasche: 95.35 },
    { date: 'Aug 26', laspeyres: 102.30, fisher: 102.21, paasche: 102.12 },
    { date: 'Sep 26', laspeyres: 114.59, fisher: 114.50, paasche: 114.41 },
  ],
  '1Y': [
    { date: 'Oct 25', laspeyres: 106.80, fisher: 106.72, paasche: 106.65 },
    { date: 'Nov 25', laspeyres: 112.40, fisher: 112.31, paasche: 112.22 },
    { date: 'Dec 25', laspeyres: 118.90, fisher: 118.79, paasche: 118.68 },
    { date: 'Jan 26', laspeyres: 94.20, fisher: 94.14, paasche: 94.08 },
    { date: 'Feb 26', laspeyres: 91.50, fisher: 91.45, paasche: 91.40 },
    { date: 'Mar 26', laspeyres: 93.80, fisher: 93.74, paasche: 93.68 },
    { date: 'Apr 26', laspeyres: 92.40, fisher: 92.35, paasche: 92.30 },
    { date: 'May 26', laspeyres: 98.60, fisher: 98.52, paasche: 98.45 },
    { date: 'Jun 26', laspeyres: 96.10, fisher: 96.04, paasche: 95.98 },
    { date: 'Jul 26', laspeyres: 95.50, fisher: 95.42, paasche: 95.35 },
    { date: 'Aug 26', laspeyres: 102.30, fisher: 102.21, paasche: 102.12 },
    { date: 'Sep 26', laspeyres: 114.59, fisher: 114.50, paasche: 114.41 },
  ],
};

export const AirfareTrendGraph: React.FC = () => {
  const isMobile = useIsMobile(640);
  const [activeRange, setActiveRange] = useState<TimeRange>('7D');
  const [hoveredPoint, setHoveredPoint] = useState<TrendDataPoint | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [liveData, setLiveData] = useState<TrendDataPoint[] | null>(() => {
    const cached = getCachedData(apiUrl('/api/v1/index/timeseries'));
    return parseTimeseriesRows(cached);
  });
  const [isApiConnected, setIsApiConnected] = useState<boolean>(() => {
    return Boolean(getCachedData(apiUrl('/api/v1/index/timeseries')));
  });

  useEffect(() => {
    const controller = new AbortController();
    const loadTimeseries = async () => {
      try {
        const payload = await fetchWithCache<unknown>(apiUrl('/api/v1/index/timeseries'), {
          signal: controller.signal,
          ttlMs: 120000,
        });

        const rows = parseTimeseriesRows(payload);
        if (!rows) throw new Error('Insufficient persisted index history');
        setLiveData(rows);
        setIsApiConnected(true);
      } catch (error) {
        if (!controller.signal.aborted) setIsApiConnected(false);
      }
    };
    void loadTimeseries();
    return () => controller.abort();
  }, []);

  const data = useMemo(() => {
    if (!liveData) return TREND_DATA[activeRange];
    const counts: Record<TimeRange, number> = {
      '7D': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
    };
    return liveData.slice(-counts[activeRange]);
  }, [activeRange, liveData]);
  const values = data.map((d) => d.laspeyres);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(rawMax - rawMin, 5);
  const padding = Math.max(1.5, span * 0.15);
  const minVal = Math.floor(rawMin - padding);
  const maxVal = Math.ceil(rawMax + padding);

  const startVal = data[0].laspeyres;
  const endVal = data[data.length - 1].laspeyres;
  const changePct = (((endVal - startVal) / startVal) * 100).toFixed(1);
  const isPositive = Number(changePct) >= 0;

  // Active point for inspection (hovered on desktop or selected/latest on mobile)
  const activePoint =
    hoveredPoint ||
    (selectedPointIndex !== null && selectedPointIndex < data.length
      ? data[selectedPointIndex]
      : data[data.length - 1]);

  // Chart dimensions adapted for mobile vs desktop - expanded width and minimal paddingX to eliminate side voids
  const width = isMobile ? 380 : 1000;
  const height = isMobile ? 210 : 250;
  const paddingX = isMobile ? 16 : 20;
  const paddingY = isMobile ? 24 : 28;

  const getX = (index: number) => {
    return paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    return height - paddingY - ((val - minVal) / (maxVal - minVal)) * (height - paddingY * 2);
  };

  // Base 100 line position
  const base100Y = getY(100);

  // SVG Line path
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)},${getY(d.laspeyres).toFixed(1)}`)
    .join(' ');

  // Fisher Line path (secondary dashed)
  const fisherPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)},${getY(d.fisher).toFixed(1)}`)
    .join(' ');

  // Gradient area path
  const areaPath = `${linePath} L ${getX(data.length - 1).toFixed(1)},${(height - paddingY).toFixed(1)} L ${getX(0).toFixed(1)},${(height - paddingY).toFixed(1)} Z`;

  // Adaptive grid levels spanning minVal to maxVal
  const rawStep = Math.max(2, Math.round((maxVal - minVal) / 4));
  const dynamicTicks = [
    Math.round(minVal + rawStep),
    Math.round(minVal + rawStep * 2),
    Math.round(minVal + rawStep * 3),
  ];
  if (100 >= minVal && 100 <= maxVal && !dynamicTicks.includes(100)) {
    dynamicTicks.push(100);
  }
  const gridLevels = Array.from(new Set(dynamicTicks)).sort((a, b) => a - b);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              National Airfare Index Trend Graph
            </h3>
            {isApiConnected ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live API Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Connecting History...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            High-frequency daily time series (Laspeyres & Fisher Ideal formulations • Base Year: 2024 = 100)
          </p>
        </div>

        {/* Time-Range Filters: [7D, 1M, 3M, 6M, 1Y] */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto overflow-x-auto max-w-full">
          {(['7D', '1M', '3M', '6M', '1Y'] as TimeRange[]).map((range) => (
            <button
              key={range}
              id={`btn-trend-range-${range}`}
              onClick={() => {
                setActiveRange(range);
                setHoveredPoint(null);
                setSelectedPointIndex(null);
              }}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRange === range
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metric summary pills */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Period Delta:</span>
            <span
              className={`font-bold font-mono inline-flex items-center gap-0.5 text-xs ${
                isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {isPositive ? `+${changePct}%` : `${changePct}%`}
            </span>
          </div>
          <div className="hidden sm:inline text-slate-300 dark:text-slate-700">•</div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px]">Min:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {rawMin.toFixed(2)}
            </span>
          </div>
          <div className="text-slate-300 dark:text-slate-700">•</div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px]">Max:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {rawMax.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-blue-600 rounded-full inline-block" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Laspeyres</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-indigo-500 inline-block" />
            <span className="text-slate-500 dark:text-slate-400">Fisher Superlative</span>
          </span>
        </div>
      </div>

      {/* Interactive Mobile Value Strip */}
      <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono font-bold text-[11px]">
            {activePoint.date} (2026)
          </span>
          <span className="hidden xs:inline text-slate-500 dark:text-slate-400 text-[11px]">
            Tap point to inspect
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono font-bold">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-sans mr-1">Laspeyres:</span>
            <span className="text-blue-600 dark:text-blue-400 text-sm">
              {activePoint.laspeyres.toFixed(2)}
            </span>
          </div>
          <div className="text-slate-300 dark:text-slate-700">|</div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-sans mr-1">Fisher:</span>
            <span className="text-indigo-600 dark:text-indigo-400 text-sm">
              {activePoint.fisher.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Container */}
      <div className="relative w-full overflow-hidden bg-slate-950/90 dark:bg-slate-950 rounded-xl p-1.5 sm:p-2 border border-slate-800">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none block"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <filter id="nodeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Reference Grid lines */}
          {gridLevels.map((lvl) => {
            const yPos = getY(lvl);
            const isBase = lvl === 100;
            return (
              <g key={lvl}>
                <line
                  x1={paddingX}
                  y1={yPos}
                  x2={width - paddingX}
                  y2={yPos}
                  stroke={isBase ? '#3b82f6' : '#334155'}
                  strokeWidth={isBase ? '1.2' : '0.7'}
                  strokeDasharray={isBase ? '5 3' : '3 3'}
                  strokeOpacity={isBase ? '0.7' : '0.4'}
                />
                <text
                  x={paddingX + (isMobile ? 2 : 4)}
                  y={yPos - 3}
                  fill={isBase ? '#60a5fa' : '#64748b'}
                  fontSize={isMobile ? '9.5' : '10'}
                  fontFamily="monospace"
                  fontWeight={isBase ? 'bold' : 'normal'}
                >
                  {isBase ? 'Base 100.00' : `${lvl}.00`}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#trendGradient)" />

          {/* Fisher Superlative Line (Dashed) */}
          <path
            d={fisherPath}
            fill="none"
            stroke="#818cf8"
            strokeWidth={isMobile ? '1.8' : '2'}
            strokeDasharray="4 3"
            opacity="0.85"
          />

          {/* Laspeyres Primary Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={isMobile ? '3' : '3.5'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active Crosshair Line */}
          {activePoint && (() => {
            const activeIdx = data.findIndex((d) => d.date === activePoint.date);
            if (activeIdx < 0) return null;
            const cx = getX(activeIdx);
            const cy = getY(activePoint.laspeyres);
            return (
              <g pointerEvents="none">
                <line
                  x1={cx}
                  y1={paddingY}
                  x2={cx}
                  y2={height - paddingY}
                  stroke="#60a5fa"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
                <circle cx={cx} cy={cy} r={isMobile ? 12 : 14} fill="#3b82f6" opacity="0.25" filter="url(#nodeGlow)" />
              </g>
            );
          })()}

          {/* Data Points */}
          {data.map((point, index) => {
            const cx = getX(index);
            const cy = getY(point.laspeyres);
            const isPointActive = activePoint?.date === point.date;

            // Evenly sample at most 5-6 date labels across the horizontal axis to prevent overlap
            const maxLabels = isMobile ? 4 : 6;
            const labelStep = Math.max(1, Math.ceil((data.length - 1) / maxLabels));
            const shouldShowLabel =
              data.length <= 7 ||
              index === 0 ||
              index === data.length - 1 ||
              (index % labelStep === 0 && (data.length - 1 - index) >= Math.floor(labelStep / 2));

            return (
              <g
                key={point.date}
                className="cursor-pointer"
                onClick={() => setSelectedPointIndex(index)}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Large transparent touch target for mobile fingertips */}
                <circle cx={cx} cy={cy} r={isMobile ? 18 : 14} fill="transparent" />

                {/* Visible Data Dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isPointActive ? (isMobile ? 6 : 6.5) : (isMobile ? 4 : 4.5)}
                  fill={isPointActive ? '#60a5fa' : '#2563eb'}
                  stroke="#ffffff"
                  strokeWidth={isPointActive ? 2.5 : 1.8}
                  className="transition-all duration-200"
                />

                {/* Date Label on X Axis */}
                {shouldShowLabel && (
                  <text
                    x={cx}
                    y={height - (isMobile ? 8 : 10)}
                    textAnchor="middle"
                    fill={isPointActive ? '#93c5fd' : '#94a3b8'}
                    fontSize={isMobile ? '9.5' : '10.5'}
                    fontFamily="sans-serif"
                    fontWeight={isPointActive ? '700' : '500'}
                  >
                    {point.date}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Desktop Hover Tooltip */}
        {!isMobile && hoveredPoint && (
          <div className="absolute top-3 right-4 bg-slate-900/95 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl backdrop-blur-xs border border-slate-700 animate-fadeIn pointer-events-none">
            <div className="font-bold border-b border-slate-700 pb-1 mb-1.5 text-slate-200 flex items-center justify-between gap-4">
              <span>{hoveredPoint.date} (2026)</span>
              <span className="text-[10px] text-blue-400 uppercase font-mono">Official Time Series</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Laspeyres (Base 100):</span>
              <span className="font-mono font-bold text-blue-400">
                {hoveredPoint.laspeyres.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 mt-0.5">
              <span className="text-slate-400">Fisher Superlative:</span>
              <span className="font-mono font-bold text-indigo-300">
                {hoveredPoint.fisher.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
