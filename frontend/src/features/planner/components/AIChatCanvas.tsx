"use client";

import React, { useState } from "react";
import type { EventItem, EventPreference } from "@/lib/api/types";
import { Bot, Send, Sparkles } from "lucide-react";

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
          <div
            className="w-9 h-9 rounded-xl bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--ink-primary)]">
              AI Planning Workspace
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)]">
              3-Tier Autonomy: Suggest • Draft • Approve
            </p>
          </div>
        </div>
      </div>

      {/* Accessible Chat Messages with aria-live polite region */}
      <div
        className="flex-1 p-5 overflow-y-auto space-y-4"
        aria-live="polite"
        aria-label="Chat Conversation History"
      >
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
              <span className="sr-only">{msg.sender === "user" ? "You: " : "CELESTIA AI: "}</span>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-3.5 rounded-2xl bg-[var(--canvas-sunken)] text-xs sm:text-sm text-[var(--ink-muted)] border border-[var(--border-subtle)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-[var(--brand-teal)]" aria-hidden="true" />
              <span>Synthesizing proposal...</span>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[var(--border-subtle)] bg-[var(--canvas-sunken)] flex items-center gap-2"
      >
        <label htmlFor="chat-command-input" className="sr-only">
          Ask AI Assistant
        </label>
        <input
          id="chat-command-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI (e.g. 'Scale budget for 350 guests', 'Add Haldi checklist')..."
          className="flex-1 px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas)] text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[var(--brand-teal)] text-white hover:opacity-90 disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
