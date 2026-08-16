import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import db from "@/db";
import { GET } from "./route";
import type { ConsoleCatalogItem } from "./route";
import { createNextRequestWithCookie } from "../test-helpers";

vi.mock("@/db", () => ({
  default: {
    select: vi.fn(),
  },
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn((token: string) =>
    token === "mock-token"
      ? { id: 1, name: "Test User", email: "test@example.com", isAdmin: false }
      : null,
  ),
}));

const authedRequest = () =>
  createNextRequestWithCookie("http://localhost/api/reservation/consoles");

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

describe("API /reservation/consoles route", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReturnValue(
      chain([
        { id: 1, name: "PlayStation 5", picture: "ps5.jpg", active_units: 3, total_units: 5 },
        { id: 2, name: "Xbox Series X", picture: "xbox.jpg", active_units: 2, total_units: 3 },
      ]) as ReturnType<typeof db.select>
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns list of active consoles successfully", async () => {
    const response = await GET(authedRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
    expect(json[0]).toHaveProperty("id", 1);
    expect(json[0]).toHaveProperty("name", "PlayStation 5");
    expect(json[0]).toHaveProperty("active_units", 3);
  });

  it("filters consoles with active_units > 0", async () => {
    vi.mocked(db.select).mockReturnValue(
      chain([
        { id: 1, name: "PlayStation 5", picture: "ps5.jpg", active_units: 3, total_units: 5 },
      ]) as ReturnType<typeof db.select>
    );

    const response = await GET(authedRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.every((console: ConsoleCatalogItem) => console.active_units > 0)).toBe(true);
  });

  it("returns empty array when no active consoles available", async () => {
    vi.mocked(db.select).mockReturnValue(
      chain([]) as ReturnType<typeof db.select>
    );

    const response = await GET(authedRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(0);
  });

  it("handles database errors gracefully", async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await GET(authedRequest());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toHaveProperty("message", "Erreur serveur");
  });

  it("returns 401 when not authenticated", async () => {
    const response = await GET(
      createNextRequestWithCookie(
        "http://localhost/api/reservation/consoles",
        "SESSION=invalid-token",
      ),
    );

    expect(response.status).toBe(401);
  });
});
