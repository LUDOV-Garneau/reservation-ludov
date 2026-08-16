import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import db from "@/db";
import { PATCH } from "./route";
import { sendCancellationEmail } from "@/lib/sendEmail";

vi.mock("@/db", () => ({
  default: {
    query: { reservation: { findFirst: vi.fn() } },
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

vi.mock("@/lib/sendEmail", () => ({
  sendCancellationEmail: vi.fn(),
}));

const RESV_ID = "RESV-12345678-1234-1234-1234-123456789abc";

function patchRequest(body: unknown, cookie = "SESSION=admin-token") {
  return new NextRequest("http://localhost/api/admin/cancel-reservation", {
    method: "PATCH",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/admin/cancel-reservation", () => {
  const insertValues = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.reservation.findFirst).mockResolvedValue({
      id: RESV_ID,
      date: "2026-08-20",
      time: "14:00:00",
      user: {
        firstname: "Alice",
        lastname: "Tremblay",
        email: "alice@example.com",
      },
    } as unknown as Awaited<ReturnType<typeof db.query.reservation.findFirst>>);
    vi.mocked(db.update).mockReturnValue({
      set: () => ({ where: () => Promise.resolve() }),
    } as unknown as ReturnType<typeof db.update>);
    vi.mocked(db.insert).mockReturnValue({
      values: insertValues,
    } as unknown as ReturnType<typeof db.insert>);
  });

  it("returns 401 without a valid session", async () => {
    const res = await PATCH(
      patchRequest({ id: RESV_ID, reason: "Bris" }, "SESSION=bad"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin", async () => {
    const res = await PATCH(
      patchRequest({ id: RESV_ID, reason: "Bris" }, "SESSION=user-token"),
    );
    expect(res.status).toBe(403);
  });

  it("returns 422 when the reason is missing", async () => {
    const res = await PATCH(patchRequest({ id: RESV_ID, reason: "  " }));
    expect(res.status).toBe(422);
    expect(vi.mocked(db.update)).not.toHaveBeenCalled();
  });

  it("cancels, sends the email and logs it", async () => {
    const res = await PATCH(
      patchRequest({ id: RESV_ID, reason: "Console en réparation" }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.emailSent).toBe(true);
    expect(vi.mocked(db.update)).toHaveBeenCalled();
    expect(vi.mocked(sendCancellationEmail)).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        userName: "Alice Tremblay",
        reservationId: RESV_ID,
        reason: "Console en réparation",
      }),
    );
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ emailType: "cancellation", status: "sent" }),
    );
  });

  it("still succeeds when the email fails, and logs the failure", async () => {
    vi.mocked(sendCancellationEmail).mockRejectedValue(new Error("SMTP down"));

    const res = await PATCH(patchRequest({ id: RESV_ID, reason: "Bris" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.emailSent).toBe(false);
    expect(vi.mocked(db.update)).toHaveBeenCalled();
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        emailType: "cancellation",
        status: "failed",
        errorMessage: "SMTP down",
      }),
    );
  });

  it("returns 404 when the reservation does not exist or is already cancelled", async () => {
    vi.mocked(db.query.reservation.findFirst).mockResolvedValue(undefined);
    const res = await PATCH(patchRequest({ id: RESV_ID, reason: "Bris" }));
    expect(res.status).toBe(404);
  });
});
