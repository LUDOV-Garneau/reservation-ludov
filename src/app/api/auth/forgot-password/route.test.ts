import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import db from "@/db";
import { sendForgotPasswordEmail } from "@/lib/sendEmail";
import { hashResetToken } from "@/lib/passwordReset";
import { POST } from "./route";

/**
 * `after()` est remplacé par une file que les tests vident à la main : c'est ce
 * qui permet de vérifier séparément ce que la requête fait *avant* de répondre
 * et ce qu'elle repousse *après*.
 */
const deferred: Array<() => unknown> = [];

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (fn: () => unknown) => void deferred.push(fn) };
});

vi.mock("@/db", () => ({
  default: {
    query: { users: { findFirst: vi.fn() } },
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("@/lib/sendEmail", () => ({ sendForgotPasswordEmail: vi.fn() }));

const NEUTRAL =
  "Si un compte existe pour cette adresse, un courriel de réinitialisation vient d'être envoyé.";

const makeRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

/** Exécute le travail que la route a repoussé après sa réponse. */
async function runDeferred() {
  const pending = deferred.splice(0);
  for (const fn of pending) await fn();
}

/** Nombre de jetons déjà créés dans l'heure, pour la limite de débit. */
const tokensThisHour = (n: number) =>
  vi.mocked(db.select).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ value: n }]),
    }),
  } as never);

const accountExists = (overrides: Record<string, unknown> = {}) =>
  vi.mocked(db.query.users.findFirst).mockResolvedValue({
    id: 42,
    email: "personne@exemple.ca",
    preferredLocale: "fr",
    ...overrides,
  } as never);

const noAccount = () =>
  vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined as never);

/** Valeurs passées au INSERT du jeton. */
let insertedValues: Record<string, unknown> | null = null;

