import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CELESTIA — AI Celebration & Event Planning Assistant",
  description:
    "Transform natural-language ideas into deterministic celebration blueprints with zero-rounding integer financial ledgers, Critical Path schedules, and authentic Indian cultural personalization.",
  keywords: [
    "wedding planner",
    "event management",
    "Indian wedding planning",
    "deterministic budget",
    "critical path timeline",
    "vendor quotation comparison",
  ],
  authors: [{ name: "CELESTIA Engineering Team" }],
};

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full antialiased ${jakartaSans.variable}`}>
      <body className="min-h-full flex flex-col bg-[var(--canvas)] text-[var(--ink-primary)] font-sans">
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
