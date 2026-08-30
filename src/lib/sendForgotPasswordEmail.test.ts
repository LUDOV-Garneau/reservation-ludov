import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mailer } from "./mailer";
import { getTemplate } from "./emailTemplates";
import { sendForgotPasswordEmail } from "./sendEmail";

vi.mock("./mailer", () => ({ mailer: { sendMail: vi.fn() } }));

// Le contenu éditable vient de la base ; on injecte les zones pour tester le
// gabarit fixe indépendamment de ce qu'un administrateur y aura écrit.
vi.mock("./emailTemplates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./emailTemplates")>();
  return { ...actual, getTemplate: vi.fn() };
});

const RESET_URL =
  "https://ludov.example.ca/fr/auth/reset-password?token=jeton-de-test";

const templateReturns = (subject: string, zones: Record<string, string>) =>
  vi.mocked(getTemplate).mockResolvedValue({ subject, zones });

/** Envoie le courriel et renvoie ce qui a été remis au transporteur. */
async function render(
  overrides: Partial<Parameters<typeof sendForgotPasswordEmail>[0]> = {},
) {
  await sendForgotPasswordEmail({
    to: "personne@exemple.ca",
    locale: "fr",
    resetUrl: RESET_URL,
    expiresInMinutes: 30,
    ...overrides,
  });
  return vi.mocked(mailer.sendMail).mock.calls[0][0] as {
    to: string;
    subject: string;
    html: string;
    text: string;
  };
}

