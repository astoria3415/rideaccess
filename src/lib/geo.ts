import { loadMaps } from "@/components/forms/AddressAutocomplete";
import {
  AIRPORT_COORDS,
  AIRPORT_RADIUS_MILES,
  STATEN_ISLAND_BOX,
  ZONE_CENTERS,
  type AirportCode,
  type PickupAreaCode,
} from "@/lib/pricing";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TripEstimate {
  miles: number;
  airport: AirportCode | "";
  /** Pickup area for an airport trip (the non-airport end). */
  pickup: PickupAreaCode | "";
}

interface Point {
  lat: number;
  lng: number;
}

/** Google returns either LatLng (lat()) or plain numbers (lat); accept both. */
function toPoint(loc: any): Point {
  const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
  const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new Error("Invalid location");
  }
  return { lat, lng };
}

function haversineMiles(a: Point, b: Point): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function airportAt(p: Point): AirportCode | "" {
  for (const code of Object.keys(AIRPORT_COORDS) as AirportCode[]) {
    if (haversineMiles(p, AIRPORT_COORDS[code]) <= AIRPORT_RADIUS_MILES) return code;
  }
  return "";
}

function areaOf(p: Point): PickupAreaCode {
  for (const z of ZONE_CENTERS) {
    if (haversineMiles(p, z) <= z.radiusMiles) return z.area;
  }
  const b = STATEN_ISLAND_BOX;
  if (p.lat >= b.south && p.lat <= b.north && p.lng >= b.west && p.lng <= b.east) {
    return "staten_island";
  }
  return "other";
}

/**
 * Works out miles, airport and pickup area from two typed addresses using
 * Google's Routes library. Throws if the route cannot be calculated.
 */
export async function estimateTrip(
  pickupAddress: string,
  dropoffAddress: string,
): Promise<TripEstimate> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Maps key not configured");
  loadMaps(apiKey);

  const g = (window as any).google;
  const { Route } = await g.maps.importLibrary("routes");
  const { routes } = await Route.computeRoutes({
    origin: pickupAddress,
    destination: dropoffAddress,
    travelMode: "DRIVING",
    fields: ["distanceMeters", "legs"],
  });

  const route = routes?.[0];
  const legs = route?.legs;
  const start = legs?.[0]?.startLocation;
  const end = legs?.[legs.length - 1]?.endLocation;
  if (!route || !route.distanceMeters || !start || !end) {
    throw new Error("No route found");
  }

  const from = toPoint(start);
  const to = toPoint(end);
  const miles = Math.round((route.distanceMeters / 1609.344) * 10) / 10;

  const dropAirport = airportAt(to);
  if (dropAirport) return { miles, airport: dropAirport, pickup: areaOf(from) };

  const pickAirport = airportAt(from);
  if (pickAirport) return { miles, airport: pickAirport, pickup: areaOf(to) };

  return { miles, airport: "", pickup: "" };
}
