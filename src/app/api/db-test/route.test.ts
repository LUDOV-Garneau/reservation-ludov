import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type mysql from "mysql2/promise";
import * as dbModule from "@/lib/db";
import { GET } from "./route";

describe("API db-test route with mocked DB", () => {
  beforeEach(() => {
    const mockPool: Partial<mysql.Pool> = {
      query: vi
        .fn()
        .mockResolvedValue([[{ now: "2025-09-23 16:00:00" }], null]),
    };
    vi.spyOn(dbModule, "default", "get").mockReturnValue(
      mockPool as mysql.Pool
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mocked DB time without real access", async () => {
    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(typeof json.time).toBe("string");
    expect(json.time).toBe("2025-09-23 16:00:00");
  });
});