describe("API POST /auth/forgot-password", () => {
  beforeEach(() => {
    deferred.length = 0;
    insertedValues = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    tokensThisHour(0);
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(async (v: Record<string, unknown>) => {
        insertedValues = v;
      }),
    } as never);
    vi.mocked(sendForgotPasswordEmail).mockResolvedValue({
      rejected: [],
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("réponse neutre", () => {
    it.each([
      ["adresse inconnue", { email: "inconnu@exemple.ca", locale: "fr" }, false],
      ["adresse connue", { email: "personne@exemple.ca", locale: "fr" }, true],
      ["courriel absent", { locale: "fr" }, false],
      ["courriel vide", { email: "   ", locale: "fr" }, false],
      ["corps sans langue", { email: "personne@exemple.ca" }, true],
    ])("répond 200 et le même message : %s", async (_cas, body, exists) => {
      if (exists) accountExists();
      else noAccount();

      const res = await POST(makeRequest(body));

      expect(res.status).toBe(200);
      expect((await res.json()).message).toBe(NEUTRAL);
    });

    it("répond 200 même sur un corps JSON illisible", async () => {
      const res = await POST(makeRequest("{ pas du json"));
      expect(res.status).toBe(200);
      expect((await res.json()).message).toBe(NEUTRAL);
    });

    it("répond 200 même si la base est injoignable", async () => {
      vi.mocked(db.query.users.findFirst).mockRejectedValue(
        new Error("base injoignable") as never,
      );

      const res = await POST(makeRequest({ email: "personne@exemple.ca" }));
      expect(res.status).toBe(200);

      // L'échec est avalé côté serveur, sans remonter à l'appelant.
      await expect(runDeferred()).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });

    it("répond 200 même si l'envoi SMTP échoue", async () => {
      accountExists();
      vi.mocked(sendForgotPasswordEmail).mockRejectedValue(
        new Error("SMTP indisponible") as never,
      );

      const res = await POST(makeRequest({ email: "personne@exemple.ca" }));
      expect(res.status).toBe(200);
      await runDeferred();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("durée de réponse indépendante du compte", () => {
    it("ne consulte pas la base avant de répondre", async () => {
      accountExists();
      await POST(makeRequest({ email: "personne@exemple.ca", locale: "fr" }));

      // Si quoi que ce soit dépendant du compte se faisait avant la réponse, sa
      // durée trahirait l'existence du compte, quel que soit le corps renvoyé.
      expect(db.query.users.findFirst).not.toHaveBeenCalled();
    });

    it("n'envoie rien avant de répondre", async () => {
      accountExists();
      await POST(makeRequest({ email: "personne@exemple.ca", locale: "fr" }));
      expect(sendForgotPasswordEmail).not.toHaveBeenCalled();

      await runDeferred();
      expect(sendForgotPasswordEmail).toHaveBeenCalledTimes(1);
    });

    it("repousse exactement une tâche, que le compte existe ou non", async () => {
      noAccount();
      await POST(makeRequest({ email: "inconnu@exemple.ca" }));
      expect(deferred).toHaveLength(1);
      await runDeferred();

      accountExists();
      await POST(makeRequest({ email: "personne@exemple.ca" }));
      expect(deferred).toHaveLength(1);
    });

    it("ne repousse aucune tâche quand le courriel est absent", async () => {
      await POST(makeRequest({ locale: "fr" }));
      expect(deferred).toHaveLength(0);
    });
  });

  describe("adresse inconnue", () => {
    it("ne crée aucun jeton et n'envoie aucun courriel", async () => {
      noAccount();
      await POST(makeRequest({ email: "inconnu@exemple.ca", locale: "fr" }));
      await runDeferred();

      expect(db.insert).not.toHaveBeenCalled();
      expect(sendForgotPasswordEmail).not.toHaveBeenCalled();
    });
  });

  describe("adresse connue", () => {
    it("stocke l'empreinte du jeton, jamais le jeton lui-même", async () => {
      accountExists();
      await POST(makeRequest({ email: "personne@exemple.ca", locale: "fr" }));
      await runDeferred();

      const { resetUrl } = vi.mocked(sendForgotPasswordEmail).mock.calls[0][0];
      const sentToken = new URL(resetUrl).searchParams.get("token");

      expect(sentToken).toBeTruthy();
      expect(insertedValues?.tokenHash).toBe(hashResetToken(sentToken as string));
      expect(JSON.stringify(insertedValues)).not.toContain(sentToken);
    });

    it("rattache le jeton au compte trouvé", async () => {
      accountExists();
      await POST(makeRequest({ email: "personne@exemple.ca" }));
      await runDeferred();
      expect(insertedValues?.userId).toBe(42);
    });

    it("laisse MySQL calculer les dates plutôt que de les poser en UTC", async () => {
      accountExists();
      await POST(makeRequest({ email: "personne@exemple.ca" }));
      await runDeferred();

      // Une date posée depuis Node serait écrite en UTC alors que les
      // comparaisons se font contre NOW(), en heure locale du serveur.
      expect(typeof insertedValues?.createdAt).not.toBe("string");
      expect(typeof insertedValues?.expiresAt).not.toBe("string");
    });

    it("envoie au courriel du compte, pas à celui saisi", async () => {
      accountExists({ email: "canonique@exemple.ca" });
      await POST(makeRequest({ email: "CANONIQUE@exemple.ca " }));
      await runDeferred();

      expect(vi.mocked(sendForgotPasswordEmail).mock.calls[0][0].to).toBe(
        "canonique@exemple.ca",
      );
    });

    it("annonce la durée de vie réelle du lien", async () => {
      accountExists();
      await POST(makeRequest({ email: "personne@exemple.ca" }));
      await runDeferred();

      expect(
        vi.mocked(sendForgotPasswordEmail).mock.calls[0][0].expiresInMinutes,
      ).toBe(30);
    });
  });

  describe("langue du courriel", () => {
    it("suit la langue de l'interface au moment de la demande", async () => {
      accountExists({ preferredLocale: "fr" });
      await POST(makeRequest({ email: "personne@exemple.ca", locale: "en" }));
      await runDeferred();

      const call = vi.mocked(sendForgotPasswordEmail).mock.calls[0][0];
      expect(call.locale).toBe("en");
      expect(call.resetUrl).toContain("/en/auth/reset-password");
    });

    it("retombe sur la langue du compte quand la demande n'en précise pas", async () => {
      accountExists({ preferredLocale: "en" });
      await POST(makeRequest({ email: "personne@exemple.ca" }));
      await runDeferred();

      expect(vi.mocked(sendForgotPasswordEmail).mock.calls[0][0].locale).toBe(
        "en",
      );
    });

    it("ignore une langue non reconnue", async () => {
      accountExists({ preferredLocale: "fr" });
      await POST(makeRequest({ email: "personne@exemple.ca", locale: "de" }));
      await runDeferred();

      expect(vi.mocked(sendForgotPasswordEmail).mock.calls[0][0].locale).toBe(
        "fr",
      );
    });
  });

  describe("limite de débit", () => {
    it("laisse passer la troisième demande de l'heure", async () => {
      accountExists();
      tokensThisHour(2);
      await POST(makeRequest({ email: "personne@exemple.ca" }));
      await runDeferred();

      expect(sendForgotPasswordEmail).toHaveBeenCalledTimes(1);
    });

    it("bloque la quatrième, sans jeton ni courriel", async () => {
      accountExists();
      tokensThisHour(3);
      await POST(makeRequest({ email: "personne@exemple.ca" }));
      await runDeferred();

      expect(db.insert).not.toHaveBeenCalled();
      expect(sendForgotPasswordEmail).not.toHaveBeenCalled();
    });

    it("bloque aussi bien au-delà du seuil", async () => {
      accountExists();
      tokensThisHour(99);
      await POST(makeRequest({ email: "personne@exemple.ca" }));
      await runDeferred();

      expect(sendForgotPasswordEmail).not.toHaveBeenCalled();
    });

    it("reste silencieuse : la réponse ne change pas quand le quota est atteint", async () => {
      accountExists();
      tokensThisHour(3);
      const res = await POST(makeRequest({ email: "personne@exemple.ca" }));

      expect(res.status).toBe(200);
      expect((await res.json()).message).toBe(NEUTRAL);
    });
  });
});
