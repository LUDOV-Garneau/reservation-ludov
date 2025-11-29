import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import type mysql from "mysql2/promise";
import * as dbModule from "@/lib/db";
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

describe("API /reservation/required-accessories route", () => {
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

        const mockPool: Partial<mysql.Pool> = {
            query: vi
                .fn()
                .mockResolvedValueOnce([
                    [
                        { required_accessories: [100, 101] },
                        { required_accessories: [102] },
                    ],
                    null,
                ])
                .mockResolvedValueOnce([
                    [
                        { id: 1, koha_id: 100 },
                        { id: 2, koha_id: 101 },
                        { id: 3, koha_id: 102 },
                    ],
                    null,
                ]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
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

        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockResolvedValueOnce([
                [
                    { required_accessories: [] },
                    { required_accessories: null },
                ],
                null,
            ]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
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

        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockRejectedValue(new Error("Database error")),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/required-accessories?gameIds=1"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json).toHaveProperty("message", "Internal server error");
    });
});
