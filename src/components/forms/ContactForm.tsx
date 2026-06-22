"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { contactSchema, type ContactInput } from "@/lib/validations";

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  async function onSubmit(values: ContactInput) {
    setStatus("idle");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong.");
      }
      setStatus("success");
      reset();
    } catch (err) {
      setStatus("error");
      setServerError(err instanceof Error ? err.message : "Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="card flex flex-col items-center py-12 text-center">
        <CheckCircle2 className="h-14 w-14 text-success" aria-hidden />
        <h3 className="mt-4 text-2xl font-bold">Message Sent!</h3>
        <p className="mt-2 max-w-md text-slate-600">
          Thanks for reaching out. Our team will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5" noValidate>
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register("company")} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Name *</label>
          <input className="field" autoComplete="name" {...register("name")} />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Phone *</label>
          <input className="field" type="tel" autoComplete="tel" {...register("phone")} />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Email *</label>
        <input className="field" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="label">Subject *</label>
        <input className="field" {...register("subject")} />
        {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
      </div>

      <div>
        <label className="label">Message *</label>
        <textarea className="field min-h-[130px] resize-y" {...register("message")} />
        {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
      </div>

      {status === "error" && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" aria-hidden /> {serverError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Sending…
          </>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  );
}