describe("sendForgotPasswordEmail", () => {
  beforeEach(() => {
    vi.mocked(mailer.sendMail).mockResolvedValue({ rejected: [] } as never);
    templateReturns("Réinitialiser votre mot de passe LUDOV", {
      intro: "Bonjour,\nUne demande a été reçue.",
      outro: "Merci de votre confiance.",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("le lien", () => {
    it("place l'URL dans le bouton et dans l'adresse de repli", async () => {
      const { html } = await render();
      const occurrences = html.split(RESET_URL).length - 1;
      // Bouton VML (Outlook), bouton HTML, lien de repli, texte du lien.
      expect(occurrences).toBeGreaterThanOrEqual(3);
    });

    it("reprend l'URL telle quelle dans la variante texte", async () => {
      const { text } = await render();
      expect(text).toContain(RESET_URL);
    });

    it("échappe les guillemets d'une URL, pour ne pas casser l'attribut href", async () => {
      const { html } = await render({
        resetUrl: 'https://exemple.ca/?t=a"onmouseover="alert(1)',
      });
      expect(html).not.toContain('href="https://exemple.ca/?t=a"onmouseover=');
      expect(html).toContain("&quot;onmouseover=");
    });

    it("n'expose jamais le jeton ailleurs que dans le lien", async () => {
      const { html } = await render();
      const sansLiens = html.split(RESET_URL).join("");
      expect(sansLiens).not.toContain("jeton-de-test");
    });
  });

  describe("le contenu éditable", () => {
    it("reprend le sujet du gabarit", async () => {
      const { subject } = await render();
      expect(subject).toBe("Réinitialiser votre mot de passe LUDOV");
    });

    it("transforme chaque ligne d'une zone en paragraphe", async () => {
      const { html } = await render();
      expect(html).toContain("<p style=");
      expect(html).toContain("Bonjour,");
      expect(html).toContain("Une demande a été reçue.");
      expect(html).toContain("Merci de votre confiance.");
    });

    it("interpole la durée de validité annoncée", async () => {
      templateReturns("Sujet", {
        intro: "Ce lien expire dans {expiresInMinutes} minutes.",
        outro: "",
      });
      const { html } = await render({ expiresInMinutes: 45 });
      expect(html).toContain("Ce lien expire dans 45 minutes.");
      expect(html).not.toContain("{expiresInMinutes}");
    });

    it("échappe les valeurs interpolées dans les {variables}", async () => {
      templateReturns("Sujet", {
        intro: "Expire dans {expiresInMinutes} minutes.",
        outro: "",
      });
      const { html } = await render({ expiresInMinutes: 30 });
      expect(html).toContain("Expire dans 30 minutes.");
    });

    it("insère le texte des zones en HTML, sans l'échapper", async () => {
      // Comportement partagé par TOUS les gabarits (zoneToParagraphs) : le
      // texte des zones est repris tel quel, seules les {variables} sont
      // échappées. Seul un administrateur peut écrire ces zones, et un client
      // de messagerie n'exécute pas de script — mais une balise mal fermée y
      // casse la mise en page. Test de constat, pas d'approbation.
      templateReturns("Sujet", { intro: "<b>gras</b>", outro: "" });
      const { html } = await render();
      expect(html).toContain("<b>gras</b>");
    });

    it("survit à un gabarit dont les zones sont vides", async () => {
      templateReturns("Sujet", {});
      const { html } = await render();
      expect(html).toContain(RESET_URL);
    });
  });

  describe("les deux langues", () => {
    it("rend le français par défaut", async () => {
      const { html } = await render({ locale: "fr" });
      expect(html).toContain('lang="fr"');
      expect(html).toContain("Choisir un nouveau mot de passe");
      expect(html).toContain("Réinitialisation du mot de passe");
    });

    it("rend l'anglais quand la langue le demande", async () => {
      const { html } = await render({ locale: "en" });
      expect(html).toContain('lang="en"');
      expect(html).toContain("Choose a new password");
      expect(html).not.toContain("Choisir un nouveau mot de passe");
    });

    it("retombe sur le français pour une langue inconnue", async () => {
      const { html } = await render({ locale: "de" });
      expect(html).toContain("Choisir un nouveau mot de passe");
    });

    it("demande le gabarit correspondant à la langue", async () => {
      await render({ locale: "en" });
      expect(getTemplate).toHaveBeenCalledWith("forgot_password", "en");
    });
  });

  describe("la mise en forme du courriel", () => {
    it("fournit une variante texte, qui compte pour le classement anti-pourriel", async () => {
      const { text } = await render();
      expect(text.length).toBeGreaterThan(50);
      expect(text).not.toContain("<");
    });

    it("porte un aperçu masqué pour la liste des messages", async () => {
      const { html } = await render();
      expect(html).toContain("mso-hide: all");
      expect(html).toContain("valide 30 minutes");
    });

    it("double le bouton en VML, seul format cliquable dans Outlook", async () => {
      const { html } = await render();
      expect(html).toContain("v:roundrect");
      expect(html).toContain("[if mso]");
    });

    it("n'utilise que des tables, jamais de flexbox ni de grid", async () => {
      const { html } = await render();
      expect(html).toContain("<table");
      expect(html).not.toMatch(/display:\s*(flex|grid)/);
    });

    it("porte tous ses styles en ligne, sans feuille externe", async () => {
      const { html } = await render();
      expect(html).not.toContain("<link");
      expect(html).toContain("style=");
    });

    it("prévoit l'affichage sur téléphone", async () => {
      const { html } = await render();
      expect(html).toContain("@media only screen and (max-width: 620px)");
      expect(html).toContain("viewport");
    });

    it("avertit que le mot de passe actuel reste valide", async () => {
      const { html } = await render();
      expect(html).toContain("votre mot de passe actuel reste valide");
    });
  });

  it("envoie à l'adresse demandée", async () => {
    const { to } = await render({ to: "quelquun@exemple.ca" });
    expect(to).toBe("quelquun@exemple.ca");
  });

  it("remonte le rapport du transporteur à l'appelant", async () => {
    vi.mocked(mailer.sendMail).mockResolvedValue({
      rejected: ["personne@exemple.ca"],
    } as never);

    const response = await sendForgotPasswordEmail({
      to: "personne@exemple.ca",
      locale: "fr",
      resetUrl: RESET_URL,
      expiresInMinutes: 30,
    });

    // C'est ainsi que la route sait qu'un courriel n'est pas parti.
    expect(response.rejected).toEqual(["personne@exemple.ca"]);
  });
});
