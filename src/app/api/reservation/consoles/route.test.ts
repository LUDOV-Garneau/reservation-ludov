import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type mysql from "mysql2/promise";
import * as dbModule from "@/lib/db";
import { GET } from "./route";
import type { ConsoleCatalogItem } from "./route";

describe("API /reservation/consoles route", () => {
    beforeEach(() => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockResolvedValue([
                [
                    {
                        id: 1,
                        name: "PlayStation 5",
                        picture: "ps5.jpg",
                        active_units: 3,
                        total_units: 5,
                    },
                    {
                        id: 2,
                        name: "Xbox Series X",
                        picture: "xbox.jpg",
                        active_units: 2,
                        total_units: 3,
                    },
                ],
                null,
            ]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns list of active consoles successfully", async () => {
        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        expect(json).toHaveLength(2);
        expect(json[0]).toHaveProperty("id", 1);
        expect(json[0]).toHaveProperty("name", "PlayStation 5");
        expect(json[0]).toHaveProperty("active_units", 3);
    });

    it("filters consoles with active_units > 0", async () => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockResolvedValue([
                [
                    {
                        id: 1,
                        name: "PlayStation 5",
                        picture: "ps5.jpg",
                        active_units: 3,
                        total_units: 5,
                    },
                ],
                null,
            ]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.every((console: ConsoleCatalogItem) => console.active_units > 0)).toBe(true);
    });

    it("returns empty array when no active consoles available", async () => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockResolvedValue([[], null]),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        expect(json).toHaveLength(0);
    });

    it("handles database errors gracefully", async () => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockRejectedValue(new Error("Database error")),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json).toHaveProperty("message", "Erreur serveur");
    });
});
