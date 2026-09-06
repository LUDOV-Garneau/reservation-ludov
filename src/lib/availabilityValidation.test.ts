import { describe, expect, it } from "vitest";
import {
  findDateErrors,
  findRangeError,
  findWeeklyErrors,
  isValidRangeSet,
  toMinutes,
} from "@/lib/availabilityValidation";

/** Raccourci de lisibilité : « 09:00-17:00 ». */
function r(debut: string, fin: string) {
  const [startHour, startMinute] = debut.split(":");
  const [endHour, endMinute] = fin.split(":");
  return { startHour, startMinute, endHour, endMinute };
}

describe("toMinutes", () => {
  it("convertit une heure valide", () => {
    expect(toMinutes("09", "30")).toBe(570);
    expect(toMinutes("00", "00")).toBe(0);
    expect(toMinutes("23", "59")).toBe(1439);
  });

  it("refuse ce qui n'est pas une heure du jour", () => {
    for (const [h, m] of [
      ["24", "00"],
      ["09", "60"],
      ["9", "00"],
      ["", "00"],
      ["ab", "00"],
      ["-1", "00"],
    ]) {
      expect(toMinutes(h, m)).toBeNull();
    }
  });
});

describe("findRangeError — une seule plage", () => {
  it("accepte une plage ordinaire", () => {
    expect(findRangeError([r("09:00", "17:00")])).toBeNull();
  });

  it("refuse une fin avant le début", () => {
    expect(findRangeError([r("17:00", "09:00")])).toBe("invalid_range");
  });

  it("refuse une plage vide", () => {
    // Fin = début : aucun créneau ne tiendrait dedans.
    expect(findRangeError([r("09:00", "09:00")])).toBe("invalid_range");
  });

  it("distingue une heure illisible d'un mauvais ordre", () => {
    expect(findRangeError([r("99:00", "17:00")])).toBe("invalid_time");
  });

  it("accepte un ensemble vide", () => {
    expect(findRangeError([])).toBeNull();
  });
});

describe("findRangeError — plusieurs plages", () => {
  it("accepte des plages disjointes, quel que soit leur ordre d'arrivee", () => {
    expect(
      findRangeError([r("13:00", "17:00"), r("09:00", "12:00")]),
    ).toBeNull();
  });

  it("accepte deux plages qui se touchent bout a bout", () => {
    // 12:00-13:00 puis 13:00-17:00 : pas de chevauchement, la seconde
    // commence quand la premiere finit.
    expect(
      findRangeError([r("12:00", "13:00"), r("13:00", "17:00")]),
    ).toBeNull();
  });

  it("refuse un chevauchement", () => {
    expect(
      findRangeError([r("09:00", "13:00"), r("12:00", "17:00")]),
    ).toBe("overlap");
  });

  it("refuse une plage entierement contenue dans une autre", () => {
    expect(
      findRangeError([r("09:00", "17:00"), r("10:00", "11:00")]),
    ).toBe("overlap");
  });

  it("signale le mauvais ordre avant le chevauchement", () => {
    // La plage inversee est le defaut le plus proche de la cause.
    expect(
      findRangeError([r("09:00", "13:00"), r("17:00", "10:00")]),
    ).toBe("invalid_range");
  });
});

describe("isValidRangeSet", () => {
  it("resume findRangeError en booleen", () => {
    expect(isValidRangeSet([r("09:00", "17:00")])).toBe(true);
    expect(isValidRangeSet([r("17:00", "09:00")])).toBe(false);
  });
});

describe("findWeeklyErrors", () => {
  it("ignore les jours desactives, meme si leurs plages sont absurdes", () => {
    const erreurs = findWeeklyErrors({
      lundi: { enabled: false, hoursRanges: [r("17:00", "09:00")] },
      mardi: { enabled: true, hoursRanges: [r("09:00", "17:00")] },
    });
    expect(erreurs).toEqual({});
  });

  it("nomme le jour fautif", () => {
    const erreurs = findWeeklyErrors({
      lundi: { enabled: true, hoursRanges: [r("09:00", "13:00"), r("12:00", "17:00")] },
      mardi: { enabled: true, hoursRanges: [r("09:00", "17:00")] },
    });
    expect(erreurs).toEqual({ lundi: "overlap" });
  });

  it("rapporte plusieurs jours a la fois", () => {
    const erreurs = findWeeklyErrors({
      lundi: { enabled: true, hoursRanges: [r("17:00", "09:00")] },
      mardi: { enabled: true, hoursRanges: [r("09:00", "13:00"), r("10:00", "11:00")] },
    });
    expect(erreurs).toEqual({ lundi: "invalid_range", mardi: "overlap" });
  });

  it("supporte un jour active sans plage", () => {
    expect(
      findWeeklyErrors({ lundi: { enabled: true, hoursRanges: [] } }),
    ).toEqual({});
  });
});

describe("findDateErrors", () => {
  it("groupe par jour calendaire et non par objet", () => {
    const erreurs = findDateErrors([
      { date: "2026-10-05", timeRange: r("09:00", "13:00") },
      { date: "2026-10-05", timeRange: r("12:00", "17:00") },
      { date: "2026-10-06", timeRange: r("09:00", "17:00") },
    ]);
    expect(erreurs).toEqual({ "2026-10-05": "overlap" });
  });

  it("ne confond pas deux jours differents", () => {
    const erreurs = findDateErrors([
      { date: "2026-10-05", timeRange: r("09:00", "13:00") },
      { date: "2026-10-06", timeRange: r("12:00", "17:00") },
    ]);
    expect(erreurs).toEqual({});
  });

  it("accepte une liste vide", () => {
    expect(findDateErrors([])).toEqual({});
  });
});
