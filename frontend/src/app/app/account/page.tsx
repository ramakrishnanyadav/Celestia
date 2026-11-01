"use client";

import React from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useCurrentUser, useEvents } from "@/lib/hooks/queries";
import {
  ShieldCheck,
  User as UserIcon,
  KeyRound,
  Lock,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { ProvenanceBadge } from "@/components/ui/ProvenanceBadge";

export default function AccountPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: events = [] } = useEvents();

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink-primary)] p-6 sm:p-10 relative">
      {/* Drifting Mesh Backdrop */}
      <div className="mesh-backdrop" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/app/events"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-teal)] hover:underline min-h-[44px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Celebrations</span>
            </Link>
          </div>
          <Breadcrumbs
            items={[
              { label: "Celebrations", href: "/app/events" },
              { label: "Account & Security", current: true },
            ]}
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink-primary)] mt-3">
            Host Account & Enterprise Security
          </h1>
          <p className="text-sm sm:text-base text-[var(--ink-secondary)] mt-1">
            Manage your authenticated profile, tenant isolation boundaries, and cryptographic session protection.
          </p>
        </div>

        {/* Profile Card */}
        <section aria-labelledby="profile-heading" className="p-6 rounded-2xl glass-card space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] flex items-center justify-center font-extrabold text-lg">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h2 id="profile-heading" className="text-lg font-bold text-[var(--ink-primary)]">
                  {userLoading ? "Loading profile..." : user?.name || "Demo Host"}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)]">
                  {user?.email || "demo@celestia.internal"}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] border border-[var(--brand-teal)]/30">
              {user?.role || "Host / Planner"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-[var(--canvas-sunken)]">
              <span className="text-[var(--ink-muted)] block text-xs font-semibold uppercase">Active Celebrations</span>
              <span className="text-lg font-extrabold text-[var(--ink-primary)] mt-0.5 block">{events.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--canvas-sunken)]">
              <span className="text-[var(--ink-muted)] block text-xs font-semibold uppercase">Auth Protection</span>
              <span className="text-sm font-bold text-[var(--status-success)] mt-0.5 block">HttpOnly Cookies + CSRF</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--canvas-sunken)]">
              <span className="text-[var(--ink-muted)] block text-xs font-semibold uppercase">Password Hash</span>
              <span className="text-sm font-bold text-[var(--ink-primary)] mt-0.5 block">Argon2id (m=65536)</span>
            </div>
          </div>
        </section>

        {/* Security & Threat Governance */}
        <section aria-labelledby="security-heading" className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[var(--brand-teal)]" aria-hidden="true" />
            <h2 id="security-heading" className="text-lg font-bold text-[var(--ink-primary)]">
              Defense-in-Depth & Tenant Isolation
            </h2>
          </div>

          <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
            CELESTIA stores zero access tokens in client-side localStorage. All API mutations require verified HttpOnly JWT rotation cookies alongside anti-CSRF request tokens, backed by Redis sliding-window rate limiters.
          </p>

          <div className="pt-2">
            <ProvenanceBadge
              source="Formula"
              confidence="High"
              assumption="Cryptographically verified HMAC-SHA256 signature with constant-time equality check"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

