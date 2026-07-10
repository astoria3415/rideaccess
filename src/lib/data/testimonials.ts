export interface Testimonial {
  name: string;
  role: string;
  location: string;
  quote: string;
  rating: number;
  /** Portrait of the person giving the testimonial (under /public). */
  image: string;
}

export const testimonials: Testimonial[] = [
  {
    name: "Maria DeLuca",
    role: "Daughter & Caregiver",
    location: "Brooklyn, NY",
    quote:
      "My mother needs dialysis three times a week and Ride Access NYC has never once let us down. The drivers are patient, kind, and always on time. It has taken so much stress off our family.",
    rating: 5,
    image: "/photos/testimonial1.jpg",
  },
  {
    name: "James Okafor",
    role: "Discharge Coordinator",
    location: "Mount Sinai, Manhattan",
    quote:
      "As a case manager I need a transportation partner I can count on. Their team coordinates discharges seamlessly and treats every patient with real dignity. They're my first call.",
    rating: 5,
    image: "/photos/testimonial2.jpg",
  },
  {
    name: "Eleanor Whitfield",
    role: "Passenger",
    location: "Westchester County",
    quote:
      "After my hip surgery I was nervous about getting to follow-up appointments. The driver helped me from my front door to the car and back. I felt completely safe the entire time.",
    rating: 5,
    image: "/photos/testimonial3.jpg",
  },
  {
    name: "Robert Hsu",
    role: "Son of Passenger",
    location: "Queens, NY",
    quote:
      "Booking was simple, the van was spotless, and the wheelchair lift made everything easy for my father. Truly a premium, professional service. Highly recommended.",
    rating: 5,
    image: "/photos/testimonial4.jpg",
  },
  {
    name: "Sister Agnes Romero",
    role: "Nursing Home Administrator",
    location: "The Bronx, NY",
    quote:
      "We rely on Ride Access NYC for our residents' appointments. Dependable scheduling, compassionate drivers, and clear communication every single time.",
    rating: 5,
    image: "/photos/testimonial5.jpg",
  },
  {
    name: "Anthony Rossi",
    role: "Passenger",
    location: "Long Island, NY",
    quote:
      "The airport transfer to JFK was flawless. They handled my luggage, secured my wheelchair, and got me to my gate with time to spare. I'll never use anyone else.",
    rating: 5,
    image: "/photos/testimonial6.jpg",
  },
];
