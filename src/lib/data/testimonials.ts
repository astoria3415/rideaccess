export interface Testimonial {
  name: string;
  role: string;
  location: string;
  quote: string;
  rating: number;
  /**
   * Optional real photo of the person (under /public), used only with their
   * permission. When omitted, the card shows their initials instead.
   */
  image?: string;
}

/**
 * Real customer testimonials only. Each one must come from an actual
 * passenger, with their permission to publish their words (and photo, if used).
 */
export const testimonials: Testimonial[] = [
  {
    name: "George",
    role: "Ride Access NYC Customer",
    location: "New Jersey Trip",
    quote:
      "My trip to New Jersey with Ride Access NYC was an excellent experience! From beginning to end, I was truly impressed by the professionalism, care, and quality of service. I had a wonderful time and felt comfortable and well taken care of throughout the journey. It's refreshing to find a transportation service that genuinely cares about its passengers. I highly recommend Ride Access NYC to anyone looking for reliable, friendly, and professional wheelchair-accessible transportation. Thank you for making my trip such a positive and memorable experience!",
    rating: 5,
    image: "/photos/george-portrait.webp",
  },
];
