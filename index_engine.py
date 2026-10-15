#!/usr/bin/env python3
"""
SkyFare India — National Airfare Intelligence Platform (MoSPI Price Statistics)
========================================================================
Econometric Price Index Calculation Engine (index_engine.py)

This module implements the core price index formulas prescribed by MoSPI and the
UN / ILO Consumer Price Index (CPI) Manual:
  1. Jevons Index: Geometric mean of price relatives (elementary aggregate).
  2. Laspeyres Index: Base-period weighted arithmetic index (fixed-basket).
  3. Paasche Index: Current-period weighted harmonic index (shifting-basket).
  4. Fisher Ideal Index: Superlative geometric mean of Laspeyres and Paasche (eliminates substitution bias).
  5. Route-Level & National Airfare Aggregation: Aggregates route price relatives using DGCA passenger volume weights.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
import math


# =====================================================================
# 1. ELEMENTARY AGGREGATE: JEVONS INDEX
# =====================================================================

def calculate_jevons_index(
    current_prices: List[float],
    base_prices: List[float],
    weights: Optional[List[float]] = None
) -> float:
    r"""
    Calculates the Jevons Price Index (unweighted or weighted geometric mean of price relatives).
    
    Mathematical Formulation:
      Unweighted:
        I_J = ( \prod_{i=1}^n (p_{t,i} / p_{0,i}) )^(1/n)
            = exp( (1/n) * \sum_{i=1}^n ln(p_{t,i} / p_{0,i}) )
            
      Weighted (when carrier/quote sampling weights w_i exist, where \sum w_i = 1):
        I_J^w = exp( \sum_{i=1}^n w_i * ln(p_{t,i} / p_{0,i}) )
        
    Properties:
      - Satisfies Axiom of Time Reversal: I_{0,t} * I_{t,0} = 1
      - Satisfies Circularity / Transitivity: I_{0,s} * I_{s,t} = I_{0,t}
      - Invariant to changes in currency units.
      - Best-practice recommendation by IMF/ILO for unweighted elementary aggregates.
    
    Args:
        current_prices: List of observed fares in period t (p_t).
        base_prices: List of baseline fares in base period 0 (p_0).
        weights: Optional sampling weights for each item quote.
        
    Returns:
        The Jevons index relative (multiply by 100 for index points with base=100).
    """
    if len(current_prices) != len(base_prices):
        raise ValueError("Length mismatch: current_prices and base_prices must have identical dimensions.")
    if len(current_prices) == 0:
        raise ValueError("Price list cannot be empty.")

    # Calculate log-price relatives to avoid numerical overflow
    if weights is None:
        n = len(current_prices)
        log_sum = 0.0
        for pt, p0 in zip(current_prices, base_prices):
            if pt <= 0 or p0 <= 0:
                raise ValueError(f"Fares must be strictly positive. Got p_t={pt}, p_0={p0}")
            log_sum += math.log(pt / p0)
        return math.exp(log_sum / n)
    else:
        if len(weights) != len(current_prices):
            raise ValueError("Length mismatch: weights must match prices length.")
        total_w = sum(weights)
        if total_w <= 0:
            raise ValueError("Sum of weights must be strictly positive.")
        normalized_w = [w / total_w for w in weights]
        
        weighted_log_sum = 0.0
        for pt, p0, w in zip(current_prices, base_prices, normalized_w):
            if pt <= 0 or p0 <= 0:
                raise ValueError(f"Fares must be strictly positive. Got p_t={pt}, p_0={p0}")
            weighted_log_sum += w * math.log(pt / p0)
        return math.exp(weighted_log_sum)


# =====================================================================
# 2. HIGHER-LEVEL AGGREGATE: LASPEYRES INDEX
# =====================================================================

def calculate_laspeyres_index(
    current_prices: List[float],
    base_prices: List[float],
    base_quantities: List[float]
) -> float:
    r"""
    Calculates the Laspeyres Price Index (L).
    
    Uses base-period quantities (q_0) as weights to aggregate price movements.
    This reflects the cost of purchasing the historical base-period passenger basket
    at current-period fares versus base-period fares.
    
    Mathematical Formulation:
      L = ( \sum p_{t,i} * q_{0,i} ) / ( \sum p_{0,i} * q_{0,i} ) * 100
      
      Equivalently expressed as expenditure-share weighted arithmetic average:
      L = \sum w_{0,i} * (p_{t,i} / p_{0,i}) * 100
      where w_{0,i} = (p_{0,i} * q_{0,i}) / \sum (p_{0,k} * q_{0,k})
      
    Args:
        current_prices: Current prices p_t.
        base_prices: Base period prices p_0.
        base_quantities: Base period passenger volume / quantity q_0.
        
    Returns:
        Laspeyres index value (base period = 100.0).
    """
    if not (len(current_prices) == len(base_prices) == len(base_quantities)):
        raise ValueError("Dimension mismatch between prices and base quantities.")
    if len(current_prices) == 0:
        raise ValueError("Input lists cannot be empty.")

    current_expenditure_with_base_q = 0.0
    base_expenditure = 0.0

    for pt, p0, q0 in zip(current_prices, base_prices, base_quantities):
        if p0 <= 0 or pt <= 0 or q0 < 0:
            raise ValueError(f"Invalid price or quantity value: pt={pt}, p0={p0}, q0={q0}")
        current_expenditure_with_base_q += pt * q0
        base_expenditure += p0 * q0

    if base_expenditure == 0:
        raise ZeroDivisionError("Base period expenditure sum cannot be zero.")

    return (current_expenditure_with_base_q / base_expenditure) * 100.0


# =====================================================================
# 3. HIGHER-LEVEL AGGREGATE: PAASCHE INDEX
# =====================================================================

def calculate_paasche_index(
    current_prices: List[float],
    base_prices: List[float],
    current_quantities: List[float]
) -> float:
    r"""
    Calculates the Paasche Price Index (P).
    
    Uses current-period quantities (q_t) as weights to evaluate price changes.
    Measures the current travel volume basket evaluated at current prices compared
    to what that same volume would have cost at base prices.
    
    Mathematical Formulation:
      P = ( \sum p_{t,i} * q_{t,i} ) / ( \sum p_{0,i} * q_{t,i} ) * 100
      
      Equivalently expressed as a harmonic average weighted by current expenditure shares:
      P = [ \sum w_{t,i} * (p_{t,i} / p_{0,i})^(-1) ]^(-1) * 100
      
    Args:
        current_prices: Current prices p_t.
        base_prices: Base period prices p_0.
        current_quantities: Current period passenger volume / quantity q_t.
        
    Returns:
        Paasche index value (base period = 100.0).
    """
    if not (len(current_prices) == len(base_prices) == len(current_quantities)):
        raise ValueError("Dimension mismatch between prices and current quantities.")
    if len(current_prices) == 0:
        raise ValueError("Input lists cannot be empty.")

    current_expenditure = 0.0
    base_expenditure_with_current_q = 0.0

    for pt, p0, qt in zip(current_prices, base_prices, current_quantities):
        if p0 <= 0 or pt <= 0 or qt < 0:
            raise ValueError(f"Invalid price or quantity value: pt={pt}, p0={p0}, qt={qt}")
        current_expenditure += pt * qt
        base_expenditure_with_current_q += p0 * qt

    if base_expenditure_with_current_q == 0:
        raise ZeroDivisionError("Base expenditure evaluated with current quantities cannot be zero.")

    return (current_expenditure / base_expenditure_with_current_q) * 100.0


# =====================================================================
# 4. SUPERLATIVE AGGREGATE: FISHER IDEAL INDEX
# =====================================================================

def calculate_fisher_ideal_index(laspeyres: float, paasche: float) -> float:
    r"""
    Calculates the Fisher Ideal Price Index (F).
    
    Defined as the geometric mean of the Laspeyres index and the Paasche index.
    
    Mathematical Formulation:
      F = \sqrt{ L * P }
      
    Economic Significance:
      - It is a 'Superlative Index' (Diewert, 1976).
      - Laspeyres generally overstates inflation (substitution bias: consumers switch away from dearer routes).
      - Paasche generally understates inflation.
      - Fisher Ideal provides an exact second-order approximation to the true Cost of Living Index (COLI).
      - Satisfies both the Factor Reversal and Time Reversal Tests.
    
    Args:
        laspeyres: Laspeyres price index value.
        paasche: Paasche price index value.
        
    Returns:
        Fisher Ideal index value.
    """
    if laspeyres <= 0 or paasche <= 0:
        raise ValueError(f"Laspeyres ({laspeyres}) and Paasche ({paasche}) must both be positive.")
    return math.sqrt(laspeyres * paasche)


def calculate_tornqvist_index(
    current_prices: List[float],
    base_prices: List[float],
    base_quantities: List[float],
    current_quantities: List[float],
) -> float:
    """
    Calculates the Törnqvist price index, a chain-linked superlative index that
    incorporates both base and current quantity shares.

    Formula:
      I_T = exp( sum_i [0.5 * (s_ti + s_0i) * ln(p_ti / p_0i)] )

    where:
      s_ti = (p_ti * q_ti) / sum_j (p_tj * q_tj)
      s_0i = (p_0i * q_0i) / sum_j (p_0j * q_0j)

    Returns the index in points, with base period = 100.
    """
    if not (
        len(current_prices) == len(base_prices) == len(base_quantities) == len(current_quantities)
    ):
        raise ValueError("All input lists must have the same length.")
    if len(current_prices) == 0:
        raise ValueError("Input lists cannot be empty.")

    base_expenditure = sum(p0 * q0 for p0, q0 in zip(base_prices, base_quantities))
    current_expenditure = sum(pt * qt for pt, qt in zip(current_prices, current_quantities))

    if base_expenditure <= 0 or current_expenditure <= 0:
        raise ZeroDivisionError("Base and current expenditure totals must be positive.")

    weighted_log_sum = 0.0
    for pt, p0, qt, q0 in zip(current_prices, base_prices, current_quantities, base_quantities):
        if pt <= 0 or p0 <= 0 or qt < 0 or q0 < 0:
            raise ValueError(f"Invalid values detected: pt={pt}, p0={p0}, qt={qt}, q0={q0}")

        share_current = (pt * qt) / current_expenditure
        share_base = (p0 * q0) / base_expenditure
        weighted_log_sum += 0.5 * (share_current + share_base) * math.log(pt / p0)

    return math.exp(weighted_log_sum) * 100.0


# =====================================================================
# 5. ROUTE-LEVEL & NATIONAL AGGREGATION ENGINE
# =====================================================================

@dataclass
class FlightQuote:
    """Represents a single scraped flight price observation."""
    airline: str
    flight_number: str
    horizon: str       # e.g., 'T+1', 'T+7', 'T+15', 'T+30', 'T+45'
    current_fare: float
    base_fare: float


@dataclass
class RouteData:
    """Represents a domestic air corridor with quotes, traffic, and baseline figures."""
    route_id: str                      # e.g., 'DEL-BOM'
    origin_iata: str                   # 'DEL'
    destination_iata: str              # 'BOM'
    base_passenger_volume: float       # q_0 (DGCA base pax volume, e.g. 2,450,000)
    current_passenger_volume: float    # q_t (Current period pax volume, e.g. 2,520,000)
    quotes: List[FlightQuote] = field(default_factory=list)


@dataclass
class RouteIndexResult:
    """Output metrics for a single air corridor."""
    route_id: str
    origin_iata: str
    destination_iata: str
    quote_count: int
    jevons_relative: float             # Elementary price relative (e.g., 1.182 for +18.2%)
    base_fare_avg: float
    current_fare_avg: float
    percentage_change: float
    route_weight_pct: float            # Share of national passenger traffic
    imputed: bool = False


@dataclass
class NationalIndexSummary:
    """Final aggregate indices and economic transmission metrics for MoSPI."""
    laspeyres_index: float
    paasche_index: float
    fisher_ideal_index: float
    jevons_macro_index: float
    transport_cpi_impact_bps: float    # Basis points transmission to Transport CPI
    headline_cpi_impact_bps: float     # Basis points transmission to Headline All-India CPI
    routes_evaluated: int
    total_quotes_processed: int
    route_breakdown: List[RouteIndexResult]
    imputed_routes_count: int = 0


class AirfareIndexEngine:
    """
    Production-grade econometric engine that computes micro-level and macro-level
    airfare price indices for India's domestic aviation sector.
    """
    # Standard MoSPI / CSO Weights in National Accounts:
    AIR_TRANSPORT_WEIGHT_IN_TRANSPORT_GROUP = 0.0680   # ~6.8% weight of airfares within Transport sub-index
    AIR_TRANSPORT_WEIGHT_IN_HEADLINE_CPI = 0.0058      # ~0.58% (58 bps) direct & second-round weight in Headline CPI

    def __init__(self, routes: List[RouteData], enable_locf_imputation: bool = True):
        self.routes = routes
        self.enable_locf_imputation = enable_locf_imputation

    def compute_route_elementary_indices(self) -> List[RouteIndexResult]:
        """
        Step 1: For each route, compute the elementary Jevons index using individual flight quotes.
        """
        results: List[RouteIndexResult] = []
        total_national_base_pax = sum(r.base_passenger_volume for r in self.routes)

        for route in self.routes:
            if not route.quotes:
                if self.enable_locf_imputation:
                    weight_pct = (
                        (route.base_passenger_volume / total_national_base_pax) * 100.0
                        if total_national_base_pax > 0
                        else 0.0
                    )
                    results.append(
                        RouteIndexResult(
                            route_id=route.route_id,
                            origin_iata=route.origin_iata,
                            destination_iata=route.destination_iata,
                            quote_count=0,
                            jevons_relative=1.0,
                            base_fare_avg=5500.0,
                            current_fare_avg=5500.0,
                            percentage_change=0.0,
                            route_weight_pct=weight_pct,
                            imputed=True,
                        )
                    )
                continue

            current_prices = [q.current_fare for q in route.quotes]
            base_prices = [q.base_fare for q in route.quotes]

            # Elementary Jevons index across all carrier quotes and booking horizons
            jevons_rel = calculate_jevons_index(current_prices, base_prices)
            
            avg_base = sum(base_prices) / len(base_prices)
            avg_curr = sum(current_prices) / len(current_prices)
            pct_change = (jevons_rel - 1.0) * 100.0
            weight_pct = (route.base_passenger_volume / total_national_base_pax) * 100.0 if total_national_base_pax > 0 else 0.0

            results.append(RouteIndexResult(
                route_id=route.route_id,
                origin_iata=route.origin_iata,
                destination_iata=route.destination_iata,
                quote_count=len(route.quotes),
                jevons_relative=jevons_rel,
                base_fare_avg=avg_base,
                current_fare_avg=avg_curr,
                percentage_change=pct_change,
                route_weight_pct=weight_pct
            ))

        return results

    def compute_national_indices(self) -> NationalIndexSummary:
        """
        Step 2: Aggregate route-level price relatives using DGCA passenger volume route weights
        to produce the National Airfare Index (Laspeyres, Paasche, Fisher, and Jevons).
        """
        route_results = self.compute_route_elementary_indices()
        if not route_results:
            raise ValueError("No route observations available to aggregate.")

        total_base_pax = sum(r.base_passenger_volume for r in self.routes)
        total_current_pax = sum(r.current_passenger_volume for r in self.routes)
        results_by_route = {result.route_id: result for result in route_results}

        # Prepare aggregated vectors for Laspeyres and Paasche
        # Route representative price is the baseline price (p_0) and current price (p_t = p_0 * jevons_relative)
        p0_vec: List[float] = []
        pt_vec: List[float] = []
        q0_vec: List[float] = []
        qt_vec: List[float] = []
        weights_vec: List[float] = []

        for route in self.routes:
            result = results_by_route.get(route.route_id)
            if result is None:
                continue
            p0 = result.base_fare_avg
            pt = p0 * result.jevons_relative  # Representative current fare via Jevons
            q0 = route.base_passenger_volume
            qt = route.current_passenger_volume
            w = q0 / total_base_pax

            p0_vec.append(p0)
            pt_vec.append(pt)
            q0_vec.append(q0)
            qt_vec.append(qt)
            weights_vec.append(w)

        # 1. Laspeyres Index (Fixed base-period passenger volumes)
        laspeyres = calculate_laspeyres_index(pt_vec, p0_vec, q0_vec)

        # 2. Paasche Index (Current-period passenger volumes)
        paasche = calculate_paasche_index(pt_vec, p0_vec, qt_vec)

        # 3. Fisher Ideal Index (Superlative geometric mean)
        fisher = calculate_fisher_ideal_index(laspeyres, paasche)

        # 4. National Jevons Macro Index (Geometric mean of route relatives weighted by passenger share)
        jevons_macro = calculate_jevons_index(pt_vec, p0_vec, weights=weights_vec) * 100.0

        # 5. Economic Transmission into MoSPI CPI:
        # Rate of change of the airfare index: (Fisher - 100.0) %
        airfare_inflation_pct = fisher - 100.0

        # Transport CPI impact in basis points (1% change * weight * 100)
        transport_cpi_bps = airfare_inflation_pct * self.AIR_TRANSPORT_WEIGHT_IN_TRANSPORT_GROUP * 100.0
        headline_cpi_bps = airfare_inflation_pct * self.AIR_TRANSPORT_WEIGHT_IN_HEADLINE_CPI * 100.0

        total_quotes = sum(r.quote_count for r in route_results)

        return NationalIndexSummary(
            laspeyres_index=round(laspeyres, 2),
            paasche_index=round(paasche, 2),
            fisher_ideal_index=round(fisher, 2),
            jevons_macro_index=round(jevons_macro, 2),
            transport_cpi_impact_bps=round(transport_cpi_bps, 2),
            headline_cpi_impact_bps=round(headline_cpi_bps, 2),
            routes_evaluated=len(route_results),
            total_quotes_processed=total_quotes,
            route_breakdown=route_results,
            imputed_routes_count=sum(1 for r in route_results if r.imputed),
        )


# =====================================================================
# 6. MISSING DATA IMPUTATION ENGINE (MoSPI / UN-CPI LOCF SPECIFICATION)
# =====================================================================

def apply_locf_to_series(
    series: List[Optional[float]],
    fallback_baseline: Optional[float] = None,
) -> List[float]:
    r"""
    Applies the Last Observation Carried Forward (LOCF) rule to a discrete price series.
    Prescribed by the UN/ILO CPI Manual (Section 10.38) for temporarily unavailable items.
    
    If an element is None, NaN, or non-positive:
      - Carries forward the most recent valid positive price.
      - If leading values are missing, uses fallback_baseline (or backward fill if possible).
    """
    imputed: List[float] = []
    last_valid: Optional[float] = None

    # First pass: identify initial positive baseline if not explicitly supplied
    if fallback_baseline is None or fallback_baseline <= 0:
        for val in series:
            if val is not None and not (isinstance(val, float) and math.isnan(val)) and val > 0:
                fallback_baseline = float(val)
                break

    for val in series:
        if val is not None and not (isinstance(val, float) and math.isnan(val)) and val > 0:
            last_valid = float(val)
            imputed.append(last_valid)
        else:
            if last_valid is not None:
                imputed.append(last_valid)
            elif fallback_baseline is not None and fallback_baseline > 0:
                imputed.append(float(fallback_baseline))
            else:
                raise ValueError("Cannot apply LOCF: leading values are missing and no fallback baseline was provided.")

    return imputed


def impute_missing_cells_locf(
    current_cells: Dict[Tuple[str, str], float],
    expected_routes: List[str],
    expected_horizons: Tuple[str, ...] = ("T+1", "T+7", "T+15", "T+30", "T+45"),
    historical_fallback: Optional[Dict[Tuple[str, str], float]] = None,
    route_baselines: Optional[Dict[str, float]] = None,
) -> Tuple[Dict[Tuple[str, str], float], int]:
    r"""
    Imputes missing (route_code, booking_horizon) cells using Last Observation Carried Forward (LOCF).
    
    Guarantees econometric stability across superlative price indices (Laspeyres, Paasche, Fisher)
    when network dropouts, API timeouts, or flight sell-outs cause gaps in high-frequency scraping.
    
    Args:
        current_cells: Dictionary of observed cell averages: (route_code, horizon) -> fare.
        expected_routes: List of all 14 DGCA domestic corridors.
        expected_horizons: All 5 mandatory MoSPI horizons.
        historical_fallback: Last known period's fare for (route_code, horizon).
        route_baselines: General 30-day baseline average by corridor.
        
    Returns:
        Tuple of (complete_cells_dict, count_of_imputed_cells).
    """
    completed_cells: Dict[Tuple[str, str], float] = dict(current_cells)
    imputed_count = 0
    hist = historical_fallback or {}
    baselines = route_baselines or {}

    for route in expected_routes:
        # Route-level average across currently available horizons as an anchor
        observed_fares_for_route = [
            fare for (r, h), fare in current_cells.items() if r == route and fare > 0
        ]
        route_current_mean = (
            sum(observed_fares_for_route) / len(observed_fares_for_route)
            if observed_fares_for_route
            else None
        )

        for horizon in expected_horizons:
            key = (route, horizon)
            if key not in completed_cells or completed_cells[key] <= 0:
                imputed_val: Optional[float] = None
                
                # 1. Primary LOCF: Carry forward last period's exact cell observation
                if key in hist and hist[key] > 0:
                    imputed_val = hist[key]
                # 2. Secondary LOCF: Current period route mean
                elif route_current_mean is not None:
                    imputed_val = route_current_mean
                # 3. Tertiary LOCF: Historical corridor 30-day baseline
                elif route in baselines and baselines[route] > 0:
                    imputed_val = baselines[route]
                else:
                    # Final safety fallback: national domestic benchmark average
                    imputed_val = 5500.0

                completed_cells[key] = round(float(imputed_val), 2)
                imputed_count += 1

    return completed_cells, imputed_count


# =====================================================================
# 7. DEMONSTRATION & VERIFICATION RUNNER
# =====================================================================

def get_sample_dgca_corridor_dataset() -> List[RouteData]:
    """
    Builds realistic sample data for top Indian domestic routes (DEL-BOM, BOM-DEL, DEL-BLR, CCU-DEL, BLR-HYD)
    with realistic passenger volumes and flight quotes across carriers and lead-times.
    """
    routes: List[RouteData] = []

    # Route 1: BOM -> DEL (Surge due to business peak & slot restrictions)
    routes.append(RouteData(
        route_id="BOM-DEL",
        origin_iata="BOM",
        destination_iata="DEL",
        base_passenger_volume=2540000,   # Base annual passenger traffic
        current_passenger_volume=2480000, # Current volume (slight capacity constraint)
        quotes=[
            FlightQuote("IndiGo", "6E-5321", "T+1", 11250, 8400),
            FlightQuote("Air India", "AI-806", "T+1", 12400, 8900),
            FlightQuote("Akasa Air", "QP-1102", "T+7", 8900, 7200),
            FlightQuote("IndiGo", "6E-205", "T+15", 7400, 6800),
            FlightQuote("SpiceJet", "SG-8169", "T+30", 5950, 5600),
        ]
    ))

    # Route 2: DEL -> BOM (High demand corridor)
    routes.append(RouteData(
        route_id="DEL-BOM",
        origin_iata="DEL",
        destination_iata="BOM",
        base_passenger_volume=2680000,
        current_passenger_volume=2720000,
        quotes=[
            FlightQuote("IndiGo", "6E-204", "T+1", 9950, 8100),
            FlightQuote("Air India", "AI-865", "T+1", 10800, 8800),
            FlightQuote("Akasa Air", "QP-1105", "T+7", 8100, 7100),
            FlightQuote("IndiGo", "6E-678", "T+15", 6900, 6400),
            FlightQuote("SpiceJet", "SG-8701", "T+30", 5400, 5200),
        ]
    ))

    # Route 3: DEL -> BLR (Tech corridor, steady increase)
    routes.append(RouteData(
        route_id="DEL-BLR",
        origin_iata="DEL",
        destination_iata="BLR",
        base_passenger_volume=1920000,
        current_passenger_volume=1980000,
        quotes=[
            FlightQuote("IndiGo", "6E-2134", "T+1", 8900, 7900),
            FlightQuote("Air India", "AI-504", "T+7", 7800, 7400),
            FlightQuote("Akasa Air", "QP-1331", "T+15", 6450, 6200),
            FlightQuote("IndiGo", "6E-5012", "T+30", 5200, 5100),
        ]
    ))

    # Route 4: CCU -> DEL (Eastern trunk route, soft leisure season)
    routes.append(RouteData(
        route_id="CCU-DEL",
        origin_iata="CCU",
        destination_iata="DEL",
        base_passenger_volume=1350000,
        current_passenger_volume=1410000,
        quotes=[
            FlightQuote("IndiGo", "6E-251", "T+1", 6200, 6800),
            FlightQuote("Air India", "AI-763", "T+7", 5600, 5900),
            FlightQuote("SpiceJet", "SG-273", "T+15", 4800, 5100),
            FlightQuote("IndiGo", "6E-804", "T+30", 4100, 4300),
        ]
    ))

    # Route 5: BLR -> HYD (Short regional connector, stable pricing)
    routes.append(RouteData(
        route_id="BLR-HYD",
        origin_iata="BLR",
        destination_iata="HYD",
        base_passenger_volume=980000,
        current_passenger_volume=1020000,
        quotes=[
            FlightQuote("IndiGo", "6E-442", "T+1", 3900, 3950),
            FlightQuote("Air India", "AI-542", "T+7", 3400, 3500),
            FlightQuote("Akasa Air", "QP-1512", "T+15", 2800, 2900),
            FlightQuote("IndiGo", "6E-711", "T+30", 2400, 2450),
        ]
    ))

    return routes


def print_index_report():
    """Executes calculation and outputs a MoSPI-grade statistical summary."""
    print("=" * 80)
    print("SKYFARE INDIA: ECONOMETRIC AIRFARE INDEX ENGINE (MoSPI Price Statistics)")
    print("=" * 80)

    routes = get_sample_dgca_corridor_dataset()
    engine = AirfareIndexEngine(routes)
    summary = engine.compute_national_indices()

    print(f"Total Routes Evaluated       : {summary.routes_evaluated}")
    print(f"Microdata Quotes Processed   : {summary.total_quotes_processed}")
    print("-" * 80)
    print("PRIMARY AGGREGATE PRICE INDICES (Base = 100.00):")
    print(f"  • Laspeyres Index (Base-Weighted)     : {summary.laspeyres_index:.2f}  (+{summary.laspeyres_index - 100.0:.2f}%)")
    print(f"  • Paasche Index (Current-Weighted)    : {summary.paasche_index:.2f}  (+{summary.paasche_index - 100.0:.2f}%)")
    print(f"  • Fisher Ideal Index (Superlative)    : {summary.fisher_ideal_index:.2f}  (+{summary.fisher_ideal_index - 100.0:.2f}%)")
    print(f"  • Jevons Macro Index (Geometric)      : {summary.jevons_macro_index:.2f}  (+{summary.jevons_macro_index - 100.0:.2f}%)")
    print("-" * 80)
    print("MoSPI CONSUMER PRICE INDEX (CPI) TRANSMISSION:")
    print(f"  • Impact on Transport CPI Group       : +{summary.transport_cpi_impact_bps:.2f} bps")
    print(f"  • Impact on All-India Headline CPI    : +{summary.headline_cpi_impact_bps:.2f} bps")
    print("-" * 80)
    print("CORRIDOR BREAKDOWN (Elementary Jevons & Volume Weights):")
    print(f"{'Route':<10} | {'Base Avg (₹)':<12} | {'Current (₹)':<12} | {'Jevons Rel':<10} | {'Change (%)':<10} | {'Weight (%)':<10}")
    print("-" * 75)
    for r in summary.route_breakdown:
        print(f"{r.route_id:<10} | ₹{r.base_fare_avg:>10.2f} | ₹{r.current_fare_avg:>10.2f} | {r.jevons_relative:>10.4f} | {r.percentage_change:>+9.2f}% | {r.route_weight_pct:>9.2f}%")
    print("=" * 80)


if __name__ == "__main__":
    print_index_report()
