import { describe, expect, it } from "vitest";
import {
  readStationPatch,
  readStationPayload,
  STATION_NAME_MAX_LENGTH,
} from "@/lib/stationUpdate";

const CONSOLES = [3, 1];

describe("readStationPayload — nom", () => {
  it("accepte et trime un nom valide", () => {
    const result = readStationPayload({
      name: "  Poste 3  ",
      consoles: CONSOLES,
    });
    expect(result).toEqual({
      ok: true,
      value: { name: "Poste 3", consoles: [1, 3] },
    });
  });

  it("refuse un nom absent, vide ou blanc", () => {
    for (const name of [undefined, null, "", "   ", 42]) {
      expect(readStationPayload({ name, consoles: CONSOLES })).toEqual({
        ok: false,
        error: "name_required",
      });
    }
  });

  it("refuse un nom plus long que la colonne", () => {
    expect(
      readStationPayload({
        name: "x".repeat(STATION_NAME_MAX_LENGTH + 1),
        consoles: CONSOLES,
      }),
    ).toEqual({ ok: false, error: "name_too_long" });
  });

  it("accepte un nom exactement à la longueur maximale", () => {
    const name = "x".repeat(STATION_NAME_MAX_LENGTH);
    const result = readStationPayload({ name, consoles: CONSOLES });
    expect(result.ok && result.value.name).toBe(name);
  });

  it("mesure la longueur après le trim", () => {
    const name = ` ${"x".repeat(STATION_NAME_MAX_LENGTH)} `;
    expect(readStationPayload({ name, consoles: CONSOLES }).ok).toBe(true);
  });
});

describe("readStationPayload — plateformes", () => {
  it("refuse une liste absente, vide ou non tableau", () => {
    for (const consoles of [undefined, null, [], "1,2", {}]) {
      expect(readStationPayload({ name: "Poste 1", consoles })).toEqual({
        ok: false,
        error: "consoles_required",
      });
    }
  });

  it("refuse un identifiant non entier ou négatif", () => {
    for (const consoles of [[1, 0], [1, -2], [1, 2.5], [1, "abc"], [1, null]]) {
      expect(readStationPayload({ name: "Poste 1", consoles })).toEqual({
        ok: false,
        error: "consoles_invalid",
      });
    }
  });

  it("refuse les coercitions que Number() laissait passer", () => {
    // `true` valait la plateforme 1, `[5]` la 5, `"0x10"` la 16 : une station
    // se retrouvait rattachée à des plateformes que personne n'avait choisies.
    for (const consoles of [
      [true],
      [1, true],
      [[5]],
      ["1e3"],
      ["0x10"],
      [" 4 "],
    ]) {
      expect(readStationPayload({ name: "Poste 1", consoles })).toEqual({
        ok: false,
        error: "consoles_invalid",
      });
    }
  });

  it("accepte des identifiants transmis en chaînes", () => {
    const result = readStationPayload({
      name: "Poste 1",
      consoles: ["2", "5"],
    });
    expect(result.ok && result.value.consoles).toEqual([2, 5]);
  });

  it("dédoublonne et ordonne", () => {
    const result = readStationPayload({
      name: "Poste 1",
      consoles: [5, 2, 5, 2, 9],
    });
    expect(result.ok && result.value.consoles).toEqual([2, 5, 9]);
  });
});

describe("readStationPayload — isActive", () => {
  it("ignore le champ quand il n'est pas autorisé (création)", () => {
    const result = readStationPayload({
      name: "Poste 1",
      consoles: CONSOLES,
      isActive: false,
    });
    expect(result.ok && "isActive" in result.value).toBe(false);
  });

  it("ne retient jamais isActive : une station naît active", () => {
    const result = readStationPayload({
      name: "Poste 1",
      consoles: CONSOLES,
      isActive: false,
    });
    expect(result.ok && "isActive" in result.value).toBe(false);
  });
});

describe("readStationPatch", () => {
  it("accepte isActive seul — c'est le geste de désactivation", () => {
    for (const isActive of [true, false]) {
      expect(readStationPatch({ isActive })).toEqual({
        ok: true,
        value: { isActive },
      });
    }
  });

  it("désactive une station sans aucune plateforme", () => {
    // Le cas qui rendait la désactivation impossible quand le PATCH exigeait
    // le corps complet : `consoles` vide était refusé.
    expect(readStationPatch({ isActive: false })).toEqual({
      ok: true,
      value: { isActive: false },
    });
  });

  it("accepte un nom seul, trimé", () => {
    expect(readStationPatch({ name: "  Poste 4 " })).toEqual({
      ok: true,
      value: { name: "Poste 4" },
    });
  });

  it("accepte des plateformes seules, dédoublonnées et ordonnées", () => {
    expect(readStationPatch({ consoles: [5, 2, 5] })).toEqual({
      ok: true,
      value: { consoles: [2, 5] },
    });
  });

  it("accepte les trois champs ensemble", () => {
    expect(
      readStationPatch({ name: "Poste 4", consoles: [2], isActive: true }),
    ).toEqual({
      ok: true,
      value: { name: "Poste 4", consoles: [2], isActive: true },
    });
  });

  it("valide les champs présents comme à la création", () => {
    expect(readStationPatch({ name: "   " })).toEqual({
      ok: false,
      error: "name_required",
    });
    expect(readStationPatch({ consoles: [] })).toEqual({
      ok: false,
      error: "consoles_required",
    });
    expect(readStationPatch({ consoles: [0] })).toEqual({
      ok: false,
      error: "consoles_invalid",
    });
  });

  it("refuse un patch vide plutôt que de ne rien faire en silence", () => {
    for (const body of [{}, undefined, null, { isActive: "oui" }, { autre: 1 }]) {
      expect(readStationPatch(body)).toEqual({
        ok: false,
        error: "empty_patch",
      });
    }
  });
});

describe("readStationPayload — champs inattendus", () => {
  it("ne recopie que les champs connus", () => {
    const result = readStationPayload({
      name: "Poste 1",
      consoles: CONSOLES,
      id: 99,
      createdAt: "2020-01-01 00:00:00",
    });
    expect(result.ok && Object.keys(result.value).sort()).toEqual([
      "consoles",
      "name",
    ]);
  });

  it("supporte un corps absent", () => {
    expect(readStationPayload(undefined)).toEqual({
      ok: false,
      error: "name_required",
    });
    expect(readStationPayload(null)).toEqual({
      ok: false,
      error: "name_required",
    });
  });
});
