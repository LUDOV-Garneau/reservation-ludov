import { describe, it, expect } from "vitest";
import fr from "@/i18n/messages/fr.json";
import en from "@/i18n/messages/en.json";
import {
  DEFAULT_TEMPLATES,
  EMAIL_LOCALES,
  EMAIL_TEMPLATE_KEYS,
  TEMPLATE_VARIABLES,
  TEMPLATE_ZONES,
  findUnknownVariables,
  isEmailLocale,
  isEmailTemplateKey,
  renderZoneText,
} from "./emailTemplates";

/**
 * Le registre des gabarits est ce qui alimente l'écran d'administration : une
 * clé déclarée sans zones, sans textes par défaut ou sans libellé traduit
 * produit une entrée cassée dans l'interface. Ces tests valent pour tous les
 * gabarits, pas seulement le dernier ajouté.
 */
describe("registre des gabarits de courriels", () => {
  it.each(EMAIL_TEMPLATE_KEYS)("%s déclare ses zones", (key) => {
    expect(TEMPLATE_ZONES[key]?.length).toBeGreaterThan(0);
  });

  it.each(EMAIL_TEMPLATE_KEYS)("%s déclare ses variables", (key) => {
    expect(TEMPLATE_VARIABLES[key]).toBeInstanceOf(Array);
  });

  it.each(EMAIL_TEMPLATE_KEYS)(
    "%s fournit un sujet et des zones dans les deux langues",
    (key) => {
      for (const locale of EMAIL_LOCALES) {
        const content = DEFAULT_TEMPLATES[key][locale];
        expect(content.subject.trim()).not.toBe("");
        for (const zone of TEMPLATE_ZONES[key]) {
          expect(content.zones[zone]?.trim()).toBeTruthy();
        }
      }
    },
  );

  it.each(EMAIL_TEMPLATE_KEYS)(
    "%s n'emploie que des variables déclarées dans ses textes par défaut",
    (key) => {
      for (const locale of EMAIL_LOCALES) {
        expect(findUnknownVariables(key, DEFAULT_TEMPLATES[key][locale])).toEqual(
          [],
        );
      }
    },
  );

  it.each(EMAIL_TEMPLATE_KEYS)(
    "%s porte un libellé traduit dans l'écran d'administration",
    (key) => {
      const labels = {
        fr: fr.admin.emails.templates as Record<string, string>,
        en: en.admin.emails.templates as Record<string, string>,
      };
      expect(labels.fr[key]).toBeTruthy();
      expect(labels.en[key]).toBeTruthy();
    },
  );

  it("reconnaît forgot_password comme clé valide", () => {
    // La route d'envoi de test refuse toute clé non reconnue.
    expect(isEmailTemplateKey("forgot_password")).toBe(true);
    expect(isEmailTemplateKey("gabarit_inexistant")).toBe(false);
  });

  it("n'accepte que les deux langues prévues", () => {
    expect(isEmailLocale("fr")).toBe(true);
    expect(isEmailLocale("en")).toBe(true);
    expect(isEmailLocale("de")).toBe(false);
  });
});

describe("interpolation des variables", () => {
  it("remplace une variable connue", () => {
    expect(renderZoneText("Expire dans {n} min.", { n: "30" })).toBe(
      "Expire dans 30 min.",
    );
  });

  it("laisse en place une variable inconnue plutôt que de vider le texte", () => {
    expect(renderZoneText("Bonjour {inconnue}.", {})).toBe("Bonjour {inconnue}.");
  });

  it("échappe la valeur interpolée", () => {
    expect(renderZoneText("{v}", { v: '<img src=x onerror="alert(1)">' })).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });
});
