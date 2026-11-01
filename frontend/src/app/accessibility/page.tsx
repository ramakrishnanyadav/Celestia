import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Keyboard, Eye, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Accessibility Statement — CELESTIA",
  description:
    "CELESTIA accessibility commitment, WCAG 2.2 Level AA / AAA conformance declaration, keyboard navigation reference, and contact details.",
};

export default function AccessibilityStatementPage() {
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink-primary)] flex flex-col">
      {/* Skip to Main Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2.5 bg-[var(--brand-teal)] text-white font-semibold rounded-xl shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="h-16 border-b border-[var(--border-subtle)] px-6 flex items-center justify-between sticky top-0 z-30 bg-[var(--glass-bg)] backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-secondary)] hover:text-[var(--brand-teal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] rounded px-2 py-1 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--brand-teal)] text-white flex items-center justify-center font-bold" aria-hidden="true">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-wider text-sm">CELESTIA</span>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-4xl mx-auto px-6 py-12 focus:outline-none">
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-teal-subtle)] text-[var(--brand-teal)] text-xs font-semibold mb-4">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>WCAG 2.2 Conformance Declaration</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink-primary)] mb-4">
              Accessibility Statement
            </h1>
            <p className="text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed">
              CELESTIA is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards under W3C Web Content Accessibility Guidelines (WCAG) 2.2 Level AA and AAA.
            </p>
          </div>

          {/* Conformance Status Card */}
          <section aria-labelledby="conformance-status" className="p-6 rounded-2xl glass-card space-y-4">
            <h2 id="conformance-status" className="text-xl font-bold text-[var(--ink-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--status-success)]" aria-hidden="true" />
              <span>Conformance Status</span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed">
              The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.
            </p>
            <div className="p-4 rounded-xl bg-[var(--canvas-subtle)] border border-[var(--border-subtle)]">
              <p className="text-sm font-semibold text-[var(--ink-primary)]">
                CELESTIA is fully conformant with WCAG 2.2 Level AA, with Level AAA text contrast compliance on all primary interactive surfaces.
              </p>
            </div>
          </section>

          {/* Key Accessibility Implementations */}
          <section aria-labelledby="implementations-heading" className="space-y-4">
            <h2 id="implementations-heading" className="text-xl font-bold text-[var(--ink-primary)]">
              Key Technical Implementations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-card)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-[var(--ink-primary)]">
                  <Eye className="w-4 h-4 text-[var(--brand-teal)]" aria-hidden="true" />
                  <span>High-Contrast Typography</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                  Normal text exceeds 4.5:1 (AA) and primary body copy exceeds 7.0:1 (AAA). Token pairs are verified via automated contrast unit testing.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-card)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-[var(--ink-primary)]">
                  <Keyboard className="w-4 h-4 text-[var(--brand-teal)]" aria-hidden="true" />
                  <span>2px Focus Ring Token</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                  Every interactive control displays a persistent 2px ring with a 2px offset. High-contrast outlines are maintained in Windows Forced Colors.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-card)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-[var(--ink-primary)]">
                  <CheckCircle2 className="w-4 h-4 text-[var(--brand-teal)]" aria-hidden="true" />
                  <span>Radix Dialogs & Modals</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                  Overlays feature strict focus traps, Escape key dismissals, scroll locking, <code className="text-xs">aria-modal=&quot;true&quot;</code>, and return-focus integrity.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas-card)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-[var(--ink-primary)]">
                  <Sparkles className="w-4 h-4 text-[var(--brand-teal)]" aria-hidden="true" />
                  <span>Reduced Motion & Transparency</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                  User preferences for reduced motion and reduced transparency are honored across animations, transitions, and glassmorphic blurs.
                </p>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts Reference */}
          <section aria-labelledby="keyboard-shortcuts" className="space-y-4">
            <h2 id="keyboard-shortcuts" className="text-xl font-bold text-[var(--ink-primary)]">
              Keyboard Navigation Map
            </h2>
            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--canvas)]">
              <table className="w-full text-left text-sm" aria-label="Keyboard shortcuts guide">
                <caption className="sr-only">List of supported keyboard shortcuts</caption>
                <thead className="bg-[var(--canvas-subtle)] border-b border-[var(--border-subtle)] text-[var(--ink-secondary)] text-xs uppercase font-semibold">
                  <tr>
                    <th scope="col" className="px-4 py-3">Key Combination</th>
                    <th scope="col" className="px-4 py-3">Action Description</th>
                    <th scope="col" className="px-4 py-3">Target Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  <tr className="hover:bg-[var(--canvas-subtle)]">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">Tab / Shift + Tab</td>
                    <td className="px-4 py-3 text-[var(--ink-secondary)]">Navigate forwards and backwards across interactive elements</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)] text-xs">Global</td>
                  </tr>
                  <tr className="hover:bg-[var(--canvas-subtle)]">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">Enter / Space</td>
                    <td className="px-4 py-3 text-[var(--ink-secondary)]">Activate buttons, links, toggles, and modals</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)] text-xs">Global</td>
                  </tr>
                  <tr className="hover:bg-[var(--canvas-subtle)]">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">Escape (Esc)</td>
                    <td className="px-4 py-3 text-[var(--ink-secondary)]">Close active dialog, alert confirmation, or dismiss menu</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)] text-xs">Overlays</td>
                  </tr>
                  <tr className="hover:bg-[var(--canvas-subtle)]">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">Arrow Left / Right</td>
                    <td className="px-4 py-3 text-[var(--ink-secondary)]">Increment or decrement simulation range slider values</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)] text-xs">What-If Sliders</td>
                  </tr>
                  <tr className="hover:bg-[var(--canvas-subtle)]">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">Home / End</td>
                    <td className="px-4 py-3 text-[var(--ink-secondary)]">Jump to minimum or maximum allowed budget/guest slider boundary</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)] text-xs">What-If Sliders</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Feedback & Contact */}
          <section aria-labelledby="feedback-contact" className="p-6 rounded-2xl bg-[var(--canvas-subtle)] border border-[var(--border-subtle)] space-y-3">
            <h2 id="feedback-contact" className="text-xl font-bold text-[var(--ink-primary)]">
              Feedback & Contact Information
            </h2>
            <p className="text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed">
              We welcome feedback on the accessibility of CELESTIA. If you encounter accessibility barriers, please let us know:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-[var(--ink-secondary)]">
              <li>E-mail: <a href="mailto:accessibility@celestia.internal" className="text-[var(--brand-teal)] hover:underline font-medium">accessibility@celestia.internal</a></li>
              <li>Engineered Response Time: Within 1 business day</li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--canvas-subtle)] px-6 py-6 text-center text-xs text-[var(--ink-muted)]">
        <p>© 2026 CELESTIA. All rights reserved. Conformance audited via axe-core & Playwright automation.</p>
      </footer>
    </div>
  );
}

