import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import db from "@/db";
import { generateResetToken, hashResetToken } from "@/lib/passwordReset";
import { GET, POST } from "./route";

vi.mock("@/db", () => ({
  default: {
    query: { passwordResetTokens: { findFirst: vi.fn() } },
    transaction: vi.fn(),
  },
}));

/** Haché factice : il ne contient pas le mot de passe, comme un vrai bcrypt. */
const { FAKE_HASH } = vi.hoisted(() => ({
  FAKE_HASH: "$2b$10$0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN",
}));

vi.mock("bcrypt", () => ({
  default: { hash: vi.fn(async () => FAKE_HASH) },
}));

const VALID_TOKEN = generateResetToken();
const GOOD_PASSWORD = "MotDePasseSolide";

/** Ce que la transaction a fait, reconstitué depuis les appels au faux `tx`. */
type TxTrace = {
  claimed: boolean;
  userUpdate: Record<string, unknown> | null;
  deletedOtherTokens: boolean;
};

let trace: TxTrace;

/**
 * Rejoue `db.transaction` avec un `tx` factice.
 * `claimedRows` est le nombre de lignes touchées par l'UPDATE conditionnel qui
 * réclame le jeton : 1 = jeton valide et disponible, 0 = expiré, déjà utilisé,
 * ou inexistant.
 */
function mockTransaction({
  claimedRows = 1,
  tokenRow = { userId: 42 } as { userId: number } | null,
} = {}) {
  vi.mocked(db.transaction).mockImplementation(async (callback) => {
    const tx = {
      update: vi.fn((table: unknown) => ({
        set: vi.fn((values: Record<string, unknown>) => ({
          where: vi.fn(async () => {
            // Le premier UPDATE réclame le jeton, le second pose le mot de passe.
            if ("usedAt" in values) {
              trace.claimed = claimedRows === 1;
              return [{ affectedRows: claimedRows }];
            }
            trace.userUpdate = values;
            void table;
            return [{ affectedRows: 1 }];
          }),
        })),
      })),
      query: {
        passwordResetTokens: { findFirst: vi.fn(async () => tokenRow) },
      },
      delete: vi.fn(() => ({
        where: vi.fn(async () => {
          trace.deletedOtherTokens = true;
          return [{ affectedRows: 0 }];
        }),
      })),
    };
    return callback(tx as never);
  });
}

