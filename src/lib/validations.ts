import { z } from "zod";

const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

export const bookingSchema = z.object({
  passengerName: z.string().min(2, "Please enter the passenger's full name."),
  phone: z.string().regex(phoneRegex, "Please enter a valid phone number."),
  email: z.string().email("Please enter a valid email address."),
  pickupAddress: z.string().min(5, "Please enter a pickup address."),
  destinationAddress: z.string().min(5, "Please enter a destination address."),
  rideDate: z.string().min(1, "Please choose a date."),
  rideTime: z.string().min(1, "Please choose a time."),
  serviceType: z.string().min(1, "Please select a service type."),
  wheelchairRequired: z.boolean().default(false),
  roundTrip: z.boolean().default(false),
  notes: z.string().max(1000).optional().or(z.literal("")),
  // Honeypot — must stay empty.
  company: z.string().max(0).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  phone: z.string().regex(phoneRegex, "Please enter a valid phone number."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(2, "Please add a subject."),
  message: z.string().min(10, "Please tell us a little more."),
  company: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const quoteSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  phone: z.string().regex(phoneRegex, "Please enter a valid phone number."),
  email: z.string().email("Please enter a valid email address."),
  pickupAddress: z.string().min(5, "Please enter a pickup address."),
  destinationAddress: z.string().min(5, "Please enter a destination address."),
  serviceType: z.string().min(1, "Please select a service type."),
  notes: z.string().max(1000).optional().or(z.literal("")),
  company: z.string().max(0).optional(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

export const checkoutSchema = z.object({
  amount: z.number().int().min(500, "Minimum payment is $5.00."),
  description: z.string().min(2),
  email: z.string().email(),
  bookingId: z.string().uuid().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
