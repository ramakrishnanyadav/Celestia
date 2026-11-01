"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Sparkles, ArrowRight, Lock, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/app/events";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await api.login(email, password);
      router.push(returnTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.demoLogin();
      router.push(returnTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Demo sign in unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl glass-card space-y-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-2xl bg-[var(--brand-teal)] text-white mx-auto flex items-center justify-center font-bold shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--ink-primary)]">
          Welcome to CELESTIA
        </h1>
        <p className="text-xs text-[var(--ink-secondary)]">
          Sign in to your celebration workspace
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[var(--status-danger)]/10 text-[var(--status-danger)] text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="you@example.com"
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
          className="w-full py-2.5 rounded-xl bg-[var(--brand-teal)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <span>{loading ? "Signing In..." : "Sign In"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-[var(--border-subtle)] w-full"></div>
        <span className="bg-[var(--canvas-card)] px-3 text-[10px] text-[var(--ink-muted)] uppercase tracking-wider absolute">
          or explore
        </span>
      </div>

      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={loading}
        className="w-full py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm font-semibold hover:bg-[var(--canvas-sunken)] disabled:opacity-50 transition-all cursor-pointer"
      >
        Try Demo Workspace (Read-Only Demo)
      </button>

      <p className="text-center text-xs text-[var(--ink-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-[var(--brand-teal)] font-semibold hover:underline"
        >
          Register here
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--canvas)]">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
