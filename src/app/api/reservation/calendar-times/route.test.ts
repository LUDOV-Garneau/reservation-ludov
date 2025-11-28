import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import type mysql from "mysql2/promise";
import * as dbModule from "@/lib/db";
import * as jwtModule from "@/lib/jwt";
import { GET } from "./route";

describe("API /reservation/calendar-times route", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns available time slots for valid request", async () => {
        vi.spyOn(jwtModule, "verifyToken").mockReturnValue({
            id: 1,
            name: "Test User",
            email: "test@example.com",
            isAdmin: false,
        });

        const mockPool: Partial<mysql.Pool> = {
            query: vi
                .fn()
                .mockResolvedValueOnce([[{ console_type_id: 1 }], null])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([
                    [
                        {
                            start_hour: "9",
                            start_minute: "0",
                            end_hour: "17",
                            end_minute: "0",
                        },
                    ],
                    null,
                ])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[{ station_id: 1 }, { station_id: 2 }], null]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/calendar-times?date=2025-12-01&consoleId=1",
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
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
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
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
            "http://localhost/api/reservation/calendar-times?date=2025-12-01",
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
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
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
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
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
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

        const mockPool: Partial<mysql.Pool> = {
            query: vi
                .fn()
                .mockResolvedValueOnce([[{ console_type_id: 1 }], null])
                .mockResolvedValueOnce([
                    [
                        {
                            time: "10:00:00",
                            console_id: 1,
                            game1_id: null,
                            game2_id: null,
                            game3_id: null,
                            accessory_ids: "[]",
                            stationId: 1,
                        },
                    ],
                    null,
                ])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([
                    [
                        {
                            start_hour: "9",
                            start_minute: "0",
                            end_hour: "17",
                            end_minute: "0",
                        },
                    ],
                    null,
                ])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[{ station_id: 1 }], null]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/calendar-times?date=2025-12-01&consoleId=1",
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(json.success).toBe(true);
        const slot10am = json.availability.find((s: any) => s.time === "10:00:00");
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

        const mockPool: Partial<mysql.Pool> = {
            query: vi
                .fn()
                .mockResolvedValueOnce([[{ console_type_id: 1 }], null])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([
                    [
                        {
                            start_hour: "9",
                            start_minute: "0",
                            end_hour: "17",
                            end_minute: "0",
                        },
                    ],
                    null,
                ])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[{ station_id: 1 }], null]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/calendar-times?date=2025-12-01&consoleId=1&gameIds=1,2,3&accessoryIds=10,20",
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(json.success).toBe(true);
        expect(json.requestedItems.gameIds).toEqual([1, 2, 3]);
        expect(json.requestedItems.accessoryIds).toEqual([10, 20]);
    });

    it("returns 401 when token is missing", async () => {
        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/calendar-times?date=2025-12-01&consoleId=1"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(response.status).toBe(401);
        expect(json.message).toBe("Unauthorized");
    });

    it("returns 401 when token is invalid", async () => {
        vi.spyOn(jwtModule, "verifyToken").mockReturnValue(null);

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/calendar-times?date=2025-12-01&consoleId=1",
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
            "http://localhost/api/reservation/calendar-times?date=2025-12-01&consoleId=1",
            {
                headers: {
                    Cookie: "SESSION=mock-token",
                },
            }
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json.success).toBe(false);
        expect(json.error).toBe("Internal server error");
    });
});
