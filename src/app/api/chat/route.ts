import { NextResponse } from "next/server";
import { site } from "@/lib/site";
import { services } from "@/lib/data/services";
import { faqs } from "@/lib/data/faq";
import { serviceAreas } from "@/lib/data/areas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const KNOWLEDGE = `
COMPANY: ${site.name} — premium private wheelchair & non-emergency medical transportation (NEMT).
PHONE: ${site.phone}  EMAIL: ${site.email}  WEBSITE: ${site.url}
HOURS: ${site.hours}
SERVICE AREAS: ${serviceAreas.map((a) => a.name).join(", ")}.
SERVICES:
${services.map((s) => `- ${s.title}: ${s.short}`).join("\n")}
PAYMENT: Secure online payment via card, Apple Pay, Google Pay, and Link by Stripe. Private-pay provider; receipts can be submitted to insurance/Medicaid/FSA for possible reimbursement.
FAQ:
${faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n")}
`.trim();

const SYSTEM_PROMPT = `You are the friendly customer-support assistant for ${site.name}, a premium wheelchair and medical transportation company in New York City.

Use ONLY the knowledge below to answer. Be warm, concise, and reassuring — many users are seniors, patients, or worried family members.

Goals, in order:
1. Answer the question accurately.
2. Help the user start a booking or quote (point them to ${site.url}/book or the "Book a Ride" button).
3. For anything you cannot confirm (exact pricing, insurance specifics, urgent same-day needs), warmly direct them to call ${site.phone} to reach a human.

Never invent prices, policies, or guarantees. Keep replies under ~90 words. End with a helpful next step when natural.

KNOWLEDGE:
${KNOWLEDGE}`;

/** Rule-based fallback used when no LLM key is configured. */
function fallbackReply(message: string): string {
  const m = message.toLowerCase();
  const hit = faqs.find((f) =>
    f.question
      .toLowerCase()
      .split(" ")
      .filter((w) => w.length > 4)
      .some((w) => m.includes(w)),
  );
  if (m.includes("book") || m.includes("ride") || m.includes("schedule")) {
    return `I'd be glad to help you book a ride! You can book online at ${site.url}/book or call us at ${site.phone}. What date and pickup location works for you?`;
  }
  if (m.includes("price") || m.includes("cost") || m.includes("quote")) {
    return `Pricing depends on distance, service type, and scheduling. For an exact quote, request one at ${site.url}/contact or call ${site.phone} and our team will help right away.`;
  }
  if (m.includes("area") || m.includes("where") || m.includes("serve")) {
    return `We serve ${serviceAreas.map((a) => a.name).join(", ")}. Where would you be traveling from and to?`;
  }
  if (hit) return hit.answer;
  return `Thanks for your message! For the fastest help, call us at ${site.phone} or book online at ${site.url}/book. I can also answer questions about our wheelchair transportation, service areas, and booking process.`;
}

async function anthropicReply(messages: ChatMessage[]): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!res.ok) {
      console.error("[chat] anthropic error", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    return typeof text === "string" ? text : null;
  } catch (err) {
    console.error("[chat] anthropic request failed", err);
    return null;
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`chat:${ip}`, { limit: 20, windowMs: 60_000 }).success) {
    return NextResponse.json(
      { reply: `You're sending messages quickly! Please call ${site.phone} for immediate help.` },
      { status: 429 },
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json({ reply: "How can I help you today?" });
  }

  const llm = await anthropicReply(messages);
  return NextResponse.json({ reply: llm ?? fallbackReply(lastUser.content) });
}
