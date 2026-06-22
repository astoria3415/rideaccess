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
