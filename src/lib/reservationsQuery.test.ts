import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  parseReservationsQuery,
  RESERVATIONS_PAGE_SIZES,
  splitLocalNow,
} from "@/lib/reservationsQuery";

/** Raccourci : `parseReservationsQuery` prend des `URLSearchParams`. */
function parse(query: string) {
  return parseReservationsQuery(new URLSearchParams(query));
}

describe("parseReservationsQuery — valeurs par défaut", () => {
  it("renvoie les défauts quand rien n'est passé", () => {
    expect(parse("")).toEqual({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      offset: 0,
      search: "",
      from: null,
      to: null,
      status: "all",
      sort: "schedule",
      dir: "asc",
      isEmptyRange: false,
    });
  });

  it("trime la recherche", () => {
    expect(parse("search=%20%20Zelda%20%20").search).toBe("Zelda");
  });
});

describe("parseReservationsQuery — pagination", () => {
  it("accepte les tailles de page proposées par l'interface", () => {
    for (const size of RESERVATIONS_PAGE_SIZES) {
      expect(parse(`limit=${size}`).limit).toBe(size);
    }
  });

  it("retombe sur le défaut pour une taille hors liste", () => {
    expect(parse("limit=37").limit).toBe(DEFAULT_PAGE_SIZE);
    expect(parse("limit=0").limit).toBe(DEFAULT_PAGE_SIZE);
    expect(parse("limit=abc").limit).toBe(DEFAULT_PAGE_SIZE);
  });

  it("ramène une page absurde à la première", () => {
    expect(parse("page=0").page).toBe(1);
    expect(parse("page=-4").page).toBe(1);
    expect(parse("page=1.5").page).toBe(1);
    expect(parse("page=xyz").page).toBe(1);
  });

  it("calcule l'offset à partir de la page et de la taille", () => {
    expect(parse("page=3&limit=25").offset).toBe(50);
  });
});

describe("parseReservationsQuery — bornes de date", () => {
  it("accepte une borne basse seule", () => {
    const q = parse("from=2026-09-03");
    expect(q.from).toBe("2026-09-03");
    expect(q.to).toBeNull();
    expect(q.isEmptyRange).toBe(false);
  });

  it("accepte une borne haute seule", () => {
    const q = parse("to=2026-09-03");
    expect(q.from).toBeNull();
    expect(q.to).toBe("2026-09-03");
  });

  it("accepte une journée précise (from = to)", () => {
    const q = parse("from=2026-09-03&to=2026-09-03");
    expect(q.from).toBe("2026-09-03");
    expect(q.to).toBe("2026-09-03");
    expect(q.isEmptyRange).toBe(false);
  });

  it("signale un intervalle inversé sans le rejeter", () => {
    const q = parse("from=2026-09-10&to=2026-09-03");
    expect(q.isEmptyRange).toBe(true);
    expect(q.from).toBe("2026-09-10");
    expect(q.to).toBe("2026-09-03");
  });

  it("ignore une date mal formée", () => {
    expect(parse("from=03-09-2026").from).toBeNull();
    expect(parse("from=2026-9-3").from).toBeNull();
    expect(parse("to=hier").to).toBeNull();
    expect(parse("from=").from).toBeNull();
  });

  it("ignore une date inexistante au calendrier", () => {
    expect(parse("from=2026-02-30").from).toBeNull();
    expect(parse("from=2026-13-01").from).toBeNull();
    expect(parse("to=2025-02-29").to).toBeNull();
  });

  it("accepte le 29 février d'une année bissextile", () => {
    expect(parse("from=2028-02-29").from).toBe("2028-02-29");
  });
});

describe("parseReservationsQuery — statut", () => {
  it("accepte les quatre statuts", () => {
    for (const status of ["all", "upcoming", "past", "cancelled"] as const) {
      expect(parse(`status=${status}`).status).toBe(status);
    }
  });

  it("retombe sur `all` pour un statut inconnu", () => {
    expect(parse("status=archived").status).toBe("all");
    expect(parse("status=").status).toBe("all");
  });
});

describe("parseReservationsQuery — tri", () => {
  it("accepte les clés de tri connues", () => {
    for (const sort of ["schedule", "user", "console", "status"] as const) {
      expect(parse(`sort=${sort}`).sort).toBe(sort);
    }
  });

  it("retombe sur `schedule` pour une clé inconnue", () => {
    expect(parse("sort=prix").sort).toBe("schedule");
  });

  it("accepte les deux sens et retombe sur `asc`", () => {
    expect(parse("dir=desc").dir).toBe("desc");
    expect(parse("dir=asc").dir).toBe("asc");
    expect(parse("dir=descending").dir).toBe("asc");
  });
});

describe("splitLocalNow", () => {
  it("découpe l'instant en jour local et heure locale", () => {
    // 3 septembre 2026, 14 h 05 min 09 s, heure locale du processus.
    const now = new Date(2026, 8, 3, 14, 5, 9);
    expect(splitLocalNow(now)).toEqual({
      today: "2026-09-03",
      nowTime: "14:05:09",
    });
  });

  it("ne bascule pas de jour en fin de soirée", () => {
    // Le piège UTC : 23 h 30 locales en Amérique, c'est déjà le lendemain à
    // Greenwich. Le jour renvoyé doit rester le jour local.
    const now = new Date(2026, 8, 3, 23, 30, 0);
    expect(splitLocalNow(now).today).toBe("2026-09-03");
  });
});
