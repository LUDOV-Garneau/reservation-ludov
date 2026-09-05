import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  parseStationsQuery,
  STATIONS_PAGE_SIZES,
} from "@/lib/stationsQuery";

function parse(query: string) {
  return parseStationsQuery(new URLSearchParams(query));
}

describe("parseStationsQuery — valeurs par défaut", () => {
  it("renvoie les défauts quand rien n'est passé", () => {
    expect(parse("")).toEqual({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      offset: 0,
      all: false,
      search: "",
      status: "all",
      sort: "name",
      dir: "asc",
    });
  });

  it("trime la recherche", () => {
    expect(parse("search=%20%20poste%201%20").search).toBe("poste 1");
  });
});

describe("parseStationsQuery — pagination", () => {
  it("accepte les tailles de page proposées par l'interface", () => {
    for (const size of STATIONS_PAGE_SIZES) {
      expect(parse(`limit=${size}`).limit).toBe(size);
    }
  });

  it("retombe sur le défaut pour une taille hors liste", () => {
    // C'est ce qui protège la route : `limit=100000` ne doit pas passer.
    expect(parse("limit=100000").limit).toBe(DEFAULT_PAGE_SIZE);
    expect(parse("limit=200").limit).toBe(DEFAULT_PAGE_SIZE);
    expect(parse("limit=0").limit).toBe(DEFAULT_PAGE_SIZE);
    expect(parse("limit=abc").limit).toBe(DEFAULT_PAGE_SIZE);
  });

  it("ramène une page absurde à la première", () => {
    expect(parse("page=0").page).toBe(1);
    expect(parse("page=-7").page).toBe(1);
    expect(parse("page=2.5").page).toBe(1);
    expect(parse("page=").page).toBe(1);
  });

  it("calcule l'offset à partir de la page et de la taille", () => {
    expect(parse("page=4&limit=50").offset).toBe(150);
  });

  it("reconnaît `all=1` et rien d'autre", () => {
    expect(parse("all=1").all).toBe(true);
    expect(parse("all=true").all).toBe(false);
    expect(parse("all=0").all).toBe(false);
    expect(parse("").all).toBe(false);
  });
});

describe("parseStationsQuery — statut", () => {
  it("accepte les trois statuts", () => {
    for (const status of ["all", "active", "inactive"] as const) {
      expect(parse(`status=${status}`).status).toBe(status);
    }
  });

  it("retombe sur `all` pour un statut inconnu", () => {
    expect(parse("status=archived").status).toBe("all");
    expect(parse("status=").status).toBe("all");
  });
});

describe("parseStationsQuery — tri", () => {
  it("accepte les clés de tri connues", () => {
    for (const sort of ["name", "created", "platforms", "status"] as const) {
      expect(parse(`sort=${sort}`).sort).toBe(sort);
    }
  });

  it("retombe sur `name` pour une clé inconnue", () => {
    expect(parse("sort=consoles").sort).toBe("name");
  });

  it("accepte les deux sens et retombe sur `asc`", () => {
    expect(parse("dir=desc").dir).toBe("desc");
    expect(parse("dir=asc").dir).toBe("asc");
    expect(parse("dir=DESC").dir).toBe("asc");
  });
});
