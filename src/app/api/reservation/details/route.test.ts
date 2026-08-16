import { describe, it, expect, vi, beforeEach } from "vitest";
import db from "@/db";
import { GET, DELETE } from "./route";
import { createNextRequestWithCookie } from "../test-helpers";

vi.mock("@/db", () => ({
  default: {
    query: {
      reservation: { findFirst: vi.fn() },
      stations: { findFirst: vi.fn() },
    },
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn((token: string) => {
    if (token === "owner-token")
      return { id: 1, name: "Owner", email: "owner@example.com", isAdmin: false };
    if (token === "other-token")
      return { id: 2, name: "Other", email: "other@example.com", isAdmin: false };
    if (token === "admin-token")
      return { id: 99, name: "Admin", email: "admin@example.com", isAdmin: true };
    return null;
  }),
}));

const RESV_ID = "RESV-12345678-1234-1234-1234-123456789abc";
const URL_WITH_ID = `http://localhost/api/reservation/details?id=${RESV_ID}`;

const baseRow = {
  id: RESV_ID,
  userId: 1,
  station: null,
  date: "2026-08-20",
  time: "14:00:00",
  archived: 0,
  accessoryIds: null,
  consoleStock: { consoleType: { name: "PlayStation 5" } },
  game_game1Id: null,
  game_game2Id: null,
  game_game3Id: null,
};

describe("API /reservation/details auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.reservation.findFirst).mockResolvedValue(
      baseRow as unknown as Awaited<
        ReturnType<typeof db.query.reservation.findFirst>
      >,
    );
    vi.mocked(db.update).mockReturnValue({
      set: () => ({ where: () => Promise.resolve() }),
    } as unknown as ReturnType<typeof db.update>);
  });

  it("GET returns 401 without a valid session", async () => {
    const res = await GET(
      createNextRequestWithCookie(URL_WITH_ID, "SESSION=bad-token"),
    );
    expect(res.status).toBe(401);
  });

  it("GET returns 403 for another user's reservation", async () => {
    const res = await GET(
      createNextRequestWithCookie(URL_WITH_ID, "SESSION=other-token"),
    );
    expect(res.status).toBe(403);
  });

  it("GET returns 200 for the owner", async () => {
    const res = await GET(
      createNextRequestWithCookie(URL_WITH_ID, "SESSION=owner-token"),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.id).toBe(RESV_ID);
    expect(json.console.nom).toBe("PlayStation 5");
  });

  it("GET returns 200 for an admin", async () => {
    const res = await GET(
      createNextRequestWithCookie(URL_WITH_ID, "SESSION=admin-token"),
    );
    expect(res.status).toBe(200);
  });

  it("DELETE returns 401 without a valid session", async () => {
    const res = await DELETE(
      createNextRequestWithCookie(URL_WITH_ID, "SESSION=bad-token"),
    );
    expect(res.status).toBe(401);
    expect(vi.mocked(db.update)).not.toHaveBeenCalled();
  });

  it("DELETE returns 403 for another user's reservation", async () => {
    const res = await DELETE(
      createNextRequestWithCookie(URL_WITH_ID, "SESSION=other-token"),
    );
    expect(res.status).toBe(403);
    expect(vi.mocked(db.update)).not.toHaveBeenCalled();
  });

  it("DELETE archives the reservation for the owner", async () => {
    const res = await DELETE(
      createNextRequestWithCookie(URL_WITH_ID, "SESSION=owner-token"),
    );
    expect(res.status).toBe(200);
    expect(vi.mocked(db.update)).toHaveBeenCalled();
  });

  it("GET returns 400 for a malformed id", async () => {
    const res = await GET(
      createNextRequestWithCookie(
        "http://localhost/api/reservation/details?id=RESV-nope",
        "SESSION=owner-token",
      ),
    );
    expect(res.status).toBe(400);
  });
});
