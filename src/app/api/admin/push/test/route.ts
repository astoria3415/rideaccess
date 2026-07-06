import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToAdmins } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fires a test notification to every subscribed admin device.
export async function POST() {
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

  const result = await sendPushToAdmins({
    title: "Ride Access NYC",
    body: "Test notification — push is working. You'll be alerted here.",
    url: "/admin",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Push is not configured on the server." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, sent: result.sent ?? 0 });
}
