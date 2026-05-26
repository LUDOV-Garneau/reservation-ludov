import { describe, it, expect, vi, beforeEach } from "vitest";
import db from "@/db";
import { GET } from "./route";

vi.mock("@/db", () => ({
  default: {
    select: vi.fn(),
    selectDistinct: vi.fn(),
  },
}));

/** Chainable thenable resolving to `result`. Covers .from/.where/.orderBy/.limit/.offset. */
function chain(result: unknown) {
  const obj: Record<string, unknown> = {
    then(
      onfulfilled?: ((v: unknown) => unknown) | null,
      onrejected?: ((e: unknown) => unknown) | null,
    ) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };
  for (const m of ["from", "where", "orderBy", "limit", "offset"]) {
    obj[m] = () => obj;
  }
  return obj;
}

describe("GET /reservation/games", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns empty result when consoleId is 0 with no DB call", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/reservation/games?consoleId=0&page=1&limit=12",
      ),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.games).toEqual([]);
    expect(json.pagination.total).toBe(0);
    expect(json.hasMore).toBe(false);
    expect(vi.mocked(db.select)).not.toHaveBeenCalled();
    expect(vi.mocked(db.selectDistinct)).not.toHaveBeenCalled();
  });

  it("returns games via db.select when no search query is provided", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(
        chain([
          {
            id: 1,
            titre: "God of War",
            author: "Sony",
            picture: "gow.jpg",
            platform: "PS5",
            biblioId: 123,
          },
          {
            id: 2,
            titre: "Spider-Man",
            author: "Insomniac",
            picture: "spiderman.jpg",
            platform: "PS5",
            biblioId: 124,
          },
        ]) as unknown as ReturnType<typeof db.select>,
      )
      .mockReturnValueOnce(
        chain([{ total: 2 }]) as unknown as ReturnType<typeof db.select>,
      );

    const res = await GET(
      new Request(
        "http://localhost/api/reservation/games?consoleId=1&page=1&limit=12",
      ),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.games).toHaveLength(2);
    expect(json.games[0]).toMatchObject({
      id: 1,
      titre: "God of War",
      biblio_id: 123,
    });
    expect(json.games[1]).toMatchObject({ id: 2, titre: "Spider-Man" });
    expect(json.pagination).toMatchObject({
      page: 1,
      limit: 12,
      total: 2,
      totalPages: 1,
    });
    expect(json.hasMore).toBe(false);
    expect(vi.mocked(db.selectDistinct)).not.toHaveBeenCalled();
  });

  it("returns filtered games via db.selectDistinct when search query is provided", async () => {
    vi.mocked(db.selectDistinct).mockReturnValueOnce(
      chain([
        {
          id: 1,
          titre: "God of War",
          author: "Sony",
          picture: "gow.jpg",
          platform: "PS5",
          biblioId: 123,
        },
      ]) as unknown as ReturnType<typeof db.selectDistinct>,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      chain([{ total: 1 }]) as unknown as ReturnType<typeof db.select>,
    );

    const res = await GET(
      new Request(
        "http://localhost/api/reservation/games?consoleId=1&page=1&limit=12&search=god",
      ),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.games).toHaveLength(1);
    expect(json.games[0]).toMatchObject({
      id: 1,
      titre: "God of War",
      biblio_id: 123,
    });
    expect(vi.mocked(db.selectDistinct)).toHaveBeenCalledOnce();
  });

  it("computes pagination metadata correctly for page 2 of 25 items", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(
        chain([
          {
            id: 13,
            titre: "Game 13",
            author: "A",
            picture: null,
            platform: "PS5",
            biblioId: 200,
          },
        ]) as unknown as ReturnType<typeof db.select>,
      )
      .mockReturnValueOnce(
        chain([{ total: 25 }]) as unknown as ReturnType<typeof db.select>,
      );

    const res = await GET(
      new Request(
        "http://localhost/api/reservation/games?consoleId=1&page=2&limit=12",
      ),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.pagination).toMatchObject({
      page: 2,
      limit: 12,
      total: 25,
      totalPages: 3,
    });
    expect(json.hasMore).toBe(true);
  });

  it("returns empty games array when none match", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([]) as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(
        chain([{ total: 0 }]) as unknown as ReturnType<typeof db.select>,
      );

    const res = await GET(
      new Request(
        "http://localhost/api/reservation/games?consoleId=1&page=1&limit=12",
      ),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.games).toHaveLength(0);
    expect(json.pagination.total).toBe(0);
  });

  it("returns 500 when a database error occurs", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("SQL error");
    });

    const res = await GET(
      new Request(
        "http://localhost/api/reservation/games?consoleId=1&page=1&limit=12",
      ),
    );
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json).toHaveProperty("message");
  });
});
