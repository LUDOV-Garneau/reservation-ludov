"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Sélection multiple du tableau des utilisateurs.
 *
 * Ne connaît que des ids. `selectableIds` est la liste des lignes cochables de
 * la page courante (le compte de l'admin connecté en est exclu par l'appelant,
 * puisque les endpoints refusent déjà l'auto-action).
 *
 * `resetKey` vide la sélection dès que la vue change : conserver une sélection
 * sur des lignes devenues invisibles conduit à agir en aveugle.
 */
export function useUserSelection(selectableIds: number[], resetKey: string) {
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    setSelected([]);
  }, [resetKey]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const isSelected = useCallback(
    (id: number) => selectedSet.has(id),
    [selectedSet],
  );

  const toggle = useCallback((id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }, []);

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedSet.has(id));
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      selectableIds.length > 0 && selectableIds.every((id) => prev.includes(id))
        ? []
        : [...selectableIds],
    );
  }, [selectableIds]);

  const clear = useCallback(() => setSelected([]), []);

  return {
    selected,
    count: selected.length,
    isSelected,
    toggle,
    toggleAll,
    allSelected,
    someSelected,
    clear,
  };
}
