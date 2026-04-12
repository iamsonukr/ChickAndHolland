"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();
  const preserveScrollRef = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      preserveScrollRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (preserveScrollRef.current) {
      preserveScrollRef.current = false;
      return;
    }

    const resetScrollPosition = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScrollPosition();
    const frameId = window.requestAnimationFrame(resetScrollPosition);

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);

  return null;
}
