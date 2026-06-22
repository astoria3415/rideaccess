import type { Metadata } from "next";
import { site } from "./site";

interface PageMetaInput {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  image?: string;
}

const baseKeywords = [
  "wheelchair transportation nyc",
  "private wheelchair transportation nyc",
  "medical transportation nyc",
  "wheelchair van service nyc",
  "hospital discharge transportation nyc",
  "dialysis transportation nyc",
  "non emergency medical transportation nyc",
  "senior transportation nyc",
  "airport wheelchair transportation nyc",
];

export function buildMetadata({
  title,
  description = site.description,
  path = "/",
  keywords = [],
  image = site.ogImage,
}: PageMetaInput): Metadata {
  const url = `${site.url}${path}`;
  const fullTitle =
    path === "/" ? `${title} | ${site.name}` : `${title} | ${site.name}`;

  return {
    title: fullTitle,
    description,
    keywords: [...baseKeywords, ...keywords],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: fullTitle,
      description,
      siteName: site.name,
      locale: "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

/** Organization + LocalBusiness JSON-LD for the whole site. */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["MedicalBusiness", "LocalBusiness", "MovingCompany"],
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    telephone: site.phoneRaw,
    email: site.email,
    image: `${site.url}${site.ogImage}`,
    description: site.description,
    priceRange: "$$",
    areaServed: site.serviceAreas.map((a) => ({
      "@type": "AdministrativeArea",
      name: a,
    })),
    address: {
      "@type": "PostalAddress",
      addressLocality: "New York",
      addressRegion: "NY",
      addressCountry: "US",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
    sameAs: [site.social.facebook, site.social.instagram],
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${site.url}${item.path}`,
    })),
  };
}

export function serviceJsonLd(service: {
  title: string;
  description: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.title,
    description: service.description,
    provider: { "@type": "LocalBusiness", name: site.name, url: site.url },
    areaServed: site.serviceAreas.join(", "),
    url: `${site.url}/services/${service.slug}`,
  };
}
