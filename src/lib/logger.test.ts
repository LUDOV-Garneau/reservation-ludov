import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger, maskEmail } from "@/lib/logger";

/** Dernière ligne écrite sur chaque canal, telle que Coolify la recevrait. */
function captureConsole() {
  return {
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
  };
}

let spies: ReturnType<typeof captureConsole>;

beforeEach(() => {
  spies = captureConsole();
  delete process.env.LOG_LEVEL;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.LOG_LEVEL;
});

describe("createLogger — le format de ligne", () => {
  it("écrit une seule ligne : portée, événement, puis les champs", () => {
    const log = createLogger("RESERVATION:test", { userId: 42 });
    log.info("hold.created", { holdId: "HOLD-1" });

    expect(spies.log).toHaveBeenCalledTimes(1);
    const line = spies.log.mock.calls[0][0] as string;
    expect(line).not.toContain("\n");
    expect(line).toMatch(
      /^\[RESERVATION:test\] hold\.created reqId=\w+ userId=42 holdId=HOLD-1$/,
    );
  });

  it("répète le même reqId sur toutes les lignes d'une requête", () => {
    const log = createLogger("RESERVATION:test");
    log.info("un");
    log.info("deux");

    const [a, b] = spies.log.mock.calls.map((c) => String(c[0]));
    expect(a).toContain(`reqId=${log.reqId}`);
    expect(b).toContain(`reqId=${log.reqId}`);
  });

  it("donne un reqId différent à deux requêtes", () => {
    expect(createLogger("x").reqId).not.toEqual(createLogger("x").reqId);
  });

  it("ajoute les champs liés par bind aux lignes suivantes", () => {
    const log = createLogger("RESERVATION:test");
    log.info("avant");
    log.bind({ holdId: "HOLD-9" });
    log.info("après");

    expect(String(spies.log.mock.calls[0][0])).not.toContain("holdId");
    expect(String(spies.log.mock.calls[1][0])).toContain("holdId=HOLD-9");
  });

  it("route warn et error vers leurs canaux (stderr pour error)", () => {
    const log = createLogger("RESERVATION:test");
    log.warn("slot.rejected");
    log.error("request.failed");

    expect(spies.warn).toHaveBeenCalledTimes(1);
    expect(spies.error).toHaveBeenCalledTimes(1);
    expect(spies.log).not.toHaveBeenCalled();
  });
});

describe("createLogger — la sérialisation des valeurs", () => {
  function fieldsOf(value: unknown): string {
    createLogger("s").info("e", { v: value });
    return String(spies.log.mock.calls[0][0]).split(" ").slice(3).join(" ");
  }

  it("rend les tableaux compacts, sans espace qui casserait la lecture", () => {
    expect(fieldsOf([1, 2, 3])).toBe("v=[1,2,3]");
  });

  it("garde un tableau vide visible (distinguer « aucun » de « absent »)", () => {
    expect(fieldsOf([])).toBe("v=[]");
  });

  it("met entre guillemets une chaîne contenant un espace", () => {
    expect(fieldsOf("Aucune unité disponible")).toBe('v="Aucune unité disponible"');
  });

  it("laisse nu un identifiant sans espace", () => {
    expect(fieldsOf("HOLD-abc")).toBe("v=HOLD-abc");
  });

  it("distingue null (valeur connue) de undefined (champ omis)", () => {
    expect(fieldsOf(null)).toBe("v=null");
    createLogger("s").info("e", { a: undefined, b: 1 });
    expect(String(spies.log.mock.calls[0][0])).not.toContain("a=");
  });
});

