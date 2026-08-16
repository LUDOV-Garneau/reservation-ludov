import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import db from "@/db";
import { GET } from "./route";
import { PATCH } from "./[id]/image/route";
import { importRemoteImage } from "@/lib/uploads";

vi.mock("@/db", () => ({
  default: {
    query: { games: { findFirst: vi.fn() } },
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn((token: string) => {
    if (token === "admin-token")
      return { id: 99, name: "Admin", email: "admin@example.com", isAdmin: true };
    if (token === "user-token")
      return { id: 1, name: "User", email: "user@example.com", isAdmin: false };
    return null;
  }),
}));

vi.mock("@/lib/uploads", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/uploads")>();
  return {
    ...actual,
    importRemoteImage: vi.fn(async () => ({
      publicPath: "/api/images/games/mock.png",
      filename: "mock.png",
    })),
  };
});

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

const listRequest = (qs = "", cookie = "SESSION=admin-token") =>
  new NextRequest(`http://localhost/api/admin/games${qs}`, {
    headers: { Cookie: cookie },
  });

const imageRequest = (id: string, body: unknown, cookie = "SESSION=admin-token") =>
  new NextRequest(`http://localhost/api/admin/games/${id}/image`, {
    method: "PATCH",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("API /admin/games", () => {
  const setMock = vi.fn(() => ({ where: () => Promise.resolve() }));

  beforeEach(() => {
    vi.clearAllMocks();
    let call = 0;
    vi.mocked(db.select).mockImplementation(() => {
      call += 1;
      return (call % 2 === 1
        ? chain([
            {
              id: 1,
              titre: "Zelda",
              author: "Nintendo",
              platform: "Switch",
              picture: null,
              biblioId: 42,
            },
          ])
        : chain([{ total: 1 }])) as unknown as ReturnType<typeof db.select>;
    });
    vi.mocked(db.query.games.findFirst).mockResolvedValue({
      id: 1,
    } as unknown as Awaited<ReturnType<typeof db.query.games.findFirst>>);
    vi.mocked(db.update).mockReturnValue({
      set: setMock,
    } as unknown as ReturnType<typeof db.update>);
  });

  it("GET requires an admin session", async () => {
    expect((await GET(listRequest("", "SESSION=bad"))).status).toBe(401);
    expect((await GET(listRequest("", "SESSION=user-token"))).status).toBe(403);
  });

  it("GET returns a paginated list with total", async () => {
    const res = await GET(listRequest("?page=1&pageSize=12&hasImage=no"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.games).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("PATCH image accepts an uploaded path", async () => {
    const res = await PATCH(
      imageRequest("1", { path: "/api/images/games/abc.png" }),
      ctx("1"),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.picture).toBe("/api/images/games/abc.png");
    expect(setMock).toHaveBeenCalledWith({
      picture: "/api/images/games/abc.png",
    });
  });

  it("PATCH image rejects a path outside /api/images/", async () => {
    const res = await PATCH(
      imageRequest("1", { path: "/etc/passwd" }),
      ctx("1"),
    );
    expect(res.status).toBe(400);
    expect(setMock).not.toHaveBeenCalled();
  });

  it("PATCH image imports a remote URL server-side", async () => {
    const res = await PATCH(
      imageRequest("1", {
        url: "https://images.igdb.com/igdb/image/upload/abc.png",
      }),
      ctx("1"),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(vi.mocked(importRemoteImage)).toHaveBeenCalled();
    expect(json.picture).toBe("/api/images/games/mock.png");
  });
});
