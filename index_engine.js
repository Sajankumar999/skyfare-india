/**
 * SkyFare India — National Airfare Intelligence Platform (MoSPI Price Statistics)
 * ========================================================================
 * Econometric Price Index Calculation Engine (index_engine.js)
 * 
 * Standard price index formulation compliant with MoSPI and UN/ILO CPI manual:
 *   1. Jevons Index: Geometric mean of price relatives (elementary level).
 *   2. Laspeyres Index: Base-period weighted arithmetic index (fixed basket).
 *   3. Paasche Index: Current-period weighted harmonic index (current basket).
 *   4. Fisher Ideal Index: Superlative geometric mean of Laspeyres and Paasche.
 *   5. Route-Level & National Airfare Aggregation: Aggregates route price relatives using DGCA passenger volume weights.
 */

// =====================================================================
// 1. ELEMENTARY AGGREGATE: JEVONS INDEX
// =====================================================================

/**
 * Calculates the Jevons Price Index (unweighted or weighted geometric mean of price relatives).
 * 
 * Formula:
 *   Unweighted: I_J = exp( (1/n) * \sum ln(p_t / p_0) )
 *   Weighted  : I_J^w = exp( \sum w_i * ln(p_t / p_0) ), where \sum w_i = 1
 * 
 * @param {number[]} currentPrices - Array of current period fares (p_t)
 * @param {number[]} basePrices - Array of base period baseline fares (p_0)
 * @param {number[]} [weights] - Optional quote sampling weights
 * @returns {number} The Jevons price relative (e.g., 1.12 for +12%)
 */
export function calculateJevonsIndex(currentPrices, basePrices, weights = null) {
  if (!currentPrices || !basePrices || currentPrices.length !== basePrices.length) {
    throw new Error('Dimension mismatch: currentPrices and basePrices must have identical non-zero length.');
  }
  const n = currentPrices.length;
  if (n === 0) {
    throw new Error('Prices array cannot be empty.');
  }

  if (!weights) {
    let logSum = 0;
    for (let i = 0; i < n; i++) {
      const pt = currentPrices[i];
      const p0 = basePrices[i];
      if (pt <= 0 || p0 <= 0) {
        throw new Error(`Fares must be strictly positive. Got pt=${pt}, p0=${p0}`);
      }
      logSum += Math.log(pt / p0);
    }
    return Math.exp(logSum / n);
  } else {
    if (weights.length !== n) {
      throw new Error('Weights length must match prices length.');
    }
    const totalW = weights.reduce((acc, w) => acc + w, 0);
    if (totalW <= 0) throw new Error('Sum of weights must be positive.');

    let weightedLogSum = 0;
    for (let i = 0; i < n; i++) {
      const pt = currentPrices[i];
      const p0 = basePrices[i];
      const normW = weights[i] / totalW;
      if (pt <= 0 || p0 <= 0) {
        throw new Error(`Fares must be strictly positive. Got pt=${pt}, p0=${p0}`);
      }
      weightedLogSum += normW * Math.log(pt / p0);
    }
    return Math.exp(weightedLogSum);
  }
}

// =====================================================================
// 2. HIGHER-LEVEL AGGREGATE: LASPEYRES INDEX
// =====================================================================

/**
 * Calculates the Laspeyres Price Index (L).
 * 
 * Uses base-period passenger volumes (q_0) as weights.
 * Formula:
 *   L = [ \sum(p_t * q_0) / \sum(p_0 * q_0) ] * 100
 * 
 * @param {number[]} currentPrices - Current fares (p_t)
 * @param {number[]} basePrices - Base fares (p_0)
 * @param {number[]} baseQuantities - Base period passenger quantities / traffic (q_0)
 * @returns {number} Laspeyres index (base = 100.0)
 */
export function calculateLaspeyresIndex(currentPrices, basePrices, baseQuantities) {
  if (
    !currentPrices ||
    !basePrices ||
    !baseQuantities ||
    currentPrices.length !== basePrices.length ||
    currentPrices.length !== baseQuantities.length
  ) {
    throw new Error('Dimension mismatch between currentPrices, basePrices, and baseQuantities.');
  }

  let currentExpenditureWithBaseQ = 0;
  let baseExpenditure = 0;

  for (let i = 0; i < currentPrices.length; i++) {
    const pt = currentPrices[i];
    const p0 = basePrices[i];
    const q0 = baseQuantities[i];

    if (pt <= 0 || p0 <= 0 || q0 < 0) {
      throw new Error(`Invalid price/quantity: pt=${pt}, p0=${p0}, q0=${q0}`);
    }

    currentExpenditureWithBaseQ += pt * q0;
    baseExpenditure += p0 * q0;
  }

  if (baseExpenditure === 0) {
    throw new Error('Base period expenditure sum cannot be zero.');
  }

  return (currentExpenditureWithBaseQ / baseExpenditure) * 100;
}

