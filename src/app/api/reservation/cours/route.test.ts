import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import db from "@/db";
import { GET } from "./route";

vi.mock("@/db", () => ({
  default: {
    query: {
      cours: { findMany: vi.fn() },
    },
  },
}));

describe("API /reservation/cours route", () => {
  beforeEach(() => {
    vi.mocked(db.query.cours.findMany).mockResolvedValue(
      ([
        { id: 1, code_cours: "420-5B6-FX", nom_cours: "Projet intégrateur" },
        { id: 2, code_cours: "420-4A5-FX", nom_cours: "Programmation web" },
      ] as unknown) as Awaited<ReturnType<typeof db.query.cours.findMany>>
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
    vi.mocked(db.query.cours.findMany).mockResolvedValue([]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(0);
  });

  it("handles database errors gracefully", async () => {
    vi.mocked(db.query.cours.findMany).mockRejectedValue(
      new Error("Database connection failed")
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toHaveProperty("message");
  });
});
