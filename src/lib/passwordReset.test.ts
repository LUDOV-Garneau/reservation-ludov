import { describe, it, expect, afterEach } from "vitest";
import {
  RESET_REQUESTS_PER_HOUR,
  RESET_TOKEN_TTL_MINUTES,
  buildResetUrl,
  generateResetToken,
  hashResetToken,
  isWellFormedResetToken,
} from "./passwordReset";

describe("generateResetToken", () => {
  it("produit un jeton sûr en URL, sans caractère à encoder", () => {
    for (let i = 0; i < 50; i++) {
      const token = generateResetToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(encodeURIComponent(token)).toBe(token);
    }
  });

  it("produit 43 caractères, soit 256 bits d'entropie", () => {
    // Un jeton plus court serait devinable par force brute pendant sa durée de
    // vie : c'est la seule chose qui protège le compte.
    expect(generateResetToken()).toHaveLength(43);
    expect(Buffer.from(generateResetToken(), "base64url")).toHaveLength(32);
  });

  it("ne répète jamais le même jeton", () => {
    const tokens = new Set(Array.from({ length: 500 }, generateResetToken));
    expect(tokens.size).toBe(500);
  });
});

describe("hashResetToken", () => {
  it("renvoie un SHA-256 hexadécimal de 64 caractères", () => {
    expect(hashResetToken("peu importe")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("est déterministe, pour permettre la recherche par index", () => {
    const token = generateResetToken();
    expect(hashResetToken(token)).toBe(hashResetToken(token));
  });

  it("ne laisse pas retrouver le jeton dans son empreinte", () => {
    const token = generateResetToken();
    expect(hashResetToken(token)).not.toContain(token);
  });

  it("donne des empreintes distinctes pour des jetons distincts", () => {
    expect(hashResetToken("a")).not.toBe(hashResetToken("b"));
  });
});

describe("isWellFormedResetToken", () => {
  it("accepte un jeton produit par generateResetToken", () => {
    expect(isWellFormedResetToken(generateResetToken())).toBe(true);
  });

  it.each([
    ["chaîne vide", ""],
    ["trop court", "abc"],
    ["trop long", "a".repeat(44)],
    ["caractère hors base64url", `${"a".repeat(42)}+`],
    ["espace", `${"a".repeat(42)} `],
  ])("rejette un jeton %s", (_cas, valeur) => {
    expect(isWellFormedResetToken(valeur)).toBe(false);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["nombre", 12345],
    ["objet", {}],
    ["tableau", []],
  ])("rejette une valeur de type %s", (_cas, valeur) => {
    expect(isWellFormedResetToken(valeur)).toBe(false);
  });

  it("écarte les jetons avant toute requête, ce qui bloque une injection", () => {
    expect(isWellFormedResetToken("' OR 1=1 --")).toBe(false);
  });
});

describe("buildResetUrl", () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  });

  it("construit l'URL à partir de NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://ludov.example.ca";
    expect(buildResetUrl("jeton", "fr")).toBe(
      "https://ludov.example.ca/fr/auth/reset-password?token=jeton",
    );
  });

  it("supprime la barre oblique finale pour ne pas doubler le séparateur", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://ludov.example.ca///";
    expect(buildResetUrl("jeton", "en")).toBe(
      "https://ludov.example.ca/en/auth/reset-password?token=jeton",
    );
  });

  it("retombe sur localhost quand la variable manque", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(buildResetUrl("jeton", "fr")).toBe(
      "http://localhost:3000/fr/auth/reset-password?token=jeton",
    );
  });

  it("ramène toute langue inconnue au français", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://ludov.example.ca";
    // Sans cela, une valeur venue du corps de requête se retrouverait dans le
    // chemin de l'URL envoyée par courriel.
    expect(buildResetUrl("jeton", "es")).toContain("/fr/auth/reset-password");
    expect(buildResetUrl("jeton", "../../evil")).toContain(
      "/fr/auth/reset-password",
    );
  });

  it("encode le jeton dans la chaîne de requête", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://ludov.example.ca";
    expect(buildResetUrl("a b&c", "fr")).toContain("?token=a%20b%26c");
  });

  it("produit une URL analysable dont le jeton se relit tel quel", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://ludov.example.ca";
    const token = generateResetToken();
    const url = new URL(buildResetUrl(token, "fr"));
    expect(url.searchParams.get("token")).toBe(token);
  });
});

describe("constantes du parcours", () => {
  it("expire le lien en 30 minutes", () => {
    expect(RESET_TOKEN_TTL_MINUTES).toBe(30);
  });

  it("plafonne les demandes à 3 par compte et par heure", () => {
    expect(RESET_REQUESTS_PER_HOUR).toBe(3);
  });
});