// =====================================================================
// 3. HIGHER-LEVEL AGGREGATE: PAASCHE INDEX
// =====================================================================

/**
 * Calculates the Paasche Price Index (P).
 * 
 * Uses current-period passenger volumes (q_t) as weights.
 * Formula:
 *   P = [ \sum(p_t * q_t) / \sum(p_0 * q_t) ] * 100
 * 
 * @param {number[]} currentPrices - Current fares (p_t)
 * @param {number[]} basePrices - Base fares (p_0)
 * @param {number[]} currentQuantities - Current period passenger quantities / traffic (q_t)
 * @returns {number} Paasche index (base = 100.0)
 */
export function calculatePaascheIndex(currentPrices, basePrices, currentQuantities) {
  if (
    !currentPrices ||
    !basePrices ||
    !currentQuantities ||
    currentPrices.length !== basePrices.length ||
    currentPrices.length !== currentQuantities.length
  ) {
    throw new Error('Dimension mismatch between currentPrices, basePrices, and currentQuantities.');
  }

  let currentExpenditure = 0;
  let baseExpenditureWithCurrentQ = 0;

  for (let i = 0; i < currentPrices.length; i++) {
    const pt = currentPrices[i];
    const p0 = basePrices[i];
    const qt = currentQuantities[i];

    if (pt <= 0 || p0 <= 0 || qt < 0) {
      throw new Error(`Invalid price/quantity: pt=${pt}, p0=${p0}, qt=${qt}`);
    }

    currentExpenditure += pt * qt;
    baseExpenditureWithCurrentQ += p0 * qt;
  }

  if (baseExpenditureWithCurrentQ === 0) {
    throw new Error('Base expenditure with current quantities cannot be zero.');
  }

  return (currentExpenditure / baseExpenditureWithCurrentQ) * 100;
}

// =====================================================================
// 4. SUPERLATIVE AGGREGATE: FISHER IDEAL INDEX
// =====================================================================

/**
 * Calculates the Fisher Ideal Price Index (F).
 * 
 * Defined as the geometric mean of Laspeyres and Paasche indices:
 *   F = \sqrt{ L * P }
 * 
 * Superlative index that eliminates route and carrier substitution bias.
 * 
 * @param {number} laspeyres - Laspeyres index
 * @param {number} paasche - Paasche index
 * @returns {number} Fisher Ideal index
 */
export function calculateFisherIdealIndex(laspeyres, paasche) {
  if (laspeyres <= 0 || paasche <= 0) {
    throw new Error(`Laspeyres (${laspeyres}) and Paasche (${paasche}) must both be strictly positive.`);
  }
  return Math.sqrt(laspeyres * paasche);
}

// =====================================================================
// 5. ROUTE-LEVEL & NATIONAL AGGREGATION ENGINE
// =====================================================================

export const MOSPI_CPI_PARAMETERS = {
  AIR_TRANSPORT_WEIGHT_IN_TRANSPORT_GROUP: 0.068, // ~6.8% of Transport CPI
  AIR_TRANSPORT_WEIGHT_IN_HEADLINE_CPI: 0.0058,   // ~0.58% of Headline All-India CPI
};

/**
 * Aggregates microdata flight quotes and route passenger volumes into national price indices.
 * 
 * @param {Array<{
 *   routeId: string,
 *   originIata: string,
 *   destinationIata: string,
 *   basePassengerVolume: number,
 *   currentPassengerVolume: number,
 *   quotes: Array<{
 *     airline: string,
 *     flightNumber: string,
 *     horizon: string,
 *     currentFare: number,
 *     baseFare: number
 *   }>
 * }>} routes
 */
