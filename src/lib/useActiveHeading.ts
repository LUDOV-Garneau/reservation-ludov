// lib/useActiveHeading.ts
import { useEffect, useState } from "react";

export default function useActiveHeading(
  selectors: string[] = ["h2", "h3", "h4"]
) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const els = Array.from(document.querySelectorAll(selectors.join(",")));
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // garde la heading intersecting la plus visible
        const visibles = entries.filter((e) => e.isIntersecting);
        if (visibles.length > 0) {
          visibles.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveId(visibles[0].target.getAttribute("id"));
          return;
        }

        // fallback: la heading la plus proche du top (>=0)
        const sorted = entries.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        );
        const next = sorted.find((e) => e.boundingClientRect.top >= 0);
        setActiveId(next?.target.getAttribute("id") ?? null);
      },
      {
        root: null,
        rootMargin: "0px 0px -65% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 1],
      }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [JSON.stringify(selectors)]);

  return activeId;
}
