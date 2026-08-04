import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import db from "@/db";
import * as jwtModule from "@/lib/jwt";
import { GET } from "./route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn((name: string) => {
        if (name === "SESSION") {
          return { value: "mock-token" };
        }
        return undefined;
      }),
    })
  ),
}));

vi.mock("@/db", () => ({
  default: {
    select: vi.fn(),
    query: {
      reservationHold: { findFirst: vi.fn() },
    },
  },
}));

function chain(result: unknown) {
  const obj: Record<string, unknown> = {
    then(
      onfulfilled?: ((v: unknown) => unknown) | null,
      onrejected?: ((e: unknown) => unknown) | null,
    ) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };
  for (const m of ["from", "where", "orderBy", "limit", "offset", "innerJoin"]) {
    obj[m] = () => obj;
  }
  return obj;
}

describe("API /reservation/accessories route", () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns accessories for authenticated user with valid hold", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.query.reservationHold.findFirst).mockResolvedValue(
      ({ consoleTypeId: 1 } as unknown) as Awaited<ReturnType<typeof db.query.reservationHold.findFirst>>
    );

    vi.mocked(db.select).mockReturnValueOnce(
      chain([{ id: 1, name: "Controller" }, { id: 2, name: "Headset" }]) as ReturnType<typeof db.select>
    );

    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0]).toHaveProperty("id", 1);
    expect(json.data[0]).toHaveProperty("name", "Controller");
  });

  it("returns 401 when token is invalid", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Invalid or expired token");
  });

  it("returns 404 when no reservation hold found", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.query.reservationHold.findFirst).mockResolvedValue(undefined);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.message).toBe("No recent reservation hold found for user");
  });

  it("returns 404 when no accessories found for console", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.query.reservationHold.findFirst).mockResolvedValue(
      ({ consoleTypeId: 1 } as unknown) as Awaited<ReturnType<typeof db.query.reservationHold.findFirst>>
    );

    vi.mocked(db.select).mockReturnValueOnce(
      chain([]) as ReturnType<typeof db.select>
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.message).toBe("No accessories found for the user's console");
  });

  it("returns 400 when user ID is invalid", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: "invalid" as unknown as number,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Invalid user ID");
  });

  it("handles database errors gracefully", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.query.reservationHold.findFirst).mockRejectedValue(
      new Error("Database error")
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Internal server error");
  });
});