export function aggregateRouteIndices(routes) {
  if (!routes || routes.length === 0) {
    throw new Error('No route observations provided.');
  }

  const totalBasePax = routes.reduce((sum, r) => sum + r.basePassengerVolume, 0);
  const totalCurrentPax = routes.reduce((sum, r) => sum + r.currentPassengerVolume, 0);

  // 1. Calculate Elementary Jevons Index for each individual route
  const routeBreakdown = routes.map((r) => {
    const currentPrices = r.quotes.map((q) => q.currentFare);
    const basePrices = r.quotes.map((q) => q.baseFare);

    const jevonsRel = calculateJevonsIndex(currentPrices, basePrices);
    const baseAvg = basePrices.reduce((a, b) => a + b, 0) / basePrices.length;
    const currentAvg = currentPrices.reduce((a, b) => a + b, 0) / currentPrices.length;
    const pctChange = (jevonsRel - 1) * 100;
    const routeWeightPct = totalBasePax > 0 ? (r.basePassengerVolume / totalBasePax) * 100 : 0;

    return {
      routeId: r.routeId,
      originIata: r.originIata,
      destinationIata: r.destinationIata,
      quoteCount: r.quotes.length,
      jevonsRelative: Number(jevonsRel.toFixed(4)),
      baseFareAvg: Number(baseAvg.toFixed(2)),
      currentFareAvg: Number(currentAvg.toFixed(2)),
      percentageChange: Number(pctChange.toFixed(2)),
      routeWeightPct: Number(routeWeightPct.toFixed(2)),
      basePax: r.basePassengerVolume,
      currentPax: r.currentPassengerVolume,
    };
  });

  // 2. Aggregate route vectors using passenger volume route weights
  const p0Vec = routeBreakdown.map((r) => r.baseFareAvg);
  const ptVec = routeBreakdown.map((r) => r.baseFareAvg * r.jevonsRelative);
  const q0Vec = routeBreakdown.map((r) => r.basePax);
  const qtVec = routeBreakdown.map((r) => r.currentPax);
  const weightsVec = routeBreakdown.map((r) => r.basePax / totalBasePax);

  // Laspeyres Index (Fixed base-period passenger volumes)
  const laspeyres = calculateLaspeyresIndex(ptVec, p0Vec, q0Vec);

  // Paasche Index (Current-period passenger volumes)
  const paasche = calculatePaascheIndex(ptVec, p0Vec, qtVec);

  // Fisher Ideal Index (Superlative geometric mean)
  const fisher = calculateFisherIdealIndex(laspeyres, paasche);

  // National Jevons Macro Index
  const jevonsMacro = calculateJevonsIndex(ptVec, p0Vec, weightsVec) * 100;

  // 3. CPI Transmission Calculations
  const airfareInflationPct = fisher - 100;
  const transportCpiBps = airfareInflationPct * MOSPI_CPI_PARAMETERS.AIR_TRANSPORT_WEIGHT_IN_TRANSPORT_GROUP * 100;
  const headlineCpiBps = airfareInflationPct * MOSPI_CPI_PARAMETERS.AIR_TRANSPORT_WEIGHT_IN_HEADLINE_CPI * 100;

  return {
    laspeyresIndex: Number(laspeyres.toFixed(2)),
    paascheIndex: Number(paasche.toFixed(2)),
    fisherIdealIndex: Number(fisher.toFixed(2)),
    jevonsMacroIndex: Number(jevonsMacro.toFixed(2)),
    transportCpiImpactBps: Number(transportCpiBps.toFixed(2)),
    headlineCpiImpactBps: Number(headlineCpiBps.toFixed(2)),
    routesEvaluated: routes.length,
    totalQuotesProcessed: routes.reduce((sum, r) => sum + r.quotes.length, 0),
    totalBasePax,
    totalCurrentPax,
    routeBreakdown,
  };
}

