"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Loader2 } from "lucide-react";
import { site } from "@/lib/site";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! 👋 Welcome to Ride Access NYC. Ask me about wheelchair & medical rides, get a quick quote, or book a trip. How can I help?",
};

/**
 * AI customer-support assistant. Talks to /api/chat, which uses a
 * knowledge-grounded prompt. Falls back gracefully and always offers
 * the phone number for human support.
 */
export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Only scroll down once a conversation is underway — never on open, so the
  // welcome message stays visible from the top instead of being scrolled off.
  useEffect(() => {
    if (messages.length > 1) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            data.reply ??
            `I'm having trouble right now. Please call us at ${site.phone}.`,
        },
      ]);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: `I'm having trouble connecting. Please call us at ${site.phone} and our team will help right away.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        className="fixed bottom-40 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-white shadow-elevated transition hover:scale-105 md:bottom-24"
      >
        {open ? <X className="h-7 w-7" /> : <Bot className="h-7 w-7" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Ride Access NYC assistant"
          className="fixed bottom-56 right-4 z-40 flex h-[min(30rem,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elevated md:bottom-40"
        >
          <div className="flex items-center gap-3 bg-primary px-4 py-3 text-white">
            <Bot className="h-6 w-6" aria-hidden />
            <div className="leading-tight">
              <p className="text-sm font-semibold">Ride Access Assistant</p>
              <p className="text-xs text-slate-200">Typically replies instantly</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-surface p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-white"
                      : "bg-white text-ink shadow-soft"
                  }`}
                >
                  {m.content}
                </p>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <p className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 text-sm text-slate-500 shadow-soft">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </p>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-2"
          >
            <label htmlFor="ai-input" className="sr-only">
              Type your message
            </label>
            <input
              id="ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a ride…"
              className="field py-2"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="btn-primary px-3 py-2"
            >
              <Send className="h-5 w-5" aria-hidden />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
