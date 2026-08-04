import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
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

describe("API /reservation/required-accessories route", () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns required accessories for valid game IDs", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.select)
      .mockReturnValueOnce(
        chain([
          { requiredAccessories: [100, 101] },
          { requiredAccessories: [102] },
        ]) as ReturnType<typeof db.select>
      )
      .mockReturnValueOnce(
        chain([{ id: 1 }, { id: 3 }]) as ReturnType<typeof db.select>
      );

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/required-accessories?gameIds=1&gameIds=2"
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(json).toHaveProperty("required_accessories");
    expect(Array.isArray(json.required_accessories)).toBe(true);
    expect(json.required_accessories).toContain(1);
    expect(json.required_accessories).toContain(3);
  });

  it("returns empty array when games have no required accessories", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.select).mockReturnValueOnce(
      chain([
        { requiredAccessories: [] },
        { requiredAccessories: null },
      ]) as ReturnType<typeof db.select>
    );

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/required-accessories?gameIds=1&gameIds=2"
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(json.required_accessories).toEqual([]);
  });

  it("returns 401 when token is invalid", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/required-accessories?gameIds=1"
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Invalid or expired token");
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue(null);

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/required-accessories?gameIds=1"
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Unauthorized");
  });

  it("handles database errors gracefully", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/required-accessories?gameIds=1"
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toHaveProperty("message", "Internal server error");
  });
});
