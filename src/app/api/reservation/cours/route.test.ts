import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type mysql from "mysql2/promise";
import * as dbModule from "@/lib/db";
import { GET } from "./route";

describe("API /reservation/cours route", () => {
    beforeEach(() => {
        const mockPool: Partial<mysql.Pool> = {
            query: vi.fn().mockResolvedValue([
                [
                    { id: 1, code_cours: "420-5B6-FX", nom_cours: "Projet intégrateur" },
                    { id: 2, code_cours: "420-4A5-FX", nom_cours: "Programmation web" },
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

    it("returns list of courses successfully", async () => {
        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(json)).toBe(true);
        expect(json).toHaveLength(2);
        expect(json[0]).toHaveProperty("id", 1);
        expect(json[0]).toHaveProperty("code_cours", "420-5B6-FX");
        expect(json[0]).toHaveProperty("nom_cours", "Projet intégrateur");
    });

    it("returns empty array when no courses found", async () => {
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
            query: vi.fn().mockRejectedValue(new Error("Database connection failed")),
        };
        vi.spyOn(dbModule, "default", "get").mockReturnValue(
            mockPool as mysql.Pool
        );

        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json).toHaveProperty("message");
    });
});
