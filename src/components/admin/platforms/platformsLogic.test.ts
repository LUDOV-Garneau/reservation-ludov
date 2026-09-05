import { describe, expect, it } from "vitest";
import {
  computeStats,
  filterPlatforms,
  isBookable,
} from "@/components/admin/platforms/platformsLogic";
import type { PlatformRow } from "@/components/admin/platforms/types";

function platform(overrides: Partial<PlatformRow> = {}): PlatformRow {
  return {
    id: 1,
    name: "PlayStation 4",
    picture: "/api/images/consoles/ps4.png",
    description: null,
    unitsTotal: 2,
    unitsActive: 2,
    gamesCount: 40,
    stationsCount: 1,
    ...overrides,
  };
}

describe("isBookable", () => {
  it("exige un exemplaire libre et une station active", () => {
    expect(isBookable(platform())).toBe(true);
    expect(isBookable(platform({ unitsActive: 0 }))).toBe(false);
    expect(isBookable(platform({ stationsCount: 0 }))).toBe(false);
  });

  it("ignore les exemplaires indisponibles", () => {
    expect(isBookable(platform({ unitsTotal: 5, unitsActive: 0 }))).toBe(false);
  });
});

describe("filterPlatforms", () => {
  const list = [
    platform({ id: 1, name: "PlayStation 4" }),
    platform({ id: 2, name: "Nintendo Switch", picture: null }),
    platform({ id: 3, name: "Xbox 360", description: "Console rétro du fonds" }),
  ];

  it("sans filtre, renvoie tout", () => {
    expect(filterPlatforms(list, { search: "", photo: "all" })).toHaveLength(3);
  });

  it("cherche dans le nom, sans tenir compte de la casse ni des espaces", () => {
    const found = filterPlatforms(list, { search: "  switch ", photo: "all" });
    expect(found.map((p) => p.id)).toEqual([2]);
  });

  it("cherche aussi dans la description", () => {
    const found = filterPlatforms(list, { search: "rétro", photo: "all" });
    expect(found.map((p) => p.id)).toEqual([3]);
  });

  it("filtre sur la présence d'une photo", () => {
    expect(
      filterPlatforms(list, { search: "", photo: "no" }).map((p) => p.id),
    ).toEqual([2]);
    expect(
      filterPlatforms(list, { search: "", photo: "yes" }).map((p) => p.id),
    ).toEqual([1, 3]);
  });

  it("combine recherche et filtre photo", () => {
    expect(
      filterPlatforms(list, { search: "o", photo: "no" }).map((p) => p.id),
    ).toEqual([2]);
  });
});

describe("computeStats", () => {
  it("compte les photos et les plateformes non réservables", () => {
    const stats = computeStats([
      platform({ id: 1 }),
      platform({ id: 2, picture: null, stationsCount: 0 }),
      platform({ id: 3, unitsActive: 0 }),
    ]);

    expect(stats).toEqual({
      total: 3,
      withPhoto: 2,
      withoutPhoto: 1,
      unbookable: 2,
    });
  });

  it("gère une liste vide", () => {
    expect(computeStats([])).toEqual({
      total: 0,
      withPhoto: 0,
      withoutPhoto: 0,
      unbookable: 0,
    });
  });
});
