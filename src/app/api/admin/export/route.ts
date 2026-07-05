import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPORTABLE: Record<string, string[]> = {
  bookings: [
    "booking_number",
    "passenger_name",
    "phone",
    "email",
    "pickup_address",
    "destination_address",
    "ride_date",
    "ride_time",
    "wheelchair_required",
    "service_type",
    "notes",
    "payment_status",
    "booking_status",
    "amount_cents",
    "created_at",
  ],
  leads: ["name", "email", "phone", "source", "status", "created_at"],
  contact_requests: [
    "name",
    "email",
    "phone",
    "subject",
    "message",
    "status",
    "created_at",
  ],
  payments: [
    "description",
    "email",
    "amount_cents",
    "status",
    "created_at",
  ],
};

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const table = new URL(req.url).searchParams.get("table") ?? "";
  const columns = EXPORTABLE[table];
  if (!columns) {
    return NextResponse.json({ error: "Invalid table." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from(table)
    .select(columns.join(","))
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const csv = [
    columns.join(","),
    ...rows.map((row) => columns.map((c) => csvCell(row[c])).join(",")),
  ].join("\r\n");

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${table}-${date}.csv"`,
    },
  });
}
