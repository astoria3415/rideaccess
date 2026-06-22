import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { services } from "@/lib/data/services";
import { serviceAreas } from "@/lib/data/areas";
import { blogPosts } from "@/lib/data/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = site.url;

  const staticPaths = [
    "",
    "/about",
    "/services",
    "/service-areas",
    "/faq",
    "/testimonials",
    "/blog",
    "/contact",
    "/book",
    "/payment",
    "/privacy",
    "/terms",
    "/accessibility",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  for (const s of services.filter((s) => s.hasPage)) {
    entries.push({
      url: `${base}/services/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const a of serviceAreas) {
    entries.push({
      url: `${base}/service-areas/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const p of blogPosts) {
    entries.push({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: "yearly",
      priority: 0.6,
    });
  }

  return entries;
}
