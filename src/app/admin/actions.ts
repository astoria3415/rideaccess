"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  BookingStatus,
  PaymentStatus,
  LeadStatus,
} from "@/lib/supabase/types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin) throw new Error("Not authorized.");
  return { supabase, user };
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const { supabase, user } = await requireAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({ booking_status: status })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    actor: user.id,
    action: "update_booking_status",
    entity: "bookings",
    entity_id: id,
    metadata: { status },
  });
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function updateBookingPayment(id: string, status: PaymentStatus) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({ payment_status: status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
}

export async function toggleTestimonial(id: string, published: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("testimonials")
    .update({ published })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/testimonials");
}

export async function setContactStatus(id: string, status: LeadStatus) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("contact_requests")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/contacts");
}

// ---- Delete actions ----

const DELETABLE = {
  bookings: "/admin/bookings",
  leads: "/admin/leads",
  contact_requests: "/admin/contacts",
  payments: "/admin/payments",
  testimonials: "/admin/testimonials",
} as const;

export type DeletableTable = keyof typeof DELETABLE;

export async function deleteRow(table: DeletableTable, id: string) {
  const path = DELETABLE[table];
  if (!path) throw new Error("Table not allowed.");
  const { supabase, user } = await requireAdmin();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    actor: user.id,
    action: "delete_row",
    entity: table,
    entity_id: id,
    metadata: {},
  });
  revalidatePath(path);
  revalidatePath("/admin");
}

export async function updateBooking(
  id: string,
  fields: {
    passenger_name: string;
    phone: string;
    email: string;
    pickup_address: string;
    destination_address: string;
    ride_date: string;
    ride_time: string;
    notes: string | null;
  },
) {
  const { supabase, user } = await requireAdmin();
  const { error } = await supabase.from("bookings").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    actor: user.id,
    action: "update_booking",
    entity: "bookings",
    entity_id: id,
    metadata: fields,
  });
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function clearOldRows(table: DeletableTable, days: number) {
  const path = DELETABLE[table];
  if (!path || table === "testimonials") throw new Error("Table not allowed.");
  if (![30, 60, 90].includes(days)) throw new Error("Invalid retention window.");
  const { supabase, user } = await requireAdmin();

  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  let query = supabase
    .from(table)
    .delete({ count: "exact" })
    .lt("created_at", cutoff);
  // Never remove bookings that are still active or unpaid business records.
  if (table === "bookings") {
    query = query.in("booking_status", ["completed", "cancelled"]);
  }
  const { error, count } = await query;
  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    actor: user.id,
    action: "clear_old_rows",
    entity: table,
    entity_id: null,
    metadata: { days, deleted: count ?? 0 },
  });
  revalidatePath(path);
  revalidatePath("/admin");
  return count ?? 0;
}
