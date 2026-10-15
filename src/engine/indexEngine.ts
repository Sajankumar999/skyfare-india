/**
 * SkyFare India — National Airfare Intelligence Platform (MoSPI Price Statistics)
 * TypeScript Implementation of Econometric Price Index Calculation Engine
 */

export interface FlightQuoteInput {
  airline: string;
  flightNumber: string;
  horizon: string;
  currentFare: number;
  baseFare: number;
}

export interface RouteInput {
  routeId: string;
  originIata: string;
  destinationIata: string;
  basePassengerVolume: number;
  currentPassengerVolume: number;
  quotes: FlightQuoteInput[];
}

export interface RouteComputationResult {
  routeId: string;
  originIata: string;
  destinationIata: string;
  quoteCount: number;
  jevonsRelative: number;
  baseFareAvg: number;
  currentFareAvg: number;
  percentageChange: number;
  routeWeightPct: number;
  basePax: number;
  currentPax: number;
}

export interface NationalComputationResult {
  laspeyresIndex: number;
  paascheIndex: number;
  fisherIdealIndex: number;
  jevonsMacroIndex: number;
  transportCpiImpactBps: number;
  headlineCpiImpactBps: number;
  routesEvaluated: number;
  totalQuotesProcessed: number;
  totalBasePax: number;
  totalCurrentPax: number;
  routeBreakdown: RouteComputationResult[];
}

/**
 * Jevons Price Index (Elementary level geometric mean of price relatives)
 */
export function calculateJevonsIndex(
  currentPrices: number[],
  basePrices: number[],
  weights?: number[] | null
): number {
  if (!currentPrices || !basePrices || currentPrices.length !== basePrices.length) {
    throw new Error('Dimension mismatch between currentPrices and basePrices');
  }
  const n = currentPrices.length;
  if (n === 0) throw new Error('Prices array cannot be empty');

  if (!weights) {
    let logSum = 0;
    for (let i = 0; i < n; i++) {
      const pt = currentPrices[i];
      const p0 = basePrices[i];
      if (pt <= 0 || p0 <= 0) {
        throw new Error(`Fares must be positive. Received pt=${pt}, p0=${p0}`);
      }
      logSum += Math.log(pt / p0);
    }
    return Math.exp(logSum / n);
  } else {
    if (weights.length !== n) {
      throw new Error('Weights length must match prices length');
    }
    const totalW = weights.reduce((acc, w) => acc + w, 0);
    if (totalW <= 0) throw new Error('Weights sum must be strictly positive');

    let weightedLogSum = 0;
    for (let i = 0; i < n; i++) {
      const pt = currentPrices[i];
      const p0 = basePrices[i];
      const normW = weights[i] / totalW;
      if (pt <= 0 || p0 <= 0) {
        throw new Error(`Fares must be positive. Received pt=${pt}, p0=${p0}`);
      }
      weightedLogSum += normW * Math.log(pt / p0);
    }
    return Math.exp(weightedLogSum);
  }
}

/**
 * Laspeyres Price Index (Base-period quantity weighted arithmetic index)
 */
export function calculateLaspeyresIndex(
  currentPrices: number[],
  basePrices: number[],
  baseQuantities: number[]
): number {
  if (
    currentPrices.length !== basePrices.length ||
    currentPrices.length !== baseQuantities.length ||
    currentPrices.length === 0
  ) {
    throw new Error('Dimension mismatch or empty input arrays');
  }

  let num = 0;
  let den = 0;
  for (let i = 0; i < currentPrices.length; i++) {
    const pt = currentPrices[i];
    const p0 = basePrices[i];
    const q0 = baseQuantities[i];
    num += pt * q0;
    den += p0 * q0;
  }

  if (den === 0) throw new Error('Base expenditure denominator is zero');
  return (num / den) * 100;
}

/**
 * Paasche Price Index (Current-period quantity weighted harmonic index)
 */
