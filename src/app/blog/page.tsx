import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { blogPosts } from "@/lib/data/blog";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Blog",
  description:
    "Guides and tips on wheelchair transportation, hospital discharges, dialysis travel, and accessible mobility in New York City.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Blog", path: "/blog" }])} />
      <PageHero
        title="Insights & Resources"
        subtitle="Helpful guides for passengers, families, and care coordinators."
        breadcrumbs={[{ name: "Blog", href: "/blog" }]}
      />
      <section className="container-page grid gap-8 py-16 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post, i) => (
          <Reveal key={post.slug} delay={(i % 3) * 0.05}>
            <article className="card flex h-full flex-col">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" aria-hidden /> {post.readMinutes} min
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold">
                <Link href={`/blog/${post.slug}`} className="hover:text-secondary">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 flex-1 text-sm text-slate-600">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-secondary"
              >
                Read article <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          </Reveal>
        ))}
      </section>
    </>
  );
}
