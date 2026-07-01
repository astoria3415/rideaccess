/**
 * Database types. Mirrors supabase/schema.sql. In a CI pipeline you
 * would regenerate this with `supabase gen types typescript`, but it
 * is maintained here so the app is fully typed out of the box.
 */

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentStatus =
  | "unpaid"
  | "deposit_paid"
  | "paid"
  | "refunded"
  | "failed";

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export type LeadSource =
  | "booking"
  | "contact"
  | "quote"
  | "whatsapp"
  | "chat"
  | "phone";

export type Booking = {
  id: string;
  booking_number: string;
  user_id: string | null;
  passenger_name: string;
  phone: string;
  email: string;
  pickup_address: string;
  destination_address: string;
  ride_date: string;
  ride_time: string;
  service_type: string;
  wheelchair_required: boolean;
  round_trip: boolean;
  notes: string | null;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  amount_cents: number | null;
  created_at: string;
  updated_at: string;
}

export type ContactRequest = {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: LeadStatus;
  created_at: string;
}

export type Quote = {
  id: string;
  name: string;
  phone: string;
  email: string;
  pickup_address: string;
  destination_address: string;
  service_type: string;
  notes: string | null;
  quoted_amount_cents: number | null;
  status: LeadStatus;
  created_at: string;
}

export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  reference_id: string | null;
  created_at: string;
}

export type Payment = {
  id: string;
  booking_id: string | null;
  stripe_payment_intent: string | null;
  stripe_checkout_session: string | null;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  email: string | null;
  created_at: string;
}

export type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  location: string | null;
  quote: string;
  rating: number;
  published: boolean;
  created_at: string;
}

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid";

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit_cents: number;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  booking_id: string | null;
  payment_id: string | null;
  customer_name: string;
  customer_email: string | null;
  line_items: InvoiceLineItem[];
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  status: InvoiceStatus;
  notes: string | null;
  issued_date: string;
  due_date: string | null;
  created_at: string;
}

// A homomorphic mapped type produces a fresh object type with an
// implicit index signature, so it satisfies Supabase's GenericTable
// constraint (`Row extends Record<string, unknown>`) where a bare
// `interface` would not.
type Resolve<T> = { [K in keyof T]: T[K] };

type TableDef<T> = {
  Row: Resolve<T>;
  Insert: Partial<Resolve<T>>;
  Update: Partial<Resolve<T>>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      bookings: TableDef<Booking>;
      contact_requests: TableDef<ContactRequest>;
      quotes: TableDef<Quote>;
      leads: TableDef<Lead>;
      payments: TableDef<Payment>;
      testimonials: TableDef<Testimonial>;
      blog_posts: TableDef<BlogPost>;
      invoices: TableDef<Invoice>;
      // Operational tables read/written via the service-role client or
      // admin session. Typed loosely so admin tooling stays ergonomic.
      admins: TableDef<{
        id: string;
        email: string;
        full_name: string | null;
        role: string;
        created_at: string;
      }>;
      audit_logs: TableDef<{
        id: string;
        actor: string | null;
        action: string;
        entity: string | null;
        entity_id: string | null;
        metadata: Record<string, unknown> | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

