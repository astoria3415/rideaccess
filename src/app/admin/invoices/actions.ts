"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeInvoiceTotals, generateInvoicePdf } from "@/lib/invoice";
import { sendInvoiceEmail } from "@/lib/email";
import type { Invoice, InvoiceLineItem, InvoiceStatus } from "@/lib/supabase/types";

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

export interface CreateInvoiceInput {
  customerName: string;
  customerEmail?: string;
  bookingId?: string | null;
  lineItems: InvoiceLineItem[];
  taxCents?: number;
  notes?: string;
  dueDate?: string | null;
}

export async function createInvoice(input: CreateInvoiceInput) {
  const { supabase } = await requireAdmin();

  const items = input.lineItems
    .filter((li) => li.description.trim() && li.unit_cents > 0)
    .map((li) => ({
      description: li.description.trim(),
      quantity: Math.max(1, Math.round(li.quantity)),
      unit_cents: Math.round(li.unit_cents),
    }));

  if (items.length === 0) throw new Error("Add at least one line item.");

  const totals = computeInvoiceTotals(items, input.taxCents ?? 0);

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      booking_id: input.bookingId || null,
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail?.trim() || null,
      line_items: items,
      ...totals,
      status: "draft",
      notes: input.notes?.trim() || null,
      due_date: input.dueDate || null,
    })
    .select("id, invoice_number")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/invoices");
  return data;
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/invoices");
}

export async function deleteInvoice(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/invoices");
}

/** Generate the PDF and email it to the customer; mark as sent on success. */
export async function emailInvoice(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  const { supabase } = await requireAdmin();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !invoice) return { ok: false, message: "Invoice not found." };

  const pdf = await generateInvoicePdf(invoice as Invoice);
  const result = await sendInvoiceEmail(invoice as Invoice, pdf);

  if (!result.sent) {
    return { ok: false, message: result.error ?? "Could not send email." };
  }

  await supabase.from("invoices").update({ status: "sent" }).eq("id", id);
  revalidatePath("/admin/invoices");
  return { ok: true, message: `Invoice emailed to ${invoice.customer_email}.` };
}
