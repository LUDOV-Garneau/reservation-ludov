import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type mysql from "mysql2/promise";
import * as dbModule from "@/lib/db";
import { GET } from "./route";

describe("API /reservation/games route", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns empty result when consoleId is 0", async () => {
        const mockRequest = new Request(
            "http://localhost/api/reservation/games?consoleId=0&page=1&limit=12"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(json.success).toBe(true);
        expect(json.games).toEqual([]);
        expect(json.pagination.total).toBe(0);
        expect(json.hasMore).toBe(false);
    });

    it("returns games for valid consoleId without search", async () => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi
                .fn()
                .mockResolvedValueOnce([
                    [
                        {
                            id: 1,
                            titre: "God of War",
                            author: "Sony",
                            picture: "gow.jpg",
                            platform: "PS5",
                            biblio_id: 123,
                            available: 1,
                        },
                        {
                            id: 2,
                            titre: "Spider-Man",
                            author: "Insomniac",
                            picture: "spiderman.jpg",
                            platform: "PS5",
                            biblio_id: 124,
                            available: 1,
                        },
                    ],
                    null,
                ])
                .mockResolvedValueOnce([[{ total: 2 }], null]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new Request(
            "http://localhost/api/reservation/games?consoleId=1&page=1&limit=12"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(json.success).toBe(true);
        expect(json.games).toHaveLength(2);
        expect(json.games[0]).toHaveProperty("id", 1);
        expect(json.games[0]).toHaveProperty("titre", "God of War");
        expect(json.pagination.total).toBe(2);
        expect(json.pagination.totalPages).toBe(1);
    });

    it("returns filtered games with search parameter", async () => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi
                .fn()
                .mockResolvedValueOnce([
                    [
                        {
                            id: 1,
                            titre: "God of War",
                            author: "Sony",
                            picture: "gow.jpg",
                            platform: "PS5",
                            biblio_id: 123,
                            available: 1,
                        },
                    ],
                    null,
                ])
                .mockResolvedValueOnce([[{ total: 1 }], null]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new Request(
            "http://localhost/api/reservation/games?consoleId=1&page=1&limit=12&search=god"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(json.success).toBe(true);
        expect(json.games).toHaveLength(1);
        expect(json.games[0].titre).toContain("God");
    });

    it("handles pagination correctly", async () => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi
                .fn()
                .mockResolvedValueOnce([
                    [
                        {
                            id: 13,
                            titre: "Game 13",
                            author: "Author",
                            picture: "pic.jpg",
                            platform: "PS5",
                            biblio_id: 200,
                            available: 1,
                        },
                    ],
                    null,
                ])
                .mockResolvedValueOnce([[{ total: 25 }], null]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new Request(
            "http://localhost/api/reservation/games?consoleId=1&page=2&limit=12"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(json.success).toBe(true);
        expect(json.pagination.page).toBe(2);
        expect(json.pagination.limit).toBe(12);
        expect(json.pagination.total).toBe(25);
        expect(json.pagination.totalPages).toBe(3);
        expect(json.hasMore).toBe(true);
    });

    it("returns empty array when no games found", async () => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi
                .fn()
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([[{ total: 0 }], null]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new Request(
            "http://localhost/api/reservation/games?consoleId=1&page=1&limit=12"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(json.success).toBe(true);
        expect(json.games).toHaveLength(0);
        expect(json.pagination.total).toBe(0);
    });

    it("handles database errors gracefully", async () => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockRejectedValue(new Error("SQL error")),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new Request(
            "http://localhost/api/reservation/games?consoleId=1&page=1&limit=12"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json.success).toBe(false);
        expect(json).toHaveProperty("message");
    });
});
