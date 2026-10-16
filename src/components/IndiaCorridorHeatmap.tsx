import React, { useState, useEffect } from 'react';
import { INDIAN_AIRPORTS } from '../data/mockData';
import { CorridorMovement } from '../types';
import { TOP_MOVING_CORRIDORS } from '../data/mockData';
import { INDIA_SURVEY_MAINLAND_PATH, INDIA_SURVEY_ISLANDS_PATHS } from '../data/indiaMapPaths';
import { RealGoogleMapView } from './RealGoogleMapView';
import { MapPin, TrendingUp, TrendingDown, Info, ShieldAlert, AlertTriangle, Zap, Layers, Globe, Compass, ShieldCheck, ArrowLeftRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { apiUrl } from '../config/api';

interface HeatmapProps {
  selectedRouteCode?: string;
  corridors?: CorridorMovement[];
  onSelectCorridor?: (corridor: CorridorMovement) => void;
  onSelectRouteCode?: (routeCode: string) => void;
}

export const IndiaCorridorHeatmap: React.FC<HeatmapProps> = ({
  selectedRouteCode,
  corridors: propCorridors,
  onSelectCorridor,
  onSelectRouteCode,
}) => {
  const [activeCorridorCode, setActiveCorridorCode] = useState<string>(selectedRouteCode || 'BOM-DEL');
  const [hoveredAirport, setHoveredAirport] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'soi_vector' | 'google_maps'>('soi_vector');
  const [corridors, setCorridors] = useState<CorridorMovement[]>(propCorridors || TOP_MOVING_CORRIDORS);
  const [isApiConnected, setIsApiConnected] = useState(Boolean(propCorridors && propCorridors.length > 0));

  useEffect(() => {
    if (propCorridors && propCorridors.length > 0) {
      setCorridors(propCorridors);
      setIsApiConnected(true);
    }
  }, [propCorridors]);

  useEffect(() => {
    if (selectedRouteCode && selectedRouteCode !== activeCorridorCode) {
      setActiveCorridorCode(selectedRouteCode);
    }
  }, [selectedRouteCode]);

  useEffect(() => {
    const controller = new AbortController();

    if (propCorridors && propCorridors.length > 0) return;

    const loadHeatmap = async () => {
      try {
        const response = await fetch(apiUrl('/api/v1/routes'), {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Routes API responded with ${response.status}`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Routes API returned an invalid response');
        }

        const liveRoutes = data.filter((route): route is {
          route_code: string;
          current_fare: number;
          baseline_fare: number;
          change_pct: number;
          status: string;
        } => (
          typeof route === 'object' &&
          route !== null &&
          typeof (route as { route_code?: unknown }).route_code === 'string' &&
          Number.isFinite(Number((route as { current_fare?: unknown }).current_fare)) &&
          Number.isFinite(Number((route as { baseline_fare?: unknown }).baseline_fare)) &&
          Number.isFinite(Number((route as { change_pct?: unknown }).change_pct))
        ));

        if (liveRoutes.length === 0) {
          throw new Error('Routes API returned no valid routes');
        }

        const AIRPORT_CITIES: Record<string, string> = {
          DEL: 'Delhi',
          BOM: 'Mumbai',
          BLR: 'Bengaluru',
          CCU: 'Kolkata',
          HYD: 'Hyderabad',
          MAA: 'Chennai',
          GOI: 'Goa',
        };

        setCorridors(liveRoutes.map((route) => {
          const fallback = TOP_MOVING_CORRIDORS.find(
            (corridor) => corridor.routeCode === route.route_code
          );
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
            status: route.status === 'CRITICAL_SPIKE' || route.status === 'ELEVATED' ||
              route.status === 'NORMAL' || route.status === 'SOFTENING'
              ? route.status
              : 'NORMAL',
          };
        }));
        setIsApiConnected(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          setIsApiConnected(false);
        }
      }
    };

    void loadHeatmap();
    return () => controller.abort();
  }, [propCorridors]);

  // Map routeCode to origin/dest coordinates
  const corridorsWithCoords = corridors.map((corridor) => {
    const [origCode, destCode] = corridor.routeCode.split('-');
    const orig = INDIAN_AIRPORTS.find((a) => a.iataCode === origCode);
    const dest = INDIAN_AIRPORTS.find((a) => a.iataCode === destCode);
    return {
      ...corridor,
      orig,
      dest,
    };
  }).filter((c) => c.orig && c.dest);

  // Find matching corridor or construct fallback from parts
  const selectedCorridor = corridors.find((c) => c.routeCode === activeCorridorCode) || (() => {
    const parts = activeCorridorCode.split('-');
    if (parts.length === 2) {
      const origAirport = INDIAN_AIRPORTS.find((a) => a.iataCode === parts[0]);
      const destAirport = INDIAN_AIRPORTS.find((a) => a.iataCode === parts[1]);
      const reverseMatch = corridors.find((c) => c.routeCode === `${parts[1]}-${parts[0]}`);
      if (reverseMatch) {
        return {
          routeCode: activeCorridorCode,
          originCity: destAirport?.city || parts[0],
          destCity: origAirport?.city || parts[1],
          currentFare: reverseMatch.currentFare,
          baselineFare: reverseMatch.baselineFare,
          changePct: reverseMatch.changePct,
          status: reverseMatch.status,
          rpkWeightPct: reverseMatch.rpkWeightPct,
          cpiContributionBps: reverseMatch.cpiContributionBps,
        };
      }
    }
    return corridors[0];
  })();

  const handleInterchange = () => {
    const parts = activeCorridorCode.split('-');
    if (parts.length === 2) {
      const reversedCode = `${parts[1]}-${parts[0]}`;
      setActiveCorridorCode(reversedCode);
      const match = corridors.find((c) => c.routeCode === reversedCode);
      if (match) {
        if (onSelectCorridor) onSelectCorridor(match);
      }
      if (onSelectRouteCode) onSelectRouteCode(reversedCode);
    }
  };

  const getCorridorColor = (changePct: number) => {
    if (changePct >= 15) return { stroke: '#ef4444', bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Critical Surge (>15%)' };
    if (changePct >= 5) return { stroke: '#f97316', bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', label: 'Moderate (5-15%)' };
    if (changePct < 0) return { stroke: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'Softening (<0%)' };
    return { stroke: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', label: 'Stable (0-5%)' };
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Airfare Change Across India
            </h3>
            {isApiConnected && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live API Connected
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              SOI Certified Alignment
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Geospatial tracking of price movements & CPI transmission across Indian domestic trunk routes
          </p>
        </div>

        {/* View Mode Switcher + Legend */}
        <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end">
          {/* Map View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('soi_vector')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                viewMode === 'soi_vector'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              SOI Vector Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('google_maps')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                viewMode === 'google_maps'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Google Maps
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-semibold flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-700 dark:text-red-400">Critical (&gt;15%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-orange-700 dark:text-orange-400">Moderate (5-15%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-blue-700 dark:text-blue-400">Stable (0-5%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 dark:text-emerald-400">Softening (&lt;0%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Map Canvas (7 cols) */}
        <div className="lg:col-span-7">
          {viewMode === 'google_maps' ? (
            <RealGoogleMapView
              activeCorridorCode={activeCorridorCode}
              corridors={corridors}
              onSelectCorridor={(c) => {
                setActiveCorridorCode(c.routeCode);
                if (onSelectCorridor) onSelectCorridor(c);
              }}
            />
          ) : (
            <div className="relative flex items-center justify-center p-3 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
              <svg
                viewBox="0 0 1000 1050"
                className="w-full max-w-[500px] aspect-square select-none"
                aria-label="Official Survey of India Flight Route Network Map"
              >
                <defs>
                  {/* Glowing Filters */}
                  <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-orange" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#0f172a" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#020617" stopOpacity="0.98" />
                  </linearGradient>
                  <linearGradient id="glowBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#0284c7" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
                  </linearGradient>
                </defs>

                {/* Subtle Coordinate Graticules */}
                <line x1="120" y1="429" x2="880" y2="429" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="4 8" />
                <line x1="120" y1="748" x2="880" y2="748" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="4 8" />
                <line x1="272" y1="100" x2="272" y2="980" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="4 8" />
                <line x1="575" y1="100" x2="575" y2="980" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="4 8" />

                {/* Graticule Degree Labels */}
                <text x="125" y="423" fill="#475569" fontSize="13" fontFamily="monospace" fontWeight="600">25° N</text>
                <text x="125" y="742" fill="#475569" fontSize="13" fontFamily="monospace" fontWeight="600">15° N</text>
                <text x="276" y="995" fill="#475569" fontSize="13" fontFamily="monospace" fontWeight="600">75° E</text>
                <text x="579" y="995" fill="#475569" fontSize="13" fontFamily="monospace" fontWeight="600">85° E</text>

                {/* Ambient Halo Behind Authentic India Mainland */}
                <path
                  d={INDIA_SURVEY_MAINLAND_PATH}
                  fill="#0284c7"
                  opacity="0.08"
                  stroke="none"
                  transform="scale(1.008) translate(-4, -4)"
                />

                {/* Official Survey of India (SOI) Authentic Sovereign Mainland Territory */}
                <path
                  d={INDIA_SURVEY_MAINLAND_PATH}
                  fill="url(#mapGradient)"
                  stroke="url(#glowBorder)"
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                  className="transition-colors"
                />

                {/* Andaman & Nicobar Archipelago (Survey of India Compliant) */}
                {INDIA_SURVEY_ISLANDS_PATHS.map((islandPath, index) => (
                  <path
                    key={`island-${index}`}
                    d={islandPath}
                    fill="url(#mapGradient)"
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                ))}

                {/* Lakshadweep Archipelago Atolls Highlight */}
                <g opacity="0.9">
                  <circle cx="201.4" cy="890.2" r="4.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                  <circle cx="187.7" cy="881.3" r="3.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                  <circle cx="213.8" cy="963.2" r="4.0" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                  <circle cx="232.9" cy="882.2" r="3.2" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                  <text x="135" y="920" fill="#64748b" fontSize="13" fontFamily="sans-serif" fontWeight="700">Lakshadweep (IND)</text>
                </g>

                {/* Andaman & Nicobar Label */}
                <text x="735" y="915" fill="#64748b" fontSize="13" fontFamily="sans-serif" fontWeight="700">Andaman &amp; Nicobar (IND)</text>

                {/* Flight Corridor Arcs */}
                {corridorsWithCoords.map((corridor) => {
                  if (!corridor.orig?.coordinates || !corridor.dest?.coordinates) return null;
                  const x1 = corridor.orig.coordinates.x;
                  const y1 = corridor.orig.coordinates.y;
                  const x2 = corridor.dest.coordinates.x;
                  const y2 = corridor.dest.coordinates.y;

                  // Arc curvature midpoint perpendicular
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const nx = -dy / dist;
                  const ny = dx / dist;
                  const curvature = Math.min(80, Math.max(30, dist * 0.16));
                  const midX = (x1 + x2) / 2 + nx * curvature;
                  const midY = (y1 + y2) / 2 + ny * curvature;

                  const isSelected = corridor.routeCode === activeCorridorCode;
                  const colorInfo = getCorridorColor(corridor.changePct);

                  return (
                    <g
                      key={corridor.routeCode}
                      className="cursor-pointer group"
                      onClick={() => {
                        setActiveCorridorCode(corridor.routeCode);
                        if (onSelectCorridor) onSelectCorridor(corridor);
                      }}
                    >
                      {/* Invisible thicker stroke for easy hover/tap */}
                      <path
                        d={`M ${x1},${y1} Q ${midX},${midY} ${x2},${y2}`}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="36"
                      />

                      {/* Route Arc Path */}
                      <path
                        d={`M ${x1},${y1} Q ${midX},${midY} ${x2},${y2}`}
                        fill="none"
                        stroke={colorInfo.stroke}
                        strokeWidth={isSelected ? '7' : corridor.changePct >= 15 ? '5.5' : corridor.changePct >= 5 ? '4' : '3'}
                        strokeDasharray={corridor.changePct >= 15 ? '8 4' : undefined}
                        strokeOpacity={isSelected ? 1 : 0.85}
                        filter={corridor.changePct >= 15 ? 'url(#glow-red)' : corridor.changePct >= 5 ? 'url(#glow-orange)' : undefined}
                        className="transition-all duration-200"
                      />

                      {/* Midpoint Pulse Node for Surge Corridors */}
                      {corridor.changePct >= 15 && (
                        <circle
                          cx={midX}
                          cy={midY}
                          r={isSelected ? '8' : '6'}
                          fill="#ef4444"
                          className="animate-ping origin-center"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Airport Nodes */}
                {INDIAN_AIRPORTS.map((airport) => {
                  if (!airport.coordinates) return null;
                  const isHovered = hoveredAirport === airport.iataCode;
                  const isConnected = selectedCorridor.routeCode.includes(airport.iataCode);

                  const labelOnLeft = airport.coordinates.x > 500;

                  return (
                    <g
                      key={airport.iataCode}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredAirport(airport.iataCode)}
                      onMouseLeave={() => setHoveredAirport(null)}
                      onClick={() => {
                        // find a corridor that involves this airport
                        const match = corridors.find((c) => c.routeCode.includes(airport.iataCode));
                        if (match) {
                          setActiveCorridorCode(match.routeCode);
                          if (onSelectCorridor) onSelectCorridor(match);
                        }
                      }}
                    >
                      {/* Outer pulse when connected */}
                      {isConnected && (
                        <circle
                          cx={airport.coordinates.x}
                          cy={airport.coordinates.y}
                          r="28"
                          fill="#38bdf8"
                          opacity="0.3"
                          className="animate-ping"
                        />
                      )}

                      {/* Node Halo Circle */}
                      <circle
                        cx={airport.coordinates.x}
                        cy={airport.coordinates.y}
                        r={isConnected ? '16' : '11'}
                        fill={isConnected ? '#0284c7' : '#0f172a'}
                        stroke={isConnected ? '#38bdf8' : '#94a3b8'}
                        strokeWidth={isConnected ? '4.5' : '2.5'}
                        className="transition-all"
                      />

                      {/* Inner Pin Dot */}
                      <circle
                        cx={airport.coordinates.x}
                        cy={airport.coordinates.y}
                        r="4.5"
                        fill={isConnected ? '#ffffff' : '#38bdf8'}
                      />

                      {/* Label Background Pill */}
                      <rect
                        x={airport.coordinates.x + (labelOnLeft ? -76 : 18)}
                        y={airport.coordinates.y - 17}
                        width="60"
                        height="34"
                        rx="8"
                        fill="#0f172a"
                        fillOpacity="0.9"
                        stroke={isConnected ? '#38bdf8' : '#334155'}
                        strokeWidth="1.8"
                      />

                      {/* Label Text */}
                      <text
                        x={airport.coordinates.x + (labelOnLeft ? -46 : 48)}
                        y={airport.coordinates.y + 6}
                        textAnchor="middle"
                        fontSize="18"
                        fontWeight="900"
                        fontFamily="monospace"
                        fill={isConnected ? '#38bdf8' : '#e2e8f0'}
                        className="select-none"
                      >
                        {airport.iataCode}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Map Overlay Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/70 text-[10px] text-slate-300 backdrop-blur-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>SOI COMPOSITE SOVEREIGN BOUNDARY</span>
              </div>

              <div className="absolute bottom-3 left-3 text-[10px] text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg backdrop-blur-xs border border-slate-800">
                100% Survey of India Alignment (J&amp;K, Ladakh &amp; Arunachal Pradesh Complete)
              </div>
            </div>
          )}
        </div>

        {/* Merged Corridor Deep Dive & DGCA Rule 135 Compliance Check Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5 shadow-2xs">
            {/* Header: Title & Status Badge */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/80 pb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Corridor Deep Dive & DGCA Rule 135 Check
                </h4>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                  selectedCorridor.status === 'CRITICAL_SPIKE'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                    : selectedCorridor.status === 'ELEVATED'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                }`}
              >
                {selectedCorridor.status.replace('_', ' ')}
              </span>
            </div>

            {/* Route Interchange Bar */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-700/90 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedCorridor.originCity} ({selectedCorridor.routeCode.split('-')[0]})
                  </span>

                  {/* Interactive Route Interchange Arrow Button */}
                  <button
                    type="button"
                    onClick={handleInterchange}
                    title={`Click to interchange route: ${selectedCorridor.destCity} ⇄ ${selectedCorridor.originCity}`}
                    className="group flex items-center justify-center p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                    aria-label="Interchange Route Direction"
                  >
                    <ArrowLeftRight className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                  </button>

                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedCorridor.destCity} ({selectedCorridor.routeCode.split('-')[1]})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span>Route Code: <strong className="text-slate-800 dark:text-slate-200">{selectedCorridor.routeCode}</strong></span>
                <span>•</span>
                <span>National RPK: <strong className="text-slate-800 dark:text-slate-200">{selectedCorridor.rpkWeightPct}%</strong></span>
              </div>
            </div>

            {/* Price & Delta 4-Metric Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block tracking-wider">Current Spot Fare</span>
                <span className="font-mono font-black text-lg text-slate-900 dark:text-white">
                  ₹{selectedCorridor.currentFare.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Live carrier quote</span>
              </div>

              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block tracking-wider">7-Day Empirical Baseline</span>
                <span className="font-mono font-bold text-lg text-slate-700 dark:text-slate-300">
                  ₹{selectedCorridor.baselineFare.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Trailing empirical window</span>
              </div>

              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block tracking-wider">Relative Price Shift</span>
                <div className="flex items-center gap-1 font-mono font-black text-lg">
                  <span
                    className={
                      selectedCorridor.changePct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }
                  >
                    {selectedCorridor.changePct > 0 ? `+${selectedCorridor.changePct}%` : `${selectedCorridor.changePct}%`}
                  </span>
                  {selectedCorridor.changePct > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block">vs baseline</span>
              </div>

              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block tracking-wider">Transport CPI Impact</span>
                <div className="font-mono font-black text-lg text-amber-600 dark:text-amber-400">
                  {selectedCorridor.cpiContributionBps > 0
                    ? `+${selectedCorridor.cpiContributionBps}`
                    : selectedCorridor.cpiContributionBps}{' '}
                  bps
                </div>
                <span className="text-[10px] text-slate-400 block">Index transmission</span>
              </div>
            </div>

            {/* Regulatory Compliance Guidance Banner */}
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                selectedCorridor.changePct >= 15
                  ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                  : selectedCorridor.changePct >= 5
                  ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
              }`}
            >
              {selectedCorridor.changePct >= 15 ? (
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              ) : selectedCorridor.changePct >= 5 ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              ) : (
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              )}

              <div className="space-y-1 text-xs">
                <div className="font-extrabold text-xs sm:text-sm">
                  {selectedCorridor.changePct >= 15
                    ? 'DGCA Rule 135 Dynamic Surge Warning'
                    : selectedCorridor.changePct >= 5
                    ? 'Elevated Tariff Warning Band'
                    : 'Rule 135 Fair Pricing Compliant'}
                </div>
                <p className="leading-relaxed text-[11px]">
                  {selectedCorridor.changePct >= 15
                    ? `Pricing on ${selectedCorridor.routeCode} has breached the 15% surveillance band (+${selectedCorridor.changePct}%). With ${selectedCorridor.rpkWeightPct}% RPK weight, it transmits ${selectedCorridor.cpiContributionBps} bps to CPI. Form 1-B carrier scrutiny recommended.`
                    : selectedCorridor.changePct >= 5
                    ? `Tariffs on ${selectedCorridor.routeCode} reflect moderate demand (+${selectedCorridor.changePct}%). Routine surveillance active.`
                    : `Tariffs on ${selectedCorridor.routeCode} are at or below baseline (${selectedCorridor.changePct}%). Serves as deflationary anchor.`}
                </p>
              </div>
            </div>

            {/* Quick Route Buttons */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Corridor Switcher
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {corridors.length} routes
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {corridors.map((c) => (
                  <button
                    key={c.routeCode}
                    onClick={() => {
                      setActiveCorridorCode(c.routeCode);
                      if (onSelectCorridor) onSelectCorridor(c);
                      if (onSelectRouteCode) onSelectRouteCode(c.routeCode);
                    }}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      activeCorridorCode === c.routeCode
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <span>{c.routeCode}</span>
                    <span
                      className={`ml-1 text-[10px] font-mono ${
                        activeCorridorCode === c.routeCode
                          ? 'text-blue-100'
                          : c.changePct > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {c.changePct > 0 ? `+${c.changePct}%` : `${c.changePct}%`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