const makePost = (body: unknown) =>
  new NextRequest("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const makeGet = (token: string | null) =>
  new NextRequest(
    `http://localhost/api/auth/reset-password${
      token === null ? "" : `?token=${encodeURIComponent(token)}`
    }`,
  );

beforeEach(() => {
  trace = { claimed: false, userUpdate: null, deletedOtherTokens: false };
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockTransaction();
  vi.mocked(db.query.passwordResetTokens.findFirst).mockResolvedValue({
    id: 1,
  } as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("API GET /auth/reset-password (vérification du lien)", () => {
  it("accepte un jeton valide", async () => {
    const res = await GET(makeGet(VALID_TOKEN));
    expect(res.status).toBe(200);
    expect((await res.json()).valid).toBe(true);
  });

  it("ne consomme pas le jeton qu'il vérifie", async () => {
    await GET(makeGet(VALID_TOKEN));
    // Aucune écriture : la vérification doit pouvoir être rejouée au montage
    // de la page sans brûler le lien.
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("refuse un jeton expiré, utilisé ou inexistant", async () => {
    vi.mocked(db.query.passwordResetTokens.findFirst).mockResolvedValue(
      undefined as never,
    );
    const res = await GET(makeGet(VALID_TOKEN));
    expect(res.status).toBe(400);
  });

  it.each([
    ["absent", null],
    ["vide", ""],
    ["trop court", "abc"],
    ["hors base64url", `${"a".repeat(42)}+`],
    ["tentative d'injection", "' OR 1=1 --"],
  ])("refuse un jeton %s sans toucher à la base", async (_cas, token) => {
    const res = await GET(makeGet(token));
    expect(res.status).toBe(400);
    expect(db.query.passwordResetTokens.findFirst).not.toHaveBeenCalled();
  });

  it("répond 500 si la base est injoignable, sans laisser passer", async () => {
    vi.mocked(db.query.passwordResetTokens.findFirst).mockRejectedValue(
      new Error("base injoignable") as never,
    );
    const res = await GET(makeGet(VALID_TOKEN));
    expect(res.status).toBe(500);
  });
});

describe("API POST /auth/reset-password (pose du mot de passe)", () => {
  describe("jetons refusés", () => {
    it.each([
      ["absent", undefined],
      ["vide", ""],
      ["trop court", "abc"],
      ["hors base64url", `${"a".repeat(42)}+`],
      ["numérique", 12345],
    ])("refuse un jeton %s sans ouvrir de transaction", async (_cas, token) => {
      const res = await POST(makePost({ token, password: GOOD_PASSWORD }));
      expect(res.status).toBe(400);
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it("refuse un jeton déjà utilisé ou expiré", async () => {
      // L'UPDATE conditionnel ne touche aucune ligne : le lien ne vaut plus rien.
      mockTransaction({ claimedRows: 0 });
      const res = await POST(
        makePost({ token: VALID_TOKEN, password: GOOD_PASSWORD }),
      );

      expect(res.status).toBe(400);
      expect(trace.userUpdate).toBeNull();
    });

    it("ne pose pas de mot de passe si la ligne du jeton a disparu", async () => {
      mockTransaction({ tokenRow: null });
      const res = await POST(
        makePost({ token: VALID_TOKEN, password: GOOD_PASSWORD }),
      );

      expect(res.status).toBe(400);
      expect(trace.userUpdate).toBeNull();
    });
  });

  describe("mots de passe refusés", () => {
    it.each([
      ["absent", undefined],
      ["vide", ""],
      ["de 7 caractères", "1234567"],
      ["non textuel", 12345678],
    ])("refuse un mot de passe %s", async (_cas, password) => {
      const res = await POST(makePost({ token: VALID_TOKEN, password }));
      expect(res.status).toBe(400);
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it("accepte tout juste 8 caractères", async () => {
      const res = await POST(
        makePost({ token: VALID_TOKEN, password: "12345678" }),
      );
      expect(res.status).toBe(200);
    });

    it("nomme la longueur attendue dans son message", async () => {
      const res = await POST(makePost({ token: VALID_TOKEN, password: "court" }));
      expect((await res.json()).message).toContain("8");
    });
  });

  describe("réinitialisation réussie", () => {
    beforeEach(async () => {
      await POST(makePost({ token: VALID_TOKEN, password: GOOD_PASSWORD }));
    });

    it("réclame le jeton avant toute autre écriture", () => {
      expect(trace.claimed).toBe(true);
    });

    it("stocke un haché, jamais le mot de passe en clair", () => {
      expect(bcrypt.hash).toHaveBeenCalledWith(GOOD_PASSWORD, 10);
      expect(trace.userUpdate?.password).toBe(FAKE_HASH);
      expect(trace.userUpdate?.password).not.toContain(GOOD_PASSWORD);
    });

    it("incrémente session_version pour fermer les autres sessions", () => {
      expect(trace.userUpdate).toHaveProperty("sessionVersion");
      expect(trace.userUpdate?.sessionVersion).not.toBeUndefined();
    });

    it("supprime les autres liens encore valides du compte", () => {
      expect(trace.deletedOtherTokens).toBe(true);
    });
  });

  it("hache le mot de passe hors transaction, pour ne pas tenir les verrous", async () => {
    const order: string[] = [];
    vi.mocked(bcrypt.hash).mockImplementation(async () => {
      order.push("bcrypt");
      return FAKE_HASH as never;
    });
    vi.mocked(db.transaction).mockImplementation(async () => {
      order.push("transaction");
      return 42;
    });

    await POST(makePost({ token: VALID_TOKEN, password: GOOD_PASSWORD }));
    expect(order).toEqual(["bcrypt", "transaction"]);
  });

  it("cherche le jeton par son empreinte, pas par sa valeur", async () => {
    let seenWhere: unknown;
    vi.mocked(db.transaction).mockImplementation(async () => {
      seenWhere = hashResetToken(VALID_TOKEN);
      return 42;
    });

    await POST(makePost({ token: VALID_TOKEN, password: GOOD_PASSWORD }));
    expect(seenWhere).toMatch(/^[0-9a-f]{64}$/);
    expect(seenWhere).not.toBe(VALID_TOKEN);
  });

  it("répond 400 sur un corps JSON illisible", async () => {
    const res = await POST(makePost("{ pas du json"));
    expect(res.status).toBe(400);
  });

  it("répond 500 si la transaction échoue, sans annoncer un succès", async () => {
    vi.mocked(db.transaction).mockRejectedValue(
      new Error("interblocage") as never,
    );
    const res = await POST(
      makePost({ token: VALID_TOKEN, password: GOOD_PASSWORD }),
    );
    expect(res.status).toBe(500);
  });
});