export function calculatePaascheIndex(
  currentPrices: number[],
  basePrices: number[],
  currentQuantities: number[]
): number {
  if (
    currentPrices.length !== basePrices.length ||
    currentPrices.length !== currentQuantities.length ||
    currentPrices.length === 0
  ) {
    throw new Error('Dimension mismatch or empty input arrays');
  }

  let num = 0;
  let den = 0;
  for (let i = 0; i < currentPrices.length; i++) {
    const pt = currentPrices[i];
    const p0 = basePrices[i];
    const qt = currentQuantities[i];
    num += pt * qt;
    den += p0 * qt;
  }

  if (den === 0) throw new Error('Current expenditure denominator is zero');
  return (num / den) * 100;
}

/**
 * Fisher Ideal Price Index (Superlative geometric mean of Laspeyres and Paasche)
 */
export function calculateFisherIdealIndex(laspeyres: number, paasche: number): number {
  if (laspeyres <= 0 || paasche <= 0) {
    throw new Error('Laspeyres and Paasche must be strictly positive');
  }
  return Math.sqrt(laspeyres * paasche);
}

export const MOSPI_WEIGHTS = {
  AIR_IN_TRANSPORT: 0.068, // 6.8%
  AIR_IN_HEADLINE: 0.0058, // 0.58% (58 basis points)
};

/**
 * Aggregate route-level microdata into National Airfare Indices
 */
