import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { CTABanner } from "@/components/CTABanner";
import { JsonLd } from "@/components/JsonLd";
import { blogPosts, getBlogPost } from "@/lib/data/blog";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return buildMetadata({ title: "Article", path: "/blog" });
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          author: { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <PageHero
        title={post.title}
        breadcrumbs={[
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ]}
      />
      <article className="container-page max-w-3xl py-16">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden /> {post.readMinutes} min read
          </span>
        </div>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-slate-700">
          {post.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </article>
      <CTABanner />
    </>
  );
}
