import { describe, expect, it } from "vitest";
import {
  applyConsoleMode,
  computeStats,
  filterAccessories,
  matchesPlatformFilter,
  matchesVisibilityFilter,
  sortAccessories,
} from "@/components/admin/accessoires/accessoriesLogic";
import type { AccessoryRow } from "@/components/admin/accessoires/types";

function accessory(overrides: Partial<AccessoryRow> = {}): AccessoryRow {
  return {
    id: 1,
    name: "Manette DualShock 4",
    kohaId: 4201,
    hidden: false,
    lastUpdatedAt: "2026-08-30 10:12:00",
    consoles: [{ id: 7, name: "PlayStation 4" }],
    ...overrides,
  };
}

const NO_FILTER = { search: "", platform: "all", visibility: "all" } as const;

describe("matchesPlatformFilter", () => {
  it("laisse tout passer sans filtre", () => {
    expect(matchesPlatformFilter(accessory(), "all")).toBe(true);
    expect(matchesPlatformFilter(accessory({ consoles: [] }), "all")).toBe(true);
  });

  it("isole les accessoires sans plateforme", () => {
    expect(matchesPlatformFilter(accessory({ consoles: [] }), "none")).toBe(true);
    expect(matchesPlatformFilter(accessory(), "none")).toBe(false);
  });

  it("retient les accessoires portant l'id demandé", () => {
    expect(matchesPlatformFilter(accessory(), 7)).toBe(true);
    expect(matchesPlatformFilter(accessory(), 8)).toBe(false);
  });
});

describe("matchesVisibilityFilter", () => {
  it("distingue visibles et masqués", () => {
    const visible = accessory();
    const masked = accessory({ hidden: true });

    expect(matchesVisibilityFilter(visible, "visible")).toBe(true);
    expect(matchesVisibilityFilter(visible, "hidden")).toBe(false);
    expect(matchesVisibilityFilter(masked, "hidden")).toBe(true);
    expect(matchesVisibilityFilter(masked, "all")).toBe(true);
  });
});

describe("filterAccessories", () => {
  const list = [
    accessory({ id: 1, name: "Manette DualShock 4", kohaId: 4201 }),
    accessory({
      id: 2,
      name: "Câble HDMI",
      kohaId: 4302,
      consoles: [],
      hidden: true,
    }),
    accessory({
      id: 3,
      name: "Volant Logitech",
      kohaId: 4403,
      consoles: [{ id: 9, name: "Nintendo Switch" }],
    }),
  ];

  it("sans filtre, renvoie tout", () => {
    expect(filterAccessories(list, NO_FILTER)).toHaveLength(3);
  });

  it("cherche dans le nom, sans tenir compte de la casse ni des espaces", () => {
    const found = filterAccessories(list, { ...NO_FILTER, search: "  volant " });
    expect(found.map((a) => a.id)).toEqual([3]);
  });

  it("cherche dans l'ID Koha", () => {
    const found = filterAccessories(list, { ...NO_FILTER, search: "4302" });
    expect(found.map((a) => a.id)).toEqual([2]);
  });

  it("cherche dans le nom des plateformes compatibles", () => {
    const found = filterAccessories(list, { ...NO_FILTER, search: "switch" });
    expect(found.map((a) => a.id)).toEqual([3]);
  });

  it("filtre sur l'absence de plateforme", () => {
    const found = filterAccessories(list, { ...NO_FILTER, platform: "none" });
    expect(found.map((a) => a.id)).toEqual([2]);
  });

  it("combine plateforme et visibilité", () => {
    expect(
      filterAccessories(list, {
        ...NO_FILTER,
        platform: "none",
        visibility: "visible",
      }),
    ).toEqual([]);
    expect(
      filterAccessories(list, {
        ...NO_FILTER,
        platform: "none",
        visibility: "hidden",
      }).map((a) => a.id),
    ).toEqual([2]);
  });
});

describe("sortAccessories", () => {
  const list = [
    accessory({ id: 1, name: "Volant", kohaId: 300, consoles: [] }),
    accessory({
      id: 2,
      name: "câble",
      kohaId: 100,
      hidden: true,
      consoles: [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
      ],
    }),
    accessory({ id: 3, name: "Manette", kohaId: 200 }),
  ];

  it("trie par nom en ignorant casse et accents", () => {
    expect(sortAccessories(list, "name", "asc").map((a) => a.id)).toEqual([
      2, 3, 1,
    ]);
    expect(sortAccessories(list, "name", "desc").map((a) => a.id)).toEqual([
      1, 3, 2,
    ]);
  });

  it("trie par ID Koha", () => {
    expect(sortAccessories(list, "koha", "asc").map((a) => a.kohaId)).toEqual([
      100, 200, 300,
    ]);
  });

  it("trie par nombre de plateformes", () => {
    expect(sortAccessories(list, "consoles", "asc").map((a) => a.id)).toEqual([
      1, 3, 2,
    ]);
  });

  it("place les visibles avant les masqués en ascendant", () => {
    expect(sortAccessories(list, "visibility", "asc").map((a) => a.id)).toEqual([
      3, 1, 2,
    ]);
  });

  it("départage les ex æquo par nom puis id, sans muter l'entrée", () => {
    const tied = [
      accessory({ id: 5, name: "Zèbre", kohaId: 1 }),
      accessory({ id: 4, name: "Alpha", kohaId: 1 }),
    ];
    expect(sortAccessories(tied, "koha", "asc").map((a) => a.id)).toEqual([4, 5]);
    expect(tied.map((a) => a.id)).toEqual([5, 4]);
  });
});

describe("computeStats", () => {
  it("compte visibles, masqués et sans plateforme", () => {
    const stats = computeStats([
      accessory({ id: 1 }),
      accessory({ id: 2, hidden: true, consoles: [] }),
      accessory({ id: 3, consoles: [] }),
    ]);

    expect(stats).toEqual({
      total: 3,
      visible: 2,
      hidden: 1,
      withoutConsole: 2,
    });
  });

  it("gère une liste vide", () => {
    expect(computeStats([])).toEqual({
      total: 0,
      visible: 0,
      hidden: 0,
      withoutConsole: 0,
    });
  });
});

describe("applyConsoleMode", () => {
  it("remplace, ajoute et retire sans jamais dupliquer", () => {
    expect(applyConsoleMode([1, 2], "set", [3, 3])).toEqual([3]);
    expect(applyConsoleMode([1, 2], "add", [2, 3])).toEqual([1, 2, 3]);
    expect(applyConsoleMode([1, 2, 3], "remove", [2, 9])).toEqual([1, 3]);
  });
});
