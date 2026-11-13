/**
 * Fare rates for the online payment calculator.
 * Change the numbers here; the payment page reads everything from this file.
 * All money values are in US dollars.
 */
export const RATES = {
  /** Flat starting fare. Also the minimum fare for a one-way ride. */
  baseFare: 55,
  /** Miles covered by the base fare. */
  includedMiles: 3,
  /** Charge per mile after the included miles. */
  perMile: 3.5,
  /** Stair assistance, charged per step at each stop that needs it. */
  perStep: 2,
  /** Waiting time included at no charge, per trip. */
  freeWaitMinutes: 15,
  /** Charge per minute of waiting after the free minutes. */
  perWaitMinute: 0.75,
};

export type AirportCode = "LGA" | "JFK" | "EWR";

export const AIRPORTS: Record<AirportCode, { label: string }> = {
  LGA: { label: "LaGuardia (LGA)" },
  JFK: { label: "JFK Airport" },
  EWR: { label: "Newark (EWR)" },
};

export type PickupAreaCode = "bronx_manhattan" | "queens" | "staten_island" | "other";

/** Flat one-way airport fares by pickup area. Tolls are extra. */
export const PICKUP_AREAS: Record<
  PickupAreaCode,
  { label: string; fares: Record<AirportCode, number> }
> = {
  bronx_manhattan: {
    label: "Bronx / Manhattan (3rd Ave & 145th St)",
    fares: { LGA: 95, JFK: 140, EWR: 150 },
  },
  queens: {
    label: "Queens (Kew Gardens)",
    fares: { LGA: 95, JFK: 140, EWR: 250 },
  },
  staten_island: {
    label: "Staten Island",
    fares: { LGA: 200, JFK: 250, EWR: 160 },
  },
  other: {
    label: "Anywhere else",
    fares: { LGA: 140, JFK: 200, EWR: 250 },
  },
};

export interface FareInput {
  /** When set, the flat airport fare is used instead of miles. */
  airport?: AirportCode | "";
  /** Pickup area; required to price an airport trip. */
  pickup?: PickupAreaCode | "";
  miles: number;
  /** Steps the rider needs help with at ONE address (per direction). */
  steps: number;
  roundTrip: boolean;
  /** Total tolls for the whole trip, passed through at cost. */
  tolls?: number;
  /** Expected total waiting time for the trip, in minutes (an estimate). */
  waitMinutes?: number;
}

export interface FareBreakdown {
  rideOneWay: number;
  rideTotal: number;
  stairsPerLeg: number;
  stairsTotal: number;
  tollsTotal: number;
  waitTotal: number;
  total: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateFare({ airport, pickup, miles, steps, roundTrip, tolls, waitMinutes }: FareInput): FareBreakdown {
  const safeMiles = Math.max(0, Number.isFinite(miles) ? miles : 0);
  const safeSteps = Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0));
  const legs = roundTrip ? 2 : 1;

  const extraMiles = Math.max(0, safeMiles - RATES.includedMiles);
  const rideOneWay = airport
    ? PICKUP_AREAS[pickup || "other"].fares[airport]
    : round2(RATES.baseFare + extraMiles * RATES.perMile);
  const stairsPerLeg = round2(safeSteps * RATES.perStep);

  const rideTotal = round2(rideOneWay * legs);
  const stairsTotal = round2(stairsPerLeg * legs);
  const waitMins = Math.max(0, Number.isFinite(waitMinutes ?? 0) ? (waitMinutes ?? 0) : 0);
  const waitTotal = round2(
    Math.max(0, waitMins - RATES.freeWaitMinutes) * RATES.perWaitMinute,
  );
  const tollsTotal = round2(Math.max(0, Number.isFinite(tolls ?? 0) ? (tolls ?? 0) : 0));

  return {
    rideOneWay,
    rideTotal,
    stairsPerLeg,
    stairsTotal,
    tollsTotal,
    waitTotal,
    total: round2(rideTotal + stairsTotal + tollsTotal + waitTotal),
  };
}

/**
 * Pickup zones used to price airport trips automatically from an address.
 * A pickup within `radiusMiles` of a center point falls in that zone;
 * Staten Island is matched by its bounding box; everything else is "other".
 */
export const ZONE_CENTERS: {
  area: PickupAreaCode;
  lat: number;
  lng: number;
  radiusMiles: number;
}[] = [
  { area: "bronx_manhattan", lat: 40.8168, lng: -73.9262, radiusMiles: 3 }, // 3rd Ave & 145th St
  { area: "queens", lat: 40.7107, lng: -73.83, radiusMiles: 3 }, // Kew Gardens
];

export const STATEN_ISLAND_BOX = { south: 40.49, north: 40.65, west: -74.26, east: -74.05 };

export const AIRPORT_COORDS: Record<AirportCode, { lat: number; lng: number }> = {
  LGA: { lat: 40.7769, lng: -73.874 },
  JFK: { lat: 40.6413, lng: -73.7781 },
  EWR: { lat: 40.6895, lng: -74.1745 },
};

/** A point within this many miles of an airport counts as that airport. */
export const AIRPORT_RADIUS_MILES = 2.5;
