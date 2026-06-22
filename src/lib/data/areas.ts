export interface ServiceArea {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  intro: string;
  landmarks: string[];
  hubs: string[];
}

export const serviceAreas: ServiceArea[] = [
  {
    slug: "manhattan",
    name: "Manhattan",
    region: "New York City",
    blurb: "Accessible medical transportation across all of Manhattan.",
    intro:
      "From the Financial District to Washington Heights, Ride Access NYC provides dependable wheelchair and ambulatory transportation throughout Manhattan. We navigate busy midtown traffic so your loved ones arrive calm and on time.",
    landmarks: [
      "NYU Langone Health",
      "Mount Sinai Hospital",
      "NewYork-Presbyterian / Weill Cornell",
      "Memorial Sloan Kettering",
      "Bellevue Hospital Center",
    ],
    hubs: ["Upper East Side", "Harlem", "Midtown", "Lower Manhattan", "Chelsea"],
  },
  {
    slug: "brooklyn",
    name: "Brooklyn",
    region: "New York City",
    blurb: "Wheelchair van service across every Brooklyn neighborhood.",
    intro:
      "Ride Access NYC serves all of Brooklyn with reliable, accessible transportation — from Coney Island to Williamsburg. We specialize in recurring dialysis and rehab transportation for Brooklyn residents.",
    landmarks: [
      "Maimonides Medical Center",
      "NYU Langone — Brooklyn",
      "Brooklyn Methodist Hospital",
      "Kings County Hospital Center",
      "SUNY Downstate",
    ],
    hubs: ["Bay Ridge", "Flatbush", "Park Slope", "Bensonhurst", "Crown Heights"],
  },
  {
    slug: "queens",
    name: "Queens",
    region: "New York City",
    blurb: "Door-to-door accessible rides throughout Queens.",
    intro:
      "Covering Astoria to the Rockaways, Ride Access NYC delivers compassionate medical transportation across Queens, including airport transfers to JFK and LaGuardia.",
    landmarks: [
      "NewYork-Presbyterian Queens",
      "Elmhurst Hospital Center",
      "Jamaica Hospital Medical Center",
      "Flushing Hospital Medical Center",
      "LaGuardia & JFK Airports",
    ],
    hubs: ["Astoria", "Flushing", "Jamaica", "Forest Hills", "Long Island City"],
  },
  {
    slug: "bronx",
    name: "Bronx",
    region: "New York City",
    blurb: "Trusted wheelchair transportation across the Bronx.",
    intro:
      "Ride Access NYC provides safe, on-time accessible transportation throughout the Bronx, with a focus on recurring dialysis and discharge transportation for area hospitals.",
    landmarks: [
      "Montefiore Medical Center",
      "Jacobi Medical Center",
      "St. Barnabas Hospital",
      "BronxCare Health System",
      "Calvary Hospital",
    ],
    hubs: ["Riverdale", "Fordham", "Pelham Bay", "Morrisania", "Throgs Neck"],
  },
  {
    slug: "staten-island",
    name: "Staten Island",
    region: "New York City",
    blurb: "Accessible medical transportation across Staten Island.",
    intro:
      "From St. George to Tottenville, Ride Access NYC offers comfortable, accessible transportation across Staten Island, including trips over the bridges to Brooklyn and New Jersey medical centers.",
    landmarks: [
      "Staten Island University Hospital",
      "Richmond University Medical Center",
      "SIUH — South",
    ],
    hubs: ["St. George", "New Dorp", "Great Kills", "Tottenville", "Port Richmond"],
  },
  {
    slug: "long-island",
    name: "Long Island",
    region: "New York Metro",
    blurb: "Wheelchair-accessible transportation across Nassau & Suffolk.",
    intro:
      "Ride Access NYC extends premium accessible transportation across Nassau and Suffolk counties — for appointments, discharges, dialysis, and trips into New York City.",
    landmarks: [
      "NYU Langone — Long Island",
      "Northwell Health facilities",
      "Stony Brook University Hospital",
      "Mount Sinai South Nassau",
    ],
    hubs: ["Hempstead", "Mineola", "Huntington", "Garden City", "Babylon"],
  },
  {
    slug: "westchester",
    name: "Westchester County",
    region: "New York Metro",
    blurb: "Reliable accessible rides throughout Westchester County.",
    intro:
      "Ride Access NYC serves Westchester County with dependable wheelchair and ambulatory transportation — connecting residents to local hospitals and into New York City for specialized care.",
    landmarks: [
      "White Plains Hospital",
      "Westchester Medical Center",
      "Phelps Hospital — Northwell",
      "NewYork-Presbyterian Lawrence",
    ],
    hubs: ["White Plains", "Yonkers", "New Rochelle", "Mount Vernon", "Scarsdale"],
  },
];

export function getServiceArea(slug: string) {
  return serviceAreas.find((a) => a.slug === slug);
}
