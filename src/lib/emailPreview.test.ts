import { describe, expect, it } from "vitest";
import {
  buildEmailPreview,
  SAMPLE_VARIABLES,
  usedVariables,
} from "@/lib/emailPreview";
import { TEMPLATE_VARIABLES, TEMPLATE_ZONES } from "@/lib/emailTemplates";

describe("SAMPLE_VARIABLES", () => {
  it("couvre toutes les variables de tous les gabarits", () => {
    // Sans quoi une prévisualisation afficherait « {userName} » brut au lieu
    // d'un exemple, et personne ne saurait si c'est le gabarit ou l'exemple
    // qui est en cause.
    const manquantes = new Set<string>();
    for (const variables of Object.values(TEMPLATE_VARIABLES)) {
      for (const v of variables) {
        if (!(v in SAMPLE_VARIABLES)) manquantes.add(v);
      }
    }
    expect([...manquantes]).toEqual([]);
  });
});

describe("usedVariables", () => {
  it("relève les variables du sujet et des zones", () => {
    expect(
      usedVariables({
        subject: "Bonjour {userName}",
        zones: { intro: "Le {date} à {time}.", outro: "" },
      }).sort(),
    ).toEqual(["date", "time", "userName"]);
  });

  it("dédoublonne", () => {
    expect(
      usedVariables({
        subject: "{userName}",
        zones: { intro: "{userName} encore" },
      }),
    ).toEqual(["userName"]);
  });

  it("renvoie une liste vide sans variable", () => {
    expect(usedVariables({ subject: "Bonjour", zones: { intro: "" } })).toEqual(
      [],
    );
  });
});

describe("buildEmailPreview", () => {
  it("interpole le sujet avec les valeurs d'exemple", () => {
    const preview = buildEmailPreview("confirmation", {
      subject: "Réservation de {userName}",
      zones: { intro: "", important: "", outro: "" },
    });
    expect(preview.subject).toBe("Réservation de Camille Tremblay");
  });

  it("rend une zone en paragraphes, une ligne par paragraphe", () => {
    const preview = buildEmailPreview("confirmation", {
      subject: "x",
      zones: { intro: "Ligne un\nLigne deux", important: "", outro: "" },
    });
    const intro = preview.zones.find((z) => z.zone === "intro")!.html;
    expect(intro.match(/<p /g)?.length).toBe(2);
    expect(intro).toContain("Ligne un");
    expect(intro).toContain("Ligne deux");
  });

  it("ignore les lignes vides", () => {
    const preview = buildEmailPreview("confirmation", {
      subject: "x",
      zones: { intro: "Un\n\n\nDeux", important: "", outro: "" },
    });
    const intro = preview.zones.find((z) => z.zone === "intro")!.html;
    expect(intro.match(/<p /g)?.length).toBe(2);
  });

  it("renvoie toutes les zones du gabarit, meme absentes du contenu", () => {
    const preview = buildEmailPreview("confirmation", {
      subject: "x",
      zones: {},
    });
    expect(preview.zones.map((z) => z.zone)).toEqual(
      TEMPLATE_ZONES.confirmation,
    );
  });

  it("echappe les valeurs interpolees, pas le texte de la zone", () => {
    // Le serveur se comporte ainsi : l'admin peut ecrire du HTML, mais une
    // valeur venue d'une reservation est echappee.
    const preview = buildEmailPreview("cancellation", {
      subject: "x",
      zones: { intro: "<strong>Motif</strong> : {reason}", outro: "" },
    });
    const intro = preview.zones.find((z) => z.zone === "intro")!.html;
    expect(intro).toContain("<strong>Motif</strong>");
  });

  it("signale les variables inconnues", () => {
    const preview = buildEmailPreview("confirmation", {
      subject: "Bonjour {nom}",
      zones: { intro: "{date}", important: "", outro: "" },
    });
    expect(preview.unknownVariables).toEqual(["nom"]);
  });

  it("signale les variables disponibles jamais utilisees", () => {
    const preview = buildEmailPreview("otp", {
      subject: "Votre code",
      zones: { body: "Voici votre code." },
    });
    expect(preview.unusedVariables).toEqual(["otpCode"]);
  });

  it("ne signale rien quand tout est utilise", () => {
    const preview = buildEmailPreview("otp", {
      subject: "Votre code",
      zones: { body: "Code : {otpCode}" },
    });
    expect(preview.unknownVariables).toEqual([]);
    expect(preview.unusedVariables).toEqual([]);
  });

  it("supporte un gabarit sans aucune variable", () => {
    const preview = buildEmailPreview("welcome", {
      subject: "Bienvenue",
      zones: { intro: "Bonjour.", outro: "A bientot." },
    });
    expect(preview.unknownVariables).toEqual([]);
    expect(preview.unusedVariables).toEqual([]);
    expect(preview.subject).toBe("Bienvenue");
  });
});
