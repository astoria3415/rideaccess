import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendContactNotification } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`contact:${ip}`, { limit: 5, windowMs: 60_000 }).success) {
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

  const parsed = contactSchema.safeParse(json);
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
    .from("contact_requests")
    .insert({
      name: data.name,
      phone: data.phone,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[contact] insert failed", error);
    return NextResponse.json(
      { error: "We couldn't send your message. Please call (929) 206-3210." },
      { status: 500 },
    );
  }

  await supabase.from("leads").insert({
    name: data.name,
    email: data.email,
    phone: data.phone,
    source: "contact",
    status: "new",
    reference_id: row?.id ?? null,
  });

  await sendContactNotification(data);

  // Push to admin devices (owner + partner)
  try {
    await sendPushToAdmins({
      title: "New contact request",
      body: `${data.name} — ${data.subject}`,
      url: "/admin/contacts",
    });
  } catch (pushError) {
    console.error("[push] admin push failed", pushError);
  }

  return NextResponse.json({ ok: true });
}
