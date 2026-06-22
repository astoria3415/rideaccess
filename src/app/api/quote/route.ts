import { NextResponse } from "next/server";
import { quoteSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`quote:${ip}`, { limit: 5, windowMs: 60_000 }).success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = quoteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 422 },
    );
  }

  const data = parsed.data;
  if (data.company) return NextResponse.json({ ok: true });

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("quotes")
    .insert({
      name: data.name,
      phone: data.phone,
      email: data.email,
      pickup_address: data.pickupAddress,
      destination_address: data.destinationAddress,
      service_type: data.serviceType,
      notes: data.notes || null,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[quote] insert failed", error);
    return NextResponse.json(
      { error: "We couldn't submit your quote. Please call (929) 206-3210." },
      { status: 500 },
    );
  }

  await supabase.from("leads").insert({
    name: data.name,
    email: data.email,
    phone: data.phone,
    source: "quote",
    status: "new",
    reference_id: row?.id ?? null,
  });

  return NextResponse.json({ ok: true });
}
