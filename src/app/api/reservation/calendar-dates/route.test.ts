import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import db from "@/db";
import * as jwtModule from "@/lib/jwt";
import { GET } from "./route";

vi.mock("@/db", () => ({
  default: {
    query: {
      weeklyAvailabilities: { findMany: vi.fn() },
    },
  },
}));

describe("API /reservation/calendar-dates route", () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns unavailable dates for authenticated user", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.query.weeklyAvailabilities.findMany).mockResolvedValue([
      {
        weeklyId: 1,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        dayOfWeek: "monday",
        enabled: 1,
        alwaysAvailable: 0,
      },
      {
        weeklyId: 2,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        dayOfWeek: "sunday",
        enabled: 0,
        alwaysAvailable: 0,
      },
    ] as any);

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/calendar-dates",
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(json).toHaveProperty("unavailableDates");
    expect(json.unavailableDates).toHaveProperty("before");
    expect(json.unavailableDates).toHaveProperty("after");
    expect(json.unavailableDates).toHaveProperty("dayOfWeek");
    expect(json.unavailableDates.dayOfWeek).toContain(0); // Sunday
  });

  it("returns null unavailable dates when always_available is true", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.query.weeklyAvailabilities.findMany).mockResolvedValue([
      {
        weeklyId: 1,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        dayOfWeek: "monday",
        enabled: 1,
        alwaysAvailable: 1,
      },
    ] as any);

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/calendar-dates",
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(json.unavailableDates.before).toBeNull();
    expect(json.unavailableDates.after).toBeNull();
  });

  it("returns null when no weekly availabilities exist", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.query.weeklyAvailabilities.findMany).mockResolvedValue([]);

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/calendar-dates",
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(json.unavailableDates).toBeNull();
  });

  it("returns 401 when token is missing", async () => {
    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/calendar-dates"
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.message).toBe("Unauthorized");
  });

  it("returns 401 when token is invalid", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue(null);

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/calendar-dates",
      { headers: { Cookie: "SESSION=invalid-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.message).toBe("Unauthorized");
  });

  it("handles database errors gracefully", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.query.weeklyAvailabilities.findMany).mockRejectedValue(
      new Error("Database error")
    );

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/calendar-dates",
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toHaveProperty("error", "Internal server error");
  });
});
