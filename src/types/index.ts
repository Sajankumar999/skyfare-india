export type CabinClass = 'Economy' | 'Premium Economy' | 'Business';

export type BookingHorizon = 'T+1' | 'T+7' | 'T+15' | 'T+30' | 'T+45';

export type UserPersona = 'citizen' | 'mospi_officer' | 'rbi_mpc' | 'dgca_regulator';

export interface Airport {
  id: number;
  iataCode: string;
  name: string;
  city: string;
  state: string;
  metroTier: 'Tier-1' | 'Tier-2' | 'Tier-3' | 'RCS-UDAN';
  coordinates?: { x: number; y: number; lat?: number; lng?: number }; // Coords for SVG India Map and Geo Leaflet
}

export interface Airline {
  id: number;
  iataCode: string;
  name: string;
  model: 'LCC' | 'FSC';
  marketSharePct: number;
  color: string;
  bgLight: string;
}

export interface FlightFareBreakdown {
  baseFare: number;
  atfFuelSurcharge: number;
  udfFee: number;
  psfFee: number;
  asfSecurityFee: number;
  gstAmount: number;
  otherFees: number;
  totalFare: number;
}

export interface FlightCardData {
  id: string;
  airline: Airline;
  flightNumber: string;
  originAirport: Airport;
  destinationAirport: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  isNonstop: boolean;
  stopsCount: number;
  cabinClass: CabinClass;
  bookingHorizon: BookingHorizon;
  leadTimeDays: number;
  fareBreakdown: FlightFareBreakdown;
  corridorBaseline30d: number;
  priceDeviationPct: number; // e.g. -12% or +28%
  isSurgePricing: boolean;
  seatsRemaining: string; // '2 left at this price', 'Available'
  buyRecommendation: {
    verdict: 'BUY_NOW' | 'WAIT' | 'FAIR_PRICE';
    headline: string;
    rationale: string;
    confidenceScore: number; // e.g. 92%
    projectedDeltaPct: number; // e.g. +18%
  };
  sourcePlatform?: string; // 'google_flights' | 'makemytrip' | 'easemytrip'
}

export interface HorizonMatrixRow {
  horizon: BookingHorizon;
  horizonLabel: string;
  purpose: string;
  leadTime: string;
  nationalAvgFare: number;
  baselineFare: number;
  spreadPct: number;
  volatilityIndex: number;
  sampleQuotes: number;
}

export interface CorridorMovement {
  routeCode: string;
  originCity: string;
  destCity: string;
  currentFare: number;
  baselineFare: number;
  changePct: number;
  status: 'CRITICAL_SPIKE' | 'ELEVATED' | 'NORMAL' | 'SOFTENING';
  rpkWeightPct: number;
  cpiContributionBps: number;
}

export interface PolicySimulatorState {
  atfShockPct: number;      // -20% to +50%
  demandShiftPct: number;   // -30% to +30%
  fleetGroundingPct: number;// 0% to -40%
}

export interface AuditRunRecord {
  id: string;
  sourceName: string;
  startedAt: string;
  completedAt: string;
  quotesFetched: number;
  errorCount: number;
  sha256Hash: string;
  status: 'TAMPER_PROOF_VALIDATED' | 'IN_PROGRESS';
  merkleRoot: string;
}

export interface PolicyChatMessage {
  id: string;
  sender: 'user' | 'analyst';
  text: string;
  timestamp: string;
  tags?: string[];
  suggestions?: string[];
  metrics?: Record<string, any>;
  source?: string;
}

export interface CarrierAnalytics {
  carrier: string;
  iataCode: string;
  category: 'LCC' | 'FSC';
  avgFare: number;
  changePct30d: number;
  marketSharePct: number;
  quotesIngested: number;
  volatilityIndex: number;
  statusBadge: 'Rising' | 'Softening' | 'Equilibrium';
  fleetActive: number;
}

export interface ChannelHealth {
  name: string;
  type: 'Direct Airline Portal' | 'Online Travel Agency (OTA)';
  quotesCount: number;
  latencyMs: number;
  uptimePct: number;
  status: 'OPTIMAL' | 'ACTIVE' | 'HIGH_LATENCY';
  lastSync: string;
}

export interface RegionalHubData {
  hubName: string;
  hubCode: string;
  region: string;
  indexValue: number;
  dodChangePct: number;
  discountVsNationalPct: number;
  trunkRoutesCount: number;
  dailyDepartures: number;
  status: 'Surging' | 'Elevated' | 'Softening';
}

export interface CpiWaterfallRow {
  corridorCode: string;
  corridorName: string;
  rpkWeightPct: number;
  inflationContributionPct: number;
  transportBps: number;
  headlineBps: number;
  status: 'CRITICAL' | 'ELEVATED' | 'SOFTENING';
}

export interface StressMatrixRow {
  scenario: string;
  airfareSwingPct: number;
  transportBps: number;
  headlineBps: number;
  rbiStatus: 'Safe Band' | 'Target Alert' | 'Breach Risk';
  dgcaAction: string;
}

export interface AnomalyRecord {
  id: string;
  corridorCode: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  observedFare: number;
  expectedCeiling: number;
  deviationPct: number;
  confidenceScore: number;
  merkleAnomalyId: string;
  timestamp: string;
  ruleCitation: string;
}
