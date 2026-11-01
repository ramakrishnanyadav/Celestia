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
  AlertCircle,
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
      setError(err instanceof Error ? err.message : "Failed to create account. Please verify input.");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="w-full max-w-md p-8 rounded-3xl glass-card space-y-6">
          <div className="text-center space-y-2">
            <div
              className="w-10 h-10 rounded-2xl bg-[var(--brand-teal)] text-white mx-auto flex items-center justify-center font-bold shadow-sm"
              aria-hidden="true"
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary)]">
              Create Your Account
            </h1>
            <p className="text-sm text-[var(--ink-secondary)]">
              Start planning your celebration with precision
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

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="register-name"
                className="block text-sm font-semibold text-[var(--ink-secondary)]"
              >
                Full Name{" "}
                <span aria-hidden="true" className="text-red-600">*</span>
                <span className="sr-only"> (required)</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="register-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anjali Sharma"
                  aria-invalid={!!error}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-email"
                className="block text-sm font-semibold text-[var(--ink-secondary)]"
              >
                Email Address{" "}
                <span aria-hidden="true" className="text-red-600">*</span>
                <span className="sr-only"> (required)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="register-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anjali@example.com"
                  aria-invalid={!!error}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-sunken)] text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-password"
                className="block text-sm font-semibold text-[var(--ink-secondary)]"
              >
                Password{" "}
                <span aria-hidden="true" className="text-red-600">*</span>
                <span className="sr-only"> (required)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="register-password"
                  type="password"
                  required
                  autoComplete="new-password"
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
              <span>{loading ? "Creating Account..." : "Register"}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          <p className="text-center text-sm text-[var(--ink-muted)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[var(--brand-teal)] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded p-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[var(--ink-muted)] border-t border-[var(--border-subtle)]">
        <Link href="/accessibility" className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded p-1">
          Accessibility Statement
        </Link>
      </footer>
    </div>
  );
}
