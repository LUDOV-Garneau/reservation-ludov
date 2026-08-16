import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import db from "@/db";
import { GET } from "./route";
import { PATCH } from "./[id]/route";

vi.mock("@/db", () => ({
  default: {
    query: { accessoires: { findFirst: vi.fn() } },
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

const listRequest = (cookie = "SESSION=admin-token") =>
  new NextRequest("http://localhost/api/admin/accessories", {
    headers: { Cookie: cookie },
  });

function patchRequest(
  id: string,
  body: unknown,
  cookie = "SESSION=admin-token",
) {
  return new NextRequest(`http://localhost/api/admin/accessories/${id}`, {
    method: "PATCH",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const patchCtx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("API /admin/accessories", () => {
  const setMock = vi.fn(() => ({ where: () => Promise.resolve() }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.select).mockImplementation(
      () =>
        chain([
          { id: 1, name: "Manette", kohaId: 100, consoles: [2], hidden: 0 },
        ]) as unknown as ReturnType<typeof db.select>,
    );
    vi.mocked(db.query.accessoires.findFirst).mockResolvedValue({
      id: 1,
    } as unknown as Awaited<ReturnType<typeof db.query.accessoires.findFirst>>);
    vi.mocked(db.update).mockReturnValue({
      set: setMock,
    } as unknown as ReturnType<typeof db.update>);
  });

  it("GET requires an admin session", async () => {
    expect((await GET(listRequest("SESSION=bad"))).status).toBe(401);
    expect((await GET(listRequest("SESSION=user-token"))).status).toBe(403);
  });

  it("GET returns accessories with resolved console names", async () => {
    vi.mocked(db.select)
      .mockImplementationOnce(
        () =>
          chain([
            { id: 1, name: "Manette", kohaId: 100, consoles: [2], hidden: 1 },
          ]) as unknown as ReturnType<typeof db.select>,
      )
      .mockImplementationOnce(
        () =>
          chain([{ id: 2, name: "PlayStation 5" }]) as unknown as ReturnType<
            typeof db.select
          >,
      );

    const res = await GET(listRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.accessories).toEqual([
      {
        id: 1,
        name: "Manette",
        kohaId: 100,
        hidden: true,
        consoles: [{ id: 2, name: "PlayStation 5" }],
      },
    ]);
  });

  it("PATCH requires an admin session", async () => {
    const res = await PATCH(
      patchRequest("1", { hidden: true }, "SESSION=user-token"),
      patchCtx("1"),
    );
    expect(res.status).toBe(403);
  });

  it("PATCH toggles hidden", async () => {
    const res = await PATCH(patchRequest("1", { hidden: true }), patchCtx("1"));
    expect(res.status).toBe(200);
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ hidden: 1 }),
    );
  });

  it("PATCH rejects unknown console ids", async () => {
    // La validation vérifie l'existence des ids : ici la BD n'en connaît qu'un.
    vi.mocked(db.select).mockImplementation(
      () => chain([{ id: 2 }]) as unknown as ReturnType<typeof db.select>,
    );
    const res = await PATCH(
      patchRequest("1", { consoles: [2, 999] }),
      patchCtx("1"),
    );
    expect(res.status).toBe(400);
    expect(setMock).not.toHaveBeenCalled();
  });

  it("PATCH rejects a malformed consoles payload", async () => {
    const res = await PATCH(
      patchRequest("1", { consoles: ["a"] }),
      patchCtx("1"),
    );
    expect(res.status).toBe(400);
  });
});
