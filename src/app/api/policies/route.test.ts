import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import db from "@/db";
import { GET, POST } from "./route";

vi.mock("@/db", () => ({
  default: {
    query: { policies: { findFirst: vi.fn() } },
    update: vi.fn(),
    insert: vi.fn(),
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

const URL_BASE = "http://localhost/api/policies";

describe("API /policies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.policies.findFirst).mockResolvedValue({
      id: 1,
      type: "privacy",
      policies: "<p>Politique</p>",
      lastUpdatedAt: "2026-08-10 12:00:00",
    } as unknown as Awaited<ReturnType<typeof db.query.policies.findFirst>>);
    vi.mocked(db.update).mockReturnValue({
      set: () => ({ where: () => Promise.resolve() }),
    } as unknown as ReturnType<typeof db.update>);
    vi.mocked(db.insert).mockReturnValue({
      values: () => Promise.resolve(),
    } as unknown as ReturnType<typeof db.insert>);
  });

  it("GET is public and defaults to the privacy policy", async () => {
    const res = await GET(new NextRequest(URL_BASE));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.policies.policies).toBe("<p>Politique</p>");
  });

  it("GET accepts ?type=usage", async () => {
    const res = await GET(new NextRequest(`${URL_BASE}?type=usage`));
    expect(res.status).toBe(200);
  });

  it("GET rejects unknown types", async () => {
    const res = await GET(new NextRequest(`${URL_BASE}?type=hacker`));
    expect(res.status).toBe(400);
  });

  it("POST requires an admin session", async () => {
    const unauth = await POST(
      new NextRequest(URL_BASE, {
        method: "POST",
        body: JSON.stringify({ policies: "<p>x</p>" }),
      }),
    );
    expect(unauth.status).toBe(401);

    const nonAdmin = await POST(
      new NextRequest(URL_BASE, {
        method: "POST",
        headers: { Cookie: "SESSION=user-token" },
        body: JSON.stringify({ policies: "<p>x</p>" }),
      }),
    );
    expect(nonAdmin.status).toBe(403);
  });

  it("POST updates the requested policy type", async () => {
    const res = await POST(
      new NextRequest(`${URL_BASE}?type=usage`, {
        method: "POST",
        headers: { Cookie: "SESSION=admin-token" },
        body: JSON.stringify({ policies: "<p>Nouvelle politique</p>" }),
      }),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(vi.mocked(db.update)).toHaveBeenCalled();
  });
});
