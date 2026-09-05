import { describe, expect, it } from "vitest";
import {
  MAX_DESCRIPTION_LENGTH,
  isValidPicture,
  parsePlatformPatch,
} from "@/lib/platformUpdate";

describe("isValidPicture", () => {
  it("accepte un chemin local servi par l'application", () => {
    expect(isValidPicture("/api/images/consoles/ps4.png")).toBe(true);
  });

  it("refuse une remontée de répertoire", () => {
    expect(isValidPicture("/api/images/../../etc/passwd")).toBe(false);
  });

  it("accepte une URL https héritée et refuse http", () => {
    expect(isValidPicture("https://images.igdb.com/x.jpg")).toBe(true);
    expect(isValidPicture("http://images.igdb.com/x.jpg")).toBe(false);
  });
});

describe("parsePlatformPatch", () => {
  it("refuse un corps qui n'est pas un objet", () => {
    expect(parsePlatformPatch(null).ok).toBe(false);
    expect(parsePlatformPatch("photo").ok).toBe(false);
    expect(parsePlatformPatch([]).ok).toBe(false);
  });

  it("refuse une modification du nom, réécrit par la synchro Koha", () => {
    const result = parsePlatformPatch({ name: "PlayStation 5" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Koha/);
  });

  it("refuse un corps sans aucun champ modifiable", () => {
    expect(parsePlatformPatch({}).ok).toBe(false);
    expect(parsePlatformPatch({ id: 3 }).ok).toBe(false);
  });

  it("accepte une photo valide et son retrait", () => {
    expect(parsePlatformPatch({ picture: "/api/images/consoles/a.png" })).toEqual(
      { ok: true, patch: { picture: "/api/images/consoles/a.png" } },
    );
    expect(parsePlatformPatch({ picture: null })).toEqual({
      ok: true,
      patch: { picture: null },
    });
  });

  it("refuse une photo au chemin invalide", () => {
    expect(parsePlatformPatch({ picture: "/uploads/a.png" }).ok).toBe(false);
    expect(parsePlatformPatch({ picture: 42 }).ok).toBe(false);
  });

  it("trime la description et ramène une description vide à null", () => {
    expect(parsePlatformPatch({ description: "  Console 8 bits  " })).toEqual({
      ok: true,
      patch: { description: "Console 8 bits" },
    });
    expect(parsePlatformPatch({ description: "   " })).toEqual({
      ok: true,
      patch: { description: null },
    });
    expect(parsePlatformPatch({ description: null })).toEqual({
      ok: true,
      patch: { description: null },
    });
  });

  it("refuse une description trop longue", () => {
    const tooLong = "a".repeat(MAX_DESCRIPTION_LENGTH + 1);
    expect(parsePlatformPatch({ description: tooLong }).ok).toBe(false);
    expect(parsePlatformPatch({ description: "a".repeat(MAX_DESCRIPTION_LENGTH) }).ok).toBe(
      true,
    );
  });

  it("accepte les deux champs à la fois", () => {
    expect(
      parsePlatformPatch({
        picture: "/api/images/consoles/a.png",
        description: "Une console",
      }),
    ).toEqual({
      ok: true,
      patch: {
        picture: "/api/images/consoles/a.png",
        description: "Une console",
      },
    });
  });
});
