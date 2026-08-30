"use client";

import { useEffect, useState } from "react";

/**
 * Id du compte connecté. Sert à masquer les actions que les routes refusent de
 * toute façon sur soi-même (suppression, réinitialisation, auto-rétrogradation).
 */
export function useCurrentUserId() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.id) setCurrentUserId(Number(data.id));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return currentUserId;
}
