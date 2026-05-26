import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import db from "@/db";
import * as jwtModule from "@/lib/jwt";
import { GET } from "./route";
import type { TimeSlotAvailability } from "./route";

vi.mock("@/db", () => ({
  default: {
    select: vi.fn(),
    execute: vi.fn(),
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

const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1))
  .toISOString()
  .split("T")[0];

describe("API /reservation/calendar-times route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns available time slots for valid request", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.query.reservationHold.findFirst).mockResolvedValue({
      consoleTypeId: 1,
    } as any);

    vi.mocked(db.select)
      .mockReturnValueOnce(chain([]) as ReturnType<typeof db.select>)   // reservations
      .mockReturnValueOnce(chain([]) as ReturnType<typeof db.select>)   // holds
      .mockReturnValueOnce(chain([]) as ReturnType<typeof db.select>)   // specificDates
      .mockReturnValueOnce(
        chain([{ startHour: "9", startMinute: "0", endHour: "17", endMinute: "0" }]) as ReturnType<typeof db.select>
      )                                                                  // weeklyHours
      .mockReturnValueOnce(chain([]) as ReturnType<typeof db.select>);  // userReservations

    vi.mocked(db.execute).mockResolvedValue(
      [{ station_id: 1 }, { station_id: 2 }] as any
    );

    const mockRequest = new NextRequest(
      `http://localhost/api/reservation/calendar-times?date=${tomorrow}&consoleId=1`,
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json).toHaveProperty("availability");
    expect(Array.isArray(json.availability)).toBe(true);
    expect(json).toHaveProperty("stats");
  });

  it("returns 400 when date parameter is missing", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/calendar-times?consoleId=1",
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Missing date parameter");
  });

  it("returns 400 when consoleId parameter is missing", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    const mockRequest = new NextRequest(
      `http://localhost/api/reservation/calendar-times?date=${tomorrow}`,
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Missing consoleId parameter");
  });

  it("returns 400 when date format is invalid", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/calendar-times?date=2025/12/01&consoleId=1",
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Invalid date format. Expected YYYY-MM-DD");
  });

  it("returns 400 when date is in the past", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    const mockRequest = new NextRequest(
      "http://localhost/api/reservation/calendar-times?date=2020-01-01&consoleId=1",
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Cannot check availability for past dates");
  });

  it("marks slots as unavailable when console is already reserved", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.query.reservationHold.findFirst).mockResolvedValue({
      consoleTypeId: 1,
    } as any);

    vi.mocked(db.select)
      .mockReturnValueOnce(
        chain([
          {
            time: "10:00:00",
            consoleId: 1,
            game1Id: null,
            game2Id: null,
            game3Id: null,
            accessoryIds: "[]",
            stationId: 1,
          },
        ]) as ReturnType<typeof db.select>
      )                                                                  // reservations
      .mockReturnValueOnce(chain([]) as ReturnType<typeof db.select>)   // holds
      .mockReturnValueOnce(chain([]) as ReturnType<typeof db.select>)   // specificDates
      .mockReturnValueOnce(
        chain([{ startHour: "9", startMinute: "0", endHour: "17", endMinute: "0" }]) as ReturnType<typeof db.select>
      )                                                                  // weeklyHours
      .mockReturnValueOnce(chain([]) as ReturnType<typeof db.select>);  // userReservations

    vi.mocked(db.execute).mockResolvedValue([{ station_id: 1 }] as any);

    const mockRequest = new NextRequest(
      `http://localhost/api/reservation/calendar-times?date=${tomorrow}&consoleId=1`,
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(json.success).toBe(true);
    const slot10am = json.availability.find((s: TimeSlotAvailability) => s.time === "10:00:00");
    if (slot10am) {
      expect(slot10am.available).toBe(false);
      expect(slot10am.conflicts).toHaveProperty("console", true);
    }
  });

  it("processes gameIds and accessoryIds parameters correctly", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
    });

    vi.mocked(db.query.reservationHold.findFirst).mockResolvedValue({
      consoleTypeId: 1,
    } as any);

    vi.mocked(db.select)
      .mockReturnValueOnce(chain([]) as ReturnType<typeof db.select>)   // reservations
      .mockReturnValueOnce(chain([]) as ReturnType<typeof db.select>)   // holds
      .mockReturnValueOnce(chain([]) as ReturnType<typeof db.select>)   // specificDates
      .mockReturnValueOnce(
        chain([{ startHour: "9", startMinute: "0", endHour: "17", endMinute: "0" }]) as ReturnType<typeof db.select>
      )                                                                  // weeklyHours
      .mockReturnValueOnce(chain([]) as ReturnType<typeof db.select>)   // userReservations
      .mockReturnValueOnce(
        chain([
          { requiredAccessories: [] },
          { requiredAccessories: [] },
          { requiredAccessories: [] },
        ]) as ReturnType<typeof db.select>
      );                                                                 // games.requiredAccessories

    vi.mocked(db.execute).mockResolvedValue([{ station_id: 1 }] as any);

    const mockRequest = new NextRequest(
      `http://localhost/api/reservation/calendar-times?date=${tomorrow}&consoleId=1&gameIds=1,2,3&accessoryIds=10,20`,
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.requestedItems.gameIds).toEqual([1, 2, 3]);
    expect(json.requestedItems.accessoryIds).toEqual([10, 20]);
  });

  it("returns 401 when token is missing", async () => {
    const mockRequest = new NextRequest(
      `http://localhost/api/reservation/calendar-times?date=${tomorrow}&consoleId=1`
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.message).toBe("Unauthorized");
  });

  it("returns 401 when token is invalid", async () => {
    vi.spyOn(jwtModule, "verifyToken").mockReturnValue(null);

    const mockRequest = new NextRequest(
      `http://localhost/api/reservation/calendar-times?date=${tomorrow}&consoleId=1`,
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

    vi.mocked(db.query.reservationHold.findFirst).mockRejectedValue(
      new Error("Database error")
    );

    const mockRequest = new NextRequest(
      `http://localhost/api/reservation/calendar-times?date=${tomorrow}&consoleId=1`,
      { headers: { Cookie: "SESSION=mock-token" } }
    );

    const response = await GET(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Internal server error");
  });
});
