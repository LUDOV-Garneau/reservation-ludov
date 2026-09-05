import { describe, expect, it } from "vitest";
import {
  orphanPlatformLabel,
  projectStationConsoles,
  readConsolesColumn,
} from "@/lib/stationProjection";

const NAMES = new Map<number, string>([
  [1, "PlayStation 2"],
  [3, "Nintendo 64"],
]);

describe("projectStationConsoles — alignement", () => {
  it("garde la même longueur et le même ordre que la colonne", () => {
    const result = projectStationConsoles([3, 1], NAMES);
    expect(result.consolesId).toEqual([3, 1]);
    expect(result.consoles).toEqual(["Nintendo 64", "PlayStation 2"]);
  });

  it("reste aligné quand un identifiant est orphelin", () => {
    // Le défaut d'origine : `filter(Boolean)` retirait l'entrée, `consoles`
    // devenait plus court que `consolesId` et la plateforme morte disparaissait.
    const result = projectStationConsoles([1, 99, 3], NAMES);
    expect(result.consolesId).toEqual([1, 99, 3]);
    expect(result.consoles).toEqual(["PlayStation 2", "#99", "Nintendo 64"]);
    expect(result.consoles).toHaveLength(result.consolesId.length);
  });

  it("reste aligné quand tous les identifiants sont orphelins", () => {
    const result = projectStationConsoles([7, 8], new Map());
    expect(result.consoles).toEqual(["#7", "#8"]);
    expect(result.consoles).toHaveLength(result.consolesId.length);
  });

  it("gère une station sans plateforme", () => {
    expect(projectStationConsoles([], NAMES)).toEqual({
      consoles: [],
      consolesId: [],
    });
  });
});

describe("readConsolesColumn", () => {
  it("accepte un tableau", () => {
    expect(readConsolesColumn([1, 2])).toEqual([1, 2]);
  });

  it("retombe sur un tableau vide pour une colonne json inattendue", () => {
    for (const value of [null, undefined, {}, "1,2", 5]) {
      expect(readConsolesColumn(value)).toEqual([]);
    }
  });
});

describe("orphanPlatformLabel", () => {
  it("préfixe l'identifiant d'un croisillon", () => {
    expect(orphanPlatformLabel(42)).toBe("#42");
  });
});
