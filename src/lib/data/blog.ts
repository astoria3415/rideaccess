export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readMinutes: number;
  body: string[];
}

/**
 * Seed blog content. The admin dashboard + `blog_posts` table allow
 * publishing additional posts to Supabase; these ship out of the box
 * for SEO.
 */
export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-choose-a-wheelchair-transportation-service",
    title: "How to Choose a Wheelchair Transportation Service in NYC",
    excerpt:
      "What to look for in an accessible medical transportation provider — from securement systems to driver training.",
    date: "2026-05-12",
    readMinutes: 5,
    body: [
      "Choosing the right wheelchair transportation service is about more than getting from point A to point B. For passengers with mobility needs, the right provider means safety, dignity, and peace of mind.",
      "Start with the vehicles. A true wheelchair-accessible service uses vans equipped with hydraulic lifts or ramps and four-point securement systems that lock the wheelchair safely in place during transit.",
      "Next, ask about driver training. Drivers should be background-checked and trained in safe transfer techniques, securement, and compassionate passenger assistance.",
      "Finally, reliability matters most for recurring appointments like dialysis. Look for a provider known for on-time scheduling and clear communication. At Ride Access NYC, every one of these standards is built into the service we deliver.",
    ],
  },
  {
    slug: "preparing-for-a-hospital-discharge",
    title: "Preparing for a Smooth Hospital Discharge",
    excerpt:
      "A simple checklist for families coordinating safe transportation home after a hospital stay.",
    date: "2026-04-28",
    readMinutes: 4,
    body: [
      "Hospital discharges can feel rushed and stressful. A little preparation goes a long way toward getting your loved one home safely.",
      "First, confirm the discharge time with the care team and book transportation early — even if the exact time may shift. Providers like Ride Access NYC accommodate same-day and short-notice discharges.",
      "Second, communicate mobility needs clearly: will the passenger need a wheelchair-accessible vehicle, door-through-door assistance, or a companion seat?",
      "Finally, have medications, paperwork, and any equipment ready to go. A coordinated discharge means your loved one rests at home sooner, with less stress for everyone.",
    ],
  },
  {
    slug: "dialysis-transportation-tips",
    title: "Dialysis Transportation: Making Recurring Rides Stress-Free",
    excerpt:
      "How standing appointments and the right provider can take the worry out of three-times-a-week treatment travel.",
    date: "2026-04-10",
    readMinutes: 4,
    body: [
      "Dialysis treatment often means traveling to a center three times a week, every week. Reliable transportation isn't a convenience — it's essential to staying on schedule with care.",
      "The key is consistency. A provider that offers standing, recurring appointments builds your treatment schedule into their routing so the same dependable service shows up every visit.",
      "Round-trip coordination matters too. After treatment, many patients feel fatigued, so door-to-door assistance for the return trip makes a real difference.",
      "Ride Access NYC specializes in recurring dialysis transportation across the NYC metro area, giving patients and families one less thing to worry about.",
    ],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
