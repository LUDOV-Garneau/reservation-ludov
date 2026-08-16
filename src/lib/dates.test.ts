import { describe, it, expect } from "vitest";
import { toLocalYmd, parseYmdLocal, isFutureSlot } from "./dates";

describe("toLocalYmd", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(toLocalYmd(new Date(2026, 7, 10))).toBe("2026-08-10");
  });

  it("pads month and day", () => {
    expect(toLocalYmd(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("keeps the local calendar day even late in the evening", () => {
    // 23h30 local : toISOString() aurait basculé au lendemain en UTC-.
    expect(toLocalYmd(new Date(2026, 7, 10, 23, 30))).toBe("2026-08-10");
  });
});

describe("parseYmdLocal", () => {
  it("parses to local midnight, not UTC midnight", () => {
    const d = parseYmdLocal("2026-08-10");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(10);
    expect(d.getHours()).toBe(0);
  });

  it("round-trips with toLocalYmd", () => {
    expect(toLocalYmd(parseYmdLocal("2026-12-31"))).toBe("2026-12-31");
    expect(toLocalYmd(parseYmdLocal("2026-01-01"))).toBe("2026-01-01");
  });

  it("round-trips across a DST change (America/Toronto: 2026-03-08)", () => {
    expect(toLocalYmd(parseYmdLocal("2026-03-08"))).toBe("2026-03-08");
    expect(toLocalYmd(parseYmdLocal("2026-11-01"))).toBe("2026-11-01");
  });
});

describe("isFutureSlot", () => {
  const now = new Date(2026, 7, 10, 14, 0); // 10 août 2026, 14h00 locale

  it("returns true for a later slot the same day", () => {
    expect(isFutureSlot("2026-08-10", "16:00:00", now)).toBe(true);
  });

  it("returns false for an earlier slot the same day", () => {
    expect(isFutureSlot("2026-08-10", "12:00:00", now)).toBe(false);
  });

  it("returns false for the current instant", () => {
    expect(isFutureSlot("2026-08-10", "14:00:00", now)).toBe(false);
  });

  it("compares minutes, not just hours", () => {
    expect(isFutureSlot("2026-08-10", "14:30:00", now)).toBe(true);
  });

  it("handles other days", () => {
    expect(isFutureSlot("2026-08-11", "08:00:00", now)).toBe(true);
    expect(isFutureSlot("2026-08-09", "23:00:00", now)).toBe(false);
  });

  it("accepts HH:mm without seconds", () => {
    expect(isFutureSlot("2026-08-10", "15:00", now)).toBe(true);
  });
});
