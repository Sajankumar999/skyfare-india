import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Code2,
  FileCode,
  Copy,
  Check,
  Download,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Sliders,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_CORRIDORS,
  aggregateRouteData,
  calculateJevonsIndex,
  calculateLaspeyresIndex,
  calculatePaascheIndex,
  calculateFisherIdealIndex,
  RouteInput,
} from '../engine/indexEngine';

export const IndexEngineViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'python' | 'javascript' | 'theory'>('sandbox');
  const [routes, setRoutes] = useState<RouteInput[]>(JSON.parse(JSON.stringify(DEFAULT_CORRIDORS)));
  const [copiedPy, setCopiedPy] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);

  // Compute live national metrics
  const computedSummary = useMemo(() => {
    try {
      return aggregateRouteData(routes);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [routes]);

  const handleUpdateFare = (routeIdx: number, quoteIdx: number, field: 'currentFare' | 'baseFare', val: number) => {
    const updated = JSON.parse(JSON.stringify(routes)) as RouteInput[];
    updated[routeIdx].quotes[quoteIdx][field] = Math.max(100, val);
    setRoutes(updated);
  };

  const handleUpdateVolume = (routeIdx: number, field: 'basePassengerVolume' | 'currentPassengerVolume', val: number) => {
    const updated = JSON.parse(JSON.stringify(routes)) as RouteInput[];
    updated[routeIdx][field] = Math.max(1000, val);
    setRoutes(updated);
  };

  const handleResetDefaults = () => {
    setRoutes(JSON.parse(JSON.stringify(DEFAULT_CORRIDORS)));
  };

  const handleCopy = (text: string, type: 'py' | 'js') => {
    navigator.clipboard.writeText(text);
    if (type === 'py') {
      setCopiedPy(true);
      setTimeout(() => setCopiedPy(false), 2000);
    } else {
      setCopiedJs(true);
      setTimeout(() => setCopiedJs(false), 2000);
    }
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const PYTHON_CODE_SAMPLE = `#!/usr/bin/env python3
"""
SkyFare India — National Airfare Intelligence Platform (MoSPI Price Statistics)
Econometric Price Index Calculation Engine (index_engine.py)
"""
import math
from typing import List, Optional

# 1. JEVONS INDEX (Geometric Mean of Price Relatives)
def calculate_jevons_index(current_prices: List[float], base_prices: List[float], weights: Optional[List[float]] = None) -> float:
    n = len(current_prices)
    if weights is None:
        log_sum = sum(math.log(pt / p0) for pt, p0 in zip(current_prices, base_prices))
        return math.exp(log_sum / n)
    else:
        total_w = sum(weights)
        norm_w = [w / total_w for w in weights]
        return math.exp(sum(w * math.log(pt / p0) for pt, p0, w in zip(current_prices, base_prices, norm_w)))

# 2. LASPEYRES INDEX (Base-Period Quantities q_0)
def calculate_laspeyres_index(current_prices: List[float], base_prices: List[float], base_quantities: List[float]) -> float:
    current_expenditure_base_q = sum(pt * q0 for pt, q0 in zip(current_prices, base_quantities))
    base_expenditure = sum(p0 * q0 for p0, q0 in zip(base_prices, base_quantities))
    return (current_expenditure_base_q / base_expenditure) * 100.0

# 3. PAASCHE INDEX (Current-Period Quantities q_t)
def calculate_paasche_index(current_prices: List[float], base_prices: List[float], current_quantities: List[float]) -> float:
    current_expenditure = sum(pt * qt for pt, qt in zip(current_prices, current_quantities))
    base_expenditure_curr_q = sum(p0 * qt for p0, qt in zip(base_prices, current_quantities))
    return (current_expenditure / base_expenditure_curr_q) * 100.0

# 4. FISHER IDEAL INDEX (Superlative Geometric Mean)
def calculate_fisher_ideal_index(laspeyres: float, paasche: float) -> float:
    return math.sqrt(laspeyres * paasche)

# 5. NATIONAL AGGREGATION USING PASSENGER-VOLUME ROUTE WEIGHTS
def aggregate_national_indices(routes):
    # Aggregates elementary route Jevons indices weighted by DGCA pax volumes
    ...`;

  const JAVASCRIPT_CODE_SAMPLE = `/**
 * SkyFare India — National Airfare Intelligence Platform (MoSPI Price Statistics)
 * Econometric Price Index Calculation Engine (index_engine.js)
 */

// 1. JEVONS INDEX (Geometric Mean of Price Relatives)
export function calculateJevonsIndex(currentPrices, basePrices, weights = null) {
  const n = currentPrices.length;
  if (!weights) {
    let logSum = 0;
    for (let i = 0; i < n; i++) {
      logSum += Math.log(currentPrices[i] / basePrices[i]);
    }
    return Math.exp(logSum / n);
  } else {
    const totalW = weights.reduce((a, b) => a + b, 0);
    let weightedLogSum = 0;
    for (let i = 0; i < n; i++) {
      weightedLogSum += (weights[i] / totalW) * Math.log(currentPrices[i] / basePrices[i]);
    }
    return Math.exp(weightedLogSum);
  }
}

// 2. LASPEYRES INDEX (Base-Period Passenger Volumes q_0)
export function calculateLaspeyresIndex(currentPrices, basePrices, baseQuantities) {
  let num = 0, den = 0;
  for (let i = 0; i < currentPrices.length; i++) {
    num += currentPrices[i] * baseQuantities[i];
    den += basePrices[i] * baseQuantities[i];
  }
  return (num / den) * 100;
}

// 3. PAASCHE INDEX (Current-Period Passenger Volumes q_t)
export function calculatePaascheIndex(currentPrices, basePrices, currentQuantities) {
  let num = 0, den = 0;
  for (let i = 0; i < currentPrices.length; i++) {
    num += currentPrices[i] * currentQuantities[i];
    den += basePrices[i] * currentQuantities[i];
  }
  return (num / den) * 100;
}

// 4. FISHER IDEAL INDEX (Superlative Geometric Mean)
export function calculateFisherIdealIndex(laspeyres, paasche) {
  return Math.sqrt(laspeyres * paasche);
}

// 5. AGGREGATE ROUTE INDICES USING PASSENGER-VOLUME WEIGHTS
export function aggregateRouteIndices(routes) { ... }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Econometric Core Engine
            </span>
            <span className="text-xs text-slate-500">
              index_engine.py & index_engine.js
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Airfare Price Index Calculation Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compliant with MoSPI & UN/ILO CPI methodology: Jevons (Elementary), Laspeyres (Base-weighted), Paasche (Current-weighted), and Superlative Fisher Ideal Index.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('index_engine.py', PYTHON_CODE_SAMPLE)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .py</span>
          </button>
          <button
            onClick={() => handleDownload('index_engine.js', JAVASCRIPT_CODE_SAMPLE)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .js</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'sandbox'
              ? 'border-blue-600 text-blue-700 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Interactive Calculator & Route Aggregator</span>
        </button>

        <button
          onClick={() => setActiveTab('theory')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'theory'
              ? 'border-blue-600 text-blue-700 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Mathematical Formulation & CPI Theory</span>
        </button>

        <button
          onClick={() => setActiveTab('python')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'python'
              ? 'border-blue-600 text-blue-700 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>index_engine.py (Python 3)</span>
        </button>

        <button
          onClick={() => setActiveTab('javascript')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'javascript'
              ? 'border-blue-600 text-blue-700 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>index_engine.js (Node / ES6)</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE CALCULATOR */}
      {activeTab === 'sandbox' && computedSummary && (
        <div className="space-y-6">
          {/* Executive Aggregate Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Laspeyres */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Laspeyres Index (L)
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {computedSummary.laspeyresIndex.toFixed(2)}
                </span>
                <span className={`text-xs font-bold ${computedSummary.laspeyresIndex >= 100 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {computedSummary.laspeyresIndex >= 100 ? '+' : ''}
                  {(computedSummary.laspeyresIndex - 100).toFixed(2)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Fixed base volume weights (q₀)</p>
            </div>

            {/* Paasche */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Paasche Index (P)
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {computedSummary.paascheIndex.toFixed(2)}
                </span>
                <span className={`text-xs font-bold ${computedSummary.paascheIndex >= 100 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {computedSummary.paascheIndex >= 100 ? '+' : ''}
                  {(computedSummary.paascheIndex - 100).toFixed(2)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Current passenger weights (qₜ)</p>
            </div>

            {/* Fisher Ideal */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-blue-950/20 border-2 border-blue-400 dark:border-blue-700 p-4 rounded-xl shadow-xs">
              <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center justify-between">
                <span>Fisher Ideal (F)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 font-extrabold">
                  SUPERLATIVE
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-blue-950 dark:text-white font-mono">
                  {computedSummary.fisherIdealIndex.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                  {computedSummary.fisherIdealIndex >= 100 ? '+' : ''}
                  {(computedSummary.fisherIdealIndex - 100).toFixed(2)}%
                </span>
              </div>
              <p className="text-[11px] text-blue-600 dark:text-blue-300 mt-1">
                √(L × P) • Eliminates substitution bias
              </p>
            </div>

            {/* CPI Impact */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                MoSPI Headline CPI Transmission
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  +{computedSummary.headlineCpiImpactBps.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-500">bps</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Transport CPI: +{computedSummary.transportCpiImpactBps.toFixed(2)} bps
              </p>
            </div>
          </div>

          {/* Route Selector & Quote Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Route List (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Air Corridors (Passenger Weights)
                </h3>
                <button
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              <div className="space-y-2">
                {routes.map((r, idx) => {
                  const res = computedSummary.routeBreakdown[idx];
                  const isSelected = activeRouteIndex === idx;

                  return (
                    <button
                      key={r.routeId}
                      onClick={() => setActiveRouteIndex(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-400 dark:bg-blue-950/30 dark:border-blue-700 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {r.routeId}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                          Weight: {res?.routeWeightPct.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-slate-500">
                          Jevons: <strong className="text-slate-800 dark:text-slate-200 font-mono">{res?.jevonsRelative.toFixed(4)}</strong>
                        </span>
                        <span className={`font-mono font-bold ${res && res.percentageChange >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {res && res.percentageChange >= 0 ? '+' : ''}{res?.percentageChange.toFixed(1)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Route Inspector & Microdata Adjuster (8 cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
              {/* Active Route Header */}
              {routes[activeRouteIndex] && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono text-base font-black text-slate-900 dark:text-white">
                          {routes[activeRouteIndex].routeId} Corridor Quotes
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-semibold">
                          {routes[activeRouteIndex].originIata} → {routes[activeRouteIndex].destinationIata}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tweak fares or passenger volumes to test real-time Jevons elementary index & Laspeyres/Paasche aggregation.
                      </p>
                    </div>

                    {/* Volume Controls */}
                    <div className="flex items-center gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Base Pax (q₀)</span>
                        <input
                          type="number"
                          value={routes[activeRouteIndex].basePassengerVolume}
                          onChange={(e) => handleUpdateVolume(activeRouteIndex, 'basePassengerVolume', Number(e.target.value))}
                          className="w-24 font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Pax (qₜ)</span>
                        <input
                          type="number"
                          value={routes[activeRouteIndex].currentPassengerVolume}
                          onChange={(e) => handleUpdateVolume(activeRouteIndex, 'currentPassengerVolume', Number(e.target.value))}
                          className="w-24 font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Flight Quotes Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                          <th className="pb-2">Airline / Flight</th>
                          <th className="pb-2">Lead Horizon</th>
                          <th className="pb-2">Base Fare (p₀)</th>
                          <th className="pb-2">Current Fare (pₜ)</th>
                          <th className="pb-2">Price Relative (pₜ/p₀)</th>
                          <th className="pb-2 text-right">Quote DoD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                        {routes[activeRouteIndex].quotes.map((q, qIdx) => {
                          const rel = q.currentFare / q.baseFare;
                          const pct = (rel - 1) * 100;

                          return (
                            <tr key={q.flightNumber + q.horizon} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 font-sans font-bold text-slate-900 dark:text-white">
                                {q.airline} <span className="font-mono text-slate-400 font-normal">({q.flightNumber})</span>
                              </td>
                              <td className="py-2.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {q.horizon}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-1">
                                  <span>₹</span>
                                  <input
                                    type="number"
                                    step="50"
                                    value={q.baseFare}
                                    onChange={(e) => handleUpdateFare(activeRouteIndex, qIdx, 'baseFare', Number(e.target.value))}
                                    className="w-20 font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-200"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-1">
                                  <span>₹</span>
                                  <input
                                    type="number"
                                    step="50"
                                    value={q.currentFare}
                                    onChange={(e) => handleUpdateFare(activeRouteIndex, qIdx, 'currentFare', Number(e.target.value))}
                                    className="w-20 font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-blue-600 dark:text-blue-400"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 font-semibold text-slate-700 dark:text-slate-300">
                                {rel.toFixed(4)}
                              </td>
                              <td className="py-2.5 text-right font-bold">
                                <span className={pct >= 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                  {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Micro Summary Banner */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        Elementary Jevons Geometric Mean for <strong>{routes[activeRouteIndex].routeId}</strong>:
                      </span>
                    </div>
                    <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      I_J = {computedSummary.routeBreakdown[activeRouteIndex]?.jevonsRelative.toFixed(4)}{' '}
                      <span className="text-xs text-slate-500 font-normal">
                        ({computedSummary.routeBreakdown[activeRouteIndex]?.percentageChange >= 0 ? '+' : ''}
                        {computedSummary.routeBreakdown[activeRouteIndex]?.percentageChange.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THEORY & FORMULAS */}
      {activeTab === 'theory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Jevons Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                  FORMULA 1
                </span>
                <span className="text-xs text-slate-400 font-medium">Elementary Aggregate</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Jevons Price Index (I_J)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The geometric mean of price relatives. Recommended by UN/ILO and MoSPI for flight quote sampling where individual transaction ticket volume weights are unknown at the micro-quote level.
              </p>
              <div className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-xs overflow-x-auto">
                I_J = [ ∏ (p_t,i / p_0,i) ]^(1/n) = exp( (1/n) * ∑ ln(p_t,i / p_0,i) )
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Satisfies Time Reversal: I_0,t × I_t,0 = 1</li>
                <li>Satisfies Circularity & Transitivity</li>
                <li>Invariant to currency unit denomination</li>
              </ul>
            </div>

            {/* 2. Laspeyres Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                  FORMULA 2
                </span>
                <span className="text-xs text-slate-400 font-medium">Fixed Base-Basket</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Laspeyres Price Index (L)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Uses historical base-period passenger volumes (q_0) as weights. Measures the cost of buying the base-period aviation basket at current versus baseline airfares.
              </p>
              <div className="p-3 bg-slate-900 text-indigo-300 rounded-lg font-mono text-xs overflow-x-auto">
                L = [ ∑ (p_t,r × q_0,r) / ∑ (p_0,r × q_0,r) ] × 100
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Fixed-basket benchmark standard used in CPI release</li>
                <li>Tends to exhibit slight upward substitution bias</li>
                <li>Weight = DGCA base annual passenger corridor share</li>
              </ul>
            </div>

            {/* 3. Paasche Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                  FORMULA 3
                </span>
                <span className="text-xs text-slate-400 font-medium">Current Basket</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Paasche Price Index (P)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Uses current-period passenger volumes (q_t) as weights. Measures current passenger volume evaluated at current fares relative to baseline fares.
              </p>
              <div className="p-3 bg-slate-900 text-amber-300 rounded-lg font-mono text-xs overflow-x-auto">
                P = [ ∑ (p_t,r × q_t,r) / ∑ (p_0,r × q_t,r) ] × 100
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Accounts for immediate consumer volume redirection</li>
                <li>Tends to understate inflation when consumers substitute</li>
                <li>Harmonic expenditure-share formulation</li>
              </ul>
            </div>

            {/* 4. Fisher Ideal Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  FORMULA 4
                </span>
                <span className="text-xs text-emerald-600 font-bold uppercase">Superlative Standard</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Fisher Ideal Price Index (F)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The geometric mean of the Laspeyres and Paasche indices. Proved by Diewert (1976) as a superlative index that provides an exact quadratic approximation to the true Cost of Living Index (COLI).
              </p>
              <div className="p-3 bg-slate-900 text-emerald-300 rounded-lg font-mono text-xs overflow-x-auto">
                F = √( L × P )
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Satisfies both Time Reversal and Factor Reversal tests</li>
                <li>Strictly bounds between Laspeyres and Paasche indices</li>
                <li>SkyFare default index for MoSPI policy transmission</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PYTHON CODE */}
      {activeTab === 'python' && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 sm:p-6 font-mono text-xs overflow-x-auto border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200">index_engine.py (Python 3.10+)</span>
            </div>
            <button
              onClick={() => handleCopy(PYTHON_CODE_SAMPLE, 'py')}
              className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {copiedPy ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPy ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="text-emerald-400 leading-relaxed max-h-[550px] overflow-y-auto">
            {PYTHON_CODE_SAMPLE}
          </pre>
        </div>
      )}

      {/* TAB 4: JAVASCRIPT CODE */}
      {activeTab === 'javascript' && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 sm:p-6 font-mono text-xs overflow-x-auto border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-slate-200">index_engine.js (ES Module & Node.js)</span>
            </div>
            <button
              onClick={() => handleCopy(JAVASCRIPT_CODE_SAMPLE, 'js')}
              className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {copiedJs ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJs ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="text-blue-300 leading-relaxed max-h-[550px] overflow-y-auto">
            {JAVASCRIPT_CODE_SAMPLE}
          </pre>
        </div>
      )}
    </div>
  );
};
