/**
 * Central photo registry.
 *
 * Every image used across the marketing site is defined here so it can be
 * swapped in one place. These are real Ride Access NYC photos, stored in
 * /public/photos. Passenger photos are used with the passenger's permission.
 *
 * To change any image, drop a new file in /public/photos and update the `src`
 * below. `position` sets which part of the photo stays visible when a portrait
 * photo is cropped into a landscape slot (CSS object-position, e.g. "50% 60%").
 */

export type SitePhoto = {
  /** Local path under /public (or a full URL). */
  src: string;
  /** Descriptive alt text for screen readers + SEO. */
  alt: string;
  /** Focus point when cropped. Defaults to center. */
  position?: string;
};

export const photos = {
  /** Large hero image — the first thing visitors see. */
  hero: {
    src: "/photos/george-van-ramp-front.webp",
    alt: "Ride Access NYC passenger in his wheelchair in front of our accessible minivan with the rear ramp lowered",
    position: "50% 55%",
  },

  /** Compassionate-care band on the homepage. */
  care: {
    src: "/photos/george-secured-inside.webp",
    alt: "Smiling passenger waving from his wheelchair, secured inside the Ride Access NYC van",
    position: "50% 45%",
  },

  /** About page — "Our Story" image. */
  about: {
    src: "/photos/george-street-stop.webp",
    alt: "Passenger in his wheelchair beside the Ride Access NYC van on a New York City street",
    position: "50% 62%",
  },

  /** Services pages — banner image at the top of the page body. */
  services: {
    src: "/photos/george-boarding-ramp.webp",
    alt: "Wheelchair passenger rolling up the rear ramp into the Ride Access NYC van",
    position: "50% 38%",
  },

  /** Services page — private trips for disabled students. */
  students: [
    {
      src: "/photos/van-ramp-deployed.webp",
      alt: "Ride Access NYC accessible minivan with the rear wheelchair ramp deployed and securement tie-downs inside",
      position: "50% 60%",
    },
    {
      src: "/photos/george-beside-van.webp",
      alt: "Wheelchair passenger next to the Ride Access NYC van with the ramp lowered",
      position: "50% 55%",
    },
  ],

  /** Trust gallery — a small grid that humanizes the service. */
  gallery: [
    {
      src: "/photos/van-ramp-deployed.webp",
      alt: "Rear wheelchair ramp deployed on the Ride Access NYC minivan",
      position: "50% 65%",
    },
    {
      src: "/photos/george-boarding-ramp.webp",
      alt: "Passenger boarding the van via the rear ramp",
      position: "50% 60%",
    },
    {
      src: "/photos/george-beside-van.webp",
      alt: "Passenger beside the accessible van before his trip",
      position: "50% 55%",
    },
    {
      src: "/photos/george-secured-inside.webp",
      alt: "Passenger secured in his wheelchair inside the van",
      position: "50% 40%",
    },
  ],
} satisfies Record<string, SitePhoto | SitePhoto[]>;
