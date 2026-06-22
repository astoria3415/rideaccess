import {
  Accessibility,
  Ambulance,
  HeartPulse,
  Hospital,
  Plane,
  Route,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface Service {
  slug: string;
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  /** Whether the service has its own dedicated marketing page. */
  hasPage: boolean;
}

export const services: Service[] = [
  {
    slug: "wheelchair-transportation",
    title: "Private Wheelchair Transportation",
    short: "ADA-equipped vans with secured wheelchair lifts and trained drivers.",
    description:
      "Our flagship service. Each vehicle is equipped with hydraulic lifts or ramps and four-point securement systems so passengers ride seated safely in their own wheelchair. Drivers are trained in safe transfer and securement procedures.",
    icon: Accessibility,
    features: [
      "Hydraulic lift & ramp equipped vans",
      "Four-point wheelchair securement",
      "Trained, background-checked drivers",
      "Door-to-door and door-through-door assistance",
      "Manual & power wheelchair compatible",
    ],
    hasPage: true,
  },
  {
    slug: "ambulatory-transportation",
    title: "Ambulatory Transportation",
    short:
      "Comfortable assisted rides for passengers who can walk with support.",
    description:
      "For passengers who do not require a wheelchair but still benefit from a steady hand. Our drivers provide curb-to-curb and door-to-door assistance in clean, comfortable sedans and vans.",
    icon: Users,
    features: [
      "Assisted entry and exit",
      "Comfortable, sanitized vehicles",
      "Companion seating available",
      "Flexible scheduling",
    ],
    hasPage: false,
  },
  {
    slug: "hospital-discharge-transportation",
    title: "Hospital Discharge Transportation",
    short: "Reliable, on-time pickups coordinated with discharge planners.",
    description:
      "We coordinate directly with case managers and discharge planners to ensure patients get home safely and on schedule. Same-day and short-notice discharges are welcome.",
    icon: Hospital,
    features: [
      "Coordinated with discharge planners",
      "Same-day & short-notice availability",
      "Wheelchair and stretcher-chair options",
      "Safe transfer to home or facility",
    ],
    hasPage: true,
  },
  {
    slug: "dialysis-transportation",
    title: "Dialysis Transportation",
    short: "Dependable recurring rides built around your treatment schedule.",
    description:
      "Standing, recurring appointments are our specialty. We build a consistent schedule around your dialysis center's treatment times with the same reliable service every visit.",
    icon: HeartPulse,
    features: [
      "Recurring standing appointments",
      "On-time, every time scheduling",
      "Round-trip coordination",
      "Patient-focused, gentle service",
    ],
    hasPage: true,
  },
  {
    slug: "doctor-appointment-transportation",
    title: "Doctor Appointment Transportation",
    short: "Stress-free rides to and from medical appointments.",
    description:
      "Never miss a check-up, specialist visit, or follow-up. We get passengers to appointments early and wait or return for the trip home.",
    icon: Stethoscope,
    features: [
      "On-time appointment arrivals",
      "Wait-and-return options",
      "Round-trip booking",
      "Friendly, patient drivers",
    ],
    hasPage: false,
  },
  {
    slug: "airport-transportation",
    title: "Airport Transportation",
    short: "Accessible airport transfers to JFK, LaGuardia & Newark.",
    description:
      "Wheelchair-accessible transfers to and from JFK, LaGuardia, and Newark airports with luggage assistance and flight-time coordination.",
    icon: Plane,
    features: [
      "JFK, LGA & EWR coverage",
      "Wheelchair-accessible vehicles",
      "Luggage assistance",
      "Flight-time coordination",
    ],
    hasPage: true,
  },
  {
    slug: "long-distance-medical-transportation",
    title: "Long Distance Medical Transportation",
    short: "Comfortable long-haul medical transport beyond the metro area.",
    description:
      "Need to travel to a specialist, rehab facility, or family member out of the region? We provide comfortable, supervised long-distance medical transportation.",
    icon: Route,
    features: [
      "Inter-city & out-of-state trips",
      "Comfort stops as needed",
      "Wheelchair-accessible vehicles",
      "Single point-of-contact coordination",
    ],
    hasPage: false,
  },
  {
    slug: "senior-transportation",
    title: "Senior Transportation",
    short: "Patient, compassionate rides for older adults.",
    description:
      "Errands, social visits, religious services, and appointments. We give seniors and their families peace of mind with patient, compassionate, door-to-door service.",
    icon: Ambulance,
    features: [
      "Door-to-door assistance",
      "Patient, compassionate drivers",
      "Errands & social outings",
      "Family peace of mind",
    ],
    hasPage: false,
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
