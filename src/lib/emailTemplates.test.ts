import { describe, it, expect, vi, beforeEach } from "vitest";
import db from "@/db";
import {
  getTemplate,
  renderZoneText,
  renderZoneTextPlain,
  zoneToParagraphs,
  zoneToListItems,
  findUnknownVariables,
  clearTemplateCache,
  DEFAULT_TEMPLATES,
} from "./emailTemplates";

vi.mock("@/db", () => ({
  default: {
    query: { emailTemplates: { findFirst: vi.fn() } },
  },
}));

describe("renderZoneText", () => {
  it("interpolates known variables and escapes HTML in values", () => {
    const out = renderZoneText("Bonjour {userName}, code {otpCode}", {
      userName: "<script>alert(1)</script>",
      otpCode: "123456",
    });
    expect(out).toBe(
      "Bonjour &lt;script&gt;alert(1)&lt;/script&gt;, code 123456",
    );
  });

  it("leaves unknown tokens untouched", () => {
    expect(renderZoneText("Salut {inconnu}", {})).toBe("Salut {inconnu}");
  });

  it("plain variant does not escape", () => {
    expect(renderZoneTextPlain("Code : {otpCode}", { otpCode: "1<2" })).toBe(
      "Code : 1<2",
    );
  });
});

describe("zone helpers", () => {
  it("splits lines into paragraphs", () => {
    const html = zoneToParagraphs("Ligne 1\nLigne 2");
    expect(html).toContain("<p");
    expect(html.match(/<p/g)).toHaveLength(2);
  });

  it("splits lines into list items", () => {
    expect(zoneToListItems("a\nb\nc").match(/<li/g)).toHaveLength(3);
  });
});

describe("findUnknownVariables", () => {
  it("flags variables not allowed for the template", () => {
    const unknown = findUnknownVariables("welcome", {
      subject: "Bienvenue {userName}",
      zones: { intro: "Salut {hacker}" },
    });
    expect(unknown.sort()).toEqual(["hacker", "userName"]);
  });

  it("accepts allowed variables", () => {
    expect(
      findUnknownVariables("confirmation", {
        subject: "Réservation {reservationId}",
        zones: { intro: "Bonjour {userName}, le {date} à {time}" },
      }),
    ).toEqual([]);
  });
});

describe("getTemplate", () => {
  beforeEach(() => {
    clearTemplateCache();
    vi.clearAllMocks();
  });

  it("returns the DB row when present", async () => {
    vi.mocked(db.query.emailTemplates.findFirst).mockResolvedValue({
      templateKey: "welcome",
      locale: "fr",
      subject: "Sujet BD",
      zones: { intro: "Intro BD", outro: "Outro BD" },
    } as unknown as Awaited<
      ReturnType<typeof db.query.emailTemplates.findFirst>
    >);

    const template = await getTemplate("welcome", "fr");
    expect(template.subject).toBe("Sujet BD");
  });

  it("falls back to embedded defaults when the DB is empty", async () => {
    vi.mocked(db.query.emailTemplates.findFirst).mockResolvedValue(undefined);
    const template = await getTemplate("welcome", "en");
    expect(template.subject).toBe(DEFAULT_TEMPLATES.welcome.en.subject);
  });

  it("falls back to defaults when the DB read throws", async () => {
    vi.mocked(db.query.emailTemplates.findFirst).mockRejectedValue(
      new Error("db down"),
    );
    const template = await getTemplate("otp", "fr");
    expect(template.subject).toBe(DEFAULT_TEMPLATES.otp.fr.subject);
  });

  it("normalizes unsupported locales to fr", async () => {
    vi.mocked(db.query.emailTemplates.findFirst).mockResolvedValue(undefined);
    const template = await getTemplate("welcome", "de");
    expect(template.subject).toBe(DEFAULT_TEMPLATES.welcome.fr.subject);
  });
});
