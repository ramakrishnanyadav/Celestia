"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteAnnouncer() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    // Give Next.js time to update DOM and document.title
    const timer = setTimeout(() => {
      const pageTitle = document.title || "CELESTIA";
      setAnnouncement(`Navigated to ${pageTitle}`);

      // Move focus to unique h1 on route change if available
      const h1 = document.querySelector("h1");
      if (h1 && !h1.hasAttribute("tabIndex")) {
        h1.setAttribute("tabindex", "-1");
        h1.focus();
      } else if (h1) {
        h1.focus();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      id="route-announcer"
    >
      {announcement}
    </div>
  );
}

