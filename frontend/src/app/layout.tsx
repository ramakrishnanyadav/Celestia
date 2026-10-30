import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CELESTIA — AI-Powered Celebration & Event Planning Assistant",
  description: "Transform natural-language requirements into structured, deterministic, and executable celebration plans for weddings, birthdays, and community events with Critical Path timeline, deterministic budget, and cultural intelligence.",
  keywords: ["wedding planner", "event management", "Indian wedding planning", "deterministic budget", "critical path timeline", "vendor quotation comparison"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0B132B] text-[#FAF7F2]">
        {children}
      </body>
    </html>
  );
}
