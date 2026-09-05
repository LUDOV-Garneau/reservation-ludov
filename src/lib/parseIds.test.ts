import { describe, expect, it } from "vitest";
import { parseIds } from "@/lib/parseIds";

describe("parseIds — ce qui est accepté", () => {
  it("garde les entiers positifs", () => {
    expect(parseIds([1, 2, 42])).toEqual([1, 2, 42]);
  });

  it("accepte les chaînes de chiffres décimaux", () => {
    expect(parseIds(["1", "42"])).toEqual([1, 42]);
  });

  it("dédoublonne en conservant le premier ordre vu", () => {
    expect(parseIds([3, 1, 3, "1", 2])).toEqual([3, 1, 2]);
  });

  it("renvoie un tableau vide si l'entrée n'est pas un tableau", () => {
    for (const raw of [undefined, null, 5, "1,2", {}, { ids: [1] }]) {
      expect(parseIds(raw)).toEqual([]);
    }
  });
});

describe("parseIds — les coercitions que Number() laissait passer", () => {
  // Chaque cas ci-dessous produisait auparavant un id valide, donc une action
  // groupée sur la mauvaise ligne.
  it("refuse les booléens (true valait 1)", () => {
    expect(parseIds([true])).toEqual([]);
    expect(parseIds([false])).toEqual([]);
  });

  it("refuse les tableaux imbriqués ([5] valait 5)", () => {
    expect(parseIds([[5]])).toEqual([]);
    expect(parseIds([["7"]])).toEqual([]);
  });

  it("refuse la notation scientifique (\"1e3\" valait 1000)", () => {
    expect(parseIds(["1e3"])).toEqual([]);
  });

  it("refuse l'hexadécimal (\"0x10\" valait 16)", () => {
    expect(parseIds(["0x10"])).toEqual([]);
  });

  it("refuse les chaînes entourées d'espaces", () => {
    expect(parseIds([" 4 "])).toEqual([]);
    expect(parseIds(["4\n"])).toEqual([]);
  });
});

describe("parseIds — bornes", () => {
  it("refuse zéro et les négatifs", () => {
    expect(parseIds([0, -1, "0", "-3"])).toEqual([]);
  });

  it("refuse les non-entiers", () => {
    expect(parseIds([1.5, "1.5", NaN, Infinity])).toEqual([]);
  });

  it("refuse au-delà des entiers sûrs", () => {
    expect(parseIds([Number.MAX_SAFE_INTEGER + 1])).toEqual([]);
    expect(parseIds([Number.MAX_SAFE_INTEGER])).toEqual([
      Number.MAX_SAFE_INTEGER,
    ]);
  });

  it("ne retient que les entrées valides d'un tableau mixte", () => {
    expect(parseIds([1, true, "2", [3], null, "4", 0])).toEqual([1, 2, 4]);
  });
});
