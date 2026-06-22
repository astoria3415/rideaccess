/**
 * Central site configuration. Single source of truth for NAP
 * (Name / Address / Phone) data used across SEO + UI.
 */
export const site = {
  name: "Ride Access NYC",
  legalName: "Ride Access NYC LLC",
  shortName: "Ride Access NYC",
  description:
    "Premium private wheelchair and non-emergency medical transportation across New York City. Safe, reliable, professional door-to-door rides for medical appointments, hospital discharges, dialysis treatments and everyday travel.",
  url: "https://www.rideaccessnyc.com",
  phone: "(929) 206-3210",
  phoneRaw: "+19292063210",
  whatsapp: "19292063210",
  whatsappMessage:
    "Hello Ride Access NYC. I would like a transportation quote.",
  email: "contact@rideaccessnyc.com",
  ogImage: "/og-image.png",
  serviceAreas: [
    "Manhattan",
    "Brooklyn",
    "Queens",
    "Bronx",
    "Staten Island",
    "Long Island",
    "Westchester County",
  ],
  hours: "24/7 — Scheduled & On-Demand",
  social: {
    facebook: "https://facebook.com/rideaccessnyc",
    instagram: "https://instagram.com/rideaccessnyc",
  },
} as const;

export type Site = typeof site;
