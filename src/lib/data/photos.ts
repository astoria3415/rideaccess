/**
 * Central photo registry.
 *
 * Every image used across the marketing site is defined here so it can be
 * swapped in one place. These are Ride Access NYC's own photos, stored in
 * /public/photos. To change any image, drop a new file in /public/photos and
 * update the `src` below — the layout, cropping and alt text stay the same.
 */

export type SitePhoto = {
  /** Local path under /public (or a full URL). */
  src: string;
  /** Descriptive alt text for screen readers + SEO. */
  alt: string;
};

export const photos = {
  /** Large hero image — the first thing visitors see. */
  hero: {
    src: "/photos/pic1.png",
    alt: "Ride Access NYC branded wheelchair-accessible van on a New York City street",
  },

  /** Compassionate-care band on the homepage. */
  care: {
    src: "/photos/pic2.png",
    alt: "Ride Access NYC attendant assisting a wheelchair passenger into an accessible van",
  },

  /** About page — "Our Story" image. */
  about: {
    src: "/photos/pic3.png",
    alt: "Ride Access NYC attendant helping a senior with a walker down the van ramp",
  },

  /** Services pages — banner image at the top of the page body. */
  services: {
    src: "/photos/pic5.png",
    alt: "Wheelchair passenger boarding a Ride Access NYC accessible van via the ramp",
  },

  /** Trust gallery — a small grid that humanizes the service. */
  gallery: [
    {
      src: "/photos/pic4.png",
      alt: "Wheelchair-accessible transport van with rear ramp deployed for boarding",
    },
    {
      src: "/photos/pic7.png",
      alt: "Caregivers helping an elderly passenger with a walker out of a vehicle",
    },
    {
      src: "/photos/pic2.png",
      alt: "Attendant securing a wheelchair passenger in a Ride Access NYC van",
    },
    {
      src: "/photos/pic3.png",
      alt: "Senior passenger assisted off the accessible van ramp by a Ride Access NYC attendant",
    },
  ],
} satisfies Record<string, SitePhoto | SitePhoto[]>;
