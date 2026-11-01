"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle } from "lucide-react";

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
      setError(err instanceof Error ? err.message : "Failed to sign in. Please verify credentials.");
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
      setError(err instanceof Error ? err.message : "Demo sign in unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl glass-card space-y-6">
      <div className="text-center space-y-2">
        <div
          className="w-10 h-10 rounded-2xl bg-[var(--brand-teal)] text-white mx-auto flex items-center justify-center font-bold shadow-sm"
          aria-hidden="true"
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)]">
          Welcome to CELESTIA
        </h1>
        <p className="text-sm text-[var(--ink-secondary)]">
          Sign in to your celebration workspace
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-[var(--status-danger)] text-sm font-medium flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4" noValidate={false}>
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-sm font-semibold text-[var(--ink-secondary)]"
          >
            Email Address{" "}
            <span aria-hidden="true" className="text-red-600">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-3.5" aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!error}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="login-password"
            className="block text-sm font-semibold text-[var(--ink-secondary)]"
          >
            Password{" "}
            <span aria-hidden="true" className="text-red-600">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-3.5" aria-hidden="true" />
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!error}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] w-full py-3 rounded-xl bg-[var(--brand-teal)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2"
        >
          <span>{loading ? "Signing In..." : "Sign In"}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-[var(--border-subtle)] w-full"></div>
        <span className="bg-[var(--canvas-card)] px-3 text-xs text-[var(--ink-muted)] uppercase tracking-wider absolute">
          or explore
        </span>
      </div>

      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={loading}
        className="min-h-[44px] w-full py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm font-semibold hover:bg-[var(--canvas-sunken)] disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
      >
        Try Demo Workspace (Read-Only Demo)
      </button>

      <p className="text-center text-sm text-[var(--ink-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-[var(--brand-teal)] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded p-1"
        >
          Register here
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--canvas)]">
      {/* Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2.5 bg-[var(--brand-teal)] text-white font-semibold rounded-xl shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>

      <header className="h-16 px-6 flex items-center justify-between border-b border-[var(--border-subtle)]">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-secondary)] hover:text-[var(--brand-teal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded px-2 py-1 min-h-[44px]"
        >
          <span>← Back to CELESTIA</span>
        </Link>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center p-6 focus:outline-none">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>

      <footer className="py-4 text-center text-xs text-[var(--ink-muted)] border-t border-[var(--border-subtle)]">
        <Link href="/accessibility" className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded p-1">
          Accessibility Statement
        </Link>
      </footer>
    </div>
  );
}
