import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { POST } from "./route";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/jwt", () => ({ verifyToken: vi.fn() }));
vi.mock("@/db", () => ({
  default: { transaction: vi.fn() },
}));

/**
 * Chainable thenable resolving to `result`.
 * Covers .from/.where/.values/.set/.orderBy/.limit/.offset chains
 * used by tx.select / tx.insert / tx.update / tx.delete.
 */
function chain(result: unknown) {
  const obj: Record<string, unknown> = {
    then(
      onfulfilled?: ((v: unknown) => unknown) | null,
      onrejected?: ((e: unknown) => unknown) | null,
    ) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };
  for (const m of ["from", "where", "values", "set", "orderBy", "limit", "offset"]) {
    obj[m] = () => obj;
  }
  return obj;
}

const FUTURE_DATE = "2030-12-25";
const VALID_TIME = "14:00";

const BASE_HOLD = {
  id: "hold-abc",
  userId: 1,
  consoleId: 1,
  consoleTypeId: 1,
  game1Id: 10,
  game2Id: null,
  game3Id: null,
  accessoirs: null,
  stationId: null,
  date: FUTURE_DATE,
  time: VALID_TIME,
};

const VALID_BODY = {
  reservationHoldId: "hold-abc",
  consoleId: 1,
  consoleTypeId: 1,
  game1Id: 10,
  coursId: 5,
  date: FUTURE_DATE,
  time: VALID_TIME,
};

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/reservation/confirm-reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function setupAuth(opts: { hasToken?: boolean; throwOnVerify?: boolean } = {}) {
  const { hasToken = true, throwOnVerify = false } = opts;
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === "SESSION" && hasToken ? { value: "mock-token" } : undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>);

  if (throwOnVerify) {
    vi.mocked(verifyToken).mockImplementation(() => {
      throw new Error("jwt expired");
    });
  } else {
    vi.mocked(verifyToken).mockReturnValue(
      { id: 1 } as unknown as ReturnType<typeof verifyToken>,
    );
  }
}

function setupTransaction(hold: object | null, consoleFound = true) {
  const mockTx = {
    query: {
      reservationHold: {
        findFirst: vi.fn()
          .mockResolvedValueOnce(hold)
          .mockResolvedValueOnce(hold ? { id: (hold as { id: string }).id } : null),
      },
      consoleStock: {
        findFirst: vi.fn().mockResolvedValue(consoleFound ? { id: 1 } : null),
      },
    },
    select: vi.fn().mockReturnValue(chain([])),
    insert: vi.fn().mockReturnValue(chain(undefined)),
    delete: vi.fn().mockReturnValue(chain(undefined)),
    update: vi.fn().mockReturnValue(chain(undefined)),
  };
  vi.mocked(db.transaction).mockImplementation(
    async (cb) => cb(mockTx as unknown as Parameters<typeof cb>[0]),
  );
  return mockTx;
}

describe("POST /reservation/confirm-reservation", () => {
  beforeEach(() => vi.clearAllMocks());

  // --- Authentication ---

  it("returns 401 Unauthorized when no SESSION cookie is present", async () => {
    setupAuth({ hasToken: false });

    const res = await post(VALID_BODY);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Unauthorized");
  });

  it("returns 401 when the JWT token is invalid or expired", async () => {
    setupAuth({ throwOnVerify: true });

    const res = await post(VALID_BODY);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.message).toMatch(/invalid or expired/i);
  });

  // --- Input validation ---

  it("returns 400 listing all missing required fields", async () => {
    setupAuth();

    const res = await post({ consoleId: 1 });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toContain("reservationHoldId");
    expect(json.message).toContain("game1Id");
  });

  it("returns 400 for an invalid date format (not YYYY-MM-DD)", async () => {
    setupAuth();

    const res = await post({ ...VALID_BODY, date: "25/12/2030" });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/invalid date format/i);
  });

  it("returns 400 when the reservation date is in the past", async () => {
    setupAuth();

    const res = await post({ ...VALID_BODY, date: "2000-01-01" });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/past/i);
  });

  it("returns 400 for an invalid time format (not HH:MM or HH:MM:SS)", async () => {
    setupAuth();

    const res = await post({ ...VALID_BODY, time: "9:5" });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/invalid time format/i);
  });

  // --- Transactional hold checks ---

  it("returns 404 when the reservation hold is not found or expired", async () => {
    setupAuth();
    setupTransaction(null);

    const res = await post(VALID_BODY);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.message).toMatch(/not found/i);
  });

  it("returns 400 when the console is unavailable or does not match the hold", async () => {
    setupAuth();
    setupTransaction(BASE_HOLD, false);

    const res = await post(VALID_BODY);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/console/i);
  });

  it("returns 400 when game IDs in the body do not match the hold", async () => {
    setupAuth();
    const holdDifferentGame = { ...BASE_HOLD, game1Id: 99 };
    const mockTx = {
      query: {
        reservationHold: { findFirst: vi.fn().mockResolvedValue(holdDifferentGame) },
        consoleStock: { findFirst: vi.fn() },
      },
      select: vi.fn(),
      insert: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => cb(mockTx));

    const res = await post(VALID_BODY); // body has game1Id: 10, hold has 99
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/game ids/i);
  });

  // --- Happy path ---

  it("confirms reservation and returns 200 with correct payload", async () => {
    setupAuth();
    setupTransaction(BASE_HOLD);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-0000-0000-000000000000" as `${string}-${string}-${string}-${string}-${string}`,
    );

    const res = await post(VALID_BODY);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe("Reservation confirmed");
    expect(json.data).toMatchObject({
      reservationId: "RESV-00000000-0000-0000-0000-000000000000",
      consoleId: 1,
      consoleTypeId: 1,
      game1Id: 10,
      game2Id: null,
      game3Id: null,
      accessoryIds: null,
      coursId: 5,
      date: FUTURE_DATE,
      time: VALID_TIME,
    });
  });

  // --- Error handling ---

  it("returns 500 when the database transaction throws an unexpected error", async () => {
    setupAuth();
    vi.mocked(db.transaction).mockRejectedValue(new Error("DB connection lost"));

    const res = await post(VALID_BODY);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Internal Server Error");
  });
});
