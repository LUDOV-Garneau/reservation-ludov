import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import type mysql from "mysql2/promise";
import * as dbModule from "@/lib/db";
import * as jwtModule from "@/lib/jwt";
import { GET } from "./route";

describe("API /reservation/calendar-dates route", () => {
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

        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockResolvedValue([
                [
                    {
                        weekly_id: 1,
                        start_date: new Date("2025-01-01"),
                        end_date: new Date("2025-12-31"),
                        day_of_week: "monday",
                        enabled: true,
                        always_available: false,
                    },
                    {
                        weekly_id: 2,
                        start_date: new Date("2025-01-01"),
                        end_date: new Date("2025-12-31"),
                        day_of_week: "sunday",
                        enabled: false,
                        always_available: false,
                    },
                ],
                null,
            ]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/calendar-dates",
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
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

        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockResolvedValue([
                [
                    {
                        weekly_id: 1,
                        start_date: new Date("2025-01-01"),
                        end_date: new Date("2025-12-31"),
                        day_of_week: "monday",
                        enabled: true,
                        always_available: true,
                    },
                ],
                null,
            ]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/calendar-dates",
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
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

        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockResolvedValue([[], null]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/calendar-dates",
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
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
            {
                headers: {
                    Cookie: "SESSION=invalid-token",
                },
            }
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

        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockRejectedValue(new Error("Database error")),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/calendar-dates",
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json).toHaveProperty("error", "Internal server error");
    });
});
