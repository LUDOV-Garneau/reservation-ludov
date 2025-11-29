import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import type mysql from "mysql2/promise";
import * as dbModule from "@/lib/db";
import { GET } from "./route";

describe("API /reservation/games/details route", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns game details for valid IDs", async () => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockResolvedValue([
                [
                    {
                        id: 1,
                        titre: "God of War",
                        picture: "gow.jpg",
                        biblio_id: 123,
                        author: "Sony",
                        available: 1,
                    },
                    {
                        id: 2,
                        titre: "Spider-Man",
                        picture: "spiderman.jpg",
                        biblio_id: 124,
                        author: "Insomniac",
                        available: 1,
                    },
                ],
                null,
            ]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/games/details?ids=1,2"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        expect(json).toHaveLength(2);
        expect(json[0]).toHaveProperty("id", 1);
        expect(json[0]).toHaveProperty("titre", "God of War");
        expect(json[1]).toHaveProperty("id", 2);
    });

    it("returns 400 when ids parameter is missing", async () => {
        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/games/details"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.message).toBe("ids param is required");
    });

    it("returns 400 when no valid IDs provided", async () => {
        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/games/details?ids=abc,xyz"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.message).toBe("No valid game IDs provided");
    });

    it("filters out invalid IDs and processes valid ones", async () => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockResolvedValue([
                [
                    {
                        id: 1,
                        titre: "God of War",
                        picture: "gow.jpg",
                        biblio_id: 123,
                        author: "Sony",
                        available: 1,
                    },
                ],
                null,
            ]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/games/details?ids=1,abc,2xyz"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        expect(json).toHaveLength(1);
    });

    it("handles database errors gracefully", async () => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockRejectedValue(new Error("Database error")),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const mockRequest = new NextRequest(
            "http://localhost/api/reservation/games/details?ids=1,2"
        );

        const response = await GET(mockRequest);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json.success).toBe(false);
        expect(json.message).toBe("Erreur serveur");
    });
});