export function aggregateRouteData(routes: RouteInput[]): NationalComputationResult {
  if (!routes || routes.length === 0) {
    throw new Error('No routes provided');
  }

  const totalBasePax = routes.reduce((sum, r) => sum + r.basePassengerVolume, 0);
  const totalCurrentPax = routes.reduce((sum, r) => sum + r.currentPassengerVolume, 0);

  const routeBreakdown: RouteComputationResult[] = routes.map((r) => {
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

  const p0Vec = routeBreakdown.map((r) => r.baseFareAvg);
  const ptVec = routeBreakdown.map((r) => r.baseFareAvg * r.jevonsRelative);
  const q0Vec = routeBreakdown.map((r) => r.basePax);
  const qtVec = routeBreakdown.map((r) => r.currentPax);
  const weightsVec = routeBreakdown.map((r) => r.basePax / totalBasePax);

  const laspeyres = calculateLaspeyresIndex(ptVec, p0Vec, q0Vec);
  const paasche = calculatePaascheIndex(ptVec, p0Vec, qtVec);
  const fisher = calculateFisherIdealIndex(laspeyres, paasche);
  const jevonsMacro = calculateJevonsIndex(ptVec, p0Vec, weightsVec) * 100;

  const inflationPct = fisher - 100;
  const transportCpiBps = inflationPct * MOSPI_WEIGHTS.AIR_IN_TRANSPORT * 100;
  const headlineCpiBps = inflationPct * MOSPI_WEIGHTS.AIR_IN_HEADLINE * 100;

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

export const DEFAULT_CORRIDORS: RouteInput[] = [
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
    routeId: 'BLR-DEL',
    originIata: 'BLR',
    destinationIata: 'DEL',
    basePassengerVolume: 1880000,
    currentPassengerVolume: 1940000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-5011', horizon: 'T+1', currentFare: 8750, baseFare: 7800 },
      { airline: 'Air India', flightNumber: 'AI-505', horizon: 'T+7', currentFare: 7600, baseFare: 7300 },
      { airline: 'Akasa Air', flightNumber: 'QP-1332', horizon: 'T+15', currentFare: 6300, baseFare: 6100 },
      { airline: 'IndiGo', flightNumber: '6E-2135', horizon: 'T+30', currentFare: 5100, baseFare: 5050 },
    ],
  },
  {
    routeId: 'BOM-BLR',
    originIata: 'BOM',
    destinationIata: 'BLR',
    basePassengerVolume: 1450000,
    currentPassengerVolume: 1480000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-512', horizon: 'T+1', currentFare: 5900, baseFare: 5600 },
      { airline: 'Air India', flightNumber: 'AI-607', horizon: 'T+7', currentFare: 4950, baseFare: 4900 },
      { airline: 'Akasa Air', flightNumber: 'QP-1122', horizon: 'T+15', currentFare: 4100, baseFare: 4200 },
    ],
  },
  {
    routeId: 'BLR-BOM',
    originIata: 'BLR',
    destinationIata: 'BOM',
    basePassengerVolume: 1420000,
    currentPassengerVolume: 1460000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-513', horizon: 'T+1', currentFare: 5850, baseFare: 5500 },
      { airline: 'Air India', flightNumber: 'AI-608', horizon: 'T+7', currentFare: 4900, baseFare: 4850 },
      { airline: 'Akasa Air', flightNumber: 'QP-1123', horizon: 'T+15', currentFare: 4050, baseFare: 4150 },
    ],
  },
  {
    routeId: 'DEL-CCU',
    originIata: 'DEL',
    destinationIata: 'CCU',
    basePassengerVolume: 1350000,
    currentPassengerVolume: 1390000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-252', horizon: 'T+1', currentFare: 7450, baseFare: 7000 },
      { airline: 'Air India', flightNumber: 'AI-764', horizon: 'T+7', currentFare: 6300, baseFare: 6100 },
      { airline: 'SpiceJet', flightNumber: 'SG-274', horizon: 'T+15', currentFare: 5200, baseFare: 5100 },
    ],
  },
  {
    routeId: 'DEL-HYD',
    originIata: 'DEL',
    destinationIata: 'HYD',
    basePassengerVolume: 1180000,
    currentPassengerVolume: 1220000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-551', horizon: 'T+1', currentFare: 6400, baseFare: 5800 },
      { airline: 'Air India', flightNumber: 'AI-440', horizon: 'T+7', currentFare: 5200, baseFare: 4900 },
      { airline: 'Akasa Air', flightNumber: 'QP-1401', horizon: 'T+15', currentFare: 4300, baseFare: 4200 },
    ],
  },
  {
    routeId: 'HYD-DEL',
    originIata: 'HYD',
    destinationIata: 'DEL',
    basePassengerVolume: 1150000,
    currentPassengerVolume: 1190000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-552', horizon: 'T+1', currentFare: 6300, baseFare: 5750 },
      { airline: 'Air India', flightNumber: 'AI-441', horizon: 'T+7', currentFare: 5150, baseFare: 4850 },
      { airline: 'Akasa Air', flightNumber: 'QP-1402', horizon: 'T+15', currentFare: 4250, baseFare: 4150 },
    ],
  },
  {
    routeId: 'BOM-GOI',
    originIata: 'BOM',
    destinationIata: 'GOI',
    basePassengerVolume: 950000,
    currentPassengerVolume: 990000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-331', horizon: 'T+1', currentFare: 4800, baseFare: 4100 },
      { airline: 'Air India', flightNumber: 'AI-661', horizon: 'T+7', currentFare: 3900, baseFare: 3600 },
      { airline: 'Akasa Air', flightNumber: 'QP-1201', horizon: 'T+15', currentFare: 3100, baseFare: 3000 },
    ],
  },
  {
    routeId: 'MAA-DEL',
    originIata: 'MAA',
    destinationIata: 'DEL',
    basePassengerVolume: 920000,
    currentPassengerVolume: 950000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-401', horizon: 'T+1', currentFare: 8400, baseFare: 7500 },
      { airline: 'Air India', flightNumber: 'AI-439', horizon: 'T+7', currentFare: 6900, baseFare: 6600 },
    ],
  },
  {
    routeId: 'DEL-MAA',
    originIata: 'DEL',
    destinationIata: 'MAA',
    basePassengerVolume: 890000,
    currentPassengerVolume: 920000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-402', horizon: 'T+1', currentFare: 8300, baseFare: 7450 },
      { airline: 'Air India', flightNumber: 'AI-442', horizon: 'T+7', currentFare: 6850, baseFare: 6550 },
    ],
  },
  {
    routeId: 'CCU-BOM',
    originIata: 'CCU',
    destinationIata: 'BOM',
    basePassengerVolume: 780000,
    currentPassengerVolume: 810000,
    quotes: [
      { airline: 'IndiGo', flightNumber: '6E-821', horizon: 'T+1', currentFare: 7200, baseFare: 6900 },
      { airline: 'Air India', flightNumber: 'AI-771', horizon: 'T+7', currentFare: 6100, baseFare: 5950 },
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