// Sample dataset and CLI execution when invoked via `node index_engine.js`
export const SAMPLE_DGCA_ROUTES = [
  {
    routeId: 'BOM-DEL',
    originIata: 'BOM',
    destinationIata: 'DEL',
    basePassengerVolume: 2540000,
    currentPassengerVolume: 2480000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-5321', horizon: 'T+1', currentFare: 11250, baseFare: 8400 },
      { airline: 'Air India', flightNumber: 'AI-806', horizon: 'T+1', currentFare: 12400, baseFare: 8900 },
      { airline: 'Akasa Air', flightNumber: 'QP-1102', horizon: 'T+7', currentFare: 8900, baseFare: 7200 },
      { airline: 'IndiGo', flightNumber: '6E-205', horizon: 'T+15', currentFare: 7400, baseFare: 6800 },
      { airline: 'SpiceJet', flightNumber: 'SG-8169', horizon: 'T+30', currentFare: 5950, baseFare: 5600 },
    ],
  },
  {
    routeId: 'DEL-BOM',
    originIata: 'DEL',
    destinationIata: 'BOM',
    basePassengerVolume: 2680000,
    currentPassengerVolume: 2720000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-204', horizon: 'T+1', currentFare: 9950, baseFare: 8100 },
      { airline: 'Air India', flightNumber: 'AI-865', horizon: 'T+1', currentFare: 10800, baseFare: 8800 },
      { airline: 'Akasa Air', flightNumber: 'QP-1105', horizon: 'T+7', currentFare: 8100, baseFare: 7100 },
      { airline: 'IndiGo', flightNumber: '6E-678', horizon: 'T+15', currentFare: 6900, baseFare: 6400 },
      { airline: 'SpiceJet', flightNumber: 'SG-8701', horizon: 'T+30', currentFare: 5400, baseFare: 5200 },
    ],
  },
  {
    routeId: 'DEL-BLR',
    originIata: 'DEL',
    destinationIata: 'BLR',
    basePassengerVolume: 1920000,
    currentPassengerVolume: 1980000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-2134', horizon: 'T+1', currentFare: 8900, baseFare: 7900 },
      { airline: 'Air India', flightNumber: 'AI-504', horizon: 'T+7', currentFare: 7800, baseFare: 7400 },
      { airline: 'Akasa Air', flightNumber: 'QP-1331', horizon: 'T+15', currentFare: 6450, baseFare: 6200 },
      { airline: 'IndiGo', flightNumber: '6E-5012', horizon: 'T+30', currentFare: 5200, baseFare: 5100 },
    ],
  },
  {
    routeId: 'CCU-DEL',
    originIata: 'CCU',
    destinationIata: 'DEL',
    basePassengerVolume: 1350000,
    currentPassengerVolume: 1410000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-251', horizon: 'T+1', currentFare: 6200, baseFare: 6800 },
      { airline: 'Air India', flightNumber: 'AI-763', horizon: 'T+7', currentFare: 5600, baseFare: 5900 },
      { airline: 'SpiceJet', flightNumber: 'SG-273', horizon: 'T+15', currentFare: 4800, baseFare: 5100 },
      { airline: 'IndiGo', flightNumber: '6E-804', horizon: 'T+30', currentFare: 4100, baseFare: 4300 },
    ],
  },
  {
    routeId: 'BLR-HYD',
    originIata: 'BLR',
    destinationIata: 'HYD',
    basePassengerVolume: 980000,
    currentPassengerVolume: 1020000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-442', horizon: 'T+1', currentFare: 3900, baseFare: 3950 },
      { airline: 'Air India', flightNumber: 'AI-542', horizon: 'T+7', currentFare: 3400, baseFare: 3500 },
      { airline: 'Akasa Air', flightNumber: 'QP-1512', horizon: 'T+15', currentFare: 2800, baseFare: 2900 },
      { airline: 'IndiGo', flightNumber: '6E-711', horizon: 'T+30', currentFare: 2400, baseFare: 2450 },
    ],
  },
];

// CLI runner
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('index_engine.js')) {
  console.log('='.repeat(80));
  console.log('SKYFARE INDIA: ECONOMETRIC AIRFARE INDEX ENGINE (Node.js / JavaScript)');
  console.log('='.repeat(80));
  const res = aggregateRouteIndices(SAMPLE_DGCA_ROUTES);
  console.log(`Routes Evaluated       : ${res.routesEvaluated}`);
  console.log(`Microdata Quotes       : ${res.totalQuotesProcessed}`);
  console.log('-'.repeat(80));
  console.log('PRIMARY AGGREGATE PRICE INDICES (Base = 100.00):');
  console.log(`  • Laspeyres Index (Base-Weighted)     : ${res.laspeyresIndex} (+${(res.laspeyresIndex - 100).toFixed(2)}%)`);
  console.log(`  • Paasche Index (Current-Weighted)    : ${res.paascheIndex} (+${(res.paascheIndex - 100).toFixed(2)}%)`);
  console.log(`  • Fisher Ideal Index (Superlative)    : ${res.fisherIdealIndex} (+${(res.fisherIdealIndex - 100).toFixed(2)}%)`);
  console.log(`  • Jevons Macro Index (Geometric)      : ${res.jevonsMacroIndex} (+${(res.jevonsMacroIndex - 100).toFixed(2)}%)`);
  console.log('-'.repeat(80));
  console.log('MoSPI CPI TRANSMISSION:');
  console.log(`  • Transport CPI Impact                : +${res.transportCpiImpactBps} bps`);
  console.log(`  • Headline All-India CPI Impact       : +${res.headlineCpiImpactBps} bps`);
  console.log('-'.repeat(80));
  console.table(
    res.routeBreakdown.map((r) => ({
      Route: r.routeId,
      'Base Avg (₹)': `₹${r.baseFareAvg}`,
      'Current (₹)': `₹${r.currentFareAvg}`,
      'Jevons Rel': r.jevonsRelative,
      'Change (%)': `${r.percentageChange > 0 ? '+' : ''}${r.percentageChange}%`,
      'Weight (%)': `${r.routeWeightPct}%`,
    }))
  );
  console.log('='.repeat(80));
}
