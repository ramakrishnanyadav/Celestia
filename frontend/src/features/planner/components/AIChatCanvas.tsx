"use client";

import React, { useState } from "react";
import type { EventItem, EventPreference } from "@/lib/api/types";
import { Bot, Send, Sparkles, CheckCircle2 } from "lucide-react";

interface AIChatCanvasProps {
  event: EventItem;
  preferences?: EventPreference | null;
  onSendCommand?: (cmd: string) => Promise<{ response: string }>;
}

export function AIChatCanvas({
  event,
  preferences,
  onSendCommand,
}: AIChatCanvasProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ sender: "user" | "ai"; text: string }>
  >([
    {
      sender: "ai",
      text: `Hello! I'm your CELESTIA assistant for ${event.title}. I'm calibrated for ${preferences?.regional_culture || "Indian traditions"} with ${preferences?.dietary || "specified dietary requirements"}. How can I assist your celebration plan?`,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setLoading(true);
    try {
      if (onSendCommand) {
        const res = await onSendCommand(userMsg);
        setMessages((prev) => [...prev, { sender: "ai", text: res.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Suggestion noted and evaluated against deterministic constraints.",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] rounded-2xl glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--canvas-sunken)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ink-primary)]">
              AI Planning Workspace
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              3-Tier Autonomy: Suggest • Draft • Approve
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[var(--brand-teal)] text-white rounded-br-xs"
                  : "bg-[var(--canvas-sunken)] text-[var(--ink-primary)] rounded-bl-xs border border-[var(--border-subtle)]"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-3.5 rounded-2xl bg-[var(--canvas-sunken)] text-xs text-[var(--ink-muted)] border border-[var(--border-subtle)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-[var(--brand-teal)]" />
              Synthesizing proposal...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[var(--border-subtle)] bg-[var(--canvas-sunken)] flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI (e.g. 'Scale budget for 350 guests', 'Add Haldi checklist')..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas)] text-sm text-[var(--ink-primary)] focus:outline-none focus:border-[var(--brand-teal)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white hover:opacity-90 disabled:opacity-50 transition-all"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
