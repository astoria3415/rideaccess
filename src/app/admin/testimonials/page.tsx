import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TestimonialToggle } from "@/components/admin/TestimonialToggle";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const supabase = await createClient();
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">Testimonials</h1>
      <p className="mt-1 text-slate-500">
        Toggle which reviews appear publicly on the website.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {!testimonials || testimonials.length === 0 ? (
          <p className="card p-10 text-center text-slate-400 md:col-span-2">
            No testimonials yet.
          </p>
        ) : (
          testimonials.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-0.5" aria-label={`${t.rating} stars`}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                      aria-hidden
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <TestimonialToggle id={t.id} published={t.published} />
                  <DeleteButton
                    table="testimonials"
                    id={t.id}
                    label="testimonial"
                  />
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                “{t.quote}”
              </p>
              <p className="mt-3 text-sm font-semibold text-primary">
                {t.name}
                {t.role ? (
                  <span className="font-normal text-slate-500"> · {t.role}</span>
                ) : null}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
