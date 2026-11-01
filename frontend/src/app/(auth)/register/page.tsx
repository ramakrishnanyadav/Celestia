"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await api.register(name, email, password);
      router.push("/app/events");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--canvas)]">
      <div className="w-full max-w-md p-8 rounded-3xl glass-card space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[var(--brand-teal)] text-white mx-auto flex items-center justify-center font-bold shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--ink-primary)]">
            Create Your Account
          </h1>
          <p className="text-xs text-[var(--ink-secondary)]">
            Start planning your celebration with precision
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[var(--status-danger)]/10 text-[var(--status-danger)] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--ink-secondary)]">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anjali Sharma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] focus:outline-none focus:border-[var(--brand-teal)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--ink-secondary)]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anjali@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] focus:outline-none focus:border-[var(--brand-teal)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--ink-secondary)]">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] focus:outline-none focus:border-[var(--brand-teal)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[var(--brand-teal)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <span>{loading ? "Creating Account..." : "Register"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-[var(--ink-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--brand-teal)] font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
