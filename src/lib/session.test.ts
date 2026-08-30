import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import db from "@/db";
import { verifyToken } from "@/lib/jwt";
import { isSessionCurrent, readSession, type SessionUser } from "./session";

vi.mock("@/db", () => ({
  default: { query: { users: { findFirst: vi.fn() } } },
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn(),
  signToken: vi.fn(),
}));

const user = (sv?: number): SessionUser => ({
  id: 7,
  name: "Test",
  email: "test@exemple.ca",
  isAdmin: false,
  ...(sv === undefined ? {} : { sv }),
});

const dbReturns = (sessionVersion: number | null) =>
  vi
    .mocked(db.query.users.findFirst)
    .mockResolvedValue(
      (sessionVersion === null ? undefined : { sessionVersion }) as never,
    );

describe("isSessionCurrent", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepte une session dont le sv correspond à la colonne", async () => {
    dbReturns(3);
    expect(await isSessionCurrent(user(3))).toBe(true);
  });

  it("rejette une session dont le sv est en retard", async () => {
    // Cas central : le mot de passe a été réinitialisé depuis la connexion.
    dbReturns(4);
    expect(await isSessionCurrent(user(3))).toBe(false);
  });

  it("rejette un sv en avance sur la colonne", async () => {
    dbReturns(1);
    expect(await isSessionCurrent(user(9))).toBe(false);
  });

  it("traite un sv absent comme 0, pour ne pas déconnecter tout le monde au déploiement", async () => {
    dbReturns(0);
    expect(await isSessionCurrent(user())).toBe(true);
  });

  it("rejette un jeton sans sv dès qu'une réinitialisation a eu lieu", async () => {
    dbReturns(1);
    expect(await isSessionCurrent(user())).toBe(false);
  });

  it("rejette la session d'un compte supprimé", async () => {
    dbReturns(null);
    expect(await isSessionCurrent(user(0))).toBe(false);
  });

  it("laisse passer si la base est injoignable, plutôt que de déconnecter tout le monde", async () => {
    vi.mocked(db.query.users.findFirst).mockRejectedValue(
      new Error("connexion perdue") as never,
    );
    expect(await isSessionCurrent(user(2))).toBe(true);
    expect(console.error).toHaveBeenCalled();
  });
});

describe("readSession", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renvoie null sans cookie, sans interroger la base", async () => {
    expect(await readSession(undefined)).toBeNull();
    expect(db.query.users.findFirst).not.toHaveBeenCalled();
  });

  it("renvoie null pour un cookie vide", async () => {
    expect(await readSession("")).toBeNull();
    expect(db.query.users.findFirst).not.toHaveBeenCalled();
  });

  it("renvoie null quand la signature est invalide", async () => {
    vi.mocked(verifyToken).mockReturnValue(null);
    expect(await readSession("jeton-bidon")).toBeNull();
    expect(db.query.users.findFirst).not.toHaveBeenCalled();
  });

  it("renvoie null quand la charge utile n'a pas d'identifiant", async () => {
    vi.mocked(verifyToken).mockReturnValue({ name: "Sans id" } as never);
    expect(await readSession("jeton")).toBeNull();
  });

  it("renvoie l'usager quand la signature et le sv concordent", async () => {
    vi.mocked(verifyToken).mockReturnValue(user(2) as never);
    dbReturns(2);
    expect(await readSession("jeton")).toMatchObject({ id: 7, sv: 2 });
  });

  it("renvoie null quand la signature est bonne mais la session périmée", async () => {
    // Une signature valide ne suffit pas : c'est tout l'intérêt du mécanisme.
    vi.mocked(verifyToken).mockReturnValue(user(2) as never);
    dbReturns(5);
    expect(await readSession("jeton")).toBeNull();
  });
});