describe("createLogger — LOG_LEVEL", () => {
  it("laisse passer info par défaut, mais pas debug", () => {
    const log = createLogger("s");
    log.debug("bruit");
    log.info("utile");
    expect(spies.log).toHaveBeenCalledTimes(1);
    expect(String(spies.log.mock.calls[0][0])).toContain("utile");
  });

  it("LOG_LEVEL=warn ne garde que les anomalies", () => {
    process.env.LOG_LEVEL = "warn";
    const log = createLogger("s");
    log.info("étape");
    log.warn("refus");
    expect(spies.log).not.toHaveBeenCalled();
    expect(spies.warn).toHaveBeenCalledTimes(1);
  });

  it("LOG_LEVEL=silent coupe tout, erreurs comprises", () => {
    process.env.LOG_LEVEL = "silent";
    const log = createLogger("s");
    log.info("étape");
    log.error("boum", new Error("x"));
    expect(spies.log).not.toHaveBeenCalled();
    expect(spies.error).not.toHaveBeenCalled();
  });

  it("retombe sur info quand la valeur est inconnue", () => {
    process.env.LOG_LEVEL = "verbeux";
    createLogger("s").info("étape");
    expect(spies.log).toHaveBeenCalledTimes(1);
  });
});

describe("createLogger — les erreurs", () => {
  it("journalise le message puis la pile, sur deux appels distincts", () => {
    createLogger("s").error("request.failed", new Error("MySQL down"));

    expect(spies.error).toHaveBeenCalledTimes(2);
    expect(String(spies.error.mock.calls[0][0])).toContain('error="MySQL down"');
    expect(String(spies.error.mock.calls[1][0])).toContain("Error: MySQL down");
  });

  it("accepte une valeur lancée qui n'est pas une Error", () => {
    createLogger("s").error("request.failed", "chaîne lancée");
    expect(spies.error).toHaveBeenCalledTimes(1);
    expect(String(spies.error.mock.calls[0][0])).toContain('error="chaîne lancée"');
  });

  it("n'affiche pas de champ error quand il n'y en a pas", () => {
    createLogger("s").error("hold.missing_after_update");
    expect(String(spies.error.mock.calls[0][0])).not.toContain("error=");
  });
});

describe("createLogger — une valeur informattable ne casse pas la requête", () => {
  // Un log ne doit jamais faire échouer ce qu'il décrit : ces valeurs faisaient
  // lever `JSON.stringify` ou `String()`, donc remonter une 500 depuis un
  // simple appel au logger.
  it("survit à une référence circulaire", () => {
    const circulaire: Record<string, unknown> = { id: 1 };
    circulaire.self = circulaire;
    expect(() => createLogger("s").info("event", { circulaire })).not.toThrow();
    expect(String(spies.log.mock.calls[0][0])).toContain('circulaire="<non sérialisable>"');
  });

  it("survit à un BigInt imbriqué", () => {
    expect(() => createLogger("s").info("event", { row: { total: BigInt(10) } })).not.toThrow();
    expect(String(spies.log.mock.calls[0][0])).toContain('row="<non sérialisable>"');
  });

  it("survit à un objet dont toString lève", () => {
    const piege = { toString() { throw new Error("boom"); } };
    expect(() => createLogger("s").info("event", { piege })).not.toThrow();
  });

  it("garde lisibles les autres champs de la même ligne", () => {
    const circulaire: Record<string, unknown> = {};
    circulaire.self = circulaire;
    createLogger("s").info("hold.created", { holdId: "HOLD-1", circulaire, ms: 12 });
    const ligne = String(spies.log.mock.calls[0][0]);
    expect(ligne).toContain("holdId=HOLD-1");
    expect(ligne).toContain("ms=12");
  });
});

describe("maskEmail", () => {
  it("garde l'initiale et le domaine, cache le reste", () => {
    expect(maskEmail("prenom.nom@cegepgarneau.ca")).toBe("p***@cegepgarneau.ca");
  });

  it("ne laisse rien filtrer d'une valeur qui n'est pas une adresse", () => {
    for (const raw of [null, undefined, "", "pas-une-adresse", "@vide.ca"]) {
      expect(maskEmail(raw)).toBe("***");
    }
  });
});
