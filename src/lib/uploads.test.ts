import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import {
  sniffImage,
  saveUpload,
  importRemoteImage,
  resolveUploadPath,
  UploadError,
  MAX_UPLOAD_BYTES,
} from "./uploads";

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16, 1),
]);
const JPG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.alloc(16, 1),
]);
const GIF = Buffer.concat([Buffer.from("GIF89a"), Buffer.alloc(16, 1)]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.alloc(4, 0),
  Buffer.from("WEBP"),
  Buffer.alloc(16, 1),
]);

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ludov-uploads-"));
  process.env.UPLOADS_DIR = tmpDir;
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
  delete process.env.UPLOADS_DIR;
  vi.restoreAllMocks();
});

describe("sniffImage", () => {
  it("detects png, jpeg, gif and webp", () => {
    expect(sniffImage(PNG)?.ext).toBe("png");
    expect(sniffImage(JPG)?.ext).toBe("jpg");
    expect(sniffImage(GIF)?.ext).toBe("gif");
    expect(sniffImage(WEBP)?.ext).toBe("webp");
  });

  it("rejects non-image content", () => {
    expect(sniffImage(Buffer.from("<html>not an image</html>"))).toBeNull();
    expect(sniffImage(Buffer.alloc(4))).toBeNull();
  });
});

describe("saveUpload", () => {
  it("writes the file and returns a public path", async () => {
    const { publicPath, filename } = await saveUpload(PNG, "games");
    expect(publicPath).toBe(`/api/images/games/${filename}`);
    expect(filename).toMatch(/^[0-9a-f-]{36}\.png$/);
    const written = await fs.readFile(path.join(tmpDir, "games", filename));
    expect(written.equals(PNG)).toBe(true);
  });

  it("rejects files over the size cap", async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(MAX_UPLOAD_BYTES)]);
    await expect(saveUpload(big, "games")).rejects.toThrow(UploadError);
  });

  it("rejects non-image files", async () => {
    await expect(
      saveUpload(Buffer.from("#!/bin/sh\nrm -rf /"), "docs"),
    ).rejects.toThrow(/Format d'image non supporté/);
  });
});

describe("importRemoteImage", () => {
  it("rejects non-https URLs", async () => {
    await expect(
      importRemoteImage("http://images.igdb.com/a.png", "games"),
    ).rejects.toThrow(/https/);
  });

  it("rejects hosts outside the allowlist (SSRF guard)", async () => {
    await expect(
      importRemoteImage("https://evil.example.com/a.png", "games"),
    ).rejects.toThrow(/Hôte non autorisé/);
    await expect(
      importRemoteImage("https://images.igdb.com.evil.com/a.png", "games"),
    ).rejects.toThrow(/Hôte non autorisé/);
  });

  it("rejects invalid URLs", async () => {
    await expect(importRemoteImage("not-a-url", "games")).rejects.toThrow(
      /URL invalide/,
    );
  });

  it("downloads and stores an allowed image", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Uint8Array(PNG), { status: 200 })),
    );

    const { publicPath } = await importRemoteImage(
      "https://images.igdb.com/igdb/image/upload/t_cover_big/abc.png",
      "games",
    );
    expect(publicPath).toMatch(/^\/api\/images\/games\/[0-9a-f-]{36}\.png$/);
  });
});

describe("resolveUploadPath", () => {
  it("resolves paths inside the uploads dir", () => {
    const resolved = resolveUploadPath(["games", "abc.png"]);
    expect(resolved).toBe(path.join(tmpDir, "games", "abc.png"));
  });

  it("blocks path traversal", () => {
    expect(resolveUploadPath(["..", "etc", "passwd"])).toBeNull();
    expect(resolveUploadPath(["games", "..", "..", "secret"])).toBeNull();
  });
});
